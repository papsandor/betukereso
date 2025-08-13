import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2, Check, X, Award, Loader2 } from 'lucide-react';
import ApiService, { getGraphemeCase } from '../services/ApiService';
import soundService from '../services/SoundService';

const ShowMarkGame = ({ child, onBack, soundEnabled, onStickerEarned }) => {
  const [currentTarget, setCurrentTarget] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(child.streak || 0);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0); // Start from 0 instead of 1
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showSticker, setShowSticker] = useState(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = async () => {
    if (round >= maxRounds) { // Changed from > to >=
      setGameOver(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFeedback(null);
      setShowSticker(null);
      setWaitingForNext(false);
      
      const randomLetters = await ApiService.getRandomGraphemes(
        1,
        child.settings?.include_foreign_letters || false,
        true
      );
      
      setCurrentTarget(randomLetters[0]);
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error generating round:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherResponse = async (isCorrect) => {
    if (waitingForNext) return;
    
    if (isCorrect) {
      try {
        // Only record progress for correct answers
        const progressData = await ApiService.recordProgress(child.id, {
          game_mode: 'show-mark',
          grapheme: currentTarget,
          is_correct: true
        });

        setScore(score + 1);
        setStreak(progressData.new_streak);
        setFeedback({ 
          type: 'success', 
          message: 'Helyes válasz!'
        });

        if (progressData.sticker_earned) {
          setShowSticker(progressData.sticker_earned);
          if (onStickerEarned) {
            onStickerEarned(progressData.sticker_earned);
          }
        }
        
        if (soundEnabled) {
          soundService.playSuccessSound();
        }
        
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      // Handle incorrect answer - reset streak locally
      setStreak(0);
      setFeedback({ 
        type: 'error', 
        message: 'Téves válasz - gyakorolni kell!'
      });
      
      // Record the incorrect attempt for analytics (optional)
      try {
        await ApiService.recordProgress(child.id, {
          game_mode: 'show-mark',
          grapheme: currentTarget,
          is_correct: false
        });
      } catch (err) {
        console.error('Error recording incorrect attempt:', err);
      }
      
      if (soundEnabled) {
        soundService.playErrorSound();
      }
    }
    
    setWaitingForNext(true);
    
    // Auto-advance after feedback
    setTimeout(() => {
      if (round < maxRounds) {
        setRound(round + 1);
        generateNewRound();
      } else {
        setGameOver(true);
      }
    }, 2000);
  };

  const getDisplayLetter = (letter) => {
    const caseType = child.settings?.letter_case === 'mixed' ? 
      ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
      child.settings?.letter_case || 'mixed';
    return getGraphemeCase(letter, caseType);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading teacher mode...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          {error}
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={generateNewRound} className="bg-blue-500 hover:bg-blue-600 text-white border-0">
            Try Again
          </Button>
          <Button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Card className="p-8">
          <CardContent className="space-y-6">
            <div className="text-6xl mb-4">👩‍🏫</div>
            <h2 className="text-3xl font-bold text-gray-800">Tanár mód befejezve!</h2>
            <div className="space-y-2">
              <p className="text-xl">Helyes válaszok: {score}/{maxRounds}</p>
              <p className="text-lg text-gray-600">Szuper munka, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white border-0">
                Újra tanulás
              </Button>
              <Button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
                Vissza a főmenübe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{round}/{maxRounds} kör</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {score} helyes
          </Badge>
          <Badge variant="outline">
            {streak} sorozat
          </Badge>
        </div>
      </div>

      {/* Instructions for Teacher */}
      <div className="bg-blue-50 p-4 rounded-lg mb-8 text-center">
        <h2 className="text-xl font-bold text-blue-800 mb-2">👩‍🏫 Tanár/Szülő Útmutató</h2>
        <p className="text-blue-700">
          Mutasd a gyereknek a betűt, és jelöld meg, hogy helyesen mondta-e ki!
        </p>
      </div>

      {/* Main Letter Display */}
      <div className="text-center mb-8">
        <div className="bg-white rounded-3xl shadow-2xl p-16 mb-6 inline-block border-4 border-purple-200">
          <div className="text-[200px] font-bold text-purple-800 leading-none">
            {getDisplayLetter(currentTarget)}
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-xl text-gray-600 mb-4">
            Kérd meg a gyereket: "Milyen betű ez?"
          </p>
          
          {soundEnabled && (
            <div className="space-y-2">
              <Button 
                size="lg" 
                className="flex items-center gap-2 mx-auto bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
                onClick={() => soundService.playLetterSound(currentTarget)}
              >
                <Volume2 className="h-5 w-5" />
                Betű hangja (segítség)
              </Button>
              <p className="text-sm text-blue-600 text-center">
                A gyerek segítségére hangot játszik le
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Response Buttons */}
      {!waitingForNext && (
        <div className="flex justify-center gap-8 mb-8">
          <Button
            onClick={() => handleTeacherResponse(true)}
            className="h-24 w-48 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white border-0 rounded-xl shadow-lg"
          >
            <Check className="h-8 w-8 mr-2" />
            Helyes! 🎉
          </Button>
          
          <Button
            onClick={() => handleTeacherResponse(false)}
            className="h-24 w-48 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl shadow-lg"
          >
            <X className="h-8 w-8 mr-2" />
            Téves 📚
          </Button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-center p-6 rounded-xl mb-6 ${
          feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-2xl font-semibold">{feedback.message}</p>
          {feedback.type === 'success' && (
            <p className="text-lg mt-2">Szuper munka! Folytathatjuk.</p>
          )}
        </div>
      )}

      {/* Sticker Reward */}
      {showSticker && (
        <div className="text-center p-6 bg-yellow-100 text-yellow-800 rounded-xl mb-6 animate-pulse">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-2xl font-bold">Matrica megszerezve!</p>
          <p className="text-lg">{showSticker.name}</p>
        </div>
      )}

      {/* Waiting indicator */}
      {waitingForNext && (
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-lg text-gray-600">Következő betű érkezik...</p>
        </div>
      )}
    </div>
  );
};

export default ShowMarkGame;