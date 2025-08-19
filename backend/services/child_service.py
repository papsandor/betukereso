from typing import List, Optional, Dict
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import (
    Child, ChildCreate, ChildUpdate, GameSession, GameSessionCreate, 
    Sticker, ProgressUpdateResponse, GraphemeProgress,
    HUNGARIAN_GRAPHEMES, FOREIGN_GRAPHEMES, PHONEME_MAP_HU, TROUBLE_GRAPHEMES
)
import asyncio
import random

# A 100-darabos matrica katalógus (név + emoji) – sorban kerül kiosztásra
STICKER_CATALOG: List[Dict[str, str]] = [
    {"name": f"Matrica #{i+1}", "emoji": emoji}
    for i, emoji in enumerate(
        (
            ["🌟", "🎈", "🚀", "🎨", "🎯", "🎵", "📚", "🧩", "⚽", "🏆"] * 10
        )
    )
]

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

        # Check for sticker rewards (only if enabled)
        sticker_earned = None
        if (
            session_data.is_correct
            and new_streak in child.settings.streak_thresholds
            and getattr(child.settings, "stickers_enabled", True) is True
        ):
            # Válasszuk a következő matricát a katalógusból, körkörösen
            index = child.total_stickers % len(STICKER_CATALOG)
            catalog_item = STICKER_CATALOG[index]
            sticker = Sticker(
                child_id=child_id,
                name=catalog_item["name"],
                emoji=catalog_item["emoji"],
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
            "streak_thresholds", "sound_enabled", "high_contrast", "difficulty", "stickers_enabled"
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
        """Return a list of UNIQUE graphemes for a game round.
        - Keeps rare graphemes (dz, dzs, w) at ~50% availability per request
        - Optionally biases by ensuring at least one trouble grapheme is included
        - Never returns duplicates within the same response
        """
        # Base pool (unique values)
        base_pool = list(HUNGARIAN_GRAPHEMES)
        if include_foreign:
            base_pool.extend(FOREIGN_GRAPHEMES)

        # Reduce frequency of specific rare graphemes by ~50% availability
        for rare in ["dz", "dzs", "w"]:
            if rare in base_pool and random.random() < 0.5:
                base_pool.remove(rare)

        # If requested count exceeds available unique graphemes, cap it
        max_count = min(count, len(base_pool))

        # Trouble bias: ensure at least one trouble grapheme is present when possible
        if trouble_bias:
            available_trouble = [g for g in base_pool if g in TROUBLE_GRAPHEMES]
            if available_trouble and max_count > 0:
                chosen_trouble = random.choice(available_trouble)
                # Sample remaining without the chosen trouble grapheme
                remaining_pool = [g for g in base_pool if g != chosen_trouble]
                remaining_count = max_count - 1
                sampled_others = random.sample(remaining_pool, remaining_count) if remaining_count > 0 else []
                result = [chosen_trouble] + sampled_others
                random.shuffle(result)
                return result

        # Default: simple unique sampling
        return random.sample(base_pool, max_count)