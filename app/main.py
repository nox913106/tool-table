"""
Tool Table - FastAPI Main Application
Network Management Portal with SQLite Backend
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from pathlib import Path

from .database import init_db
from .routes import nodes, auth_links, search

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize database on startup"""
    await init_db()
    yield

app = FastAPI(
    title="Tool Table API",
    description="Network Management Portal Backend",
    version="2.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(nodes.router)
app.include_router(auth_links.router)
app.include_router(search.router)

# Mount static files
app.mount("/resource", StaticFiles(directory=PROJECT_ROOT / "resource"), name="resource")
app.mount("/fonts", StaticFiles(directory=PROJECT_ROOT / "fonts"), name="fonts")

# Serve static files from root
@app.get("/")
async def serve_index():
    """Serve main portal page"""
    return FileResponse(PROJECT_ROOT / "index.html")

@app.get("/admin")
async def serve_admin():
    """Serve admin page"""
    return FileResponse(PROJECT_ROOT / "admin.html")

@app.get("/admin.html")
async def serve_admin_html():
    """Serve admin page (with extension)"""
    return FileResponse(PROJECT_ROOT / "admin.html")

# Serve CSS and JS files
@app.get("/{filename}.css")
async def serve_css(filename: str):
    """Serve CSS files"""
    file_path = PROJECT_ROOT / f"{filename}.css"
    if file_path.exists():
        return FileResponse(file_path, media_type="text/css")
    return {"error": "File not found"}

@app.get("/{filename}.js")
async def serve_js(filename: str):
    """Serve JS files"""
    file_path = PROJECT_ROOT / f"{filename}.js"
    if file_path.exists():
        return FileResponse(file_path, media_type="application/javascript")
    return {"error": "File not found"}

# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "2.0.0"}
