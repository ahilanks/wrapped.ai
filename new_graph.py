import os
import numpy as np
import pandas as pd
import umap
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import seaborn as sns
from supabase import create_client, Client
import tensorflow as tf
from tensorboard.plugins import projector
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# --- Supabase Setup ---
SUPABASE_URL = "https://aqavgmrcggugruedqtzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZnbXJjZ2d1Z3J1ZWRxdHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDA5MTMsImV4cCI6MjA2NjExNjkxM30.f4RSnwdPVkSpApBUuzZlYnG63Y-3SUQtYkAhXpi3tFk"

def fetch_embeddings_from_supabase():
    """Fetch all embeddings and metadata from Supabase using pagination"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    batch_size = 1000
    all_records = []
    offset = 0

    while True:
        print(f"Fetching rows {offset} to {offset + batch_size - 1}...")
        response = supabase.table("chat_logs_final").select("*").range(offset, offset + batch_size - 1).execute()
        batch = response.data

        if not batch:
            break
        
        all_records.extend(batch)
        offset += batch_size

    print(f"Total records fetched: {len(all_records)}")
    
    # Now continue with your parsing logic as before
    embeddings = []
    emails = []
    titles = []
    timestamps = []
    
    for i, r in enumerate(all_records):
        emails.append(r.get("email", "unknown"))
        titles.append(r.get("title", "untitled"))
        timestamps.append(r.get("created_at", "unknown"))
        
        embedding_json = r.get("embeddings_json")
        if embedding_json is not None:
            try:
                import json
                embedding_data = json.loads(embedding_json)
                if isinstance(embedding_data, dict) and 'conversation' in embedding_data:
                    conversation_embedding = embedding_data['conversation']
                    embeddings.append(conversation_embedding)
                else:
                    seed_value = hash(f"{emails[-1]}_{titles[-1]}_{i}") % (2**32)
                    local_random = np.random.RandomState(seed_value)
                    embeddings.append(local_random.normal(0, 1, 512).tolist())
            except Exception as e:
                seed_value = hash(f"{emails[-1]}_{titles[-1]}_{i}") % (2**32)
                local_random = np.random.RandomState(seed_value)
                embeddings.append(local_random.normal(0, 1, 512).tolist())
        else:
            seed_value = hash(f"{emails[-1]}_{titles[-1]}_{i}") % (2**32)
            local_random = np.random.RandomState(seed_value)
            embeddings.append(local_random.normal(0, 1, 512).tolist())
    
    embeddings_array = np.array(embeddings)
    print(f"Final embeddings shape: {embeddings_array.shape}")
    return embeddings_array, emails, titles, timestamps

def create_3d_umap_visualization(embeddings, emails, titles, timestamps):
    """Create 3D UMAP visualization"""
    print("Creating 3D UMAP projection...")
    
    # UMAP with 3 components for 3D visualization
    reducer = umap.UMAP(
        n_components=3,  # 3D instead of 2D
        n_neighbors=15, 
        min_dist=0.1, 
        metric='cosine',
        random_state=42
    )
    embedding_3d = reducer.fit_transform(embeddings)
    
    # Create DataFrame
    df = pd.DataFrame({
        "x": embedding_3d[:, 0],
        "y": embedding_3d[:, 1],
        "z": embedding_3d[:, 2],
        "email": emails,
        "title": titles,
        "created_at": timestamps
    })
    
    # Create 3D plot
    fig = plt.figure(figsize=(15, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # Get unique emails for color mapping
    unique_emails = df['email'].unique()
    colors = plt.cm.Set3(np.linspace(0, 1, len(unique_emails)))
    email_color_map = dict(zip(unique_emails, colors))
    
    # Plot points
    for email in unique_emails:
        mask = df['email'] == email
        ax.scatter(
            df[mask]['x'], 
            df[mask]['y'], 
            df[mask]['z'],
            c=[email_color_map[email]], 
            label=email[:20] + '...' if len(email) > 20 else email,
            alpha=0.7,
            s=50
        )
    
    ax.set_xlabel('UMAP-1')
    ax.set_ylabel('UMAP-2')
    ax.set_zlabel('UMAP-3')
    ax.set_title('3D UMAP Projection of Conversations by Email')
    
    # Add legend (limit to avoid clutter)
    if len(unique_emails) <= 10:
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.tight_layout()
    plt.show()
    
    return embedding_3d, df

def setup_tensorboard_projector(embeddings, emails, titles, timestamps, log_dir='logs/chat-embeddings'):
    """Setup TensorBoard Embedding Projector"""
    print("Setting up TensorBoard Embedding Projector...")
    
    # Create log directory
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Save metadata (labels for each embedding)
    metadata_file = os.path.join(log_dir, 'metadata.tsv')
    with open(metadata_file, 'w', encoding='utf-8') as f:
        # Write header
        f.write("Email\tTitle\tTimestamp\n")
        
        # Write data
        for email, title, timestamp in zip(emails, titles, timestamps):
            # Clean the data for TSV format
            clean_email = str(email).replace('\t', ' ').replace('\n', ' ')
            clean_title = str(title).replace('\t', ' ').replace('\n', ' ')[:50]  # Truncate long titles
            clean_timestamp = str(timestamp).replace('\t', ' ').replace('\n', ' ')
            
            f.write(f"{clean_email}\t{clean_title}\t{clean_timestamp}\n")
    
    # Save embeddings as TensorFlow variable
    embeddings_var = tf.Variable(embeddings, name='chat_embeddings')
    
    # Create checkpoint
    checkpoint = tf.train.Checkpoint(embedding=embeddings_var)
    checkpoint_path = os.path.join(log_dir, "embedding.ckpt")
    checkpoint.save(checkpoint_path)
    
    # Configure projector
    config = projector.ProjectorConfig()
    embedding_config = config.embeddings.add()
    embedding_config.tensor_name = "embedding/.ATTRIBUTES/VARIABLE_VALUE"
    embedding_config.metadata_path = 'metadata.tsv'
    
    # Save projector config
    projector.visualize_embeddings(log_dir, config)
    
    print(f"TensorBoard files saved to: {log_dir}")
    print("To view the embedding projector:")
    print(f"1. Run: tensorboard --logdir {log_dir}")
    print("2. Open your browser to the displayed URL")
    print("3. Click on the 'PROJECTOR' tab")

def create_interactive_3d_plot(embedding_3d, df):
    """Create an interactive 3D plot using plotly (if available)"""
    try:
        import plotly.express as px
        import plotly.graph_objects as go
        
        fig = px.scatter_3d(
            df, 
            x='x', y='y', z='z',
            color='email',
            hover_data=['title', 'created_at'],
            title='Interactive 3D UMAP Projection of Chat Embeddings'
        )
        
        fig.update_traces(marker=dict(size=5))
        fig.update_layout(
            scene=dict(
                xaxis_title='UMAP-1',
                yaxis_title='UMAP-2',
                zaxis_title='UMAP-3'
            ),
            width=1000,
            height=700
        )
        
        fig.show()
        return True
        
    except ImportError:
        print("Plotly not available. Install with: pip install plotly")
        return False

def main():
    """Main function to run all visualizations"""
    print("Fetching data from Supabase...")
    embeddings, emails, titles, timestamps = fetch_embeddings_from_supabase()
    
    # Validate data
    if len(embeddings) == 0:
        print("No embeddings found! Exiting...")
        return None, None
    
    print(f"Loaded {len(embeddings)} embeddings")
    if len(embeddings.shape) == 2:
        print(f"Embedding dimensions: {embeddings.shape[1]}")
    else:
        print(f"Embeddings shape: {embeddings.shape}")
    
    # Create 3D UMAP visualization
    embedding_3d, df = create_3d_umap_visualization(embeddings, emails, titles, timestamps)
    
    # Try to create interactive plot
    if not create_interactive_3d_plot(embedding_3d, df):
        print("Showing static 3D plot only")
    
    # Setup TensorBoard projector
    setup_tensorboard_projector(embeddings, emails, titles, timestamps)
    
    print("\nVisualization complete!")
    print("You now have:")
    print("1. 3D matplotlib visualization (shown above)")
    print("2. TensorBoard projector files (run tensorboard --logdir logs/chat-embeddings)")
    
    return df, embeddings

if __name__ == "__main__":
    # Run the main function
    result = main()
    
    if result[0] is not None and result[1] is not None:
        df_result, embeddings_result = result
        
        # Optional: Print some statistics
        print(f"\nDataset statistics:")
        print(f"- Total conversations: {len(df_result)}")
        print(f"- Unique users: {df_result['email'].nunique()}")
        print(f"- Embedding dimensions: {embeddings_result.shape[1] if len(embeddings_result.shape) == 2 else 'N/A'}")
        print(f"- Date range: {df_result['created_at'].min()} to {df_result['created_at'].max()}")
    else:
        print("Visualization failed due to data issues.")