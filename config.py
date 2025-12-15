# config.py
import json
import os

CONFIG_FILE = 'agent_config.json'
AGENT_NAME = "Ultima Agent"
SYSTEM_PROMPT_KEY = "system_prompt"

def get_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)
