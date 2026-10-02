import httpx

API_BASE = "https://ai-bos-backend-x11s.onrender.com/api/v1"

def run():
    print("Testing CORS OPTIONS...")
    with httpx.Client(timeout=30) as client:
        res = client.options(f"{API_BASE}/documents/upload", headers={
            "Origin": "https://ai-bos-frontend.vercel.app",
            "Access-Control-Request-Method": "POST"
        })
        print(res.status_code, res.headers)

if __name__ == "__main__":
    run()
