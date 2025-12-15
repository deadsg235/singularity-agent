# agent_web.py
import os
from langchain_community.llms import Ollama
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

# Ultima AI Agent branding
AGENT_NAME_WEB = "Ultima"
DEFAULT_WEB_SYSTEM_PROMPT = f"You are {AGENT_NAME_WEB}, an advanced AI assistant with cutting-edge capabilities. You excel at code generation, analysis, and intelligent problem-solving. Your responses are precise, helpful, and technically accurate. You maintain a professional yet approachable tone."

class UltimaWebAgent:
    def __init__(self, model_name: str = "llama3.2", system_prompt: str = None):
        self.model_name = model_name
        self.llm = Ollama(model=model_name, base_url="http://localhost:11434")
        self._system_prompt = system_prompt if system_prompt else DEFAULT_WEB_SYSTEM_PROMPT
        self.memory = ConversationBufferMemory(return_messages=True)
        
    def get_system_prompt(self) -> str:
        return self._system_prompt

    def send_message(self, message: str, chat_history: list = None) -> str:
        try:
            # Build conversation context
            messages = [self._system_prompt]
            
            if chat_history:
                for msg in chat_history:
                    role = msg.get('role', '')
                    content = msg.get('parts', '')
                    if role == 'user':
                        messages.append(f"Human: {content}")
                    elif role == 'model':
                        messages.append(f"Assistant: {content}")
            
            messages.append(f"Human: {message}")
            
            # Create prompt
            prompt = "\n".join(messages) + "\nAssistant:"
            
            # Get response from Ollama
            response = self.llm.invoke(prompt)
            return response.strip()
            
        except Exception as e:
            return f"Error communicating with Ollama: {e}"

    def suggest_system_prompt(self) -> str:
        current_prompt = self.get_system_prompt()
        suggestion_prompt = (
            f"Based on your current system prompt: '{current_prompt}', "
            "and your goal to become a better, more helpful AI assistant that can adapt to web interactions, "
            "suggest a refined or improved version of this system prompt. "
            "Focus on clarity, effectiveness, and guiding your responses. "
            "Provide only the new system prompt text, nothing else."
        )
        try:
            response = self.llm.invoke(suggestion_prompt)
            return response.strip()
        except Exception as e:
            return f"Error generating prompt suggestion: {e}"

    def suggest_code_change(self, file_content: str, change_description: str) -> str:
        code_suggestion_prompt = (
            f"Given the following code:\n\n```\n{file_content}\n```\n\n"
            f"And the request: '{change_description}'.\n\n"
            "Please provide a code suggestion to implement this change. "
            "Your response should be either a complete new code block for the relevant section, "
            "or a clear diff format (unified diff) if a small modification is sufficient. "
            "Focus on correctness, maintainability, and adhering to best practices. "
            "Provide only the code suggestion, nothing else. If you provide a diff, start with `---`."
        )
        try:
            response = self.llm.invoke(code_suggestion_prompt)
            return response.strip()
        except Exception as e:
            return f"Error generating code suggestion: {e}"