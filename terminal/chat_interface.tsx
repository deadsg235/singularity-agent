import { useState, useEffect, useRef } from 'react';
import FileExplorer from './file_explorer';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
  copyable: boolean;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: new Date(),
      copyable: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        type: 'agent',
        timestamp: new Date(),
        copyable: true
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span>ULTIMA v1.0</span>
        <span className="status">● ONLINE</span>
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <FileExplorer />
        </div>
        
        <div className="chat-area">
          <div className="messages-container">
            {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="sender">
                {message.type === 'user' ? '> USER' : '> ULTIMA'}
              </span>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.copyable && (
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(message.content)}
                >
                  COPY
                </button>
              )}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="message agent processing">
            <div className="message-header">
              <span className="sender">&gt; ULTIMA</span>
              <span className="status">PROCESSING...</span>
            </div>
            <div className="message-content">
              <div className="thinking-indicator">
                ▓▓▓░░░ Deep reasoning in progress...
              </div>
            </div>
          </div>
        )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Enter command or query..."
          className="terminal-input"
          disabled={isProcessing}
        />
        <button 
          onClick={sendMessage}
          disabled={isProcessing || !input.trim()}
          className="send-btn"
        >
          SEND
          </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .terminal-container {
          background: linear-gradient(135deg, #000000 0%, #0a0000 100%);
          color: #ff4444;
          font-family: 'Fira Code', 'Courier New', monospace;
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        
        .main-content {
          display: flex;
          flex: 1;
        }
        
        .sidebar {
          width: 300px;
          background: rgba(10, 0, 0, 0.8);
          border-right: 2px solid #440000;
          position: relative;
          z-index: 3;
        }
        
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .terminal-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 68, 68, 0.03) 2px,
            rgba(255, 68, 68, 0.03) 4px
          );
          pointer-events: none;
          z-index: 1;
        }
        
        .terminal-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%);
          pointer-events: none;
          z-index: 2;
        }

        .terminal-header {
          background: linear-gradient(90deg, #1a0000 0%, #2a0000 50%, #1a0000 100%);
          padding: 15px 25px;
          border-bottom: 2px solid #440000;
          box-shadow: 0 2px 10px rgba(255, 68, 68, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 3;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
        }

        .status {
          color: #ff6666;
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes pulse-glow {
          from { text-shadow: 0 0 5px rgba(255, 102, 102, 0.5); }
          to { text-shadow: 0 0 15px rgba(255, 102, 102, 0.8); }
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 25px;
          position: relative;
          z-index: 3;
          backdrop-filter: blur(0.5px);
        }
        
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: #220000;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: #440000;
          border-radius: 4px;
        }

        .message {
          margin-bottom: 20px;
          border-left: 3px solid #440000;
          padding: 12px 0 12px 20px;
          background: rgba(17, 0, 0, 0.3);
          border-radius: 0 8px 8px 0;
          backdrop-filter: blur(2px);
          transition: all 0.3s ease;
        }
        
        .message:hover {
          background: rgba(34, 0, 0, 0.4);
          border-left-color: #ff4444;
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.1);
        }

        .message.user {
          border-left-color: #cc4444;
          background: rgba(34, 11, 11, 0.3);
        }

        .message.agent {
          border-left-color: #ff4444;
          background: rgba(17, 0, 0, 0.4);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
          font-size: 12px;
          opacity: 0.7;
        }

        .copy-btn {
          background: linear-gradient(45deg, #220000, #330000);
          color: #ff6666;
          border: 1px solid #440000;
          padding: 4px 12px;
          cursor: pointer;
          font-size: 10px;
          border-radius: 4px;
          transition: all 0.2s ease;
          text-transform: uppercase;
          font-weight: bold;
        }

        .copy-btn:hover {
          background: linear-gradient(45deg, #440000, #550000);
          box-shadow: 0 0 10px rgba(255, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .message-content {
          white-space: pre-wrap;
          line-height: 1.4;
        }

        .thinking-indicator {
          animation: thinking-pulse 1.5s infinite;
          font-style: italic;
        }

        @keyframes thinking-pulse {
          0%, 100% { 
            opacity: 1;
            text-shadow: 0 0 5px rgba(255, 68, 68, 0.5);
          }
          50% { 
            opacity: 0.6;
            text-shadow: 0 0 15px rgba(255, 68, 68, 0.8);
          }
        }

        .input-container {
          background: linear-gradient(90deg, #1a0000 0%, #2a0000 50%, #1a0000 100%);
          padding: 25px;
          border-top: 2px solid #440000;
          box-shadow: 0 -2px 10px rgba(255, 68, 68, 0.1);
          display: flex;
          gap: 15px;
          position: relative;
          z-index: 3;
        }

        .terminal-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #440000;
          color: #ff4444;
          padding: 12px 16px;
          font-family: inherit;
          border-radius: 6px;
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .terminal-input:focus {
          outline: none;
          border-color: #ff4444;
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.3);
          background: rgba(17, 0, 0, 0.9);
        }

        .send-btn {
          background: linear-gradient(45deg, #330000, #440000);
          color: #ff6666;
          border: 2px solid #550000;
          padding: 12px 24px;
          cursor: pointer;
          border-radius: 6px;
          font-weight: bold;
          text-transform: uppercase;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .send-btn:hover:not(:disabled) {
          background: linear-gradient(45deg, #550000, #660000);
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
          transform: translateY(-2px);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;