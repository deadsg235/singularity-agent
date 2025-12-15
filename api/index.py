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
CORS(app) # Enable CORS for all origins, adjust in production

# Load environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY environment variable not set. API calls will fail.")

# System prompt from environment variable, fallback to default
ULTIMA_AGENT_SYSTEM_PROMPT = os.getenv("ULTIMA_AGENT_SYSTEM_PROMPT", DEFAULT_WEB_SYSTEM_PROMPT)

# Define project root for secure file access
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__)) # This is 'api' directory
# Go up one level to get to the main project root
PROJECT_ROOT = os.path.dirname(PROJECT_ROOT)

@app.route('/api/tool/suggest', methods=['POST'])
def suggest_tool():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

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

    tool_generator = DeepQToolGenerator(api_key=GEMINI_API_KEY)
    suggested_tool_code = tool_generator.generate_tool_code(task_description)

    if "Error generating tool code" in suggested_tool_code:
        return jsonify({"error": suggested_tool_code}), 500

    token_module.record_transaction(
        user_id,
        "response_generated",
        0, # Cost already covered
        "Suggested tool code generated",
        {"suggested_tool_code_start": suggested_tool_code[:100]}
    )

    return jsonify({"task_description": task_description, "suggested_tool_code": suggested_tool_code})

@app.route('/api/code/read', methods=['GET'])
def read_code():
    file_path_param = request.args.get('file_path')
    if not file_path_param:
        return jsonify({"error": "file_path parameter is required"}), 400

    # Sanitize path to prevent directory traversal
    absolute_file_path = os.path.abspath(os.path.join(PROJECT_ROOT, file_path_param))

    # Ensure the file is within the project root
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

@app.route('/api/chat', methods=['POST'])
def chat():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

    data = request.get_json()
    user_message = data.get('message')
    chat_history = data.get('history', []) # Expect history from frontend
    user_id = data.get('user_id', 'default_user') # For token system

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Simulate token deduction for chat message
    cost = token_module.TOKEN_COST_PER_CHAT_MESSAGE
    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402 # 402 Payment Required

    if not token_module.deduct_tokens(user_id, cost):
        return jsonify({"error": "Failed to deduct tokens."}), 500
    
    # Record token deduction transaction
    token_module.record_transaction(
        user_id,
        "deduction",
        cost,
        "Chat message processing",
        {"user_message": user_message[:100]} # Limit data for logging
    )

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    
    response_text = agent.send_message(user_message, chat_history)

    # Record response transaction
    token_module.record_transaction(
        user_id,
        "response_generated",
        0, # No additional cost for response generation itself, covered by message cost
        "Agent response generated",
        {"agent_response": response_text[:100]} # Limit data for logging
    )

    return jsonify({"response": response_text})

@app.route('/api/prompt/suggest', methods=['GET'])
def suggest_prompt():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

    user_id = request.args.get('user_id', 'default_user') # Assuming user_id can be passed, else default
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

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_prompt = agent.suggest_system_prompt()

    if "Error generating prompt suggestion" in suggested_prompt:
        return jsonify({"error": suggested_prompt}), 500 # Return 500 if Gemini failed

    token_module.record_transaction(
        user_id,
        "response_generated",
        0, # Cost already covered
        "Suggested prompt generated",
        {"suggested_prompt": suggested_prompt[:100]}
    )
    
    return jsonify({"suggested_prompt": suggested_prompt})

@app.route('/api/code/suggest_change', methods=['POST'])
def suggest_code_change():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

    data = request.get_json()
    user_id = data.get('user_id', 'default_user') # For token system
    file_path_param = data.get('file_path')
    change_description = data.get('change_description')

    if not file_path_param or not change_description:
        return jsonify({"error": "file_path and change_description are required"}), 400

    cost = token_module.TOKEN_COST_PER_CODE_SUGGESTION
    if token_module.get_balance(user_id) < cost:
        return jsonify({"error": f"Insufficient Ultima Tokens. Balance: {token_module.get_balance(user_id)}, Cost: {cost}"}), 402
    
    # Sanitize path to prevent directory traversal (same logic as read_code)
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

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_code = agent.suggest_code_change(file_content, change_description)

    if "Error generating code suggestion" in suggested_code:
        return jsonify({"error": suggested_code}), 500 # Return 500 if Gemini failed

    token_module.record_transaction(
        user_id,
        "response_generated",
        0, # Cost already covered
        "Suggested code generated",
        {"file_path": file_path_param, "suggested_code_start": suggested_code[:100]}
    )

    return jsonify({"file_path": file_path_param, "change_description": change_description, "suggested_code": suggested_code})

@app.route('/api/token/balance', methods=['GET'])
def get_token_balance():
    user_id = request.args.get('user_id', 'default_user')
    balance = token_module.get_balance(user_id)
    return jsonify({"user_id": user_id, "balance": balance})

@app.route('/api/prompt/get', methods=['GET'])
def get_prompt():
    return jsonify({"system_prompt": ULTIMA_AGENT_SYSTEM_PROMPT})


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Ultima AI Terminal",
        "version": "2.0.0",
        "ai_model": "Gemini Pro"
    })

@app.route('/api/self', methods=['GET'])
def self_reference():
    return jsonify({
        "message": "I am Ultima, an advanced AI assistant with cutting-edge capabilities.",
        "capabilities": ["code generation", "analysis", "tool creation", "intelligent problem-solving"],
        "status": "ready"
    })

@app.route('/', methods=['GET'])
def api_root():
    return jsonify({"message": "Ultima AI Terminal API - Ready for interaction"})

# Export the app for Vercel
app = app

if __name__ == '__main__':
    # This block is for local testing purposes only. Vercel will run the app differently.
    app.run(debug=True, port=5000)
