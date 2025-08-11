from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..models import Child, ChildCreate, ChildUpdate, GameSessionCreate, ProgressUpdateResponse, Sticker
from ..services.child_service import ChildService
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

router = APIRouter(prefix="/children", tags=["children"])

# Dependency to get database
async def get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'betukkereso')]
    return db

# Dependency to get child service
async def get_child_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> ChildService:
    return ChildService(db)

@router.get("/", response_model=List[Child])
async def get_children(service: ChildService = Depends(get_child_service)):
    """Get all children"""
    return await service.get_children()

@router.post("/", response_model=Child)
async def create_child(child_data: ChildCreate, service: ChildService = Depends(get_child_service)):
    """Create a new child profile"""
    return await service.create_child(child_data)

@router.get("/{child_id}", response_model=Child)
async def get_child(child_id: str, service: ChildService = Depends(get_child_service)):
    """Get a specific child by ID"""
    child = await service.get_child(child_id)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@router.delete("/{child_id}")
async def delete_child(child_id: str, service: ChildService = Depends(get_child_service)):
    """Delete a child and all associated data"""
    success = await service.delete_child(child_id)
    if not success:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"success": True}

@router.put("/{child_id}", response_model=Child)
async def update_child(child_id: str, update_data: ChildUpdate, service: ChildService = Depends(get_child_service)):
    """Update child information"""
    child = await service.update_child(child_id, update_data)
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@router.post("/{child_id}/progress", response_model=ProgressUpdateResponse)
async def record_progress(child_id: str, session_data: GameSessionCreate, service: ChildService = Depends(get_child_service)):
    """Record game session and update child progress"""
    try:
        return await service.record_game_session(child_id, session_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{child_id}/stickers", response_model=List[Sticker])
async def get_child_stickers(child_id: str, service: ChildService = Depends(get_child_service)):
    """Get all stickers earned by a child"""
    return await service.get_child_stickers(child_id)

@router.put("/{child_id}/settings")
async def update_settings(child_id: str, key: str, value, service: ChildService = Depends(get_child_service)):
    """Update a specific setting for a child"""
    try:
        child = await service.update_child_settings(child_id, key, value)
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        return {"success": True, "settings": child.settings}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))