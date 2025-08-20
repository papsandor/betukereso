import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Shuffle, CheckCircle, Loader2 } from 'lucide-react';
import ApiService, { getGraphemeCase } from '../services/ApiService';
import soundService from '../services/SoundService';

const MatchCaseGame = ({ child, onBack, soundEnabled, onStickerEarned }) => {
  const [pairs, setPairs] = useState([]);
  const [selectedUppercase, setSelectedUppercase] = useState(null);
  const [selectedLowercase, setSelectedLowercase] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(child.streak || 0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const pairsToMatch = child.settings?.letters_per_session || 9;

  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedUppercase(null);
      setSelectedLowercase(null);
      setMatchedPairs(new Set());
      setFeedback(null);
      setAttempts(0);
      setScore(0);
      setGameOver(false);

      const randomLetters = await ApiService.getRandomGraphemes(
        pairsToMatch,
        child.settings?.include_foreign_letters || false,
        true
      );

      const uppercaseLetters = randomLetters.map(letter => ({
        id: `upper-${letter}`,
        letter,
        case: 'uppercase',
        display: getGraphemeCase(letter, 'uppercase')
      }));

      const lowercaseLetters = randomLetters.map(letter => ({
        id: `lower-${letter}`,
        letter,
        case: 'lowercase',
        display: getGraphemeCase(letter, 'lowercase')
      }));

      const shuffledUpper = [...uppercaseLetters].sort(() => Math.random() - 0.5);
      const shuffledLower = [...lowercaseLetters].sort(() => Math.random() - 0.5);

      setPairs({ uppercase: shuffledUpper, lowercase: shuffledLower });
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error initializing matching game:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLetterClick = (letter) => {
    if (matchedPairs.has(letter.letter) || isProcessing || gameOver) return;
    if (letter.case === 'uppercase') {
      setSelectedUppercase(selectedUppercase?.letter === letter.letter ? null : letter);
    } else {
      setSelectedLowercase(selectedLowercase?.letter === letter.letter ? null : letter);
    }
  };

  useEffect(() => {
    if (selectedUppercase && selectedLowercase && !isProcessing) {
      setIsProcessing(true);
      setTimeout(() => {
        checkMatch();
      }, 200);
    }
  }, [selectedUppercase, selectedLowercase]);

  const checkMatch = async () => {
    const isMatch = selectedUppercase.letter === selectedLowercase.letter;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (isMatch) {
      try {
        const progressData = await ApiService.recordProgress(child.id, {
          game_mode: 'match-case',
          grapheme: selectedUppercase.letter,
          is_correct: true
        });

        setMatchedPairs(prev => new Set([...prev, selectedUppercase.letter]));
        setScore(score + 1);
        setStreak(progressData.new_streak);
        setFeedback({ 
          type: 'success', 
          message: progressData.sticker_earned ? 
            `Szuper párosítás! ${progressData.sticker_earned.name}` : 
            'Szuper párosítás!'
        });

        if (progressData.sticker_earned && onStickerEarned) {
          onStickerEarned(progressData.sticker_earned);
        }
        
        if (soundEnabled) {
          soundService.playSuccessSound();
        }

        if ((matchedPairs.size + 1) === (pairs.uppercase?.length || 0)) {
          setTimeout(() => setGameOver(true), 800);
        }
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      setStreak(0);
      setFeedback({ type: 'error', message: 'Próbáld újra!' });

      try {
        await ApiService.recordProgress(child.id, {
          game_mode: 'match-case',
          grapheme: selectedUppercase.letter,
          is_correct: false
        });
      } catch (err) {
        console.error('Error recording incorrect attempt:', err);
      }

      if (soundEnabled) {
        soundService.playErrorSound();
      }

      if (nextAttempts >= 3 && pairs.uppercase && pairs.lowercase) {
        setPairs({
          uppercase: [...pairs.uppercase].sort(() => Math.random() - 0.5),
          lowercase: [...pairs.lowercase].sort(() => Math.random() - 0.5)
        });
        setAttempts(0);
      }
    }

    setTimeout(() => {
      setSelectedUppercase(null);
      setSelectedLowercase(null);
      setIsProcessing(false);
      if (!isMatch) setFeedback(null);
    }, 1200);
  };

  const shuffleLetters = () => {
    if (!pairs.uppercase || !pairs.lowercase || gameOver) return;
    setPairs({
      uppercase: [...pairs.uppercase].sort(() => Math.random() - 0.5),
      lowercase: [...pairs.lowercase].sort(() => Math.random() - 0.5)
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-foreground/60">Loading matching game...</p>
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
          <Button onClick={initGame} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
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
    const totalPairs = pairs.uppercase?.length || pairsToMatch;
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Card className="p-8">
          <CardContent className="space-y-6">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-foreground">Párosítás kész!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{totalPairs}</p>
              <p className="text-lg text-foreground/60">Szuper párosítás, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={initGame} className="bg-success hover:bg-success/90 text-success-foreground border-0">
                Újra párosítás
              </Button>
              <Button onClick={onBack} className="bg-muted hover:bg-accent text-foreground border-0">
                Vissza a főmenübe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground border-0">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="flex items-center gap-4">
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
        <h2 className="text-2xl font-bold text-foreground mb-4">Párosítsd a nagy és kis betűket!</h2>
        <p className="text-foreground/60 mb-4">Kattints egy nagy betűre, majd a hozzá tartozó kis betűre.</p>
        
        <Button
          onClick={shuffleLetters}
          className="flex items-center gap-2 mx-auto bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0 hover-float"
        >
          <Shuffle className="h-4 w-4" />
          Betűk keverése
        </Button>
      </div>

      {/* Game Board - Two Columns Side by Side */}
      <div className="grid grid-cols-2 gap-8 mb-6 max-w-4xl mx-auto">
        {/* Uppercase Letters - Left Column */}
        <div>
          <h3 className="text-xl font-bold text-center mb-4 text-primary font-brand-heading">Nagy betűk</h3>
          <div className="space-y-3">
            {pairs.uppercase?.map((letter) => (
              <Button
                key={letter.id}
                className={`w-full h-16 text-3xl font-bold transition-all duration-200 border-2 hover-float ${
                  matchedPairs.has(letter.letter) 
                    ? 'bg-success/10 text-success border-success/50 cursor-default' 
                    : selectedUppercase?.letter === letter.letter
                    ? 'bg-primary/20 text-foreground border-primary'
                    : 'bg-card hover:bg-accent text-foreground border-border hover:border-primary'
                }`}
                onClick={() => handleLetterClick(letter)}
                disabled={matchedPairs.has(letter.letter) || isProcessing}
              >
                {letter.display}
                {matchedPairs.has(letter.letter) && (
                  <CheckCircle className="h-5 w-5 ml-2 text-success" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Lowercase Letters - Right Column */}
        <div>
          <h3 className="text-xl font-bold text-center mb-4 text-secondary-foreground font-brand-heading">Kis betűk</h3>
          <div className="space-y-3">
            {pairs.lowercase?.map((letter) => (
              <Button
                key={letter.id}
                className={`w-full h-16 text-3xl font-bold transition-all duration-200 border-2 hover-float ${
                  matchedPairs.has(letter.letter) 
                    ? 'bg-success/10 text-success border-success/50 cursor-default' 
                    : selectedLowercase?.letter === letter.letter
                    ? 'bg-secondary/30 text-secondary-foreground border-secondary'
                    : 'bg-card hover:bg-accent text-foreground border-border hover:border-secondary'
                }`}
                onClick={() => handleLetterClick(letter)}
                disabled={matchedPairs.has(letter.letter) || isProcessing}
              >
                {letter.display}
                {matchedPairs.has(letter.letter) && (
                  <CheckCircle className="h-5 w-5 ml-2 text-success" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="text-center mb-4">
        <p className="text-lg text-foreground/60">
          Párosítva: {matchedPairs.size} / {pairs.uppercase?.length || 0}
        </p>
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

export default MatchCaseGame;