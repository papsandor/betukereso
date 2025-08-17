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
  const [round, setRound] = useState(0); // Start from 0 instead of 1
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [traceComplete, setTraceComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [drawnPixels, setDrawnPixels] = useState(new Set());
  const [letterPixels, setLetterPixels] = useState(new Set());
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [letterGuideImageData, setLetterGuideImageData] = useState(null);

  useEffect(() => {
    generateNewRound();
  }, []);

  useEffect(() => {
    if (canvasRef.current && currentDisplayLetter) {
      setupCanvas();
    }
  }, [currentDisplayLetter]);

  const generateNewRound = async () => {
    if (round >= maxRounds) { // Changed from > to >=
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
    
    // Calculate letter pixels for comparison
    calculateLetterPixels(ctx);
    
    // Set up drawing context for user drawing
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out'; // Eraser mode
      ctx.lineWidth = 15; // Wider eraser
    } else {
      ctx.globalCompositeOperation = 'source-over'; // Draw mode
      ctx.strokeStyle = '#3B82F6';
      ctx.fillStyle = '#3B82F6';
      ctx.lineWidth = 6;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const calculateLetterPixels = (ctx) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const pixels = imageData.data;
    const letterPixelSet = new Set();
    
    // Find all non-white pixels (letter pixels)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1]; 
      const b = pixels[i + 2];
      
      // If pixel is not white (letter outline or fill)
      if (r < 250 || g < 250 || b < 250) {
        const pixelIndex = Math.floor(i / 4);
        const x = pixelIndex % ctx.canvas.width;
        const y = Math.floor(pixelIndex / ctx.canvas.width);
        letterPixelSet.add(`${x},${y}`);
      }
    }
    setLetterPixels(letterPixelSet);
    setDrawnPixels(new Set()); // Reset drawn pixels
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
    
    // Set drawing mode
    if (isEraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 15;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 6;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
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
    
    // Track drawn pixels only in draw mode (not eraser mode)
    if (!isEraserMode) {
      const drawnPixelKey = `${Math.floor(x)},${Math.floor(y)}`;
      setDrawnPixels(prev => new Set([...prev, drawnPixelKey]));
    }
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      // REMOVED: checkTraceCompletion() - now only triggered by "Kész" button
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
    // Calculate how much of the drawn line overlaps with the letter
    const drawnPixelsArray = Array.from(drawnPixels);
    const letterPixelsArray = Array.from(letterPixels);
    
    if (drawnPixelsArray.length === 0 || letterPixelsArray.length === 0) {
      handleTraceComplete(false);
      return;
    }
    
    // Count overlapping pixels
    let overlapCount = 0;
    drawnPixelsArray.forEach(drawnPixel => {
      // Check if drawn pixel is within letter area (with some tolerance)
      const [dx, dy] = drawnPixel.split(',').map(Number);
      
      for (const letterPixel of letterPixelsArray) {
        const [lx, ly] = letterPixel.split(',').map(Number);
        const distance = Math.sqrt((dx - lx) ** 2 + (dy - ly) ** 2);
        
        // If within tolerance distance (10 pixels), count as overlap
        if (distance <= 10) {
          overlapCount++;
          break;
        }
      }
    });
    
    // Calculate accuracy percentage
    const accuracy = overlapCount / drawnPixelsArray.length;
    const isSuccessful = accuracy >= 0.8; // 80% threshold
    
    console.log(`Trace accuracy: ${(accuracy * 100).toFixed(1)}% (${overlapCount}/${drawnPixelsArray.length} pixels)`);
    
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
          if (round + 1 >= maxRounds) {
            setGameOver(true);
          } else {
            setRound(round + 1);
            generateNewRound();
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
        if (round + 1 >= maxRounds) {
          setGameOver(true);
        } else {
          setRound(round + 1);
          generateNewRound();
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
    setIsEraserMode(false); // Reset to draw mode
  };

  const toggleEraserMode = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handleFinishDrawing = () => {
    checkTraceCompletion();
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
          <Badge variant="secondary">{round + 1}/{maxRounds} kör</Badge>
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
        {isEraserMode && (
          <div className="mb-4 p-2 bg-orange-100 text-orange-800 rounded-lg inline-block">
            🗑️ <strong>Radír mód:</strong> Húzd az egeret/ujjad a törölni kívánt vonalakon!
          </div>
        )}
        <div className="inline-block bg-white rounded-lg shadow-lg p-4">
          <canvas
            ref={canvasRef}
            className={`border-2 border-gray-300 rounded-lg select-none ${
              isEraserMode ? 'cursor-crosshair' : 'cursor-crosshair'
            }`}
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
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
            >
              <RotateCcw className="h-4 w-4" />
              Újra kezdés
            </Button>
            
            <Button
              onClick={toggleEraserMode}
              className={`flex items-center gap-2 border-0 ${
                isEraserMode 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
              }`}
            >
              <div className="h-4 w-4 rounded-full border-2 border-current" />
              {isEraserMode ? 'Radír BE' : 'Radír'}
            </Button>
            
            <Button
              onClick={handleFinishDrawing}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white border-0"
              disabled={traceComplete}
            >
              <CheckCircle className="h-4 w-4" />
              Kész vagyok!
            </Button>
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