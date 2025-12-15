import os
os.environ["GROQ_API_KEY"] = "test_key"

try:
    from groq import Groq
    print("Groq import successful")
    client = Groq(api_key="test_key")
    print("Groq client created successfully")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()