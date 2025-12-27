"""
Search API Routes
Global search across nodes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from ..database import get_db
from ..models import SearchResult

router = APIRouter(prefix="/api", tags=["search"])

async def get_node_path(db, node_id: int) -> str:
    """Get full path of a node"""
    path_parts = []
    current_id = node_id
    
    while current_id:
        cursor = await db.execute(
            "SELECT id, parent_id, name FROM nodes WHERE id = ?", (current_id,)
        )
        row = await cursor.fetchone()
        if row:
            path_parts.insert(0, row['name'])
            current_id = row['parent_id']
        else:
            break
    
    return " > ".join(path_parts)

@router.get("/search")
async def search_nodes(q: str, limit: int = 50):
    """Search nodes by name"""
    if not q or len(q) < 1:
        return []
    
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT * FROM nodes 
               WHERE name LIKE ? AND is_active = TRUE 
               ORDER BY node_type DESC, name 
               LIMIT ?""",
            (f"%{q}%", limit)
        )
        rows = await cursor.fetchall()
        
        results = []
        for row in rows:
            node = dict(row)
            node['path'] = await get_node_path(db, node['id'])
            results.append(node)
        
        return results
    finally:
        await db.close()

@router.get("/icons")
async def get_icons():
    """Get list of available icons with metadata"""
    import os
    from pathlib import Path
    
    icon_dir = Path(__file__).parent.parent.parent / "resource" / "icon"
    icons = []
    
    if icon_dir.exists():
        for f in icon_dir.iterdir():
            if f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif']:
                stat = f.stat()
                icons.append({
                    "name": f.name,
                    "size": stat.st_size,
                    "modified": stat.st_mtime
                })
    
    return sorted(icons, key=lambda x: x['name'])

@router.post("/icons")
async def upload_icon(file: UploadFile = File(...)):
    """Upload a new icon"""
    from pathlib import Path
    import shutil
    
    icon_dir = Path(__file__).parent.parent.parent / "resource" / "icon"
    
    # Validate file type
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif']
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
    
    # Save file
    dest = icon_dir / file.filename
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": "Icon uploaded", "filename": file.filename}

@router.delete("/icons/{filename}")
async def delete_icon(filename: str):
    """Delete an icon"""
    from pathlib import Path
    
    icon_dir = Path(__file__).parent.parent.parent / "resource" / "icon"
    icon_path = icon_dir / filename
    
    if not icon_path.exists():
        raise HTTPException(status_code=404, detail="Icon not found")
    
    # Check if icon is in use
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) as count FROM nodes WHERE icon = ?", (filename,))
        row = await cursor.fetchone()
        if row['count'] > 0:
            raise HTTPException(status_code=400, detail=f"Icon is in use by {row['count']} node(s)")
    finally:
        await db.close()
    
    icon_path.unlink()
    return {"message": "Icon deleted", "filename": filename}

@router.put("/icons/{filename}")
async def rename_icon(filename: str, new_name: str):
    """Rename an icon"""
    from pathlib import Path
    
    icon_dir = Path(__file__).parent.parent.parent / "resource" / "icon"
    old_path = icon_dir / filename
    new_path = icon_dir / new_name
    
    if not old_path.exists():
        raise HTTPException(status_code=404, detail="Icon not found")
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Icon with this name already exists")
    
    # Validate extension
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif']
    if Path(new_name).suffix.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file extension")
    
    # Rename file
    old_path.rename(new_path)
    
    # Update references in database
    db = await get_db()
    try:
        await db.execute("UPDATE nodes SET icon = ? WHERE icon = ?", (new_name, filename))
        await db.commit()
    finally:
        await db.close()
    
    return {"message": "Icon renamed", "old_name": filename, "new_name": new_name}

