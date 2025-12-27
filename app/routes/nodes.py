"""
Nodes API Routes
CRUD operations for hierarchical nodes (categories and links)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import aiosqlite

from ..database import get_db
from ..models import (
    NodeCreate, NodeUpdate, NodeMove, NodeResponse, 
    NodeTreeItem, NodeReorder, APIResponse
)

router = APIRouter(prefix="/api/nodes", tags=["nodes"])

# ============ Helper Functions ============

async def generate_code(db, parent_id: Optional[int]) -> str:
    """Generate next code based on parent"""
    if parent_id is None:
        # Root level - find max root code
        cursor = await db.execute(
            "SELECT code FROM nodes WHERE parent_id IS NULL ORDER BY code DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if row:
            try:
                next_num = int(row['code']) + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1
        return str(next_num)
    else:
        # Child level - find parent code and max sibling
        cursor = await db.execute("SELECT code FROM nodes WHERE id = ?", (parent_id,))
        parent = await cursor.fetchone()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent not found")
        
        parent_code = parent['code']
        cursor = await db.execute(
            "SELECT code FROM nodes WHERE parent_id = ? ORDER BY code DESC LIMIT 1",
            (parent_id,)
        )
        row = await cursor.fetchone()
        if row:
            # Extract last segment and increment
            last_segment = row['code'].split('-')[-1]
            try:
                next_num = int(last_segment) + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1
        return f"{parent_code}-{next_num}"

async def build_tree(db, parent_id: Optional[int] = None) -> List[dict]:
    """Recursively build tree structure"""
    if parent_id is None:
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE parent_id IS NULL AND is_active = TRUE ORDER BY sort_order, code"
        )
    else:
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order, code",
            (parent_id,)
        )
    
    rows = await cursor.fetchall()
    result = []
    for row in rows:
        node = dict(row)
        node['children'] = await build_tree(db, node['id'])
        result.append(node)
    return result

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

# ============ CRUD Routes ============

@router.get("", response_model=List[NodeResponse])
async def get_root_nodes():
    """Get all root nodes"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE parent_id IS NULL AND is_active = TRUE ORDER BY sort_order, code"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

@router.get("/tree")
async def get_full_tree():
    """Get complete tree structure"""
    db = await get_db()
    try:
        tree = await build_tree(db)
        return tree
    finally:
        await db.close()

@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(node_id: int):
    """Get single node by ID"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Node not found")
        return dict(row)
    finally:
        await db.close()

@router.get("/{node_id}/children", response_model=List[NodeResponse])
async def get_children(node_id: int):
    """Get children of a node"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order, code",
            (node_id,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()

@router.get("/code/{code}")
async def get_by_code(code: str):
    """Get node by code (e.g., 3-2-1)"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE code = ? AND is_active = TRUE", (code,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Also get children
        node = dict(row)
        cursor = await db.execute(
            "SELECT * FROM nodes WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order, code",
            (node['id'],)
        )
        children = await cursor.fetchall()
        node['items'] = [dict(child) for child in children]
        return node
    finally:
        await db.close()

@router.post("", response_model=NodeResponse)
async def create_node(node: NodeCreate):
    """Create a new node"""
    db = await get_db()
    try:
        # Validate link type requires URL
        if node.node_type == 'link' and not node.url:
            raise HTTPException(status_code=400, detail="Link type requires URL")
        
        # Retry logic for code generation conflicts
        max_retries = 5
        for attempt in range(max_retries):
            try:
                # Generate code if not provided
                code = node.code or await generate_code(db, node.parent_id)
                
                cursor = await db.execute(
                    """INSERT INTO nodes (parent_id, code, name, node_type, icon, url, sort_order, is_active)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (node.parent_id, code, node.name, node.node_type, 
                     node.icon, node.url, node.sort_order, node.is_active)
                )
                await db.commit()
                
                # Return created node
                cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (cursor.lastrowid,))
                row = await cursor.fetchone()
                return dict(row)
            except Exception as e:
                if "UNIQUE constraint" in str(e) and attempt < max_retries - 1:
                    # Code conflict, increment and retry
                    await db.rollback()
                    continue
                raise
        
        raise HTTPException(status_code=500, detail="Failed to generate unique code")
    finally:
        await db.close()

@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(node_id: int, node: NodeUpdate):
    """Update a node"""
    db = await get_db()
    try:
        # Check exists
        cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
        existing = await cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Build update query
        updates = []
        values = []
        update_data = node.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(node_id)
            
            await db.execute(
                f"UPDATE nodes SET {', '.join(updates)} WHERE id = ?",
                values
            )
            await db.commit()
        
        cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()

@router.delete("/{node_id}")
async def delete_node(node_id: int):
    """Delete a node and its children"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Node not found")
        
        await db.execute("DELETE FROM nodes WHERE id = ?", (node_id,))
        await db.commit()
        return {"success": True, "message": "Node deleted"}
    finally:
        await db.close()

@router.put("/{node_id}/move")
async def move_node(node_id: int, move: NodeMove):
    """Move node to a new parent"""
    db = await get_db()
    try:
        # Check node exists
        cursor = await db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
        node = await cursor.fetchone()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Generate new code
        new_code = await generate_code(db, move.new_parent_id)
        
        await db.execute(
            "UPDATE nodes SET parent_id = ?, code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (move.new_parent_id, new_code, node_id)
        )
        await db.commit()
        
        return {"success": True, "message": "Node moved", "new_code": new_code}
    finally:
        await db.close()

@router.put("/reorder")
async def reorder_nodes(reorder: NodeReorder):
    """Batch reorder nodes"""
    db = await get_db()
    try:
        for item in reorder.items:
            await db.execute(
                "UPDATE nodes SET sort_order = ? WHERE id = ?",
                (item['sort_order'], item['id'])
            )
        await db.commit()
        return {"success": True, "message": "Nodes reordered"}
    finally:
        await db.close()
