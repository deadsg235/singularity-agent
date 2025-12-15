# agent_web.py
import os
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, AIMessage, SystemMessage

# Ultima AI Agent branding
AGENT_NAME_WEB = "Ultima"
DEFAULT_WEB_SYSTEM_PROMPT = f"You are {AGENT_NAME_WEB}, an advanced AI assistant with cutting-edge capabilities. You excel at code generation, analysis, and intelligent problem-solving. Your responses are precise, helpful, and technically accurate. You maintain a professional yet approachable tone."

class UltimaWebAgent:
    def __init__(self, model_name: str = "llama3-8b-8192", system_prompt: str = None):
        self.model_name = model_name
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")
        
        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model_name,
            temperature=0.7
        )
        self._system_prompt = system_prompt if system_prompt else DEFAULT_WEB_SYSTEM_PROMPT
        
    def get_system_prompt(self) -> str:
        return self._system_prompt

    def send_message(self, message: str, chat_history: list = None) -> str:
        try:
            messages = [SystemMessage(content=self._system_prompt)]
            
            if chat_history:
                for msg in chat_history:
                    role = msg.get('role', '')
                    content = msg.get('parts', '')
                    if role == 'user':
                        messages.append(HumanMessage(content=content))
                    elif role == 'model':
                        messages.append(AIMessage(content=content))
            
            messages.append(HumanMessage(content=message))
            
            response = self.llm.invoke(messages)
            return response.content
            
        except Exception as e:
            return f"Error communicating with Groq: {e}"

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
            messages = [HumanMessage(content=suggestion_prompt)]
            response = self.llm.invoke(messages)
            return response.content.strip()
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
            messages = [HumanMessage(content=code_suggestion_prompt)]
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            return f"Error generating code suggestion: {e}"