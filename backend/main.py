import os
import uuid
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for downloads
DOWNLOAD_DIR = "backend/static"
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

app.mount("/static", StaticFiles(directory=DOWNLOAD_DIR), name="static")

class VideoURL(BaseModel):
    url: str

def cleanup_old_files():
    """Remove files older than 1 hour"""
    now = time.time()
    for f in os.listdir(DOWNLOAD_DIR):
        file_path = os.path.join(DOWNLOAD_DIR, f)
        if os.stat(file_path).st_mtime < now - 3600:
            try:
                os.remove(file_path)
            except:
                pass

@app.get("/info")
def get_info(url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "view_count": info.get('view_count'),
                "uploader": info.get('uploader'),
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/download")
async def download_video(video: VideoURL, background_tasks: BackgroundTasks):
    cleanup_old_files()
    file_id = str(uuid.uuid4())
    output_filename = f"{file_id}.mp4"
    output_path = os.path.join(DOWNLOAD_DIR, output_filename)
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We do this synchronously for now to ensure the file is ready when the URL is returned
            # In a real production app, we might use a task queue and polling
            ydl.download([video.url])
            
        # Determine correct API URL for the response
        api_url = os.getenv("VERCEL_URL", "http://localhost:8000")
        if not api_url.startswith("http"):
            api_url = f"https://{api_url}"
            
        return {"download_url": f"{api_url}/static/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
