from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from ..services.child_service import ChildService
from ..models import GraphemeInfo
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

router = APIRouter(prefix="/game", tags=["game"])

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

@router.get("/graphemes", response_model=List[Dict[str, str]])
async def get_graphemes(service: ChildService = Depends(get_child_service)):
    """Get all Hungarian graphemes with phonetic information"""
    return service.get_grapheme_info()

@router.get("/graphemes/random")
async def get_random_graphemes(
    count: int = 9, 
    include_foreign: bool = False, 
    trouble_bias: bool = True,
    service: ChildService = Depends(get_child_service)
):
    """Get random graphemes for game sessions"""
    if count < 1 or count > 20:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 20")
    
    return {
        "graphemes": service.get_random_graphemes(count, include_foreign, trouble_bias)
    }

@router.get("/audio/{grapheme}")
async def get_grapheme_audio(grapheme: str):
    """Get audio file for a specific grapheme (placeholder)"""
    # TODO: Implement actual audio generation/serving
    # For now, return a placeholder response
    return {
        "grapheme": grapheme,
        "audio_url": f"/static/audio/{grapheme}.mp3",
        "status": "placeholder"
    }