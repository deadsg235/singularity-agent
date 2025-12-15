# api/index.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from agent_web import UltimaWebAgent, DEFAULT_WEB_SYSTEM_PROMPT

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

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    
    response_text = agent.send_message(user_message, chat_history)
    return jsonify({"response": response_text})

@app.route('/api/prompt/suggest', methods=['GET'])
def suggest_prompt():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_prompt = agent.suggest_system_prompt()

    if "Error generating prompt suggestion" in suggested_prompt:
        return jsonify({"error": suggested_prompt}), 500
    
    return jsonify({"suggested_prompt": suggested_prompt})

@app.route('/api/code/suggest_change', methods=['POST'])
def suggest_code_change():
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY is not set."}), 500

    data = request.get_json()
    file_path_param = data.get('file_path')
    change_description = data.get('change_description')

    if not file_path_param or not change_description:
        return jsonify({"error": "file_path and change_description are required"}), 400

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

    agent = UltimaWebAgent(api_key=GEMINI_API_KEY, system_prompt=ULTIMA_AGENT_SYSTEM_PROMPT)
    suggested_code = agent.suggest_code_change(file_content, change_description)

    if "Error generating code suggestion" in suggested_code:
        return jsonify({"error": suggested_code}), 500

    return jsonify({"file_path": file_path_param, "change_description": change_description, "suggested_code": suggested_code})

@app.route('/api/prompt/get', methods=['GET'])
def get_prompt():
    return jsonify({"system_prompt": ULTIMA_AGENT_SYSTEM_PROMPT})


@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from Ultima Web Agent API!"})

if __name__ == '__main__':
    # This block is for local testing purposes only. Vercel will run the app differently.
    app.run(debug=True, port=5000)
