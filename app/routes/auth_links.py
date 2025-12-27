"""
Auth Links API Routes
CRUD operations for internet access authentication links
"""
from fastapi import APIRouter, HTTPException
from typing import List

from ..database import get_db
from ..models import (
    AuthLinkCreate, AuthLinkUpdate, AuthLinkResponse, AuthLinkGroup
)

router = APIRouter(prefix="/api/auth-links", tags=["auth-links"])

@router.get("", response_model=List[AuthLinkGroup])
async def get_auth_links():
    """Get all auth links grouped by region"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE is_active = TRUE ORDER BY region, sort_order"
        )
        rows = await cursor.fetchall()
        
        # Group by region
        groups = {}
        for row in rows:
            region = row['region']
            if region not in groups:
                groups[region] = []
            groups[region].append(dict(row))
        
        return [{"region": region, "items": items} for region, items in groups.items()]
    finally:
        await db.close()

@router.get("/all", response_model=List[AuthLinkResponse])
async def get_all_auth_links():
    """Get all auth links as flat list (for admin)"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM auth_links ORDER BY region, sort_order"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

@router.get("/{link_id}", response_model=AuthLinkResponse)
async def get_auth_link(link_id: int):
    """Get single auth link by ID"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE id = ?", (link_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Auth link not found")
        return dict(row)
    finally:
        await db.close()

@router.post("", response_model=AuthLinkResponse)
async def create_auth_link(link: AuthLinkCreate):
    """Create a new auth link"""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO auth_links (region, name, url, sort_order, is_active)
               VALUES (?, ?, ?, ?, ?)""",
            (link.region, link.name, link.url, link.sort_order, link.is_active)
        )
        await db.commit()
        
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE id = ?", (cursor.lastrowid,)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()

@router.put("/{link_id}", response_model=AuthLinkResponse)
async def update_auth_link(link_id: int, link: AuthLinkUpdate):
    """Update an auth link"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE id = ?", (link_id,)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Auth link not found")
        
        # Build update query
        updates = []
        values = []
        update_data = link.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if updates:
            values.append(link_id)
            await db.execute(
                f"UPDATE auth_links SET {', '.join(updates)} WHERE id = ?",
                values
            )
            await db.commit()
        
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE id = ?", (link_id,)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()

@router.delete("/{link_id}")
async def delete_auth_link(link_id: int):
    """Delete an auth link"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM auth_links WHERE id = ?", (link_id,)
        )
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Auth link not found")
        
        await db.execute("DELETE FROM auth_links WHERE id = ?", (link_id,))
        await db.commit()
        return {"success": True, "message": "Auth link deleted"}
    finally:
        await db.close()

@router.get("/regions/list")
async def get_regions():
    """Get list of unique regions"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT DISTINCT region FROM auth_links WHERE is_active = TRUE ORDER BY region"
        )
        rows = await cursor.fetchall()
        return [row['region'] for row in rows]
    finally:
        await db.close()
