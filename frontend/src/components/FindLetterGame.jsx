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
  const [round, setRound] = useState(0); // Start from 0 instead of 1
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      const gridSize = child.settings?.difficulty === 'Easy' ? 6 : 
                      child.settings?.difficulty === 'Hard' ? 12 : 9;
      
      const randomLetters = await ApiService.getRandomGraphemes(
        gridSize, 
        child.settings?.include_foreign_letters || false,
        true
      );
      
      const targetLetter = randomLetters[0];
      setCurrentTarget(targetLetter);
      
      const caseType = child.settings?.letter_case === 'mixed' ? 
        ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
        child.settings?.letter_case || 'lowercase';
      
      const displayLetter = getGraphemeCase(targetLetter, caseType);
      setCurrentDisplayLetter(displayLetter);
      
      const gridLettersFormatted = randomLetters.map(letter => {
        if (letter === targetLetter) {
          return displayLetter;
        } else {
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
    const isCorrect = clickedLetter === currentDisplayLetter;
    
    if (isCorrect) {
      try {
        const progressData = await ApiService.recordProgress(child.id, {
          game_mode: 'find-letter',
          grapheme: currentTarget,
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
          if (round + 1 >= maxRounds) {
            setGameOver(true);
          } else {
            setRound(round + 1);
            generateNewRound();
          }
        }, 1500);
        
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      setStreak(0);
      setFeedback({ type: 'error', message: 'Próbáld újra!' });
      
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
        if (round + 1 >= maxRounds) {
          setGameOver(true);
        } else {
          setRound(round + 1);
          generateNewRound();
        }
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-foreground/60">Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
          {error}
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={generateNewRound} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0">
            Try Again
          </Button>
          <Button onClick={onBack} className="bg-muted hover:bg-accent text-foreground border-0">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Card className="p-8 bg-card-semi backdrop-blur-sm">
          <CardContent className="space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-foreground">Játék vége!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{maxRounds}</p>
              <p className="text-lg text-foreground/60">Nagyszerű munka, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={generateNewRound} className="bg-success text-success-foreground hover:bg-success/90 border-0 backdrop-blur-sm">
                Újra játék
              </Button>
              <Button onClick={onBack} className="bg-semi-transparent hover:bg-accent text-foreground border-0 backdrop-blur-sm">
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
      <div className="flex justify-between items-center mb-6 bg-semi-transparent p-4 rounded-2xl backdrop-blur-sm">
        <Button onClick={onBack} className="flex items-center gap-2 bg-semi-transparent hover:bg-accent text-foreground border-0 backdrop-blur-sm">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-semi-transparent backdrop-blur-sm">{round + 1}/{maxRounds} kör</Badge>
          <Badge variant="outline" className="flex items-center gap-1 bg-semi-transparent backdrop-blur-sm">
            <Star className="h-3 w-3" />
            {score} pont
          </Badge>
          <Badge variant="outline" className="bg-semi-transparent backdrop-blur-sm">
            {streak} sorozat
          </Badge>
        </div>
      </div>

      {/* Game Instruction */}
      <div className="text-center mb-8">
        <div className="bg-semi-transparent p-4 rounded-2xl backdrop-blur-sm mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Keresd meg:</h2>
        </div>
        {/* Target letter - OPAQUE (exception) */}
        <div className="bg-opaque rounded-2xl p-8 mb-6 inline-block shadow-lg border-4 border-primary">
          <div className="text-8xl font-bold text-primary text-opaque">
            {currentDisplayLetter}
          </div>
        </div>
        {soundEnabled && (
          <Button 
            size="sm" 
            className="flex items-center gap-2 mx-auto bg-primary/70 hover:bg-primary/80 text-white border-0 backdrop-blur-sm"
            onClick={() => soundService.playLetterSound(currentDisplayLetter)}
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
            className={`h-24 text-4xl font-bold transition-all duration-200 hover-float border-2 backdrop-blur-sm ${
              feedback?.type === 'error' && letter !== currentDisplayLetter ? 
                'opacity-50 bg-semi-transparent border-border text-foreground/50' : 
                letter === currentDisplayLetter && feedback?.type === 'success' ? 
                  'bg-success/10 text-success border-success/50' : 
                  'bg-card hover:bg-accent border-border hover:border-primary text-foreground'
            }`}
            onClick={() => handleLetterClick(letter)}
            disabled={feedback !== null}
          >
            {letter}
          </Button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          <p className="text-xl font-semibold">{feedback.message}</p>
        </div>
      )}
    </div>
  );
};

export default FindLetterGame;