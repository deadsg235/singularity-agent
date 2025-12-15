# agent_web.py
import os
import google.generativeai as genai

# Ultima AI Agent branding
AGENT_NAME_WEB = "Ultima"
DEFAULT_WEB_SYSTEM_PROMPT = f"You are {AGENT_NAME_WEB}, an advanced AI assistant with cutting-edge capabilities. You excel at code generation, analysis, and intelligent problem-solving. Your responses are precise, helpful, and technically accurate. You maintain a professional yet approachable tone."

class UltimaWebAgent:
    def __init__(self, api_key: str, system_prompt: str = None):
        if not api_key:
            raise ValueError("API Key is required for UltimaWebAgent.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self._system_prompt = system_prompt if system_prompt else DEFAULT_WEB_SYSTEM_PROMPT

    def _initialize_chat_with_prompt(self):
        # Create a new chat session with the current system prompt
        # In a web context, history might be passed with each request,
        # so we re-initialize chat for each session or manage history externally.
        return self.model.start_chat(history=[
            {"role": "user", "parts": self._system_prompt},
            {"role": "model", "parts": "Acknowledged. How can I assist you today?"}
        ])

    def get_system_prompt(self) -> str:
        return self._system_prompt

    def send_message(self, message: str, chat_history: list = None) -> str:
        # If chat_history is provided (from frontend), use it. Otherwise, start fresh.
        # This allows the frontend to manage conversational state.
        history_to_use = []
        if self._system_prompt:
             history_to_use.append({"role": "user", "parts": self._system_prompt})
             history_to_use.append({"role": "model", "parts": "Acknowledged. How can I assist you today?"})

        if chat_history:
            history_to_use.extend(chat_history)
        
        chat = self.model.start_chat(history=history_to_use)

        try:
            response = chat.send_message(message)
            return response.text
        except Exception as e:
            return f"Error communicating with Gemini: {e}"

    def suggest_system_prompt(self) -> str:
        current_prompt = self.get_system_prompt()
        suggestion_prompt_text = (
            f"Based on your current system prompt: '{current_prompt}', "
            "and your goal to become a better, more helpful AI assistant that can adapt to web interactions, "
            "suggest a refined or improved version of this system prompt. "
            "Focus on clarity, effectiveness, and guiding your responses. "
            "Provide only the new system prompt text, nothing else."
        )
        try:
            temp_model = genai.GenerativeModel('gemini-pro')
            response = temp_model.generate_content(suggestion_prompt_text)
            return response.text.strip()
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
            temp_model = genai.GenerativeModel('gemini-pro')
            response = temp_model.generate_content(code_suggestion_prompt)
            return response.text.strip()
        except Exception as e:
            return f"Error generating code suggestion: {e}"

