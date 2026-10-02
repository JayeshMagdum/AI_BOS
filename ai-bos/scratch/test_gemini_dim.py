import os
from google import genai

def test_gemini_embedding():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyAq92ty-rpZOxtOnUeJIk0tCq6yShoG4lg"))
    response = client.models.embed_content(
        model="text-embedding-004",
        contents="Hello world!"
    )
    dim = len(response.embeddings[0].values)
    print("Model: text-embedding-004")
    print("Dimension:", dim)

if __name__ == "__main__":
    test_gemini_embedding()
