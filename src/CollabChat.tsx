import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Message {
  text: string;
  sender: string;
}

const CollabChat: React.FC = () => {
  const { sessionId, currentUserEmail } = useParams<{ sessionId: string; currentUserEmail: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const parts = sessionId ? sessionId.split('-') : [];
  const topic = parts.length > 2 ? decodeURIComponent(parts.slice(2).join('-')) : "this discussion";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/get_collab_history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        
        setMessages(currentMessages => {
          if (JSON.stringify(data.messages) !== JSON.stringify(currentMessages)) {
            return data.messages || [];
          }
          return currentMessages;
        });
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    const intervalId = setInterval(fetchHistory, 2000);
    fetchHistory(); 

    return () => clearInterval(intervalId);
  }, [sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserEmail) return;

    const tempId = Date.now().toString();
    const optimisticMessage: Message = { text: input, sender: currentUserEmail };
    setMessages(prev => [...prev, optimisticMessage]);
    
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      await fetch('/api/collab_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentUserEmail,
          message: messageToSend,
        }),
      });
      // The polling mechanism will handle updating the final state
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.text !== messageToSend));
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageClass = (sender: string) => {
    if (sender === 'ai') return 'ai-message';
    return sender === currentUserEmail ? 'user-message-right' : 'user-message-left';
  }

  return (
    <div className="collab-chat-page">
      <style>{`
        .collab-chat-page { 
          display: flex; 
          flex-direction: column; 
          height: 100vh; 
          background-color: #000000;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 20px 20px;
          color: white; 
          font-family: 'Inter', sans-serif; 
        }
        
        /* Header and Footer Panels */
        .collab-header, .collab-input-form {
          background: rgba(15, 15, 15, 0.8);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
        }

        .collab-header {
          display: flex; 
          justify-content: space-between; 
          align-items: center;
        }

        .collab-input-form {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          display: flex;
        }

        .collab-header h1 { font-size: 18px; margin: 0; font-weight: 600; }
        .collab-header .topic { font-size: 14px; color: #a0a0a0; font-weight: 400; margin-top: 4px; }
        
        .back-btn {
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border: none;
          border-radius: 8px;
          color: white;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .back-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 217, 255, 0.2);
        }

        .collab-messages { flex-grow: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .collab-message { max-width: 70%; padding: 12px 16px; border-radius: 12px; line-height: 1.5; font-size: 15px; display: flex; flex-direction: column; transition: transform 0.2s ease; }
        .collab-message:hover { transform: scale(1.01); }

        .sender-label { font-size: 12px; font-weight: 600; margin-bottom: 6px; opacity: 0.9; }
        
        /* Message bubble styling */
        .ai-message { align-self: flex-start; background: rgba(40, 40, 40, 0.9); border: 1px solid rgba(255, 255, 255, 0.05); color: #e0e0e0; }
        .user-message-right { align-self: flex-end; background: linear-gradient(45deg, #00d9ff, #0099cc); color: white; }
        .user-message-left { align-self: flex-start; background: rgba(50, 50, 50, 0.9); border: 1px solid rgba(255, 255, 255, 0.05); color: white; }

        /* Copied from Chatbot.tsx for consistency */
        .chatbot-input {
          flex-grow: 1;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          margin-right: 10px;
          transition: all 0.2s ease;
        }
        .chatbot-input:focus {
          border-color: #00d9ff;
          background: rgba(0, 0, 0, 0.3);
        }

        .chatbot-send-btn {
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border: none;
          color: white;
          padding: 0 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .chatbot-send-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 217, 255, 0.2);
        }
        .chatbot-send-btn:disabled {
          background: #555;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
      <div className="collab-header">
        <div>
          <h1>Poke Their Brain</h1>
          <span className="topic">Topic: {topic}</span>
        </div>
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Graph
        </button>
      </div>
      <div className="collab-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`collab-message ${getMessageClass(msg.sender)}`}>
            <span className="sender-label">
              {msg.sender === 'ai' ? 'Wrapped.ai' : msg.sender}
            </span>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="collab-message ai-message"><span className="sender-label">Wrapped.ai</span>...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="collab-input-form">
        <input
          type="text"
          className="chatbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message, use @WrapperAI for help"
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
        <button
          className="chatbot-send-btn"
          onClick={sendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CollabChat; 