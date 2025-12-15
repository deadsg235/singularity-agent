from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
from deepq import deep_q
from self_upgrade import upgrader

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
tokens = {"default": 1000}
costs = {"chat": 5, "code": 50, "tool": 75}

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
    data = request.json
    message = data.get('message', '')
    user_id = data.get('user_id', 'default')
    
    if tokens.get(user_id, 0) < costs["chat"]:
        return jsonify({"error": "Insufficient tokens"}), 402
    
    tokens[user_id] = tokens.get(user_id, 0) - costs["chat"]
    
    # Deep Q reasoning
    reasoning = deep_q.reason(message)
    
    system_prompt = upgrader.get_system_prompt()
    messages = [
        {"role": "system", "content": f"{system_prompt} Deep Q analysis: {reasoning['reasoning_steps']}. Confidence: {reasoning['confidence']:.2f}"},
        {"role": "user", "content": message}
    ]
    
    response = groq_call(messages)
    return jsonify({
        "response": response,
        "deep_q_analysis": reasoning
    })

@app.route('/api/token/balance')
def balance():
    user_id = request.args.get('user_id', 'default')
    return jsonify({"balance": tokens.get(user_id, 0)})

@app.route('/api/deepq/reason', methods=['POST'])
def deep_reason():
    data = request.json
    query = data.get('query', '')
    context = data.get('context', [])
    
    reasoning = deep_q.reason(query, context)
    return jsonify(reasoning)

@app.route('/api/upgrade/prompt', methods=['POST'])
def upgrade_prompt():
    data = request.json
    new_prompt = data.get('prompt', '')
    result = upgrader.update_system_prompt(new_prompt)
    return jsonify(result)

@app.route('/api/upgrade/create-tool', methods=['POST'])
def create_tool():
    data = request.json
    tool_name = data.get('name', '')
    tool_code = data.get('code', '')
    result = upgrader.create_tool(tool_name, tool_code)
    return jsonify(result)

@app.route('/api/upgrade/code', methods=['POST'])
def upgrade_code():
    data = request.json
    module = data.get('module', '')
    code = data.get('code', '')
    result = upgrader.upgrade_code(module, code)
    return jsonify(result)

@app.route('/api/status')
def status():
    return jsonify({
        "version": upgrader.config["version"],
        "capabilities": upgrader.config["capabilities"],
        "system_prompt": upgrader.get_system_prompt()[:100] + "..."
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)