import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
from proxy_provider import get_gemini_key

app = FastAPI(title="Gemini Local Proxy")

# Allow all for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_gemini(request: Request, path: str):
    """
    Transparent proxy that injects a rotated API key into every request.
    """
    # 1. Rotate the key
    current_key = get_gemini_key()
    
    # 2. Build the target URL
    # Note: path includes the version and method, e.g., v1beta/models/gemini-pro:generateContent
    url = f"{GOOGLE_API_BASE}/{path}"
    
    # 3. Handle query params (some clients puts the key in the URL)
    params = dict(request.query_params)
    params["key"] = current_key  # Override or add the rotated key
    
    # 4. Handle headers (some clients use x-goog-api-key)
    headers = dict(request.headers)
    # Remove 'host' to avoid issues with target server
    headers.pop("host", None)
    headers["x-goog-api-key"] = current_key
    
    # 5. Handle body
    body = await request.body()
    
    # 6. Forward the request
    async with httpx.AsyncClient() as client:
        try:
            proxy_res = await client.request(
                method=request.method,
                url=url,
                params=params,
                headers=headers,
                content=body,
                timeout=60.0
            )
            
            # Return the response as is
            return Response(
                content=proxy_res.content,
                status_code=proxy_res.status_code,
                headers=dict(proxy_res.headers)
            )
        except Exception as e:
            return Response(content=f"Proxy Error: {str(e)}", status_code=500)

if __name__ == "__main__":
    print(f"--- Gemini Proxy Starting on http://localhost:8080 ---")
    print(f"--- Point your Base URL to this address ---")
    uvicorn.run(app, host="127.0.0.1", port=8080)
