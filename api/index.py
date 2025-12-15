# api/index.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent_web import UltimaWebAgent, DEFAULT_WEB_SYSTEM_PROMPT
import token_module
from ml_core.deep_q_tool_generator import DeepQToolGenerator

app = Flask(__name__)
CORS(app)

# Load environment variables
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
print(f"Using Ollama model: {OLLAMA_MODEL}")

# System prompt from environment variable, fallback to default
ULTIMA_AGENT_SYSTEM_PROMPT = os.getenv("ULTIMA_AGENT_SYSTEM_PROMPT", DEFAULT_WEB_SYSTEM_PROMPT)

# Define project root for secure file access
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(PROJECT_ROOT)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Ultima AI Terminal",
        "version": "2.0.0",
        "ai_model": f"Ollama {OLLAMA_MODEL}",
        "token_system": "Ultima Tokens Active",
        "llm_provider": "Ollama (Free)"
    })

@app.route('/api/self', methods=['GET'])
def self_reference():
    return jsonify({
        "message": "I am Ultima, an advanced AI assistant with cutting-edge capabilities.",
        "capabilities": ["code generation", "analysis", "tool creation", "intelligent problem-solving"],
        "status": "ready"
    })

@app.route('/api/chat', methods=['POST'])
def chat():

    data = request.get_json()
    user_message = data.get('message')
    chat_history = data.get('history', [])
    user_id = data.get('user_id', 'default_user')

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    cost = token_module.TOKEN_COST_PER_CHAT_MESSAGE
    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402

    if not token_module.deduct_tokens(user_id, cost):
        return jsonify({"error": "Failed to deduct tokens."}), 500
    
    token_module.record_transaction(
        user_id,
        "deduction",
        cost,
        "Chat message processing",
        {"user_message": user_message[:100]}
    )

    agent = UltimaWebAgent(model_name=OLLAMA_MODEL, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    response_text = agent.send_message(user_message, chat_history)

    token_module.record_transaction(
        user_id,
        "response_generated",
        0,
        "Agent response generated",
        {"agent_response": response_text[:100]}
    )

    return jsonify({"response": response_text})

@app.route('/api/token/balance', methods=['GET'])
def get_token_balance():
    user_id = request.args.get('user_id', 'default_user')
    balance = token_module.get_balance(user_id)
    return jsonify({"user_id": user_id, "balance": balance})

@app.route('/api/prompt/get', methods=['GET'])
def get_prompt():
    return jsonify({"system_prompt": ULTIMA_AGENT_SYSTEM_PROMPT})

@app.route('/api/tool/suggest', methods=['POST'])
def suggest_tool():
    data = request.get_json()
    user_id = data.get('user_id', 'default_user')
    task_description = data.get('task_description')

    if not task_description:
        return jsonify({"error": "task_description is required"}), 400

    cost = token_module.TOKEN_COST_PER_TOOL_SUGGESTION
    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402

    if not token_module.deduct_tokens(user_id, cost):
        return jsonify({"error": "Failed to deduct tokens for tool suggestion."}), 500
    
    token_module.record_transaction(
        user_id,
        "deduction",
        cost,
        "Tool suggestion generation",
        {"task_description": task_description[:100]}
    )

    tool_generator = DeepQToolGenerator(model_name=OLLAMA_MODEL)
    suggested_tool_code = tool_generator.generate_tool_code(task_description)

    if "Error generating tool code" in suggested_tool_code:
        return jsonify({"error": suggested_tool_code}), 500

    token_module.record_transaction(
        user_id,
        "response_generated",
        0,
        "Suggested tool code generated",
        {"suggested_tool_code_start": suggested_tool_code[:100]}
    )

    return jsonify({"task_description": task_description, "suggested_tool_code": suggested_tool_code})

@app.route('/api/code/read', methods=['GET'])
def read_code():
    file_path_param = request.args.get('file_path')
    if not file_path_param:
        return jsonify({"error": "file_path parameter is required"}), 400

    absolute_file_path = os.path.abspath(os.path.join(PROJECT_ROOT, file_path_param))

    if not absolute_file_path.startswith(PROJECT_ROOT):
        return jsonify({"error": "Access denied: File outside project root"}), 403

    if not os.path.exists(absolute_file_path):
        return jsonify({"error": f"File not found: {file_path_param}"}), 404

    try:
        with open(absolute_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({"file_path": file_path_param, "content": content})
    except Exception as e:
        return jsonify({"error": f"Error reading file: {str(e)}"}), 500

@app.route('/api/code/suggest_change', methods=['POST'])
def suggest_code_change():

    data = request.get_json()
    user_id = data.get('user_id', 'default_user')
    file_path_param = data.get('file_path')
    change_description = data.get('change_description')

    if not file_path_param or not change_description:
        return jsonify({"error": "file_path and change_description are required"}), 400

    cost = token_module.TOKEN_COST_PER_CODE_SUGGESTION
    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402
    
    absolute_file_path = os.path.abspath(os.path.join(PROJECT_ROOT, file_path_param))
    if not absolute_file_path.startswith(PROJECT_ROOT):
        return jsonify({"error": "Access denied: File outside project root"}), 403
    if not os.path.exists(absolute_file_path):
        return jsonify({"error": f"File not found: {file_path_param}"}), 404

    try:
        with open(absolute_file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
    except Exception as e:
        return jsonify({"error": f"Error reading file for suggestion: {str(e)}"}), 500

    if not token_module.deduct_tokens(user_id, cost):
        return jsonify({"error": "Failed to deduct tokens for code suggestion."}), 500
    
    token_module.record_transaction(
        user_id,
        "deduction",
        cost,
        "Code suggestion generation",
        {"file_path": file_path_param, "description": change_description[:100]}
    )

    agent = UltimaWebAgent(model_name=OLLAMA_MODEL, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_code = agent.suggest_code_change(file_content, change_description)

    if "Error generating code suggestion" in suggested_code:
        return jsonify({"error": suggested_code}), 500

    token_module.record_transaction(
        user_id,
        "response_generated",
        0,
        "Suggested code generated",
        {"file_path": file_path_param, "suggested_code_start": suggested_code[:100]}
    )

    return jsonify({"file_path": file_path_param, "change_description": change_description, "suggested_code": suggested_code})

@app.route('/api/prompt/suggest', methods=['GET'])
def suggest_prompt():

    user_id = request.args.get('user_id', 'default_user')
    cost = token_module.TOKEN_COST_PER_PROMPT_SUGGESTION

    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402
    
    if not token_module.deduct_tokens(user_id, cost):
        return jsonify({"error": "Failed to deduct tokens for prompt suggestion."}), 500
    
    token_module.record_transaction(
        user_id,
        "deduction",
        cost,
        "Prompt suggestion generation"
    )

    agent = UltimaWebAgent(model_name=OLLAMA_MODEL, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_prompt = agent.suggest_system_prompt()

    if "Error generating prompt suggestion" in suggested_prompt:
        return jsonify({"error": suggested_prompt}), 500

    token_module.record_transaction(
        user_id,
        "response_generated",
        0,
        "Suggested prompt generated",
        {"suggested_prompt": suggested_prompt[:100]}
    )
    
    return jsonify({"suggested_prompt": suggested_prompt})

@app.route('/api/files', methods=['GET'])
def list_files():
    """List project files for the file explorer"""
    try:
        files = []
        for root, dirs, filenames in os.walk(PROJECT_ROOT):
            # Skip hidden directories and common build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules', '.git']]
            
            rel_root = os.path.relpath(root, PROJECT_ROOT)
            if rel_root == '.':
                rel_root = ''
            
            for filename in filenames:
                if not filename.startswith('.') and not filename.endswith('.pyc'):
                    file_path = os.path.join(rel_root, filename) if rel_root else filename
                    files.append({
                        "name": filename,
                        "path": file_path,
                        "type": "file",
                        "size": os.path.getsize(os.path.join(root, filename))
                    })
        
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": f"Error listing files: {str(e)}"}), 500

@app.route('/api/token/pricing', methods=['GET'])
def get_token_pricing():
    """Get Ultima token pricing information"""
    pricing = token_module.get_token_price()
    return jsonify(pricing)

@app.route('/api/token/purchase', methods=['POST'])
def purchase_tokens():
    """Purchase Ultima tokens (simulation)"""
    data = request.get_json()
    user_id = data.get('user_id', 'default_user')
    package = data.get('package', 'starter')
    
    pricing = token_module.get_token_price()
    if package not in pricing['packages']:
        return jsonify({"error": "Invalid package"}), 400
    
    package_info = pricing['packages'][package]
    tokens_to_add = package_info['tokens']
    
    # Simulate successful payment
    if token_module.add_tokens(user_id, tokens_to_add):
        token_module.record_transaction(
            user_id,
            "purchase",
            tokens_to_add,
            f"Purchased {package} package",
            {"package": package, "price": package_info['price']}
        )
        
        new_balance = token_module.get_balance(user_id)
        return jsonify({
            "success": True,
            "tokens_added": tokens_to_add,
            "new_balance": new_balance,
            "package": package
        })
    else:
        return jsonify({"error": "Failed to add tokens"}), 500

@app.route('/', methods=['GET'])
def api_root():
    return jsonify({"message": "Ultima AI Terminal API - Ready for interaction"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)