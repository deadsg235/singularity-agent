# Ultima AI Terminal - Complete Overhaul

Lightning-fast AI terminal powered by Groq with full functionality.

## 🚀 Features

- **Real-time AI Chat** - Instant responses via Groq
- **Code Analysis** - Read and suggest code improvements  
- **Tool Generation** - AI creates Python tools from descriptions
- **File Explorer** - Browse and view project files
- **Token System** - Built-in usage tracking
- **Terminal Commands** - Full command-line interface

## ⚡ Quick Setup

1. **Get Groq API Key**: https://console.groq.com
2. **Set Environment Variable**: `GROQ_API_KEY=your_key`
3. **Deploy**: `vercel --prod`

## 🎯 Commands

- `help` - Show all commands
- `clear` - Clear terminal
- `status` - System status
- `balance` - Token balance
- `files` - List files
- `health` - API health

## 🛠️ API Endpoints

- `POST /api/chat` - Chat with AI
- `GET /api/code/read` - Read files
- `POST /api/code/suggest` - Code suggestions
- `POST /api/tool/generate` - Generate tools
- `GET /api/token/balance` - Check tokens
- `GET /api/health` - System health

## 🔧 Environment Variables

```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
```

## 📊 Token Costs

- Chat: 5 tokens
- Code suggestions: 50 tokens  
- Tool generation: 75 tokens
- Starting balance: 1000 tokens

Ready to deploy with full functionality!