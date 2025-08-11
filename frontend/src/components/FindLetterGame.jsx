import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2 } from 'lucide-react';
import { getRandomGraphemes, getGraphemeCase, mockSettings } from '../data/mock';

const FindLetterGame = ({ child, onBack, onProgress, soundEnabled }) => {
  const [currentTarget, setCurrentTarget] = useState('');
  const [gridLetters, setGridLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(mockSettings.lettersPerSession);

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = () => {
    if (round > maxRounds) {
      setGameOver(true);
      return;
    }

    const gridSize = mockSettings.difficulty === 'Easy' ? 6 : 
                    mockSettings.difficulty === 'Hard' ? 12 : 9;
    
    const randomLetters = getRandomGraphemes(gridSize, mockSettings.includeForeignLetters);
    const targetLetter = randomLetters[0];
    
    setCurrentTarget(targetLetter);
    setGridLetters(randomLetters.sort(() => Math.random() - 0.5));
    setFeedback(null);
  };

  const handleLetterClick = (clickedLetter) => {
    const isCorrect = clickedLetter === currentTarget;
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setFeedback({ type: 'success', message: 'Nagyszerű!' });
      
      // Simulate progress update
      onProgress(currentTarget, true);
      
      if (soundEnabled) {
        // Would play success sound
        console.log('Playing success sound');
      }
      
      setTimeout(() => {
        setRound(round + 1);
        generateNewRound();
      }, 1500);
    } else {
      setStreak(0);
      setFeedback({ type: 'error', message: 'Próbáld újra!' });
      
      onProgress(currentTarget, false);
      
      if (soundEnabled) {
        // Would play error sound
        console.log('Playing error sound');
      }
      
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  const getDisplayLetter = (letter) => {
    const caseType = mockSettings.letterCase === 'mixed' ? 
      ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
      mockSettings.letterCase;
    return getGraphemeCase(letter, caseType);
  };

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
              <Button onClick={generateNewRound} className="bg-green-600 hover:bg-green-700">
                Újra játék
              </Button>
              <Button variant="outline" onClick={onBack}>
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
            {getDisplayLetter(currentTarget)}
          </div>
        </div>
        {soundEnabled && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 mx-auto"
            onClick={() => console.log('Playing letter sound:', currentTarget)}
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
            variant="outline"
            className={`h-24 text-4xl font-bold transition-all duration-200 hover:scale-105 ${
              feedback?.type === 'error' && letter !== currentTarget ? 
                'opacity-50' : 
                letter === currentTarget && feedback?.type === 'success' ? 
                  'bg-green-100 text-green-800 border-green-400' : 
                  'hover:bg-blue-50'
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