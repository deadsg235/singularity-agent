from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
tokens = {"default": 1000}

def groq_call(messages):
    if not GROQ_API_KEY:
        return "Error: No API key"
    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "groq": bool(GROQ_API_KEY)})

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        message = data.get('message', '')
        user_id = data.get('user_id', 'default')
        
        if tokens.get(user_id, 0) < 5:
            return jsonify({"error": "Insufficient tokens"}), 402
        
        tokens[user_id] = tokens.get(user_id, 0) - 5
        
        messages = [
            {"role": "system", "content": "You are Ultima AI assistant with advanced reasoning."},
            {"role": "user", "content": message}
        ]
        
        response = groq_call(messages)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/token/balance')
def balance():
    user_id = request.args.get('user_id', 'default')
    return jsonify({"balance": tokens.get(user_id, 0)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)