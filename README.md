# Ultima AI Terminal

A sleek, terminal-style AI assistant powered by Ollama with advanced tool generation capabilities.

## ✨ Features

- **Terminal Interface**: Sleek, hacker-style terminal UI with real-time interaction
- **Ultima AI**: Advanced AI assistant with code generation and analysis
- **Free LLM**: Powered by Ollama - no API keys required
- **Tool Generation**: AI-powered Python tool creation from natural language
- **Code Analysis**: Read, analyze, and suggest improvements to code files
- **Smart Commands**: Built-in terminal commands and AI chat integration
- **Token System**: Secure usage tracking with Ultima Tokens
- **Real-time Status**: Live connection monitoring and system status

## 🚀 Tech Stack

- **Backend**: Flask (Python) + Serverless Functions
- **AI Model**: Ollama (llama3.2, codellama, etc.)
- **LLM Framework**: LangChain
- **Frontend**: Vanilla JS + Terminal CSS
- **Deployment**: Vercel
- **Fonts**: JetBrains Mono

## 🔧 Setup Requirements

### 1. Install Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (e.g., llama3.2)
ollama pull llama3.2

# Start Ollama server
ollama serve
```

### 2. Environment Setup
Set in Vercel dashboard or `.env.local`:
```bash
OLLAMA_MODEL=llama3.2
ULTIMA_AGENT_SYSTEM_PROMPT=optional_custom_prompt
```

## 💻 Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Ensure Ollama is running
ollama serve

# Run development server
python api/index.py

# Open terminal
open http://localhost:5000
```

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

## 🎯 Terminal Commands

- `help` - Show available commands
- `clear` - Clear terminal screen
- `status` - Show system status
- `tools` - Open tools panel
- `balance` - Check token balance
- Chat naturally with Ultima AI

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/chat` | POST | Chat with Ultima AI |
| `/api/tool/suggest` | POST | Generate Python tools |
| `/api/code/read` | GET | Read project files |
| `/api/code/suggest_change` | POST | Suggest code improvements |
| `/api/prompt/get` | GET | View system prompt |
| `/api/prompt/suggest` | GET | Generate new prompts |
| `/api/token/balance` | GET | Check token balance |

## 📁 Project Structure

```
ultima-terminal/
├── api/
│   └── index.py              # Flask API server
├── ml_core/
│   └── deep_q_tool_generator.py  # AI tool generator
├── public/
│   ├── index.html            # Terminal interface
│   ├── script.js             # Terminal logic
│   └── style.css             # Terminal styling
├── agent_web.py              # Ultima AI agent (Ollama)
├── token_module.py           # Token management
├── requirements.txt          # Dependencies
├── vercel.json              # Vercel config
└── deploy.py                # Deployment helper
```

## 🔒 Security Features

- Path traversal protection
- CORS configuration
- Input sanitization
- Token-based rate limiting
- Secure file access boundaries

## 🎨 Terminal Features

- **Sleek Design**: Modern terminal aesthetic with red glow effects
- **Responsive**: Works on desktop and mobile devices
- **Real-time**: Live typing indicators and status updates
- **Interactive**: Click-to-use tools and commands
- **Animated**: Smooth transitions and terminal boot sequence

## 📊 Token System

- Chat messages: 5 tokens
- Code suggestions: 50 tokens
- Tool generation: 75 tokens
- Prompt suggestions: 25 tokens
- Starting balance: 1000 tokens

## 🆓 Free LLM Benefits

- **No API costs** - Run completely free with Ollama
- **Privacy** - All processing happens locally
- **Customizable** - Use any Ollama-supported model
- **Offline capable** - Works without internet (after model download)

## 🚀 Quick Start

1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull llama3.2
   ollama serve
   ```

2. **Clone & Setup**
   ```bash
   git clone <repo>
   cd singularity-agent
   pip install -r requirements.txt
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Use Terminal**
   - Open your Vercel URL
   - Type `help` for commands
   - Chat with Ultima AI
   - Use tools panel (⚡ button)

## 🤖 Supported Models

- **llama3.2** - General purpose (recommended)
- **codellama** - Code-focused
- **mistral** - Fast and efficient
- **phi3** - Lightweight option

## 📝 License

MIT License - Build amazing AI terminals for free!