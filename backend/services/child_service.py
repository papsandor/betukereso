from typing import List, Optional, Dict, Set
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import (
    Child, ChildCreate, ChildUpdate, GameSession, GameSessionCreate, 
    Sticker, ProgressUpdateResponse, GraphemeProgress,
    HUNGARIAN_GRAPHEMES, FOREIGN_GRAPHEMES, PHONEME_MAP_HU, TROUBLE_GRAPHEMES
)
import asyncio
import random

# 102 egyedi magyar nevű és rövid leírású matrica katalógus
STICKER_CATALOG: List[Dict[str, str]] = [
    # Állat Hős (10)
    {"name": "Állat Hős - Róka", "emoji": "🦊", "desc": "Ravasz és fürge tanuló!"},
    {"name": "Állat Hős - Medve", "emoji": "🐻", "desc": "Erős kitartás, szuper haladás."},
    {"name": "Állat Hős - Bagoly", "emoji": "🦉", "desc": "Bölcsen gyakorolsz minden nap."},
    {"name": "Állat Hős - Delfin", "emoji": "🐬", "desc": "Gyors és okos, ügyes felismerés!"},
    {"name": "Állat Hős - Nyuszi", "emoji": "🐰", "desc": "Ugrásszerű fejlődés!"},
    {"name": "Állat Hős - Teknős", "emoji": "🐢", "desc": "Lassan, de biztosan haladsz."},
    {"name": "Állat Hős - Páva", "emoji": "🦚", "desc": "Színes és ragyogó teljesítmény."},
    {"name": "Állat Hős - Oroszlán", "emoji": "🦁", "desc": "Bátor és hangos siker!"},
    {"name": "Állat Hős - Panda", "emoji": "🐼", "desc": "Kedves és kitartó próbálkozás."},
    {"name": "Állat Hős - Mókus", "emoji": "🐿️", "desc": "Gyorsan gyűjtöd a tudást."},
    # Jármű Mester (10)
    {"name": "Jármű Mester - Autó", "emoji": "🚗", "desc": "Száguld a fejlődés!"},
    {"name": "Jármű Mester - Vonat", "emoji": "🚆", "desc": "Folyamatos haladás, mint a vonat."},
    {"name": "Jármű Mester - Repülő", "emoji": "✈️", "desc": "Magasba emelkedő eredmények."},
    {"name": "Jármű Mester - Hajó", "emoji": "🛳️", "desc": "Stabil haladás a betűk tengerén."},
    {"name": "Jármű Mester - Tűzoltó", "emoji": "🚒", "desc": "Tűzoltó gyorsaságával javítasz!"},
    {"name": "Jármű Mester - Mentő", "emoji": "🚑", "desc": "Segítsz magadnak jobban olvasni."},
    {"name": "Jármű Mester - Busz", "emoji": "🚌", "desc": "Sok állomáson át vezet az utad."},
    {"name": "Jármű Mester - Traktor", "emoji": "🚜", "desc": "Erősen húzod a tanulást előre."},
    {"name": "Jármű Mester - Versenyautó", "emoji": "🏎️", "desc": "Villámgyors felismerések!"},
    {"name": "Jármű Mester - Helikopter", "emoji": "🚁", "desc": "Felülről is átlátod a betűket."},
    # Természet Felfedező (10)
    {"name": "Természet Felfedező - Fa", "emoji": "🌳", "desc": "Erős alap, egyre magasabb ágak."},
    {"name": "Természet Felfedező - Virág", "emoji": "🌸", "desc": "Kinyílik a tudásod."},
    {"name": "Természet Felfedező - Hegy", "emoji": "⛰️", "desc": "Csúcsra törő teljesítmény."},
    {"name": "Természet Felfedező - Nap", "emoji": "☀️", "desc": "Ragyogó eredmények nap mint nap."},
    {"name": "Természet Felfedező - Hold", "emoji": "🌙", "desc": "Csendes, de biztos haladás."},
    {"name": "Természet Felfedező - Csillag", "emoji": "⭐", "desc": "Csillogó sikerek sorozata."},
    {"name": "Természet Felfedező - Felhő", "emoji": "☁️", "desc": "Könnyed tanulás, mint a pelyhek."},
    {"name": "Természet Felfedező - Szivárvány", "emoji": "🌈", "desc": "Színes és örömteli fejlődés."},
    {"name": "Természet Felfedező - Tenger", "emoji": "🌊", "desc": "Mély és gazdag tudás hullámzik."},
    {"name": "Természet Felfedező - Tűz", "emoji": "🔥", "desc": "Lángoló lelkesedés a betűkért."},
    # Sport Bajnok (10)
    {"name": "Sport Bajnok - Foci", "emoji": "⚽", "desc": "Gólt rúgsz minden jó válasszal!"},
    {"name": "Sport Bajnok - Kosár", "emoji": "🏀", "desc": "Hárompontos teljesítmény!"},
    {"name": "Sport Bajnok - Tenisz", "emoji": "🎾", "desc": "Ütős felismerések!"},
    {"name": "Sport Bajnok - Úszás", "emoji": "🏊", "desc": "Úszol a sikerben!"},
    {"name": "Sport Bajnok - Futás", "emoji": "🏃", "desc": "Gyors tempóban haladsz előre."},
    {"name": "Sport Bajnok - Bicikli", "emoji": "🚴", "desc": "Kiegyensúlyozott fejlődés."},
    {"name": "Sport Bajnok - Torna", "emoji": "🤸", "desc": "Hajlékony gondolkodás, remek forma."},
    {"name": "Sport Bajnok - Jéghoki", "emoji": "🏒", "desc": "Jéghideg koncentráció, pontos találat."},
    {"name": "Sport Bajnok - Sí", "emoji": "⛷️", "desc": "Lejtmenetben is stabil a tudás."},
    {"name": "Sport Bajnok - Judo", "emoji": "🥋", "desc": "Fegyelem és erő a tanulásban."},
    # Űr Utazó (10)
    {"name": "Űr Utazó - Rakéta", "emoji": "🚀", "desc": "Kilősz a tudás világába!"},
    {"name": "Űr Utazó - Bolygó", "emoji": "🪐", "desc": "Új betűvilágokat fedezel fel."},
    {"name": "Űr Utazó - Csillag", "emoji": "🌟", "desc": "Ragyogó teljesítmény az égen."},
    {"name": "Űr Utazó - Űrhajós", "emoji": "👩‍🚀", "desc": "Bátor felfedező vagy!"},
    {"name": "Űr Utazó - Távcső", "emoji": "🔭", "desc": "Éles szemmel figyelsz a részletekre."},
    {"name": "Űr Utazó - Meteorit", "emoji": "☄️", "desc": "Száguldó siker!"},
    {"name": "Űr Utazó - Holdbázis", "emoji": "🏚️", "desc": "Biztos bázis a tudásnak."},
    {"name": "Űr Utazó - Galaxis", "emoji": "🌌", "desc": "Táguló tudáshorizont."},
    {"name": "Űr Utazó - Rover", "emoji": "🤖", "desc": "Kitartóan kutatsz és tanulsz."},
    {"name": "Űr Utazó - Antenna", "emoji": "📡", "desc": "Jeleket fogsz – megérted a betűket."},
    # Zenei Csillag (10)
    {"name": "Zenei Csillag - Hegedű", "emoji": "🎻", "desc": "Harmonikus fejlődés."},
    {"name": "Zenei Csillag - Zongora", "emoji": "🎹", "desc": "Pontosan játszol a betűkkel."},
    {"name": "Zenei Csillag - Gitár", "emoji": "🎸", "desc": "Pengeted a tudás húrjait."},
    {"name": "Zenei Csillag - Dob", "emoji": "🥁", "desc": "Jó ritmusban haladsz."},
    {"name": "Zenei Csillag - Fuvola", "emoji": "🎶", "desc": "Könnyed és tiszta megoldások."},
    {"name": "Zenei Csillag - Mikrofon", "emoji": "🎤", "desc": "Hangosan kimondod a helyeset."},
    {"name": "Zenei Csillag - Hangjegy", "emoji": "🎵", "desc": "Minden válaszod zenél."},
    {"name": "Zenei Csillag - Szaxofon", "emoji": "🎷", "desc": "Egyedi hangon szól a tudás."},
    {"name": "Zenei Csillag - Trombita", "emoji": "🎺", "desc": "Fényes sikerfanfár!"},
    {"name": "Zenei Csillag - Dj Pult", "emoji": "🎧", "desc": "Te kevered a tudást profin."},
    # Iskolai Hős (10)
    {"name": "Iskolai Hős - Könyv", "emoji": "📚", "desc": "A könyvek barátja vagy."},
    {"name": "Iskolai Hős - Ceruza", "emoji": "✏️", "desc": "Pontosan írsz és rajzolsz."},
    {"name": "Iskolai Hős - Radír", "emoji": "🧽", "desc": "Hibátlanítás mestere."},
    {"name": "Iskolai Hős - Táska", "emoji": "🎒", "desc": "Mindig felkészült vagy."},
    {"name": "Iskolai Hős - Számológép", "emoji": "🧮", "desc": "Okos számolás, okos észrevétel."},
    {"name": "Iskolai Hős - Ecset", "emoji": "🖌️", "desc": "Szép és pontos vonalak."},
    {"name": "Iskolai Hős - Vonalzó", "emoji": "📏", "desc": "Rendszerető és precíz."},
    {"name": "Iskolai Hős - Földgömb", "emoji": "🌍", "desc": "Világlátó tudás."},
    {"name": "Iskolai Hős - Óra", "emoji": "⏰", "desc": "Jó tempóban tanulsz."},
    {"name": "Iskolai Hős - Diploma", "emoji": "🎓", "desc": "Igazi kis tudós!"},
    # Étel Rajongó (10)
    {"name": "Étel Rajongó - Alma", "emoji": "🍎", "desc": "Egészséges tudással tele."},
    {"name": "Étel Rajongó - Banán", "emoji": "🍌", "desc": "Energiával teli tanulás."},
    {"name": "Étel Rajongó - Szőlő", "emoji": "🍇", "desc": "Apró lépésekkel nagy eredmény."},
    {"name": "Étel Rajongó - Eper", "emoji": "🍓", "desc": "Édes siker!"},
    {"name": "Étel Rajongó - Dinnye", "emoji": "🍉", "desc": "Nagy falatokban haladsz."},
    {"name": "Étel Rajongó - Sajt", "emoji": "🧀", "desc": "Okos mint egy kisegér."},
    {"name": "Étel Rajongó - Pizza", "emoji": "🍕", "desc": "Minden szeletben tudás van."},
    {"name": "Étel Rajongó - Szendvics", "emoji": "🥪", "desc": "Rétegenként épül a tudás."},
    {"name": "Étel Rajongó - Leves", "emoji": "🍲", "desc": "Melengető, tápláló fejlődés."},
    {"name": "Étel Rajongó - Süti", "emoji": "🍪", "desc": "Jutalomfalat a jó válaszokért."},
    # Formák Mágusa (10)
    {"name": "Formák Mágusa - Kör", "emoji": "⚪", "desc": "Kerek a tudásod!"},
    {"name": "Formák Mágusa - Négyzet", "emoji": "🟥", "desc": "Stabil és szilárd alapok."},
    {"name": "Formák Mágusa - Háromszög", "emoji": "🔺", "desc": "Háromszor is meggondolt válaszok."},
    {"name": "Formák Mágusa - Csillag", "emoji": "⭐", "desc": "Csillagfényű felismerések."},
    {"name": "Formák Mágusa - Szív", "emoji": "❤️", "desc": "Szívvel-lélekkel tanulsz."},
    {"name": "Formák Mágusa - Gyémánt", "emoji": "💎", "desc": "Csiszolt tudás, fényes siker."},
    {"name": "Formák Mágusa - Nyíl", "emoji": "➡️", "desc": "Mindig jó irányba haladsz."},
    {"name": "Formák Mágusa - Spirál", "emoji": "🌀", "desc": "Felfelé ívelő tudás."},
    {"name": "Formák Mágusa - Puzzle", "emoji": "🧩", "desc": "Összeáll a nagy kép."},
    {"name": "Formák Mágusa - Csepp", "emoji": "💧", "desc": "Apránként töltődik a tudás."},
    # Extra Állatok (12)
    {"name": "Állat Hős - Zsiráf", "emoji": "🦒", "desc": "Magasra nyújtózó célok."},
    {"name": "Állat Hős - Pingvin", "emoji": "🐧", "desc": "Elegáns és kitartó lépések."},
    {"name": "Állat Hős - Bálna", "emoji": "🐋", "desc": "Óriási tudás hullámzik benned."},
    {"name": "Állat Hős - Ló", "emoji": "🐴", "desc": "Fürge és erős haladás."},
    {"name": "Állat Hős - Egér", "emoji": "🐭", "desc": "Apró, de bátor lépések."},
    {"name": "Állat Hős - Koala", "emoji": "🐨", "desc": "Nyugodt, biztos fejlődés."},
    {"name": "Állat Hős - Farkas", "emoji": "🐺", "desc": "Okos csapatjátékos a betűk között."},
    {"name": "Állat Hős - Víziló", "emoji": "🦛", "desc": "Súlyos érvekkel nyersz."},
    {"name": "Állat Hős - Pulyka", "emoji": "🦃", "desc": "Hangosan ünnepled a sikert."},
    {"name": "Állat Hős - Polip", "emoji": "🐙", "desc": "Sokoldalúan kezeled a feladatokat."},
    {"name": "Állat Hős - Kenguru", "emoji": "🦘", "desc": "Nagy ugrások a tudásban."},
    {"name": "Állat Hős - Csiga", "emoji": "🐌", "desc": "Lassú, de kitartó haladás."},
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
        session = GameSession(child_id=child_id, **session_data.dict())
        await self.sessions_collection.insert_one(session.dict())

        child = await self.get_child(child_id)
        if not child:
            raise ValueError("Child not found")

        new_streak = child.streak + 1 if session_data.is_correct else 0

        grapheme = session_data.grapheme
        if grapheme not in child.progress:
            child.progress[grapheme] = GraphemeProgress()
        child.progress[grapheme].attempts += 1
        if session_data.is_correct:
            child.progress[grapheme].correct += 1

        accuracy = child.progress[grapheme].correct / child.progress[grapheme].attempts
        new_stars = min(3, int(accuracy * 4))
        child.progress[grapheme].stars = new_stars

        # Sticker awarding logic (ALWAYS tries to award at thresholds; controls NEW vs DUPLICATE probability)
        sticker_earned = None
        stickers_enabled = getattr(child.settings, "stickers_enabled", True) is True
        interval = getattr(child.settings, "additional_sticker_interval", 0)
        should_award_threshold = (
            session_data.is_correct and (
                new_streak in child.settings.streak_thresholds or
                (interval and interval > 0 and new_streak >= 10 and (new_streak - 10) % interval == 0)
            )
        )
        if stickers_enabled and should_award_threshold:
            # Determine unique stickers the child has (by name)
            unique_names: Set[str] = set()
            async for s in self.stickers_collection.find({"child_id": child_id}, {"name": 1}):
                if s.get("name"):
                    unique_names.add(s["name"])
            unique_count = len(unique_names)

            # Build uncollected and collected pools by name
            uncollected = [item for item in STICKER_CATALOG if item["name"] not in unique_names]
            collected = [item for item in STICKER_CATALOG if item["name"] in unique_names]

            # Base: uniform random across full catalog until 20 egyedi matrica
            if unique_count <= 20 or len(uncollected) == 0 or len(collected) == 0:
                # 20 egyedi matricáig: teljesen véletlenszerű választás a teljes katalógusból
                chosen = random.choice(STICKER_CATALOG)
            else:
                # 20 egyedi után: az ÚJ matrica esélye minden új egyedi után 1%-kal csökken
                # Példa: 21 egyedi → 99% esély ÚJ, 30 egyedi → 90% esély ÚJ, stb.
                new_prob = max(0.0, 1.0 - (unique_count - 20) * 0.01)
                if random.random() < new_prob and len(uncollected) > 0:
                    chosen = random.choice(uncollected)
                else:
                    # Ha nincs begyűjtött, essünk vissza az újakra (ritka eset)
                    chosen = random.choice(collected if len(collected) > 0 else (uncollected if len(uncollected) > 0 else STICKER_CATALOG))

            sticker = Sticker(
                child_id=child_id,
                name=chosen["name"],
                emoji=chosen["emoji"],
                description=chosen.get("desc"),
                streak_level=new_streak
            )
            await self.stickers_collection.insert_one(sticker.dict())
            sticker_earned = sticker
            child.total_stickers += 1

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
        valid_keys = {
            "letters_per_session", "letter_case", "include_foreign_letters", 
            "streak_thresholds", "sound_enabled", "high_contrast", "difficulty", "stickers_enabled", "additional_sticker_interval"
        }
        if key not in valid_keys:
            raise ValueError(f"Invalid setting key: {key}")

        def to_bool(v):
            if isinstance(v, bool):
                return v
            if v is None:
                return False
            return str(v).lower() in {"true", "1", "yes", "on"}
        
        if key in {"include_foreign_letters", "sound_enabled", "high_contrast", "stickers_enabled"}:
            value = to_bool(value)
        elif key in {"letters_per_session", "additional_sticker_interval"}:
            try:
                value = int(value)
            except Exception:
                pass

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
                "audio_url": f"/api/audio/{grapheme}"
            }
            for grapheme in HUNGARIAN_GRAPHEMES
        ]

    def get_random_graphemes(self, count: int, include_foreign: bool = False, trouble_bias: bool = True) -> List[str]:
        base_pool = list(HUNGARIAN_GRAPHEMES)
        if include_foreign:
            base_pool.extend(FOREIGN_GRAPHEMES)
        for rare in ["dz", "dzs", "w"]:
            if rare in base_pool and random.random() < 0.5:
                base_pool.remove(rare)
        max_count = min(count, len(base_pool))
        if trouble_bias:
            available_trouble = [g for g in base_pool if g in TROUBLE_GRAPHEMES]
            if available_trouble and max_count > 0:
                chosen_trouble = random.choice(available_trouble)
                remaining_pool = [g for g in base_pool if g != chosen_trouble]
                remaining_count = max_count - 1
                sampled_others = random.sample(remaining_pool, remaining_count) if remaining_count > 0 else []
                result = [chosen_trouble] + sampled_others
                random.shuffle(result)
                return result
        return random.sample(base_pool, max_count)