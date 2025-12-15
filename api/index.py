from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import traceback

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")

# Simple in-memory token system
user_tokens = {"default_user": 1000}
token_costs = {
    "chat": 5,
    "code": 50,
    "tool": 75,
    "prompt": 25
}

def deduct_tokens(user_id, cost):
    if user_tokens.get(user_id, 0) >= cost:
        user_tokens[user_id] -= cost
        return True
    return False

def get_balance(user_id):
    return user_tokens.get(user_id, 0)

# Groq client
def call_groq(messages, max_tokens=1024):
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not configured"
    
    try:
        import groq
        client = groq.Groq(api_key=GROQ_API_KEY)
        
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Ultima AI Terminal",
        "groq_configured": bool(GROQ_API_KEY),
        "model": GROQ_MODEL
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        user_id = data.get('user_id', 'default_user')
        history = data.get('history', [])
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        # Check tokens
        cost = token_costs["chat"]
        if not deduct_tokens(user_id, cost):
            return jsonify({"error": f"Insufficient tokens. Need {cost}, have {get_balance(user_id)}"}), 402
        
        # Build messages
        messages = [{"role": "system", "content": "You are Ultima, an advanced AI assistant with cutting-edge capabilities."}]
        
        # Add history
        for msg in history[-10:]:  # Last 10 messages
            role = "user" if msg.get('role') == 'user' else "assistant"
            content = msg.get('parts', '')
            if content:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})
        
        # Get response
        response = call_groq(messages)
        
        return jsonify({"response": response})
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/code/read', methods=['GET'])
def read_code():
    try:
        file_path = request.args.get('file_path', '')
        if not file_path:
            return jsonify({"error": "file_path required"}), 400
            
        # Security: only allow certain files
        allowed_files = [
            'api/index.py', 'public/index.html', 'public/style.css', 
            'public/script.js', 'requirements.txt', 'vercel.json'
        ]
        
        if file_path not in allowed_files:
            return jsonify({"error": "File not allowed"}), 403
            
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_path = os.path.join(project_root, file_path)
        
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({"file_path": file_path, "content": content})
        else:
            return jsonify({"error": "File not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/code/suggest', methods=['POST'])
def suggest_code():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        file_content = data.get('file_content', '')
        description = data.get('description', '')
        
        if not file_content or not description:
            return jsonify({"error": "file_content and description required"}), 400
            
        cost = token_costs["code"]
        if not deduct_tokens(user_id, cost):
            return jsonify({"error": f"Insufficient tokens. Need {cost}, have {get_balance(user_id)}"}), 402
        
        prompt = f"""Given this code:
```
{file_content}
```

Request: {description}

Provide a code suggestion to implement this change. Focus on correctness and best practices."""

        messages = [{"role": "user", "content": prompt}]
        response = call_groq(messages)
        
        return jsonify({"suggestion": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tool/generate', methods=['POST'])
def generate_tool():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        description = data.get('description', '')
        
        if not description:
            return jsonify({"error": "description required"}), 400
            
        cost = token_costs["tool"]
        if not deduct_tokens(user_id, cost):
            return jsonify({"error": f"Insufficient tokens. Need {cost}, have {get_balance(user_id)}"}), 402
        
        prompt = f"""Generate a complete Python tool for: {description}

Requirements:
- Include all necessary imports
- Add clear function definitions
- Include comments and docstrings
- Make it self-contained and runnable
- Provide only the code, nothing else"""

        messages = [{"role": "user", "content": prompt}]
        response = call_groq(messages, max_tokens=2048)
        
        return jsonify({"code": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/token/balance', methods=['GET'])
def token_balance():
    user_id = request.args.get('user_id', 'default_user')
    balance = get_balance(user_id)
    return jsonify({"user_id": user_id, "balance": balance})

@app.route('/api/token/add', methods=['POST'])
def add_tokens():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        amount = data.get('amount', 0)
        
        if amount > 0:
            user_tokens[user_id] = user_tokens.get(user_id, 0) + amount
            return jsonify({"success": True, "new_balance": user_tokens[user_id]})
        else:
            return jsonify({"error": "Invalid amount"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    files = [
        {"name": "api/index.py", "type": "file"},
        {"name": "public/index.html", "type": "file"},
        {"name": "public/style.css", "type": "file"},
        {"name": "public/script.js", "type": "file"},
        {"name": "requirements.txt", "type": "file"},
        {"name": "vercel.json", "type": "file"}
    ]
    return jsonify({"files": files})

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Ultima AI Terminal API - Ready"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)