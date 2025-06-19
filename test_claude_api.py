import os
from dotenv import load_dotenv
import anthropic

load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("API-Key nicht gefunden! Bitte prüfe deine .env-Datei.")
    exit(1)

client = anthropic.Anthropic(api_key=api_key)

try:
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        messages=[{"role": "user", "content": "Sag mir einen lustigen Fakt auf Deutsch."}]
    )
    print("Antwort von Claude:")
    print(response.content[0].text)
except Exception as e:
    print("Fehler bei der Anfrage:")
    print(e) 