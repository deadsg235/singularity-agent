import os
import json
from typing import Dict, Any

class SelfUpgrade:
    def __init__(self):
        self.config_file = "ultima_config.json"
        self.load_config()
    
    def load_config(self):
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {
                "system_prompt": "You are Ultima AI with advanced deep Q neural cognition and self-upgrading capabilities.",
                "version": "1.0.0",
                "capabilities": ["chat", "reasoning", "self_upgrade", "tool_creation"]
            }
            self.save_config()
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def update_system_prompt(self, new_prompt: str) -> Dict[str, Any]:
        old_prompt = self.config["system_prompt"]
        self.config["system_prompt"] = new_prompt
        self.save_config()
        return {
            "success": True,
            "old_prompt": old_prompt[:100] + "...",
            "new_prompt": new_prompt[:100] + "...",
            "message": "System prompt updated successfully"
        }
    
    def get_system_prompt(self) -> str:
        return self.config["system_prompt"]
    
    def create_tool(self, tool_name: str, tool_code: str) -> Dict[str, Any]:
        tools_dir = "generated_tools"
        if not os.path.exists(tools_dir):
            os.makedirs(tools_dir)
        
        tool_path = os.path.join(tools_dir, f"{tool_name}.py")
        
        try:
            with open(tool_path, 'w') as f:
                f.write(tool_code)
            
            # Add to capabilities
            if tool_name not in self.config["capabilities"]:
                self.config["capabilities"].append(tool_name)
                self.save_config()
            
            return {
                "success": True,
                "tool_name": tool_name,
                "tool_path": tool_path,
                "message": f"Tool '{tool_name}' created successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to create tool '{tool_name}'"
            }
    
    def upgrade_code(self, module_name: str, new_code: str) -> Dict[str, Any]:
        try:
            # Backup existing code
            backup_path = f"{module_name}.backup"
            if os.path.exists(f"{module_name}.py"):
                with open(f"{module_name}.py", 'r') as f:
                    backup_code = f.read()
                with open(backup_path, 'w') as f:
                    f.write(backup_code)
            
            # Write new code
            with open(f"{module_name}.py", 'w') as f:
                f.write(new_code)
            
            # Update version
            version_parts = self.config["version"].split(".")
            version_parts[-1] = str(int(version_parts[-1]) + 1)
            self.config["version"] = ".".join(version_parts)
            self.save_config()
            
            return {
                "success": True,
                "module": module_name,
                "version": self.config["version"],
                "backup": backup_path,
                "message": f"Code upgraded successfully to v{self.config['version']}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to upgrade {module_name}"
            }

# Global instance
upgrader = SelfUpgrade()