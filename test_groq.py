
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if api_key and api_key != "your_actual_groq_api_key_here":
    print("Groq API key loaded successfully.")
else:
    print("API key missing. Check your .env file.")
