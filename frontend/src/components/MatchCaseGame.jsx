import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2, Shuffle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);

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
      setSelectedUppercase(null);
      setSelectedLowercase(null);
      setMatchedPairs(new Set());
      setFeedback(null);
      setAttempts(0);
      
      // Get the number of pairs to match based on letters per session setting
      const pairsToMatch = child.settings?.letters_per_session || 9;
      
      const randomLetters = await ApiService.getRandomGraphemes(
        pairsToMatch, // Use letters_per_session as number of pairs
        child.settings?.include_foreign_letters || false,
        true
      );
      
      // Create pairs with shuffled positions
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
      
      // Shuffle arrays
      const shuffledUpper = [...uppercaseLetters].sort(() => Math.random() - 0.5);
      const shuffledLower = [...lowercaseLetters].sort(() => Math.random() - 0.5);
      
      setPairs({
        uppercase: shuffledUpper,
        lowercase: shuffledLower
      });
      
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error generating round:', err);
    } finally {
      setLoading(false);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleLetterClick = (letter) => {
    if (matchedPairs.has(letter.letter) || isProcessing) return;
    
    if (letter.case === 'uppercase') {
      setSelectedUppercase(selectedUppercase?.letter === letter.letter ? null : letter);
    } else {
      setSelectedLowercase(selectedLowercase?.letter === letter.letter ? null : letter);
    }
  };

  useEffect(() => {
    if (selectedUppercase && selectedLowercase && !isProcessing) {
      setIsProcessing(true);
      // Add small delay to prevent rapid clicking issues
      setTimeout(() => {
        checkMatch();
      }, 200);
    }
  }, [selectedUppercase, selectedLowercase]);

  const checkMatch = async () => {
    const isMatch = selectedUppercase.letter === selectedLowercase.letter;
    setAttempts(attempts + 1);

    if (isMatch) {
      try {
        // Only record progress for correct matches
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

        // Check if all pairs are matched
        if (matchedPairs.size + 1 === pairs.uppercase?.length) {
          setTimeout(() => {
            if (round < maxRounds) {
              setRound(round + 1);
              generateNewRound();
            } else {
              setGameOver(true);
            }
          }, 2000);
        }
        
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      // Handle incorrect match - reset streak locally and give feedback
      setStreak(0);
      setFeedback({ type: 'error', message: 'Próbáld újra!' });
      
      // Record the incorrect attempt for analytics (optional)
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
      
      // After several incorrect attempts, move to next round
      if (attempts >= 3) {
        setTimeout(() => {
          if (round < maxRounds) {
            setRound(round + 1);
            generateNewRound();
          } else {
            setGameOver(true);
          }
        }, 1500);
      }
    }
    
    // Clear selections after feedback
    setTimeout(() => {
      setSelectedUppercase(null);
      setSelectedLowercase(null);
      setIsProcessing(false);
      if (!isMatch) {
        setFeedback(null);
      }
    }, 1500);
  };

  const shuffleLetters = () => {
    if (!pairs.uppercase || !pairs.lowercase) return;
    
    setPairs({
      uppercase: [...pairs.uppercase].sort(() => Math.random() - 0.5),
      lowercase: [...pairs.lowercase].sort(() => Math.random() - 0.5)
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading matching game...</p>
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
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800">Párosítás befejezve!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{maxRounds * 6}</p>
              <p className="text-lg text-gray-600">Szuper párosítás, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white border-0">
                Újra párosítás
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
    <div className="w-full max-w-6xl mx-auto p-6">
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Párosítsd a nagy és kis betűket!</h2>
        <p className="text-gray-600 mb-4">Kattints egy nagy betűre, majd a hozzá tartozó kis betűre.</p>
        
        <Button
          onClick={shuffleLetters}
          className="flex items-center gap-2 mx-auto bg-purple-100 hover:bg-purple-200 text-purple-700 border-0"
        >
          <Shuffle className="h-4 w-4" />
          Betűk keverése
        </Button>
      </div>

      {/* Game Board - Two Columns Side by Side */}
      <div className="grid grid-cols-2 gap-8 mb-6 max-w-4xl mx-auto">
        {/* Uppercase Letters - Left Column */}
        <div>
          <h3 className="text-xl font-bold text-center mb-4 text-blue-800">Nagy betűk</h3>
          <div className="space-y-3">
            {pairs.uppercase?.map((letter) => (
              <Button
                key={letter.id}
                className={`w-full h-16 text-3xl font-bold transition-all duration-200 hover:scale-105 border-2 ${
                  matchedPairs.has(letter.letter) 
                    ? 'bg-green-100 text-green-800 border-green-400 cursor-default' 
                    : selectedUppercase?.letter === letter.letter
                    ? 'bg-blue-200 text-blue-800 border-blue-400'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 hover:border-blue-400'
                }`}
                onClick={() => handleLetterClick(letter)}
                disabled={matchedPairs.has(letter.letter) || isProcessing}
              >
                {letter.display}
                {matchedPairs.has(letter.letter) && (
                  <CheckCircle className="h-5 w-5 ml-2 text-green-600" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Lowercase Letters - Right Column */}
        <div>
          <h3 className="text-xl font-bold text-center mb-4 text-orange-800">Kis betűk</h3>
          <div className="space-y-3">
            {pairs.lowercase?.map((letter) => (
              <Button
                key={letter.id}
                className={`w-full h-16 text-3xl font-bold transition-all duration-200 hover:scale-105 border-2 ${
                  matchedPairs.has(letter.letter) 
                    ? 'bg-green-100 text-green-800 border-green-400 cursor-default' 
                    : selectedLowercase?.letter === letter.letter
                    ? 'bg-orange-200 text-orange-800 border-orange-400'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 hover:border-orange-400'
                }`}
                onClick={() => handleLetterClick(letter)}
                disabled={matchedPairs.has(letter.letter) || isProcessing}
              >
                {letter.display}
                {matchedPairs.has(letter.letter) && (
                  <CheckCircle className="h-5 w-5 ml-2 text-green-600" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="text-center mb-4">
        <p className="text-lg text-gray-600">
          Párosítva: {matchedPairs.size} / {pairs.uppercase?.length || 0}
        </p>
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

export default MatchCaseGame;