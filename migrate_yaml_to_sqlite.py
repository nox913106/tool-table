"""
YAML to SQLite Migration Script
Migrates existing YAML data to the new SQLite database
"""
import asyncio
import yaml
import re
from pathlib import Path
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_db, get_db

RESOURCE_DIR = Path(__file__).parent / "resource"

async def migrate_yaml_to_sqlite():
    """Main migration function"""
    print("=" * 50)
    print("Tool Table: YAML to SQLite Migration")
    print("=" * 50)
    
    # Initialize database
    await init_db()
    
    db = await get_db()
    
    try:
        # Clear existing data
        await db.execute("DELETE FROM nodes")
        await db.execute("DELETE FROM auth_links")
        await db.commit()
        print("\n✓ Cleared existing data")
        
        # Migrate sidebar structure from index.html
        await migrate_sidebar_structure(db)
        
        # Migrate service items from YAML files
        await migrate_yaml_files(db)
        
        # Migrate auth links
        await migrate_auth_links(db)
        
        await db.commit()
        
        # Verify migration
        await verify_migration(db)
        
        print("\n" + "=" * 50)
        print("✅ Migration completed successfully!")
        print("=" * 50)
        
    finally:
        await db.close()

async def migrate_sidebar_structure(db):
    """Create folder nodes based on sidebar structure"""
    print("\n📁 Creating folder structure...")
    
    # Root categories (from index.html sidebar)
    root_categories = [
        ("1", "集團服務 PCG Service"),
        ("2", "跳板主機 Jumpserver"),
        ("3", "維運工具 NetOps Tools"),
        ("4", "線上工具"),
    ]
    
    for code, name in root_categories:
        await db.execute(
            """INSERT INTO nodes (parent_id, code, name, node_type, sort_order)
               VALUES (NULL, ?, ?, 'folder', ?)""",
            (code, name, int(code))
        )
        print(f"  ✓ Created root: {code}. {name}")
    
    await db.commit()

async def migrate_yaml_files(db):
    """Migrate all YAML files recursively"""
    print("\n📄 Migrating YAML files...")
    
    yaml_files = list(RESOURCE_DIR.glob("*.yaml"))
    yaml_files = [f for f in yaml_files if f.name != "AccessInternetAuth.yaml"]
    
    # Sort by code length to ensure parents are created first
    def get_code(filepath):
        """Extract code from Path object (e.g., '3-2-1' from '3-2-1.yaml')"""
        match = re.match(r'^(\d+(?:-\d+)*)', filepath.stem)
        return match.group(1) if match else ""
    
    yaml_files.sort(key=lambda f: (len(get_code(f).split('-')), get_code(f)))
    
    for yaml_file in yaml_files:
        await process_yaml_file(db, yaml_file)
    
    await db.commit()

async def process_yaml_file(db, yaml_file: Path):
    """Process a single YAML file"""
    code = re.match(r'^(\d+(?:-\d+)*)', yaml_file.stem)
    if not code:
        return
    
    parent_code = code.group(1)
    
    # Get parent node ID
    cursor = await db.execute("SELECT id FROM nodes WHERE code = ?", (parent_code,))
    parent_row = await cursor.fetchone()
    
    # If parent doesn't exist, create it
    if not parent_row:
        # Find parent of parent
        parent_parts = parent_code.split('-')
        if len(parent_parts) > 1:
            grandparent_code = '-'.join(parent_parts[:-1])
            cursor = await db.execute("SELECT id FROM nodes WHERE code = ?", (grandparent_code,))
            grandparent = await cursor.fetchone()
            grandparent_id = grandparent['id'] if grandparent else None
        else:
            grandparent_id = None
        
        # Create parent folder
        await db.execute(
            """INSERT INTO nodes (parent_id, code, name, node_type, sort_order)
               VALUES (?, ?, ?, 'folder', 0)""",
            (grandparent_id, parent_code, parent_code)
        )
        await db.commit()
        
        cursor = await db.execute("SELECT id FROM nodes WHERE code = ?", (parent_code,))
        parent_row = await cursor.fetchone()
    
    parent_id = parent_row['id']
    
    # Read YAML content
    try:
        with open(yaml_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"  ⚠ Error reading {yaml_file.name}: {e}")
        return
    
    if not data or 'items' not in data:
        return
    
    items = data.get('items', [])
    sort_order = 0
    
    for item in items:
        name = item.get('name', '')
        icon = item.get('icon', '')
        url = item.get('url', '')
        file_ref = item.get('file', '')
        
        # Determine node type
        if file_ref:
            # This is a folder reference
            node_type = 'folder'
            # Extract code from file reference
            child_code_match = re.match(r'^(\d+(?:-\d+)*)', file_ref)
            if child_code_match:
                child_code = child_code_match.group(1)
            else:
                child_code = f"{parent_code}-{sort_order + 1}"
            
            # Check if folder node exists
            cursor = await db.execute("SELECT id FROM nodes WHERE code = ?", (child_code,))
            existing = await cursor.fetchone()
            
            if existing:
                # Update existing folder with name and icon
                await db.execute(
                    "UPDATE nodes SET name = ?, icon = ?, sort_order = ? WHERE id = ?",
                    (name, icon, sort_order, existing['id'])
                )
            else:
                # Create new folder
                await db.execute(
                    """INSERT INTO nodes (parent_id, code, name, node_type, icon, sort_order)
                       VALUES (?, ?, ?, 'folder', ?, ?)""",
                    (parent_id, child_code, name, icon, sort_order)
                )
        else:
            # This is a link
            node_type = 'link'
            child_code = f"{parent_code}-{sort_order + 1}"
            
            await db.execute(
                """INSERT INTO nodes (parent_id, code, name, node_type, icon, url, sort_order)
                   VALUES (?, ?, ?, 'link', ?, ?, ?)""",
                (parent_id, child_code, name, icon, url, sort_order)
            )
        
        sort_order += 1
    
    print(f"  ✓ Processed {yaml_file.name}: {len(items)} items")

async def migrate_auth_links(db):
    """Migrate AccessInternetAuth.yaml"""
    print("\n🌐 Migrating auth links...")
    
    auth_file = RESOURCE_DIR / "AccessInternetAuth.yaml"
    if not auth_file.exists():
        print("  ⚠ AccessInternetAuth.yaml not found")
        return
    
    try:
        with open(auth_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"  ⚠ Error reading auth file: {e}")
        return
    
    if not data or 'sections' not in data:
        return
    
    total = 0
    for section in data.get('sections', []):
        region = section.get('region', '')
        items = section.get('items', [])
        
        for i, item in enumerate(items):
            await db.execute(
                """INSERT INTO auth_links (region, name, url, sort_order, is_active)
                   VALUES (?, ?, ?, ?, TRUE)""",
                (region, item.get('name', ''), item.get('url', ''), i)
            )
            total += 1
    
    print(f"  ✓ Migrated {total} auth links")

async def verify_migration(db):
    """Verify migration results"""
    print("\n📊 Verification:")
    
    cursor = await db.execute("SELECT COUNT(*) as count FROM nodes WHERE node_type = 'folder'")
    folders = (await cursor.fetchone())['count']
    
    cursor = await db.execute("SELECT COUNT(*) as count FROM nodes WHERE node_type = 'link'")
    links = (await cursor.fetchone())['count']
    
    cursor = await db.execute("SELECT COUNT(*) as count FROM auth_links")
    auth = (await cursor.fetchone())['count']
    
    print(f"  • Folders: {folders}")
    print(f"  • Links: {links}")
    print(f"  • Auth Links: {auth}")
    print(f"  • Total Nodes: {folders + links}")

if __name__ == "__main__":
    asyncio.run(migrate_yaml_to_sqlite())
