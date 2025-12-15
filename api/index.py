from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
from datetime import datetime
import sys
sys.path.append('..')
from dqn_core import dqn

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
    data = request.json
    message = data.get('message', '')
    
    ultima.log_activity("user_message", {"message": message})
    
    reasoning = dqn.get_reasoning_analysis(message)
    response = f"Ultima v{ultima.version}: {ultima.system_prompt} Analysis: {', '.join(reasoning['reasoning_steps'])}. Confidence: {reasoning['confidence']:.2f}"
    
    learning_data = dqn.learn_from_interaction(message, response)
    ultima.log_activity("ai_response", {"response": response, "learning": learning_data})
    
    return jsonify({
        "response": response,
        "version": ultima.version,
        "token_address": ultima.token_address,
        "reasoning": reasoning,
        "learning": learning_data
    })

@app.route('/api/upgrade/prompt', methods=['POST'])
def upgrade_prompt():
    data = request.json
    new_prompt = data.get('prompt', '')
    
    success = ultima.update_system_prompt(new_prompt)
    return jsonify({
        "success": success,
        "new_prompt": ultima.system_prompt,
        "version": ultima.version
    })

@app.route('/api/create-tool', methods=['POST'])
def create_tool():
    data = request.json
    name = data.get('name', '')
    code = data.get('code', '')
    
    success = ultima.create_tool(name, code)
    return jsonify({
        "success": success,
        "tool_name": name,
        "tools_count": len(ultima.tools)
    })

@app.route('/api/status')
def status():
    return jsonify({
        "version": ultima.version,
        "system_prompt": ultima.system_prompt,
        "memory_entries": len(ultima.memory),
        "tools_created": len(ultima.tools),
        "upgrades": len(ultima.upgrades),
        "token_address": ultima.token_address
    })

@app.route('/api/logs')
def logs():
    return jsonify({
        "logs": ultima.memory[-20:],
        "total": len(ultima.memory)
    })

@app.route('/api/tools')
def tools():
    return jsonify({
        "tools": ultima.tools,
        "count": len(ultima.tools)
    })

if __name__ == '__main__':
    app.run(debug=True)