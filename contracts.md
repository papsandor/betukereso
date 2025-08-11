# Betűkereső App - API Contracts & Backend Implementation Plan

## API Contracts

### 1. Children Management
```
GET /api/children
Response: [{ id, name, streak, totalStickers, progress: {}, createdAt }]

POST /api/children
Body: { name }
Response: { id, name, streak: 0, totalStickers: 0, progress: {}, createdAt }

DELETE /api/children/:id
Response: { success: true }

GET /api/children/:id/progress
Response: { [grapheme]: { stars, attempts, correct } }
```

### 2. Game Progress
```
POST /api/children/:id/progress
Body: { grapheme, gameMode, isCorrect, timestamp }
Response: { newStreak, newStars, stickerEarned? }

GET /api/children/:id/stickers
Response: [{ id, name, emoji, earnedAt }]
```

### 3. Settings
```
GET /api/settings/:childId
Response: { lettersPerSession, letterCase, includeForeignLetters, streakThresholds, soundEnabled, highContrast, difficulty }

PUT /api/settings/:childId
Body: { key, value }
Response: { updated settings object }
```

### 4. Audio/Phonemes
```
GET /api/graphemes
Response: [{ grapheme, phoneticWord, audioUrl? }]

GET /api/audio/:grapheme
Response: audio file or 404
```

## Mock Data Replacement Plan

### Current Mock Data in `/app/frontend/src/data/mock.js`:
- `mockChildren` → Replace with API calls to `/api/children`
- `mockSettings` → Replace with `/api/settings/:childId`
- `mockStickers` → Replace with `/api/children/:id/stickers`
- `phonemeMapHU` → Replace with `/api/graphemes`

### Frontend Integration Changes:
1. **App.js**: Add API service layer, replace mock calls
2. **ChildSelector.jsx**: Connect to children API endpoints
3. **GameModeSelector.jsx**: Connect to settings and progress APIs
4. **FindLetterGame.jsx**: Connect to progress tracking API
5. Create new **ApiService.js** for centralized API calls

## Backend Implementation

### Database Models (MongoDB)
```javascript
// Child Schema
{
  _id: ObjectId,
  name: String,
  streak: Number,
  totalStickers: Number,
  progress: {
    [grapheme]: {
      stars: Number (0-3),
      attempts: Number,
      correct: Number
    }
  },
  settings: {
    lettersPerSession: Number,
    letterCase: String,
    includeForeignLetters: Boolean,
    streakThresholds: [Number],
    soundEnabled: Boolean,
    highContrast: Boolean,
    difficulty: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Session Schema (for game tracking)
{
  _id: ObjectId,
  childId: ObjectId,
  gameMode: String,
  grapheme: String,
  isCorrect: Boolean,
  responseTime: Number,
  timestamp: Date
}

// Sticker Schema
{
  _id: ObjectId,
  childId: ObjectId,
  name: String,
  emoji: String,
  earnedAt: Date,
  streakLevel: Number
}
```

### Key Backend Features:
1. **Streak Management**: Auto-calculate streaks based on consecutive correct answers
2. **Sticker Rewards**: Auto-award stickers when streak thresholds are hit
3. **Progress Tracking**: Update stars (0-3) based on accuracy over time
4. **Session Logging**: Track detailed game analytics
5. **Settings Persistence**: Save/load child-specific game settings

### Business Logic:
- **Stars Calculation**: Based on accuracy ratio over last 10 attempts
- **Streak Reset**: Reset to 0 on incorrect answer
- **Sticker Triggers**: Award at configured thresholds [3,5,10]
- **Difficulty Adjustment**: Bias toward trouble graphemes ["b","d","p","q"]

## Integration Steps:
1. Create backend models and endpoints
2. Replace mock data calls with API service
3. Add error handling and loading states
4. Test full integration flow
5. Add audio generation via GPT integration