# ml_core/deep_q_tool_generator.py
import os
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage

class DeepQToolGenerator:
    def __init__(self, model_name: str = "llama3-8b-8192"):
        self.model_name = model_name
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set.")
        
        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model_name,
            temperature=0.7
        )

    def generate_tool_code(self, task_description: str) -> str:
        """
        Generate Python code for a tool based on a task description using Groq.
        """
        prompt = (
            f"You are an advanced AI specialized in generating Python tools. "
            f"A user wants a new Python tool for the following task: '{task_description}'.\n\n"
            f"Please provide the complete, runnable Python code for this tool. "
            f"Include necessary imports, a clear function definition, and comments. "
            f"The tool should be self-contained. Provide only the code, nothing else."
        )
        try:
            messages = [HumanMessage(content=prompt)]
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            return f"Error generating tool code: {e}"