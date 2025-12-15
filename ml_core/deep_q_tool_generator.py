# ml_core/deep_q_tool_generator.py
import google.generativeai as genai

class DeepQToolGenerator:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("API Key is required for DeepQToolGenerator.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def generate_tool_code(self, task_description: str) -> str:
        """
        Simulates an AI generating Python code for a tool based on a task description.
        In a true DeepQ implementation, this would involve complex RL inference.
        Here, we use the Gemini model to directly generate the code.
        """
        prompt = (
            f"You are an advanced AI specialized in generating Python tools. "
            f"A user wants a new Python tool for the following task: '{task_description}'.\n\n"
            f"Please provide the complete, runnable Python code for this tool. "
            f"Include necessary imports, a clear function definition, and comments. "
            f"The tool should be self-contained. Provide only the code, nothing else."
        )
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Error generating tool code: {e}"
