import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2, Loader2 } from 'lucide-react';
import ApiService, { getGraphemeCase } from '../services/ApiService';
import soundService from '../services/SoundService';

const FindLetterGame = ({ child, onBack, soundEnabled, onStickerEarned }) => {
  const [currentTarget, setCurrentTarget] = useState('');
  const [currentDisplayLetter, setCurrentDisplayLetter] = useState('');
  const [gridLetters, setGridLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(child.streak || 0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = async () => {
    if (round > maxRounds) {
      setGameOver(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const gridSize = child.settings?.difficulty === 'Easy' ? 6 : 
                      child.settings?.difficulty === 'Hard' ? 12 : 9;
      
      const randomLetters = await ApiService.getRandomGraphemes(
        gridSize, 
        child.settings?.include_foreign_letters || false,
        true
      );
      
      const targetLetter = randomLetters[0];
      setCurrentTarget(targetLetter);
      
      // Generate the display letter case ONCE and store it
      const caseType = child.settings?.letter_case === 'mixed' ? 
        ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
        child.settings?.letter_case || 'lowercase';
      
      const displayLetter = getGraphemeCase(targetLetter, caseType);
      setCurrentDisplayLetter(displayLetter);
      
      // Generate grid letters with consistent casing for the target
      const gridLettersFormatted = randomLetters.map(letter => {
        if (letter === targetLetter) {
          return displayLetter; // Use the same case as the target display
        } else {
          // Other letters can use mixed casing for difficulty
          const randomCase = child.settings?.letter_case === 'mixed' ? 
            ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
            child.settings?.letter_case || 'lowercase';
          return getGraphemeCase(letter, randomCase);
        }
      });
      
      setGridLetters([...gridLettersFormatted].sort(() => Math.random() - 0.5));
      setFeedback(null);
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error generating round:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLetterClick = async (clickedLetter) => {
    const isCorrect = clickedLetter === currentDisplayLetter; // Compare with the display letter
    
    if (isCorrect) {
      try {
        // Only record progress for CORRECT answers
        const progressData = await ApiService.recordProgress(child.id, {
          game_mode: 'find-letter',
          grapheme: currentTarget, // Still use the base grapheme for progress tracking
          is_correct: true
        });

        setScore(score + 1);
        setStreak(progressData.new_streak);
        setFeedback({ 
          type: 'success', 
          message: progressData.sticker_earned ? 
            `Nagyszerű! ${progressData.sticker_earned.name}` : 
            'Nagyszerű!'
        });

        if (progressData.sticker_earned && onStickerEarned) {
          onStickerEarned(progressData.sticker_earned);
        }
        
        if (soundEnabled) {
          soundService.playSuccessSound();
        }
        
        setTimeout(() => {
          setRound(round + 1);
          generateNewRound();
        }, 1500);
        
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      // Handle incorrect answer - don't send to API, just reset streak locally
      setStreak(0);
      setFeedback({ type: 'error', message: 'Próbáld újra!' });
      
      // Record the incorrect attempt for analytics (optional)
      try {
        await ApiService.recordProgress(child.id, {
          game_mode: 'find-letter',
          grapheme: currentTarget,
          is_correct: false
        });
      } catch (err) {
        console.error('Error recording incorrect attempt:', err);
      }
      
      if (soundEnabled) {
        soundService.playErrorSound();
      }
      
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
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
        <p className="text-gray-600">Loading game...</p>
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
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800">Játék vége!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{maxRounds}</p>
              <p className="text-lg text-gray-600">Nagyszerű munka, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={generateNewRound} className="bg-green-500 hover:bg-green-600 text-white border-0">
                Újra játék
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
            {score} pont
          </Badge>
          <Badge variant="outline">
            {streak} sorozat
          </Badge>
        </div>
      </div>

      {/* Game Instruction */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Keresd meg:</h2>
        <div className="bg-blue-100 rounded-2xl p-8 mb-6 inline-block">
          <div className="text-8xl font-bold text-blue-800">
            {currentDisplayLetter}
          </div>
        </div>
        {soundEnabled && (
          <Button 
            size="sm" 
            className="flex items-center gap-2 mx-auto bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
            onClick={() => soundService.playLetterSound(currentTarget)}
          >
            <Volume2 className="h-4 w-4" />
            Hangot lejátszani
          </Button>
        )}
      </div>

      {/* Letter Grid */}
      <div className={`grid gap-4 mb-6 ${
        gridLetters.length <= 6 ? 'grid-cols-2 md:grid-cols-3' :
        gridLetters.length <= 9 ? 'grid-cols-3 md:grid-cols-3' :
        'grid-cols-3 md:grid-cols-4'
      }`}>
        {gridLetters.map((letter, index) => (
          <Button
            key={index}
            className={`h-24 text-4xl font-bold transition-all duration-200 hover:scale-105 border-2 ${
              feedback?.type === 'error' && letter !== currentTarget ? 
                'opacity-50 bg-gray-50 border-gray-200 text-gray-500' : 
                letter === currentTarget && feedback?.type === 'success' ? 
                  'bg-green-100 text-green-800 border-green-400' : 
                  'bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-400 text-gray-800'
            }`}
            onClick={() => handleLetterClick(letter)}
            disabled={feedback !== null}
          >
            {getDisplayLetter(letter)}
          </Button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-xl font-semibold">{feedback.message}</p>
        </div>
      )}
    </div>
  );
};

export default FindLetterGame;