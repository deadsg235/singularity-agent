from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
from datetime import datetime
try:
    from dqn_core import dqn
except ImportError as e:
    print(f"DQN import error: {e}")
    # Fallback DQN
    class FallbackDQN:
        def get_reasoning_analysis(self, query):
            return {"reasoning_steps": ["Fallback mode"], "confidence": 0.5}
        def learn_from_interaction(self, user_input, ai_response):
            return {"state": 0, "action": 0, "reward": 0.0, "q_value": 0.0, "epsilon": 1.0}
    dqn = FallbackDQN()

app = Flask(__name__)
CORS(app)

# Ultima Core System
class UltimaCore:
    def __init__(self):
        self.version = "1.0.0"
        self.system_prompt = "I am Ultima, a self-referencing AI with advanced reasoning capabilities."
        self.memory = []
        self.tools = {}
        self.upgrades = []
        self.token_address = "9bzJn2jHQPCGsYKapFvytJQcbaz5FN2TtNB43jb1pump"
        
    def log_activity(self, activity_type, data):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "type": activity_type,
            "data": data,
            "version": self.version
        }
        self.memory.append(log_entry)
        return log_entry
    
    def update_system_prompt(self, new_prompt):
        old_prompt = self.system_prompt
        self.system_prompt = new_prompt
        self.log_activity("prompt_update", {
            "old": old_prompt[:50] + "...",
            "new": new_prompt[:50] + "..."
        })
        return True
    
    def create_tool(self, name, code):
        self.tools[name] = {
            "code": code,
            "created": datetime.now().isoformat()
        }
        self.log_activity("tool_created", {"name": name})
        return True

# Global Ultima instance
ultima = UltimaCore()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        ultima.log_activity("user_message", {"message": message})
        
        try:
            reasoning = dqn.get_reasoning_analysis(message)
        except Exception as e:
            reasoning = {"reasoning_steps": ["Error in reasoning"], "confidence": 0.0}
            print(f"DQN reasoning error: {e}")
        
        response = f"Ultima v{ultima.version}: {ultima.system_prompt} Analysis: {', '.join(reasoning['reasoning_steps'])}. Confidence: {reasoning['confidence']:.2f}"
        
        try:
            learning_data = dqn.learn_from_interaction(message, response)
        except Exception as e:
            learning_data = {"error": str(e)}
            print(f"DQN learning error: {e}")
        
        ultima.log_activity("ai_response", {"response": response, "learning": learning_data})
        
        return jsonify({
            "response": response,
            "version": ultima.version,
            "token_address": ultima.token_address,
            "reasoning": reasoning,
            "learning": learning_data
        })
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return jsonify({"error": f"Internal error: {str(e)}"}), 500

@app.route('/api/upgrade/prompt', methods=['POST'])
def upgrade_prompt():
    try:
        data = request.json or {}
        new_prompt = data.get('prompt', '')
        
        if not new_prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        success = ultima.update_system_prompt(new_prompt)
        return jsonify({
            "success": success,
            "new_prompt": ultima.system_prompt,
            "version": ultima.version
        })
    except Exception as e:
        print(f"Upgrade prompt error: {e}")
        return jsonify({"error": f"Upgrade failed: {str(e)}"}), 500

@app.route('/api/create-tool', methods=['POST'])
def create_tool():
    try:
        data = request.json or {}
        name = data.get('name', '')
        code = data.get('code', '')
        
        if not name or not code:
            return jsonify({"error": "Name and code required"}), 400
        
        success = ultima.create_tool(name, code)
        return jsonify({
            "success": success,
            "tool_name": name,
            "tools_count": len(ultima.tools)
        })
    except Exception as e:
        print(f"Create tool error: {e}")
        return jsonify({"error": f"Tool creation failed: {str(e)}"}), 500

@app.route('/api/status')
def status():
    try:
        return jsonify({
            "version": ultima.version,
            "system_prompt": ultima.system_prompt,
            "memory_entries": len(ultima.memory),
            "tools_created": len(ultima.tools),
            "upgrades": len(ultima.upgrades),
            "token_address": ultima.token_address
        })
    except Exception as e:
        print(f"Status error: {e}")
        return jsonify({"error": f"Status failed: {str(e)}"}), 500

@app.route('/api/logs')
def logs():
    try:
        return jsonify({
            "logs": ultima.memory[-20:],
            "total": len(ultima.memory)
        })
    except Exception as e:
        print(f"Logs error: {e}")
        return jsonify({"error": f"Logs failed: {str(e)}"}), 500

@app.route('/api/tools')
def tools():
    try:
        return jsonify({
            "tools": ultima.tools,
            "count": len(ultima.tools)
        })
    except Exception as e:
        print(f"Tools error: {e}")
        return jsonify({"error": f"Tools failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)