# ml_core/deep_q_tool_generator.py
from langchain_community.llms import Ollama

class DeepQToolGenerator:
    def __init__(self, model_name: str = "llama3.2"):
        self.model_name = model_name
        self.llm = Ollama(model=model_name, base_url="http://localhost:11434")

    def generate_tool_code(self, task_description: str) -> str:
        """
        Generate Python code for a tool based on a task description using Ollama.
        """
        prompt = (
            f"You are an advanced AI specialized in generating Python tools. "
            f"A user wants a new Python tool for the following task: '{task_description}'.\n\n"
            f"Please provide the complete, runnable Python code for this tool. "
            f"Include necessary imports, a clear function definition, and comments. "
            f"The tool should be self-contained. Provide only the code, nothing else."
        )
        try:
            response = self.llm.invoke(prompt)
            return response.strip()
        except Exception as e:
            return f"Error generating tool code: {e}"