import httpx
import uuid
from pathlib import Path

API_BASE = "https://ai-bos-backend-x11s.onrender.com/api/v1"

def run():
    # 1. Sign up a temp user to get token
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    pwd = "password123"
    print(f"Creating user {email} on {API_BASE}...")
    
    with httpx.Client(timeout=120) as client:
        res = client.post(f"{API_BASE}/auth/signup", json={
            "email": email,
            "password": pwd,
            "full_name": "Live Test User"
        })
        if res.status_code not in (200, 201):
            print("Signup failed:", res.status_code, res.text)
            return
            
        token = res.json()["access_token"]
        print("Logged in, token acquired.")
        
        # 2. Create a test document
        test_file = Path("test_upload.txt")
        test_file.write_text("This is a simple test document for Render upload test. " * 500)
        
        # 3. Upload document
        print("Uploading document...")
        with open(test_file, "rb") as f:
            files = {"file": ("test_upload.txt", f, "text/plain")}
            headers = {"Authorization": f"Bearer {token}"}
            up_res = client.post(f"{API_BASE}/documents/upload", headers=headers, files=files)
            
        print("Upload Status:", up_res.status_code)
        print("Upload Response:", up_res.text)
        
        test_file.unlink(missing_ok=True)

if __name__ == "__main__":
    run()
