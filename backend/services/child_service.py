from typing import List, Optional, Dict
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models import (
    Child, ChildCreate, ChildUpdate, GameSession, GameSessionCreate, 
    Sticker, ProgressUpdateResponse, GraphemeProgress,
    HUNGARIAN_GRAPHEMES, PHONEME_MAP_HU, TROUBLE_GRAPHEMES
)
import asyncio

class ChildService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.children_collection = db.children
        self.sessions_collection = db.game_sessions
        self.stickers_collection = db.stickers

    async def create_child(self, child_data: ChildCreate) -> Child:
        child = Child(name=child_data.name)
        child_dict = child.dict()
        
        await self.children_collection.insert_one(child_dict)
        return child

    async def get_children(self) -> List[Child]:
        cursor = self.children_collection.find()
        children_data = await cursor.to_list(length=None)
        return [Child(**child) for child in children_data]

    async def get_child(self, child_id: str) -> Optional[Child]:
        child_data = await self.children_collection.find_one({"id": child_id})
        return Child(**child_data) if child_data else None

    async def delete_child(self, child_id: str) -> bool:
        # Delete child and all associated data
        tasks = [
            self.children_collection.delete_one({"id": child_id}),
            self.sessions_collection.delete_many({"child_id": child_id}),
            self.stickers_collection.delete_many({"child_id": child_id})
        ]
        results = await asyncio.gather(*tasks)
        return results[0].deleted_count > 0

    async def update_child(self, child_id: str, update_data: ChildUpdate) -> Optional[Child]:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await self.children_collection.update_one(
            {"id": child_id}, 
            {"$set": update_dict}
        )
        
        if result.modified_count > 0:
            return await self.get_child(child_id)
        return None

    async def record_game_session(self, child_id: str, session_data: GameSessionCreate) -> ProgressUpdateResponse:
        # Create game session record
        session = GameSession(child_id=child_id, **session_data.dict())
        await self.sessions_collection.insert_one(session.dict())

        # Get current child data
        child = await self.get_child(child_id)
        if not child:
            raise ValueError("Child not found")

        # Update streak
        new_streak = child.streak + 1 if session_data.is_correct else 0
        
        # Update grapheme progress
        grapheme = session_data.grapheme
        if grapheme not in child.progress:
            child.progress[grapheme] = GraphemeProgress()
        
        child.progress[grapheme].attempts += 1
        if session_data.is_correct:
            child.progress[grapheme].correct += 1

        # Calculate new stars (0-3 based on accuracy)
        accuracy = child.progress[grapheme].correct / child.progress[grapheme].attempts
        new_stars = min(3, int(accuracy * 4))  # 0-75% = 0-2 stars, 76-100% = 3 stars
        child.progress[grapheme].stars = new_stars

        # Check for sticker rewards
        sticker_earned = None
        if session_data.is_correct and new_streak in child.settings.streak_thresholds:
            sticker_names = {
                3: "Első Matrica! 🌟",
                5: "Szuper Olvasó! 📚", 
                10: "Betű Mester! 🏆"
            }
            sticker_emojis = {3: "🌟", 5: "📚", 10: "🏆"}
            
            sticker = Sticker(
                child_id=child_id,
                name=sticker_names.get(new_streak, f"{new_streak} Sorozat!"),
                emoji=sticker_emojis.get(new_streak, "🎯"),
                streak_level=new_streak
            )
            await self.stickers_collection.insert_one(sticker.dict())
            sticker_earned = sticker
            child.total_stickers += 1

        # Update child in database
        child.streak = new_streak
        child.updated_at = datetime.utcnow()
        
        await self.children_collection.update_one(
            {"id": child_id},
            {"$set": child.dict()}
        )

        return ProgressUpdateResponse(
            new_streak=new_streak,
            new_stars=new_stars,
            sticker_earned=sticker_earned,
            total_stickers=child.total_stickers
        )

    async def get_child_stickers(self, child_id: str) -> List[Sticker]:
        cursor = self.stickers_collection.find({"child_id": child_id}).sort("earned_at", -1)
        stickers_data = await cursor.to_list(length=None)
        return [Sticker(**sticker) for sticker in stickers_data]

    async def update_child_settings(self, child_id: str, key: str, value) -> Optional[Child]:
        # Validate setting key exists
        valid_keys = {
            "letters_per_session", "letter_case", "include_foreign_letters", 
            "streak_thresholds", "sound_enabled", "high_contrast", "difficulty"
        }
        
        if key not in valid_keys:
            raise ValueError(f"Invalid setting key: {key}")
        
        update_path = f"settings.{key}"
        result = await self.children_collection.update_one(
            {"id": child_id},
            {"$set": {update_path: value, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return await self.get_child(child_id)
        return None

    def get_grapheme_info(self) -> List[Dict[str, str]]:
        return [
            {
                "grapheme": grapheme,
                "phonetic_word": PHONEME_MAP_HU.get(grapheme, ""),
                "audio_url": f"/api/audio/{grapheme}"  # Would be actual audio URLs
            }
            for grapheme in HUNGARIAN_GRAPHEMES
        ]

    def get_random_graphemes(self, count: int, include_foreign: bool = False, trouble_bias: bool = True) -> List[str]:
        pool = HUNGARIAN_GRAPHEMES.copy()
        if include_foreign:
            pool.extend(FOREIGN_GRAPHEMES)
        
        # Bias toward trouble graphemes
        if trouble_bias:
            available_trouble = [g for g in TROUBLE_GRAPHEMES if g in pool]
            if available_trouble:
                # Add trouble graphemes multiple times to increase selection probability
                pool.extend(available_trouble * 2)
        
        import random
        return random.sample(pool, min(count, len(pool)))