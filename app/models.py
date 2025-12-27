"""
Pydantic Models for Tool Table API
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ============ Node Models ============

class NodeBase(BaseModel):
    """Base node model with common fields"""
    name: str = Field(..., min_length=1, max_length=200)
    node_type: str = Field(..., pattern="^(folder|link)$")
    icon: Optional[str] = None
    url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

class NodeCreate(NodeBase):
    """Model for creating a new node"""
    parent_id: Optional[int] = None
    code: Optional[str] = None  # Auto-generate if not provided

class NodeUpdate(BaseModel):
    """Model for updating a node"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    node_type: Optional[str] = Field(None, pattern="^(folder|link)$")
    icon: Optional[str] = None
    url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class NodeMove(BaseModel):
    """Model for moving a node"""
    new_parent_id: Optional[int] = None

class NodeResponse(NodeBase):
    """Response model for a node"""
    id: int
    parent_id: Optional[int]
    code: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NodeTreeItem(NodeResponse):
    """Node with children for tree structure"""
    children: List["NodeTreeItem"] = []

class NodeReorder(BaseModel):
    """Model for batch reordering"""
    items: List[dict]  # [{id: 1, sort_order: 0}, ...]

# ============ Auth Link Models ============

class AuthLinkBase(BaseModel):
    """Base auth link model"""
    region: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., min_length=1)
    sort_order: int = 0
    is_active: bool = True

class AuthLinkCreate(AuthLinkBase):
    """Model for creating auth link"""
    pass

class AuthLinkUpdate(BaseModel):
    """Model for updating auth link"""
    region: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class AuthLinkResponse(AuthLinkBase):
    """Response model for auth link"""
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthLinkGroup(BaseModel):
    """Auth links grouped by region"""
    region: str
    items: List[AuthLinkResponse]

# ============ Search Models ============

class SearchResult(BaseModel):
    """Search result item"""
    id: int
    name: str
    node_type: str
    icon: Optional[str]
    url: Optional[str]
    code: str
    path: str  # Full path like "維運工具 > 臺灣區 > 彰化"

# ============ API Response Models ============

class APIResponse(BaseModel):
    """Generic API response"""
    success: bool
    message: str
    data: Optional[dict] = None
