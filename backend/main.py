from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import redis
import os

app = FastAPI()

# Enable CORS for local testing (Nginx handles it in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis
REDIS_HOST = os.getenv("REDIS_HOST", "redis-service")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
except Exception as e:
    print(f"Failed to connect to Redis: {e}")

@app.get("/api/visit")
async def register_visit():
    try:
        # Atomically increment the 'visitor_count' key
        count = r.incr("visitor_count")
        return {"count": count}
    except Exception as e:
        print(f"Redis error: {e}")
        # Fallback if Redis is temporarily unreachable
        return {"count": "ERR", "detail": str(e)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/strava/login", response_class=HTMLResponse)
async def strava_login():
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Strava API Gateway - Authorize</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <style>
            :root {
                --bg: #070707;
                --strava-orange: #fc4c02;
                --text-main: #f3f3f3;
                --card-border: rgba(255, 255, 255, 0.08);
            }
            body {
                background-color: var(--bg);
                color: var(--text-main);
                font-family: 'Outfit', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                overflow: hidden;
            }
            /* Ambient orange background glow */
            .glow {
                position: absolute;
                width: 600px;
                height: 600px;
                background: radial-gradient(circle, rgba(252, 76, 2, 0.15) 0%, transparent 70%);
                filter: blur(80px);
                z-index: 0;
            }
            .auth-card {
                background: rgba(15, 15, 15, 0.6);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid var(--card-border);
                border-radius: 20px;
                padding: 3rem;
                width: 100%;
                max-width: 460px;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                position: relative;
                z-index: 1;
            }
            .strava-logo {
                font-size: 3.5rem;
                color: var(--strava-orange);
                margin-bottom: 1.5rem;
                text-shadow: 0 0 20px rgba(252, 76, 2, 0.3);
            }
            h1 {
                font-size: 1.8rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            .app-request {
                color: #888;
                font-size: 0.95rem;
                margin-bottom: 2rem;
            }
            .app-name {
                color: var(--text-main);
                font-weight: 600;
                border-bottom: 1px dashed #444;
                padding-bottom: 2px;
            }
            .permissions-list {
                text-align: left;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid var(--card-border);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2.5rem;
                font-size: 0.9rem;
            }
            .permissions-list h3 {
                margin-top: 0;
                font-size: 1rem;
                color: #aaa;
                margin-bottom: 0.8rem;
            }
            .perm-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 0.6rem;
                color: #ccc;
            }
            .perm-item i {
                color: var(--strava-orange);
            }
            .btn-group {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .auth-btn {
                background: var(--strava-orange);
                border: none;
                color: white;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                font-size: 1rem;
                padding: 1rem;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .auth-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(252, 76, 2, 0.4);
                background: #ff5714;
            }
            .cancel-link {
                color: #666;
                text-decoration: none;
                font-size: 0.9rem;
                transition: color 0.3s;
                padding: 0.5rem;
            }
            .cancel-link:hover {
                color: #aaa;
            }
        </style>
    </head>
    <body>
        <div class="glow"></div>
        <div class="auth-card">
            <i class="fa-brands fa-strava strava-logo"></i>
            <h1>Authorize Application</h1>
            <p class="app-request"><span class="app-name">Ronald Mugume's Cloud Engine</span> is requesting access to your Strava profile telemetry.</p>
            
            <div class="permissions-list">
                <h3>Requested Permissions:</h3>
                <div class="perm-item">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Read profile information & statistics</span>
                </div>
                <div class="perm-item">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Read your public & private activities</span>
                </div>
            </div>

            <div class="btn-group">
                <button class="auth-btn" onclick="authorize()">AUTHORIZE GATEWAY</button>
                <a href="https://portfolio.phib.net" class="cancel-link">Cancel</a>
            </div>
        </div>

        <script>
            function authorize() {
                // Redirect back to portfolio root with query param
                window.location.href = "https://portfolio.phib.net/?strava_connected=true";
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
