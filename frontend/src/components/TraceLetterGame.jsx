import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import ApiService, { getGraphemeCase } from '../services/ApiService';
import soundService from '../services/SoundService';

const TraceLetterGame = ({ child, onBack, soundEnabled, onStickerEarned }) => {
  const canvasRef = useRef(null);
  const [currentTarget, setCurrentTarget] = useState('');
  const [currentDisplayLetter, setCurrentDisplayLetter] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(child.streak || 0);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [traceComplete, setTraceComplete] = useState(false);
  const [drawnPixels, setDrawnPixels] = useState(new Set());
  const [letterPixels, setLetterPixels] = useState(new Set());

  useEffect(() => {
    generateNewRound();
  }, []);

  useEffect(() => {
    if (canvasRef.current && currentDisplayLetter) {
      setupCanvas();
    }
  }, [currentDisplayLetter]);

  const generateNewRound = async () => {
    if (round > maxRounds) {
      setGameOver(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTraceComplete(false);
      setShowSuccess(false);
      
      const randomLetters = await ApiService.getRandomGraphemes(
        1,
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
      
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error generating round:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentDisplayLetter) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size properly
    const rect = canvas.getBoundingClientRect();
    canvas.width = 400;
    canvas.height = 300;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw letter outline/guide in light gray - using the SAME letter as displayed
    ctx.strokeStyle = '#D1D5DB';
    ctx.fillStyle = '#F3F4F6';
    ctx.lineWidth = 4;
    ctx.font = 'bold 160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Use the stored display letter to ensure consistency
    ctx.fillText(currentDisplayLetter, canvas.width / 2, canvas.height / 2);
    ctx.strokeText(currentDisplayLetter, canvas.width / 2, canvas.height / 2);
    
    // Set up drawing context for user drawing
    ctx.strokeStyle = '#3B82F6';
    ctx.fillStyle = '#3B82F6';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
  };

  const getDisplayLetter = (letter) => {
    // This function is now only used for sound - the display letter is stored in state
    const caseType = child.settings?.letter_case === 'mixed' ? 
      ['lowercase', 'uppercase', 'titlecase'][Math.floor(Math.random() * 3)] :
      child.settings?.letter_case || 'lowercase';
    return getGraphemeCase(letter, caseType);
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Get coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Get coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      checkTraceCompletion();
    }
  };

  // Add touch support for mobile devices
  const startTouchDrawing = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent);
  };

  const touchDraw = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent);
  };

  const stopTouchDrawing = (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent("mouseup", {});
    stopDrawing(mouseEvent);
  };

  const checkTraceCompletion = () => {
    // Simple completion check - in real app, this would analyze the drawing
    // For now, simulate success most of the time, but occasionally simulate failure for testing
    const isSuccessful = Math.random() > 0.1; // 90% success rate for demo
    
    setTimeout(() => {
      setTraceComplete(true);
      setShowSuccess(isSuccessful);
      handleTraceComplete(isSuccessful);
    }, 500);
  };

  const handleTraceComplete = async (isCorrect) => {
    if (isCorrect) {
      try {
        // Only record progress for successful traces
        const progressData = await ApiService.recordProgress(child.id, {
          game_mode: 'trace-letter',
          grapheme: currentTarget,
          is_correct: true
        });

        setScore(score + 1);
        setStreak(progressData.new_streak);
        
        if (progressData.sticker_earned && onStickerEarned) {
          onStickerEarned(progressData.sticker_earned);
        }
        
        if (soundEnabled) {
          soundService.playSuccessSound();
        }
        
        setTimeout(() => {
          if (round < maxRounds) {
            setRound(round + 1);
            generateNewRound();
          } else {
            setGameOver(true);
          }
        }, 2000);
        
      } catch (err) {
        console.error('Error recording progress:', err);
        setError('Failed to save progress');
      }
    } else {
      // Handle incorrect trace - reset streak and move to next round
      setStreak(0);
      setShowSuccess(false);
      
      // Record the incorrect attempt for analytics
      try {
        await ApiService.recordProgress(child.id, {
          game_mode: 'trace-letter',
          grapheme: currentTarget,
          is_correct: false
        });
      } catch (err) {
        console.error('Error recording incorrect attempt:', err);
      }
      
      if (soundEnabled) {
        soundService.playErrorSound();
      }
      
      // Move to next round after error sound and feedback
      setTimeout(() => {
        if (round < maxRounds) {
          setRound(round + 1);
          generateNewRound();
        } else {
          setGameOver(true);
        }
      }, 2000);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the letter guide
    setupCanvas();
    
    setTraceComplete(false);
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading tracing game...</p>
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
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-3xl font-bold text-gray-800">Rajzolás befejezve!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{maxRounds}</p>
              <p className="text-lg text-gray-600">Szuper rajzolás, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600 text-white border-0">
                Újra rajzolás
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Rajzold le:</h2>
        <div className="bg-green-100 rounded-2xl p-8 mb-6 inline-block">
          <div className="text-8xl font-bold text-green-800">
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

      {/* Drawing Canvas */}
      <div className="text-center mb-6">
        <div className="inline-block bg-white rounded-lg shadow-lg p-4">
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-300 rounded-lg cursor-crosshair select-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startTouchDrawing}
            onTouchMove={touchDraw}
            onTouchEnd={stopTouchDrawing}
            style={{ touchAction: 'none' }}
          />
          
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={clearCanvas}
              className="flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 border-0"
            >
              <RotateCcw className="h-4 w-4" />
              Újra kezdés
            </Button>
            
            {traceComplete && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Szuper!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success feedback */}
      {showSuccess && (
        <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg mb-4">
          <p className="text-xl font-semibold">Nagyszerű rajzolás! 🎨</p>
        </div>
      )}
    </div>
  );
};

export default TraceLetterGame;