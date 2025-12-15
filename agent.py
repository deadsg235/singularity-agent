# agent.py
import os
import google.generativeai as genai
from config import get_config, save_config, AGENT_NAME, SYSTEM_PROMPT_KEY

# For terminal styling
try:
    import colorama
    from colorama import Fore, Style
    colorama.init()
except ImportError:
    print("Colorama not found. Install with 'pip install colorama' for colored output.")
    class Fore:
        BLACK = ''
        RED = ''
        GREEN = ''
        YELLOW = ''
        BLUE = ''
        MAGENTA = ''
        CYAN = ''
        WHITE = ''
        RESET = ''
    class Style:
        BRIGHT = ''
        DIM = ''
        NORMAL = ''

class UltimaAgent:
    def __init__(self):
        self.config = get_config()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        genai.configure(api_key=self.api_key)
        
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.chat = self.model.start_chat(history=[])
        self.load_system_prompt()

    def load_system_prompt(self):
        system_prompt = self.config.get(SYSTEM_PROMPT_KEY)
        if not system_prompt:
            print(f"{Fore.YELLOW}Warning: System prompt not found in config. Using a default.{Style.RESET_ALL}")
            system_prompt = f"You are {AGENT_NAME}, an advanced AI assistant. Your goal is to help users safely and efficiently. You can self-reference and update your own system prompts. You are currently running in a command-line interface with a black and red theme."
            self.update_system_prompt(system_prompt, save=True)
        
        # Initialize chat history with the system prompt
        self.chat = self.model.start_chat(history=[
            {"role": "user", "parts": system_prompt},
            {"role": "model", "parts": "Acknowledged. How can I assist you today?"}
        ])
        print(f"{Fore.CYAN}System prompt loaded: '{system_prompt[:70]}...'{Style.RESET_ALL}")

    def update_system_prompt(self, new_prompt: str, save: bool = True):
        self.config[SYSTEM_PROMPT_KEY] = new_prompt
        if save:
            save_config(self.config)
        self.load_system_prompt() # Reload the chat with the new prompt
        print(f"{Fore.GREEN}System prompt updated successfully.{Style.RESET_ALL}")

    def get_system_prompt(self):
        return self.config.get(SYSTEM_PROMPT_KEY, "No system prompt defined.")

    def suggest_system_prompt(self) -> str:
        current_prompt = self.get_system_prompt()
        suggestion_prompt = (
            f"Based on your current system prompt: '{current_prompt}', "
            "and your goal to become a better, more helpful AI assistant that can self-reference and improve, "
            "suggest a refined or improved version of this system prompt. "
            "Focus on clarity, effectiveness, and guiding your responses. "
            "Provide only the new system prompt text, nothing else."
        )
        try:
            # Create a temporary model just for this suggestion to avoid polluting main chat history
            temp_model = genai.GenerativeModel('gemini-2.0-flash-exp')
            response = temp_model.generate_content(suggestion_prompt)
            return response.text.strip()
        except Exception as e:
            return f"{Fore.RED}Error generating prompt suggestion: {e}{Style.RESET_ALL}"

    def send_message(self, message: str) -> str:
        try:
            response = self.chat.send_message(message)
            return response.text
        except Exception as e:
            return f"{Fore.RED}Error communicating with Gemini: {e}{Style.RESET_ALL}"

    def run(self):
        print(f"{Fore.RED}{Style.BRIGHT}Welcome to the {AGENT_NAME} CLI!{Style.RESET_ALL}")
        print(f"{Fore.WHITE}Type 'exit' to quit, 'prompt' to view current system prompt, or 'update prompt <new_prompt>' to change it.{Style.RESET_ALL}")

        while True:
            try:
                user_input = input(f"{Fore.RED}{Style.BRIGHT}You:{Style.RESET_ALL} ")
                if user_input.lower() == 'exit':
                    print(f"{Fore.RED}Exiting {AGENT_NAME}. Goodbye!{Style.RESET_ALL}")
                    break
                elif user_input.lower() == 'prompt':
                    print(f"{Fore.YELLOW}Current System Prompt:{Style.RESET_ALL}\n{self.get_system_prompt()}")
                    continue
                elif user_input.lower().startswith('update prompt '):
                    new_prompt = user_input[len('update prompt '):].strip()
                    if new_prompt:
                        self.update_system_prompt(new_prompt)
                    else:
                        print(f"{Fore.YELLOW}Please provide a new system prompt after 'update prompt'.{Style.RESET_ALL}")
                    continue
                elif user_input.lower() == 'suggest prompt':
                    print(f"{Fore.CYAN}Generating a system prompt suggestion...{Style.RESET_ALL}")
                    suggested_prompt = self.suggest_system_prompt()
                    if suggested_prompt.startswith(f"{Fore.RED}Error"):
                        print(suggested_prompt)
                        continue
                    
                    print(f"{Fore.YELLOW}Suggested new system prompt:{Style.RESET_ALL}\n{suggested_prompt}")
                    confirm = input(f"{Fore.WHITE}Apply this suggestion? (yes/no):{Style.RESET_ALL} ").lower()
                    if confirm == 'yes':
                        self.update_system_prompt(suggested_prompt)
                    else:
                        print(f"{Fore.RED}Suggestion not applied.{Style.RESET_ALL}")
                    continue

                response = self.send_message(user_input)
                print(f"{Fore.BLACK}{Style.BRIGHT}Agent:{Style.RESET_ALL} {response}")

            except KeyboardInterrupt:
                print(f"\n{Fore.RED}Exiting {AGENT_NAME}. Goodbye!{Style.RESET_ALL}")
                break
            except Exception as e:
                print(f"{Fore.RED}An unexpected error occurred: {e}{Style.RESET_ALL}")

if __name__ == "__main__":
    agent = UltimaAgent()
    agent.run()
