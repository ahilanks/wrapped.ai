import React, { useState, useRef, useEffect } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatbotProps {
  selectedPoint: any; // Use a more specific type if available
  currentUserEmail: string | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ selectedPoint, currentUserEmail }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          user_email: currentUserEmail,
          selected_conversation: selectedPoint,
          chat_history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botMessage: Message = { text: data.response, isUser: false };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage: Message = { text: 'Sorry, I encountered an error. Please try again.', isUser: false };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <style>{`
        .chatbot-container {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 350px;
          height: 450px;
          background: rgba(15, 15, 15, 0.85);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          z-index: 1001; /* Above other UI panels */
        }
        .chatbot-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
        }
        .chatbot-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 10px;
          line-height: 1.4;
          font-size: 14px;
        }
        .user-message {
          align-self: flex-end;
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          color: white;
          border-bottom-right-radius: 2px;
        }
        .bot-message {
          align-self: flex-start;
          background: rgba(40, 40, 40, 0.9);
          color: #e0e0e0;
          border-bottom-left-radius: 2px;
        }
        .chatbot-input-form {
          display: flex;
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chatbot-input {
          flex-grow: 1;
          padding: 10px 14px;
          background: rgba(40, 40, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          margin-right: 10px;
        }
        .chatbot-send-btn {
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border: none;
          color: white;
          padding: 0 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
      `}</style>
      <div className="chatbot-header">Groq AI Assistant</div>
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="spinner" style={{width: '20px', height: '20px', margin: '0 auto'}}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="chatbot-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          className="chatbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your data..."
          disabled={isLoading}
        />
        <button type="submit" className="chatbot-send-btn" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot; 