from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
