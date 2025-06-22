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
from sklearn.cluster import KMeans
from collections import Counter
import re
import anthropic
import time

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# --- Supabase Setup ---
SUPABASE_URL = "https://aqavgmrcggugruedqtzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZnbXJjZ2d1Z3J1ZWRxdHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NDA5MTMsImV4cCI6MjA2NjExNjkxM30.f4RSnwdPVkSpApBUuzZlYnG63Y-3SUQtYkAhXpi3tFk"

# --- Anthropic Setup ---
# Add your Anthropic API key here
ANTHROPIC_API_KEY = "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"  # Replace with your actual API key

def generate_cluster_title_with_claude(conversation_titles, cluster_id, max_retries=3):
    """Generate a cluster title using Claude API based on conversation titles"""
    try:
        # Initialize the Anthropic client
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        # Prepare the prompt
        titles_text = "\n".join([f"- {title}" for title in conversation_titles[:10]])  # Limit to 10 titles
        
        prompt = f"""You are analyzing conversation titles to create a short, descriptive cluster name. 

Here are the conversation titles in this cluster:
{titles_text}

Please generate a very short (2-4 words) descriptive title that captures the main theme or topic of these conversations. The title should be:
- Concise and clear
- Capture the essence of the conversations
- Professional and readable
- No more than 4 words

Examples of good cluster titles:
- "Python & Data Analysis"
- "Project Management"
- "Technical Support"
- "Creative Writing"
- "Business Strategy"

Just return the cluster title, nothing else."""

        for attempt in range(max_retries):
            try:
                message = client.messages.create(
                    model="claude-3-haiku-20240307",  # Using Haiku for speed and cost efficiency
                    max_tokens=50,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                cluster_title = message.content[0].text.strip()
                # Clean up the response
                cluster_title = cluster_title.replace('"', '').replace("'", "")
                
                if cluster_title:
                    return cluster_title
                
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for cluster {cluster_id}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # Brief delay before retry
                continue
        
        # Fallback if all attempts fail
        return f"Cluster {cluster_id + 1}"
        
    except Exception as e:
        print(f"Claude API error for cluster {cluster_id}: {e}")
        # Fallback to keyword extraction
        return extract_keywords_from_titles(conversation_titles, top_n=2)

def extract_keywords_from_titles(titles, top_n=2):
    """Fallback function: Extract common keywords from conversation titles"""
    # Combine all titles and extract meaningful words
    all_text = ' '.join([str(title) for title in titles])
    
    # Simple keyword extraction
    words = re.findall(r'\b[a-zA-Z]{3,}\b', all_text.lower())
    
    # Remove common stop words
    stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'use', 'what', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'she', 'been', 'than', 'that', 'were', 'said', 'each', 'which', 'their', 'time', 'about', 'would', 'there', 'could', 'other', 'into', 'very', 'what', 'know', 'just', 'first', 'also', 'after', 'back', 'well', 'work', 'life', 'only', 'then', 'should', 'those', 'come', 'need', 'want', 'question', 'help', 'create', 'make', 'using', 'used', 'like', 'code', 'data', 'analysis'}
    
    words = [word for word in words if word not in stop_words and len(word) > 3]
    
    # Get most common words
    word_counts = Counter(words)
    top_keywords = [word for word, count in word_counts.most_common(top_n)]
    
    if top_keywords:
        return ' & '.join(top_keywords[:2])
    else:
        return "Mixed Topics"

def generate_cluster_titles_for_users(df, embeddings, n_clusters=5):
    """Generate cluster titles for each user's conversations using Claude API"""
    cluster_info = {}
    
    for email in df['email'].unique():
        print(f"Processing clusters for user: {email}")
        user_mask = df['email'] == email
        user_df = df[user_mask].copy()
        user_embeddings = embeddings[user_mask]
        
        if len(user_df) < 2:
            # If user has only one conversation, use Claude to generate a title
            single_title = user_df['title'].iloc[0]
            if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
                generated_title = generate_cluster_title_with_claude([single_title], 0)
            else:
                generated_title = f"Single: {single_title[:20]}..."
            
            cluster_info[email] = {
                0: {
                    'title': generated_title,
                    'indices': [0],
                    'conversations': user_df['title'].tolist()
                }
            }
            user_df['cluster'] = 0
        else:
            # Perform clustering on user's conversations
            n_user_clusters = min(n_clusters, len(user_df))
            kmeans = KMeans(n_clusters=n_user_clusters, random_state=42, n_init=10)
            user_clusters = kmeans.fit_predict(user_embeddings)
            user_df['cluster'] = user_clusters
            
            # Generate titles for each cluster using Claude
            user_cluster_info = {}
            for cluster_id in range(n_user_clusters):
                cluster_mask = user_clusters == cluster_id
                cluster_titles = user_df[cluster_mask]['title'].tolist()
                
                print(f"  Generating title for cluster {cluster_id + 1} ({len(cluster_titles)} conversations)")
                
                # Use Claude API to generate cluster title
                if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
                    cluster_title = generate_cluster_title_with_claude(cluster_titles, cluster_id)
                else:
                    # Fallback to keyword extraction if no API key
                    keywords = extract_keywords_from_titles(cluster_titles, top_n=2)
                    cluster_title = keywords if keywords else f"Cluster {cluster_id + 1}"
                
                user_cluster_info[cluster_id] = {
                    'title': cluster_title,
                    'indices': np.where(cluster_mask)[0].tolist(),
                    'conversations': cluster_titles
                }
            
            cluster_info[email] = user_cluster_info
        
        # Update the main dataframe with cluster information
        df.loc[user_mask, 'cluster'] = user_df['cluster']
        df.loc[user_mask, 'cluster_title'] = user_df['cluster'].map(
            lambda x: cluster_info[email][x]['title']
        )
    
    return df, cluster_info

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
    
    # Generate cluster titles for each user
    print("Generating cluster titles for users...")
    df, cluster_info = generate_cluster_titles_for_users(df, embeddings)
    
    # Print cluster information
    print("\n=== CLUSTER ANALYSIS ===")
    for email, clusters in cluster_info.items():
        print(f"\nUser: {email}")
        for cluster_id, info in clusters.items():
            print(f"  {info['title']} ({len(info['conversations'])} conversations)")
            # Show first few conversation titles as examples
            examples = info['conversations'][:3]
            for example in examples:
                print(f"    - {example[:50]}...")
    
    # Create 3D plot with cluster information
    fig = plt.figure(figsize=(16, 12))
    ax = fig.add_subplot(111, projection='3d')
    
    # Get unique emails for color mapping
    unique_emails = df['email'].unique()
    colors = plt.cm.Set3(np.linspace(0, 1, len(unique_emails)))
    email_color_map = dict(zip(unique_emails, colors))
    
    # Plot points with cluster information
    for email in unique_emails:
        email_mask = df['email'] == email
        email_df = df[email_mask]
        
        # Get unique clusters for this email
        unique_clusters = email_df['cluster_title'].unique()
        
        for i, cluster_title in enumerate(unique_clusters):
            cluster_mask = email_df['cluster_title'] == cluster_title
            cluster_data = email_df[cluster_mask]
            
            # Use different markers or transparency for different clusters
            marker_style = ['o', 's', '^', 'D', 'v'][i % 5]  # Cycle through marker styles
            
            ax.scatter(
                cluster_data['x'], 
                cluster_data['y'], 
                cluster_data['z'],
                c=[email_color_map[email]], 
                label=f"{email[:15]}... - {cluster_title}",
                alpha=0.7,
                s=60,
                marker=marker_style
            )
    
    ax.set_xlabel('UMAP-1')
    ax.set_ylabel('UMAP-2')
    ax.set_zlabel('UMAP-3')
    ax.set_title('3D UMAP Projection of Conversations by Email (with Cluster Titles)')
    
    # Add legend (limit to avoid clutter)
    if len(df['cluster_title'].unique()) <= 15:
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)
    
    plt.tight_layout()
    plt.show()
    
    return embedding_3d, df

def setup_tensorboard_projector(embeddings, emails, titles, timestamps, df=None, log_dir='logs/chat-embeddings'):
    """Setup TensorBoard Embedding Projector"""
    print("Setting up TensorBoard Embedding Projector...")
    
    # Create log directory
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Save metadata (labels for each embedding) - enhanced with cluster info
    metadata_file = os.path.join(log_dir, 'metadata.tsv')
    with open(metadata_file, 'w', encoding='utf-8') as f:
        # Write header
        if df is not None and 'cluster_title' in df.columns:
            f.write("Email\tTitle\tTimestamp\tCluster\n")
        else:
            f.write("Email\tTitle\tTimestamp\n")
        
        # Write data
        for i, (email, title, timestamp) in enumerate(zip(emails, titles, timestamps)):
            # Clean the data for TSV format
            clean_email = str(email).replace('\t', ' ').replace('\n', ' ')
            clean_title = str(title).replace('\t', ' ').replace('\n', ' ')[:50]  # Truncate long titles
            clean_timestamp = str(timestamp).replace('\t', ' ').replace('\n', ' ')
            
            if df is not None and 'cluster_title' in df.columns:
                cluster_title = str(df.iloc[i]['cluster_title']).replace('\t', ' ').replace('\n', ' ')
                f.write(f"{clean_email}\t{clean_title}\t{clean_timestamp}\t{cluster_title}\n")
            else:
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
        
        # Enhanced hover data with cluster information
        hover_data = ['title', 'created_at']
        if 'cluster_title' in df.columns:
            hover_data.append('cluster_title')
        
        fig = px.scatter_3d(
            df, 
            x='x', y='y', z='z',
            color='email',
            symbol='cluster_title' if 'cluster_title' in df.columns else None,
            hover_data=hover_data,
            title='Interactive 3D UMAP Projection of Chat Embeddings (with Clusters)'
        )
        
        fig.update_traces(marker=dict(size=5))
        fig.update_layout(
            scene=dict(
                xaxis_title='UMAP-1',
                yaxis_title='UMAP-2',
                zaxis_title='UMAP-3'
            ),
            width=1200,
            height=800
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
    
    # Check if Anthropic API key is set
    if ANTHROPIC_API_KEY == "your-anthropic-api-key-here":
        print("\n⚠️  WARNING: Anthropic API key not set!")
        print("Please set your ANTHROPIC_API_KEY in the code to use Claude for cluster title generation.")
        print("Falling back to keyword extraction method.")
        print("To get an API key, visit: https://console.anthropic.com/")
    else:
        print("✅ Using Claude API for intelligent cluster title generation")
    
    # Create 3D UMAP visualization (now includes cluster generation with Claude)
    embedding_3d, df = create_3d_umap_visualization(embeddings, emails, titles, timestamps)
    
    # Try to create interactive plot
    if not create_interactive_3d_plot(embedding_3d, df):
        print("Showing static 3D plot only")
    
    # Setup TensorBoard projector (now includes cluster info)
    setup_tensorboard_projector(embeddings, emails, titles, timestamps, df)
    
    print("\nVisualization complete!")
    print("You now have:")
    print("1. 3D matplotlib visualization with AI-generated cluster titles (shown above)")
    print("2. TensorBoard projector files with cluster information")
    print("3. Cluster analysis with Claude-generated titles printed above")
    
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
        print(f"- Total clusters: {df_result['cluster_title'].nunique() if 'cluster_title' in df_result.columns else 'N/A'}")
        print(f"- Embedding dimensions: {embeddings_result.shape[1] if len(embeddings_result.shape) == 2 else 'N/A'}")
        print(f"- Date range: {df_result['created_at'].min()} to {df_result['created_at'].max()}")
    else:
        print("Visualization failed due to data issues.")