import json
import random
from supabase import create_client, Client

# --- Supabase Setup ---
SUPABASE_URL = "https://aqavgmrcggugruedqtzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZnbXJjZ2d1Z3J1ZWRxdHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDA5MTMsImV4cCI6MjA2NjExNjkxM30.f4RSnwdPVkSpApBUuzZlYnG63Y-3SUQtYkAhXpi3tFk"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Load JSON File ---
with open('conversations.json', 'r') as f:
    data = json.load(f)

# --- Helper: Generate 1024-dimensional random embedding ---
def generate_dummy_embedding():
    return [random.uniform(-1, 1) for _ in range(1024)]

# --- Normalize role ---
def normalize_role(sender):
    if sender == 'human':
        return 'user'
    return sender  # e.g., assistant

# --- Main Logic ---
def insert_conversation(chat, msg):
    sender = msg.get('sender')
    if sender not in ['human', 'assistant']:
        return

    insert_data = {
        "conversation_id": str(chat.get("uuid")),
        "title": chat.get("name"),
        "author_role": normalize_role(sender),
        "body": msg.get("text"),
        "created_at": str(msg.get("created_at")),
        "company": "claude",
        "embedding": generate_dummy_embedding(),
        "email": "ahilanks101@gmail.com"  # <-- Set statically or extract from data
    }

    if "attachments" in msg:
        insert_data["attachments"] = json.dumps(msg["attachments"])

    response = supabase.table("chat_logs_final").insert(insert_data).execute()
    print(response)


if isinstance(data, list):
    for chat in data:
        for msg in chat.get("chat_messages", []):
            insert_conversation(chat, msg)
else:
    for msg in data.get("chat_messages", []):
        insert_conversation(data, msg)
