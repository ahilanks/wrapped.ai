import json
import time
import collections
import re
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

import pandas as pd
import numpy as np
import networkx as nx
import spacy
from supabase import create_client
from anthropic import Anthropic

from llama_index.core import (
    Document, Settings, VectorStoreIndex, StorageContext,
)
from llama_index.core.schema import BaseNode, TextNode, NodeWithScore
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.voyageai import VoyageEmbedding
from llama_index.vector_stores.supabase import SupabaseVectorStore

# ── Configuration ──────────────────────────────────────────────────
SUPABASE_URL = "https://aqavgmrcggugruedqtzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZnbXJjZ2d1Z3J1ZWRxdHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDA5MTMsImV4cCI6MjA2NjExNjkxM30.f4RSnwdPVkSpApBUuzZlYnG63Y-3SUQtYkAhXpi3tFk"
POSTGRES_CONN = "postgresql://postgres:Wrapped12345!@db.aqavgmrcggugruedqtzv.supabase.co:5432/postgres"
VOYAGE_KEY = "pa-z3YYZAFZnRW0fte9GEpN2dYHGC4dB8H5CMAFeg3lIue"
ANTHROPIC_API_KEY = "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"

MODEL_NAME = "voyage-3-lite"
DIMENSION = 512
TABLE_NAME = "chat_logs_final"

# Initialize clients
client = create_client(SUPABASE_URL, SUPABASE_KEY)
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

@dataclass
class EmbedConfig:
    conv_chunk: int = 8192
    chunk: int = 512
    sent: int = 256
    chunk_ov: int = 100
    sent_ov: int = 20

class MiniChatEmbedder:
    _DAYS_RE = re.compile(r"(\d+)\s+days,\s+([\d:.]+)")

    def __init__(self, cfg: EmbedConfig = None):
        self.cfg = cfg or EmbedConfig()
        
        # Initialize spaCy
        self.nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer"])
        self.nlp.add_pipe("sentencizer")
        
        # Initialize embedding model
        Settings.embed_model = VoyageEmbedding(
            model_name=MODEL_NAME,
            voyage_api_key=VOYAGE_KEY,
            input_type="document",
        )
        
        # Bootstrap vector collection
        self._bootstrap_vector_collection()
        
        # Initialize vector store for conversations only
        self.store = SupabaseVectorStore(
            postgres_connection_string=POSTGRES_CONN,
            collection_name=TABLE_NAME,
            dimension=DIMENSION,
            overwrite_collection=False,
            vector_column="embedding_conv_512",
        )
        
        # Initialize parser for conversations
        self.parser = SentenceSplitter(
            chunk_size=self.cfg.conv_chunk, 
            chunk_overlap=200
        )
        
        # Entity graph
        self.G = nx.Graph()

    @staticmethod
    def _bootstrap_vector_collection():
        """Create the vector collection if it doesn't exist"""
        SupabaseVectorStore(
            postgres_connection_string=POSTGRES_CONN,
            collection_name=TABLE_NAME,
            dimension=DIMENSION,
            overwrite_collection=False,
        )

    def _sanitize(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate dataframe"""
        rename_map = {"create_time": "created_at", "timestamp": "created_at"}
        df = df.rename(columns={k: v for k, v in rename_map.items() if k in df})

        must_have = {"conversation_id", "author_role", "body", "created_at"}
        missing = must_have - set(df.columns)
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        df["created_at"] = df["created_at"].apply(self._parse_created_at)
        df = df.dropna(subset=["created_at"])
        return df

    def _parse_created_at(self, val):
        """Parse various timestamp formats"""
        if pd.isna(val):
            return pd.NaT
        
        # Try standard datetime parsing first
        ts = pd.to_datetime(val, errors="coerce", utc=True)
        if ts is not pd.NaT:
            return ts
        
        # Try custom format
        m = self._DAYS_RE.fullmatch(str(val).strip())
        if m:
            days, timestr = int(m.group(1)), m.group(2)
            base = datetime(1970, 1, 1, tzinfo=pd.Timestamp.utcnow().tz)
            return base + timedelta(days=days) + pd.to_timedelta(timestr)
        
        return pd.NaT

    def _df_to_conversations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Convert dataframe to conversation format"""
        grouped = collections.defaultdict(list)
        for r in df.itertuples(index=False):
            grouped[r.conversation_id].append({
                "timestamp": r.created_at,
                "role": r.author_role,
                "content": r.body
            })
        
        convs = []
        for cid, msgs in grouped.items():
            msgs.sort(key=lambda m: m["timestamp"])
            text = "\n\n".join(f"[{m['role'].upper()}] {m['content']}" for m in msgs)
            convs.append({
                "id": cid,
                "text": text,
                "meta": {"conversation_id": cid}
            })
        return convs

    def build_entity_graph(self, texts: List[str]):
        """Build entity co-occurrence graph"""
        for text in texts:
            doc = self.nlp(text)
            entities = [
                ent.text.strip() for ent in doc.ents
                if len(ent.text.strip()) >= 3 
                and not ent.text.strip().isdigit()
                and not re.fullmatch(r"[#\\d/_.]+", ent.text.strip())
                and ent.label_ not in {"DATE", "TIME"}
            ]
            
            # Add nodes and edges
            for ent in entities:
                if not self.G.has_node(ent):
                    self.G.add_node(ent)
            
            # Add co-occurrence edges
            for i, ent1 in enumerate(entities):
                for ent2 in entities[i+1:]:
                    if self.G.has_edge(ent1, ent2):
                        self.G[ent1][ent2]["weight"] += 1
                    else:
                        self.G.add_edge(ent1, ent2, weight=1)

    def process_for_analytics_only(self, df: pd.DataFrame):
        """Process dataframe for analytics without creating vector index"""
        df = self._sanitize(df)
        convs = self._df_to_conversations(df)
        
        # Just build entity graph for analytics
        for conv in convs:
            self.build_entity_graph([conv["text"]])
        
        return convs

    def spotify_wrapped(self, df: pd.DataFrame, user_id: str = None) -> Dict[str, Any]:
        """Generate Spotify-like wrapped statistics"""
        df = self._sanitize(df)

        num_chats = df.conversation_id.nunique()
        num_messages = len(df)

        user_df = df[df.author_role.eq("user")]
        assistant_df = df[df.author_role.eq("assistant")]

        # Entity extraction
        ent_counter = collections.Counter()
        for doc in self.nlp.pipe(user_df.body.tolist(), batch_size=128):
            for ent in doc.ents:
                txt = ent.text.strip()
                if (len(txt) >= 3 and 
                    not txt.isdigit() and 
                    not re.fullmatch(r"[#\\d/_.]+", txt)):
                    ent_counter[txt] += 1

        top_entities = ent_counter.most_common(15)

        # Top queries
        queries = (
            user_df.body
            .map(lambda t: " ".join(t.strip().split()[:8]).lower())
            .value_counts()
            .head(10)
            .to_dict()
        )

        # Response tokens
        response_tokens = int(assistant_df.body.str.split().map(len).sum())

        # Programming languages
        langs = ["python", "javascript", "typescript", "c++", "c", "java", 
                "go", "rust", "ruby", "php", "scala", "sql"]
        lang_counts = {
            lang: int(df.body.str.contains(fr"\b{re.escape(lang)}\b", case=False).sum())
            for lang in langs
        }
        most_common_languages = {
            k: v for k, v in sorted(lang_counts.items(), key=lambda p: p[1], reverse=True) 
            if v > 0
        }

        # Most active hour
        most_active_hour = (
            int(df.created_at.dt.hour.value_counts().idxmax()) 
            if not df.empty else None
        )

        return {
            "year": datetime.utcnow().year,
            "user_id": user_id or "default",
            "num_chats": num_chats,
            "num_messages": num_messages,
            "response_tokens": response_tokens,
            "top_entities": top_entities,
            "top_queries": queries,
            "languages": most_common_languages,
            "most_active_hour": most_active_hour,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def graph_summary(self, top_k: int = 10) -> Dict[str, Any]:
        """Generate graph statistics"""
        if self.G.number_of_nodes() == 0:
            return {}
        
        pr = nx.pagerank(self.G, weight="weight")
        top_nodes = sorted(pr.items(), key=lambda x: x[1], reverse=True)[:top_k]
        bridge_edges = sorted(
            self.G.edges(data=True), 
            key=lambda e: e[2]["weight"], 
            reverse=True
        )[:top_k]
        
        return {
            "pagerank_top": top_nodes,
            "bridge_edges": [(s, t, d["weight"]) for s, t, d in bridge_edges],
        }

class ChatGraphBackend:
    """Vector search + Anthropic API wrapper"""
    
    def __init__(self, embedder: MiniChatEmbedder):
        storage_ctx = StorageContext.from_defaults(vector_store=embedder.store)
        self.vector_idx = VectorStoreIndex([], storage_context=storage_ctx)
        self.entity_graph = embedder.G
        self.anthropic_client = anthropic_client

    def retrieve(self, query: str, k: int = 8) -> List[NodeWithScore]:
        """Retrieve k context nodes"""
        retriever = self.vector_idx.as_retriever(similarity_top_k=k)
        return retriever.retrieve(query)

    def answer(self, query: str, k: int = 8) -> str:
        """Retrieve context and generate answer"""
        nodes = self.retrieve(query, k=k)
        context = "\n\n".join(n.node.text for n in nodes)

        system_prompt = (
            "You are an expert assistant who answers using the provided context. "
            "If the answer isn't in the context, say you don't know."
        )
        
        prompt = f"Context:\n---\n{context}\n---\n\nQuestion: {query}\nAnswer:"
        
        response = self.anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text.strip()

# ── Data loading functions ──────────────────────────────────────────

def load_conversations(path: str | Path) -> List[Dict[str, Any]]:
    """Load conversations from JSON file"""
    path = Path(path)
    with path.open("r", encoding="utf-8") as f:
        conversations = json.load(f)
    if not isinstance(conversations, list):
        raise ValueError(f"Expected list, got {type(conversations).__name__}")
    return conversations

def _to_text(part: Any) -> str:
    """Convert message part to text"""
    if isinstance(part, str):
        return part
    if isinstance(part, dict) and "text" in part:
        return part["text"]
    return json.dumps(part, ensure_ascii=False)

def parse_chatgpt_json(conv: Dict[str, Any], email: str) -> pd.DataFrame:
    """Parse ChatGPT conversation format"""
    rows = []
    conv_id = conv.get("conversation_id")
    title = conv.get("title", "")

    for node in conv.get("mapping", {}).values():
        msg = node.get("message")
        if msg is None:
            continue

        parts = msg.get("content", {}).get("parts", [])
        body = "\n".join(_to_text(p) for p in parts).strip()
        if not body:
            continue

        rows.append({
            "conversation_id": conv_id,
            "email": email,
            "title": title,
            "body": body,
            "embeddings_json": None,
            "created_at": datetime.utcfromtimestamp(msg["create_time"]).isoformat(),
            "company": "gpt",
            "author_role": (msg.get("author") or {}).get("role"),
        })

    col_order = [
        "conversation_id", "email", "title", "body",
        "embeddings_json", "created_at", "company", "author_role",
    ]
    return pd.DataFrame(rows)[col_order]

def conversations_to_dataframe(
    path: str | Path,
    email: str,
    drop_empty: bool = True,
    drop_empty_convs: bool = True,
) -> pd.DataFrame:
    """Convert conversations file to dataframe"""
    convs = load_conversations(path)
    dfs = [parse_chatgpt_json(c, email) for c in convs]
    df = pd.concat(dfs, ignore_index=True)

    if drop_empty:
        df = df[df["body"].str.strip().astype(bool)]

    if drop_empty_convs:
        df = df[df["conversation_id"].isin(df["conversation_id"].unique())]

    # Clean up infinite values
    df = df.replace([np.inf, -np.inf], np.nan)
    clean_df = df.where(pd.notnull(df), None)

    return clean_df.reset_index(drop=True)

def batched_embed_and_insert(
    df: pd.DataFrame,
    table_name: str,
    batch_size: int = 100,  # Smaller batches for embedding API
    max_retries: int = 3,
):
    """Generate embeddings and insert data in batches"""
    embed_model = VoyageEmbedding(
        model_name=MODEL_NAME,
        voyage_api_key=VOYAGE_KEY
    )
    
    tbl = client.table(table_name)
    records = df.to_dict(orient="records")
    
    print(f"Processing {len(records)} records in batches of {batch_size}...")

    for start in range(0, len(records), batch_size):
        chunk = records[start:start + batch_size]
        
        print(f"Processing batch {start//batch_size + 1}/{(len(records)-1)//batch_size + 1} "
              f"(rows {start}-{start+len(chunk)-1})")

        # Generate embeddings for this batch
        texts_to_embed = [r["body"] for r in chunk]
        
        try:
            # Batch embed all texts at once (more efficient)
            embeddings = embed_model.get_text_embedding_batch(texts_to_embed)
            
            # Add embeddings to records
            for i, r in enumerate(chunk):
                r["embeddings_json"] = json.dumps({"conversation": embeddings[i]})
                
        except Exception as e:
            print(f"⚠️  Embedding batch failed, falling back to individual embeds: {e}")
            # Fallback to individual embeddings
            for r in chunk:
                try:
                    conv_emb = embed_model.get_text_embedding(r["body"])
                    r["embeddings_json"] = json.dumps({"conversation": conv_emb})
                except Exception as embed_err:
                    print(f"⚠️  Failed to embed text: {embed_err}")
                    r["embeddings_json"] = json.dumps({"conversation": [0.0] * DIMENSION})

        # Insert batch into database with retry logic
        attempt = 0
        while True:
            try:
                resp = tbl.upsert(chunk).execute()
                print(f"✓ Inserted {len(chunk)} rows")
                break
            except Exception as err:
                attempt += 1
                if attempt > max_retries:
                    print(f"❌ Failed to insert batch after {max_retries} retries: {err}")
                    raise
                wait = 2 ** attempt
                print(f"⚠️  Insert failed ({err}); retry {attempt} in {wait}s")
                time.sleep(wait)
        
        # Small delay between batches to be nice to the APIs
        time.sleep(0.5)

def update_analytics_for_email(email: str,
                               table_name: str = TABLE_NAME,
                               max_retries: int = 3):
    """
    Pull *all* rows for a user, compute wrapped + graph analytics,
    and store them only in the first row (oldest message).
    """

    print(f"📊 Updating user-level analytics for email: {email}")

    # 1) Pull data in pages (no time-out)
    print("📥 Fetching existing data from Supabase (paged)…")
    rows = fetch_rows_for_email(email, table_name)
    if not rows:
        print(f"❌ No data found for email: {email}")
        return

    first_row = rows[0]
    print(f"✅ Found {len(rows)} rows for {email}")
    print(f"📍 Will write analytics to row ID: {first_row.get('id', 'unknown')}")

    # 2) Tiny guard in case PostgREST cache still missing columns
    required_cols = {"wrapped_json", "graph_json"}
    if not required_cols.issubset(first_row.keys()):
        print(f"⚠️  Table schema hasn't refreshed yet "
              f"(missing {required_cols - first_row.keys()}). "
              "Wait ~60 s and retry.")
        return

    # 3) Build DataFrame & run analytics
    df = pd.DataFrame(rows)

    print("🔄 Initializing analytics processor…")
    embedder = MiniChatEmbedder()

    print("📊 Calculating wrapped analytics…")
    try:
        wrapped = embedder.spotify_wrapped(df, user_id=email)
    except Exception as e:
        print(f"❌ Failed to compute wrapped: {e}")
        wrapped = {}

    print("🕸️  Calculating graph analytics…")
    try:
        embedder.process_for_analytics_only(df)
        graph = embedder.graph_summary()
    except Exception as e:
        print(f"❌ Failed to compute graph analytics: {e}")
        graph = {}

    # 4) Update just the first row
    update_data = {
        "id": first_row["id"],
        "wrapped_json": json.dumps(wrapped),
        "graph_json":   json.dumps(graph),
    }

    attempt = 0
    while True:
        try:
            client.table(table_name).upsert([update_data]).execute()
            print("✅ Analytics stored successfully")
            break
        except Exception as err:
            attempt += 1
            if attempt > max_retries:
                print(f"❌ Update failed after {max_retries} retries: {err}")
                return
            wait = 2 ** attempt
            print(f"⚠️  Update failed ({err}); retry {attempt}/{max_retries} in {wait}s")
            time.sleep(wait)

    print(f"🎉 Finished analytics for {email}\n")

def list_emails_in_database(
    table_name: str = TABLE_NAME,
    page_size: int = 1_000,
) -> List[str]:
    """
    Return *all* unique e-mails in the table, fetched in pages of ≤ page_size.
    """
    emails: set[str] = set()
    start = 0

    while True:
        end = start + page_size - 1

        try:
            resp = (
                client
                .table(table_name)
                .select("email")
                .range(start, end)
                .execute()
            )
        except Exception as e:
            print(f"❌ Failed to fetch range {start}-{end}: {e}")
            break

        rows = resp.data or []
        if not rows:                     # no more records
            break

        emails.update(
            row["email"] for row in rows
            if row.get("email")
        )

        if len(rows) < page_size:        # last partial page
            break

        start += page_size               # next page

    return sorted(emails)
    
def fetch_rows_for_email(email: str,
                         table_name: str = TABLE_NAME,
                         page_size: int = 1_000) -> List[Dict[str, Any]]:
    """
    Fetch *all* rows for a given e-mail using ≤1 000-row pages.
    """
    out, start = [], 0
    while True:
        end   = start + page_size - 1
        resp  = (client.table(table_name)
                       .select("*")
                       .eq("email", email)
                       .order("created_at")
                       .range(start, end)
                       .execute())
        chunk = resp.data or []
        out.extend(chunk)
        if len(chunk) < page_size:
            break
        start += page_size
    return out

def process_uploaded_json(file_path: str, email: str):
    """Main function to process and insert data"""
    
    # Load and process data
    print(f"Loading conversations from {file_path} for user {email}...")
    full_df = conversations_to_dataframe(file_path, email=email)
    print(f"Loaded {len(full_df)} messages from {full_df.conversation_id.nunique()} conversations")
    
    # Initialize embedder for analytics
    print("Initializing embedder...")
    embedder = MiniChatEmbedder()
    
    print("Processing conversations for analytics...")
    embedder.process_for_analytics_only(full_df)
    
    # Generate analytics
    print("Generating analytics...")
    wrapped = embedder.spotify_wrapped(full_df, user_id=email)
    graph = embedder.graph_summary()
    
    # Add analytics to dataframe
    print("Adding analytics to records...")
    full_df = full_df.copy()
    full_df["wrapped_json"] = json.dumps(wrapped)
    full_df["graph_json"] = json.dumps(graph)
    full_df["embeddings_json"] = None  # Will be populated during insert
    
    # Generate embeddings and insert in batches
    print("Generating embeddings and inserting into database...")
    batched_embed_and_insert(full_df, TABLE_NAME, batch_size=50)
    
    print("✅ Complete! Your data is now in Supabase with embeddings.")
    print(f"Analytics summary for {email}:")
    print(f"  - {wrapped.get('num_chats', 0)} conversations")
    print(f"  - {wrapped.get('num_messages', 0)} messages")
    print(f"  - {wrapped.get('response_tokens', 0)} response tokens")

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: python claude_parser.py <path_to_json_file> <user_email>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    user_email = sys.argv[2]
    
    process_uploaded_json(file_path, user_email)
