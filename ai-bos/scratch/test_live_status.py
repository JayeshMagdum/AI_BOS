import httpx

API_BASE = "https://ai-bos-backend-x11s.onrender.com/api/v1"

def run():
    # We will log in as the test user from earlier (or any test user) to fetch their documents
    email = "test_c6947d@example.com"
    pwd = "password123"
    
    with httpx.Client(timeout=60) as client:
        res = client.post(f"{API_BASE}/auth/login", json={
            "email": email,
            "password": pwd
        })
        if res.status_code != 200:
            print("Login failed:", res.status_code, res.text)
            return
            
        token = res.json()["access_token"]
        
        # Get documents
        headers = {"Authorization": f"Bearer {token}"}
        res = client.get(f"{API_BASE}/documents", headers=headers)
        if res.status_code == 200:
            docs = res.json()
            for doc in docs:
                print(f"Doc: {doc['filename']}, Status: {doc['status']}, Error: {doc.get('error_message')}")
        else:
            print("Failed to get documents:", res.text)

if __name__ == "__main__":
    run()
