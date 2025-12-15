# 🚀 ULTIMA AI - Self-Referencing AI Terminal

Ultima is an advanced self-referencing AI with Deep Q-Network reasoning capabilities, built for continuous learning and self-improvement.

## ✨ Features

- **🧠 Self-Referencing AI**: Dynamic system prompt updates and self-modification
- **🔬 DQN Reasoning**: Advanced Deep Q-Network for cognitive processing
- **🛠️ Tool Creation**: Generate and manage custom tools dynamically  
- **📊 Real-time Monitoring**: Live activity logs and system status
- **🎨 Futuristic UI**: Black/red metallic terminal with scanlines
- **⚡ Typewriter Effect**: Realistic AI response animation
- **🪙 Token Integration**: Built-in token economy support

## 🏗️ Architecture

```
├── app.py              # Main Flask application
├── api/index.py        # Vercel serverless API
├── dqn_core.py         # Simple DQN implementation
├── torch_dqn.py        # Advanced PyTorch DQN (optional)
├── index.html          # Terminal UI interface
└── requirements.txt    # Dependencies
```

## 🚀 Quick Start

### Local Development
```bash
git clone <repository>
cd singularity-agent
pip install -r requirements.txt
python app.py
```

### Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

## 🎮 Usage

1. **Chat**: Interact with Ultima through the terminal
2. **Upgrade**: Click "Upgrade" to modify system prompts
3. **Advanced Mode**: Toggle PyTorch DQN for enhanced reasoning
4. **Monitor**: View real-time logs, tools, and upgrades in sidebar

## 🔧 API Endpoints

- `POST /api/chat` - Chat with AI
- `POST /api/upgrade/prompt` - Update system prompt
- `POST /api/create-tool` - Create new tool
- `GET /api/status` - System status
- `GET /api/logs` - Activity logs
- `GET /api/tools` - Created tools

## 🪙 Token Integration

**Token Address**: `9bzJn2jHQPCGsYKapFvytJQcbaz5FN2TtNB43jb1pump`

Ultima is designed to integrate with token-based economies for AI services and capabilities.

## 🧠 DQN System

Ultima uses a dual-mode DQN system:

- **Simple DQN**: Pure Python Q-learning for basic reasoning
- **PyTorch DQN**: Neural network with replay buffer for advanced cognition

The AI learns from every interaction, continuously improving its responses and reasoning capabilities.

## 🎨 UI Features

- **Scanline Effects**: Authentic terminal aesthetics
- **Typewriter Animation**: Realistic AI response rendering
- **Real-time Updates**: Live system monitoring
- **Responsive Design**: Works on desktop and mobile

## 🔮 Self-Improvement

Ultima can:
- Modify its own system prompts
- Create new tools and capabilities
- Learn from user interactions
- Upgrade its reasoning algorithms
- Track its own evolution

## 📝 License

MIT License - Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request

---

**Ultima AI** - The future of self-referencing artificial intelligence.