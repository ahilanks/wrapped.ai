from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
import re
import time
from collections import Counter
from datetime import datetime
import umap
from sklearn.cluster import KMeans
import random
from supabase import create_client, Client
import anthropic

# --- Setup ---
SUPABASE_URL = "https://aqavgmrcggugruedqtzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZnbXJjZ2d1Z3J1ZWRxdHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDA5MTMsImV4cCI6MjA2NjExNjkxM30.f4RSnwdPVkSpApBUuzZlYnG63Y-3SUQtYkAhXpi3tFk"
ANTHROPIC_API_KEY = "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"

app = Flask(__name__, static_folder='dist', static_url_path=None)
CORS(app)

# Claude client
claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def generate_cluster_title_with_claude(conversation_titles, cluster_id, max_retries=3):
    titles_text = "\n".join([f"- {title}" for title in conversation_titles[:10]])
    prompt = f"""You are analyzing conversation titles to create a short, descriptive cluster name. 
Here are the conversation titles in this cluster:
{titles_text}

Please generate a very short (2-4 words) descriptive title..."""
    
    for attempt in range(max_retries):
        try:
            message = claude.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}]
            )
            return message.content[0].text.strip().replace('"', '').replace("'", "")
        except:
            time.sleep(1)
    return f"Cluster {cluster_id + 1}"

def extract_keywords_from_titles(titles, top_n=2):
    all_text = ' '.join(titles)
    words = re.findall(r'\b[a-zA-Z]{3,}\b', all_text.lower())
    stop_words = {...}  # same as before
    words = [w for w in words if w not in stop_words]
    top = [w for w, _ in Counter(words).most_common(top_n)]
    return ' & '.join(top) if top else "Mixed Topics"

def fetch_embeddings_from_supabase():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    batch_size, offset, all_records = 1000, 0, []
    # Limit records during development to prevent database timeouts on large tables
    MAX_RECORDS_TO_FETCH = 3000

    while True:
        try:
            # Select only the specific columns we need to improve query performance
            resp = supabase.table("chat_logs_final").select(
                "email, title, created_at, embeddings_json"
            ).range(offset, offset + batch_size - 1).execute()
            
            if not resp.data: break
            
            all_records.extend(resp.data)
            offset += batch_size

            # Stop fetching if we've reached our development limit
            if len(all_records) >= MAX_RECORDS_TO_FETCH:
                break
        except Exception as e:
            print(f"Error fetching from Supabase: {e}")
            break

    embeddings, emails, titles, timestamps = [], [], [], []
    for i, r in enumerate(all_records):
        emails.append(r.get("email", "unknown"))
        titles.append(r.get("title", "untitled"))
        timestamps.append(r.get("created_at", datetime.now().isoformat()))
        emb = r.get("embeddings_json")
        if emb:
            try:
                emb_obj = json.loads(emb)
                embeddings.append(emb_obj.get("conversation", np.random.randn(512).tolist()))
            except:
                embeddings.append(np.random.randn(512).tolist())
        else:
            embeddings.append(np.random.randn(512).tolist())
    return np.array(embeddings), emails, titles, timestamps

def generate_cluster_titles_for_users(df, embeddings, n_clusters=5):
    cluster_info = {}
    for email in df['email'].unique():
        user_df = df[df['email'] == email].copy()
        user_embeddings = embeddings[user_df.index]
        if len(user_df) < 2:
            title = generate_cluster_title_with_claude([user_df.iloc[0]['title']], 0)
            cluster_info[email] = {0: {'title': title, 'indices': [0], 'conversations': user_df['title'].tolist()}}
            df.loc[user_df.index, 'cluster'] = 0
            df.loc[user_df.index, 'cluster_title'] = title
        else:
            n_user_clusters = min(n_clusters, len(user_df))
            kmeans = KMeans(n_clusters=n_user_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(user_embeddings)
            user_df['cluster'] = labels
            user_info = {}
            for cluster_id in range(n_user_clusters):
                titles = user_df[user_df['cluster'] == cluster_id]['title'].tolist()
                ctitle = generate_cluster_title_with_claude(titles, cluster_id)
                user_info[cluster_id] = {
                    'title': ctitle,
                    'indices': user_df.index[user_df['cluster'] == cluster_id].tolist(),
                    'conversations': titles
                }
            cluster_info[email] = user_info
            df.loc[user_df.index, 'cluster'] = user_df['cluster']
            df.loc[user_df.index, 'cluster_title'] = user_df['cluster'].map(lambda x: user_info[x]['title'])
    return df, cluster_info

def create_3d_umap_visualization(embeddings, emails, titles, timestamps):
    reducer = umap.UMAP(n_components=3, random_state=42)
    embedding_3d = reducer.fit_transform(embeddings)
    df = pd.DataFrame({
        'x': embedding_3d[:, 0],
        'y': embedding_3d[:, 1],
        'z': embedding_3d[:, 2],
        'email': emails,
        'title': titles,
        'timestamp': timestamps
    })
    df, cluster_info = generate_cluster_titles_for_users(df, embeddings)
    return df, cluster_info

# --- Flask Routes ---
cached_df, cached_cluster_info, last_updated = None, None, None

# Serve React App
if os.path.exists('dist'):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + '/' + path):
            return app.send_static_file(path)
        else:
            return app.send_static_file('index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/data')
def get_data():
    global cached_df, cached_cluster_info, last_updated
    if cached_df is None:
        emb, ems, ttl, tss = fetch_embeddings_from_supabase()
        cached_df, cached_cluster_info = create_3d_umap_visualization(emb, ems, ttl, tss)
        last_updated = datetime.now()
    df = cached_df
    return jsonify({
        "data": df.to_dict(orient='records'),
        "cluster_info": cached_cluster_info,
        "stats": {
            "total_conversations": len(df),
            "unique_users": df['email'].nunique(),
            "unique_clusters": df['cluster_title'].nunique(),
            "date_range": {
                "min": df['timestamp'].min(),
                "max": df['timestamp'].max()
            }
        },
        "last_updated": last_updated.isoformat() if last_updated else None
    })

@app.route('/api/refresh', methods=['POST'])
def refresh():
    global cached_df, cached_cluster_info, last_updated
    emb, ems, ttl, tss = fetch_embeddings_from_supabase()
    cached_df, cached_cluster_info = create_3d_umap_visualization(emb, ems, ttl, tss)
    last_updated = datetime.now()
    return jsonify({"message": "Refreshed"})

if __name__ == '__main__':
    app.run(debug=True, port=8000)
