from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import uuid

class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium" 
    HARD = "Hard"

class LetterCase(str, Enum):
    LOWERCASE = "lowercase"
    UPPERCASE = "uppercase"
    TITLECASE = "titlecase"
    MIXED = "mixed"

class GameMode(str, Enum):
    FIND_LETTER = "find-letter"
    TRACE_LETTER = "trace-letter"
    MATCH_CASE = "match-case"
    SHOW_MARK = "show-mark"

# Child Settings Model
class ChildSettings(BaseModel):
    letters_per_session: int = Field(default=9, ge=3, le=15)
    letter_case: LetterCase = Field(default=LetterCase.MIXED)
    include_foreign_letters: bool = Field(default=False)
    streak_thresholds: List[int] = Field(default=[3, 5, 10])
    sound_enabled: bool = Field(default=True)
    high_contrast: bool = Field(default=False)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM)
    stickers_enabled: bool = Field(default=True)
    additional_sticker_interval: int = Field(default=5, ge=0, le=50)

# Progress for individual graphemes
class GraphemeProgress(BaseModel):
    stars: int = Field(default=0, ge=0, le=3)
    attempts: int = Field(default=0)
    correct: int = Field(default=0)

# Child Model
class Child(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(min_length=1, max_length=50)
    streak: int = Field(default=0, ge=0)
    total_stickers: int = Field(default=0, ge=0)
    progress: Dict[str, GraphemeProgress] = Field(default_factory=dict)
    settings: ChildSettings = Field(default_factory=ChildSettings)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChildCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

class ChildUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)

# Game Session Model
class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    game_mode: GameMode
    grapheme: str
    is_correct: bool
    response_time: Optional[int] = None  # milliseconds
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GameSessionCreate(BaseModel):
    game_mode: GameMode
    grapheme: str
    is_correct: bool
    response_time: Optional[int] = None

# Sticker Model
class Sticker(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    name: str
    emoji: str
    streak_level: int
    description: Optional[str] = None
    earned_at: datetime = Field(default_factory=datetime.utcnow)

# Progress Update Response
class ProgressUpdateResponse(BaseModel):
    new_streak: int
    new_stars: int
    sticker_earned: Optional[Sticker] = None
    total_stickers: int

# Grapheme with Phonetic Info
class GraphemeInfo(BaseModel):
    grapheme: str
    phonetic_word: str
    audio_url: Optional[str] = None

# Hungarian Graphemes Data
HUNGARIAN_GRAPHEMES = [
    "a", "á", "b", "c", "cs", "d", "dz", "dzs", "e", "é", "f", "g", "gy", "h", "i", "í", 
    "j", "k", "l", "ly", "m", "n", "ny", "o", "ó", "ö", "ő", "p", "r", "s", "sz", 
    "t", "ty", "u", "ú", "ü", "ű", "v", "z", "zs"
]

FOREIGN_GRAPHEMES = ["q", "w", "x", "y"]

TROUBLE_GRAPHEMES = ["b", "d", "p", "q"]

PHONEME_MAP_HU = {
    "a": "alma", "á": "ház", "b": "béka", "c": "ceruza", "cs": "család",
    "d": "dió", "dz": "bodza", "dzs": "dzsungel", "e": "egér", "é": "étel",
    "f": "fa", "g": "gomb", "gy": "gyerek", "h": "ház", "i": "iskola",
    "í": "íj", "j": "jég", "k": "kutya", "l": "labda", "ly": "lyuk",
    "m": "macska", "n": "nap", "ny": "nyúl", "o": "óra", "ó": "óriás",
    "ö": "ördög", "ő": "őz", "p": "piros", "r": "repülő", "s": "sajt",
    "sz": "szék", "t": "teve", "ty": "tyúk", "u": "ujj", "ú": "úszik",
    "ü": "üveg", "ű": "űrhajó", "v": "virág", "z": "zöld", "zs": "zsiráf",
    "q": "quiche", "w": "walkman", "x": "xilofon", "y": "yacht"
}

# Settings Update Model
class SettingsUpdate(BaseModel):
    key: str
    value: Any