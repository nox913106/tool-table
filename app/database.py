"""
SQLite Database Module for Tool Table
Handles database connection and table creation
"""
import aiosqlite
import os
from pathlib import Path

# Database path
DB_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "tool-table.db"

def ensure_db_dir():
    """Ensure data directory exists"""
    DB_DIR.mkdir(parents=True, exist_ok=True)

async def get_db():
    """Get database connection"""
    ensure_db_dir()
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db

async def init_db():
    """Initialize database tables"""
    ensure_db_dir()
    async with aiosqlite.connect(DB_PATH) as db:
        # Nodes table - unified hierarchy
        await db.execute("""
            CREATE TABLE IF NOT EXISTS nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_id INTEGER,
                code TEXT UNIQUE,
                name TEXT NOT NULL,
                node_type TEXT NOT NULL CHECK(node_type IN ('folder', 'link')),
                icon TEXT,
                url TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
            )
        """)
        
        # Auth links table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS auth_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                region TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        await db.execute("CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_nodes_code ON nodes(code)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_auth_region ON auth_links(region)")
        
        await db.commit()
        print(f"Database initialized at {DB_PATH}")

async def close_db(db):
    """Close database connection"""
    await db.close()
