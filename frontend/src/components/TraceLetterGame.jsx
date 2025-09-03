import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Star, Volume2, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';
import ApiService, { getGraphemeCase } from '../services/ApiService';
import soundService from '../services/SoundService';

const TraceLetterGame = ({ child, onBack, soundEnabled, onStickerEarned }) => {
  const guideCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const [currentTarget, setCurrentTarget] = useState('');
  const [currentDisplayLetter, setCurrentDisplayLetter] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(child.streak || 0);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(child.settings?.letters_per_session || 9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [traceComplete, setTraceComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [drawnPixels, setDrawnPixels] = useState(new Set());
  const [letterPixels, setLetterPixels] = useState(new Set());
  const [isEraserMode, setIsEraserMode] = useState(false);

  useEffect(() => {
    generateNewRound();
  }, []);

  useEffect(() => {
    if (currentDisplayLetter) {
      setupCanvases();
    }
  }, [currentDisplayLetter]);

  const generateNewRound = async () => {
    if (round >= maxRounds) {
      setGameOver(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTraceComplete(false);
      setShowSuccess(false);
      setDrawnPixels(new Set());
      setIsEraserMode(false); // AUTO: új körnél rajzolás módra váltunk
      
      const randomLetters = await ApiService.getRandomGraphemes(
        1,
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
      
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error generating round:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupCanvases = () => {
    const guideCanvas = guideCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!guideCanvas || !drawCanvas) return;

    const width = 400;
    const height = 300;
    guideCanvas.width = width;
    guideCanvas.height = height;
    drawCanvas.width = width;
    drawCanvas.height = height;

    const gctx = guideCanvas.getContext('2d');
    gctx.fillStyle = '#ffffff';
    gctx.fillRect(0, 0, width, height);
    gctx.strokeStyle = '#D1D5DB';
    gctx.fillStyle = '#F3F4F6';
    gctx.lineWidth = 4;
    gctx.font = 'bold 160px Arial';
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    gctx.fillText(currentDisplayLetter, width / 2, height / 2);
    gctx.strokeText(currentDisplayLetter, width / 2, height / 2);

    calculateLetterPixels(gctx);

    const dctx = drawCanvas.getContext('2d');
    dctx.clearRect(0, 0, width, height);
    dctx.lineCap = 'round';
    dctx.lineJoin = 'round';
    dctx.lineWidth = 6;
    dctx.strokeStyle = '#3B82F6';
    dctx.globalCompositeOperation = 'source-over';
  };

  const calculateLetterPixels = (ctx) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const pixels = imageData.data;
    const letterPixelSet = new Set();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1]; 
      const b = pixels[i + 2];
      
      if (r < 250 || g < 250 || b < 250) {
        const pixelIndex = Math.floor(i / 4);
        const x = pixelIndex % ctx.canvas.width;
        const y = Math.floor(pixelIndex / ctx.canvas.width);
        letterPixelSet.add(`${x},${y}`);
      }
    }
    setLetterPixels(letterPixelSet);
    setDrawnPixels(new Set());
  };

  const getCoords = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
    const clientY = 'clientY' in e ? e.clientY : (e.touches ? e.touches[0].clientY : 0);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');

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

    const { x, y } = getCoords(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const { x, y } = getCoords(canvas, e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (!isEraserMode) {
      const drawnPixelKey = `${Math.floor(x)},${Math.floor(y)}`;
      setDrawnPixels(prev => new Set([...prev, drawnPixelKey]));
    }
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const startTouchDrawing = (e) => startDrawing(e);
  const touchDraw = (e) => draw(e);
  const stopTouchDrawing = (e) => stopDrawing(e);

  const checkTraceCompletion = () => {
    const drawnPixelsArray = Array.from(drawnPixels);
    const letterPixelsArray = Array.from(letterPixels);
    
    if (drawnPixelsArray.length === 0 || letterPixelsArray.length === 0) {
      handleTraceComplete(false);
      return;
    }
    
    let overlapCount = 0;
    drawnPixelsArray.forEach(drawnPixel => {
      const [dx, dy] = drawnPixel.split(',').map(Number);
      for (const letterPixel of letterPixelsArray) {
        const [lx, ly] = letterPixel.split(',').map(Number);
        const distance = Math.sqrt((dx - lx) ** 2 + (dy - ly) ** 2);
        if (distance <= 10) {
          overlapCount++;
          break;
        }
      }
    });
    
    const accuracy = overlapCount / drawnPixelsArray.length;
    const isSuccessful = accuracy >= 0.8;
    
    setTimeout(() => {
      setTraceComplete(true);
      setShowSuccess(isSuccessful);
      handleTraceComplete(isSuccessful);
    }, 500);
  };

  const handleTraceComplete = async (isCorrect) => {
    if (isCorrect) {
      try {
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
      setStreak(0);
      setShowSuccess(false);
      
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
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTraceComplete(false);
    setShowSuccess(false);
    setIsEraserMode(false);
    setDrawnPixels(new Set());
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
        <p className="text-foreground/60">Loading tracing game...</p>
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
          <Button onClick={generateNewRound} className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
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
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-3xl font-bold text-foreground">Rajzolás befejezve!</h2>
            <div className="space-y-2">
              <p className="text-xl">Pontszám: {score}/{maxRounds}</p>
              <p className="text-lg text-foreground/60">Szuper rajzolás, {child.name}!</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()} className="bg-success hover:bg-success/90 text-success-foreground border-0">
                Újra rajzolás
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
          <Badge variant="outline">
            {streak} sorozat
          </Badge>
        </div>
      </div>

      {/* Game Instruction */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Rajzold le:</h2>
        <div className="bg-secondary/20 rounded-2xl p-8 mb-6 inline-block">
          <div className="text-8xl font-bold text-secondary-foreground">
            {currentDisplayLetter}
          </div>
        </div>
        {soundEnabled && (
          <Button 
            size="sm" 
            className="flex items-center gap-2 mx-auto bg-primary/10 hover:bg-primary/20 text-primary border-0"
            onClick={() => soundService.playLetterSound(currentDisplayLetter)}
          >
            <Volume2 className="h-4 w-4" />
            Hangot lejátszani
          </Button>
        )}
      </div>

      {/* Two-layer Canvas: guide (bottom) + drawing (top) */}
      <div className="text-center mb-6">
        {isEraserMode && (
          <div className="mb-4 p-2 bg-warning/30 text-warning rounded-lg inline-block backdrop-blur-sm">
            🗑️ <strong>Radír mód:</strong> Húzd az egeret/ujjad a törölni kívánt vonalakon!
          </div>
        )}
        {/* Canvas container - OPAQUE (exception) */}
        <div className="inline-block canvas-opaque rounded-lg shadow-lg p-4 card-float">
          <div className="relative" style={{ width: 400, height: 300 }}>
            <canvas
              ref={guideCanvasRef}
              className="absolute top-0 left-0 border-2 border-border rounded-lg select-none pointer-events-none canvas-opaque"
              width={400}
              height={300}
            />
            <canvas
              ref={drawCanvasRef}
              className={`absolute top-0 left-0 border-2 border-border rounded-lg select-none canvas-opaque ${
                isEraserMode ? 'cursor-crosshair' : 'cursor-crosshair'
              }`}
              width={400}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startTouchDrawing}
              onTouchMove={touchDraw}
              onTouchEnd={stopTouchDrawing}
              style={{ touchAction: 'none' }}
            />
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={clearCanvas}
              className="flex items-center gap-2 bg-semi-transparent hover:bg-accent text-foreground border-0 backdrop-blur-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Újra kezdés
            </Button>
            
            <Button
              onClick={toggleEraserMode}
              className={`flex items-center gap-2 border-0 backdrop-blur-sm ${
                isEraserMode 
                  ? 'bg-warning text-warning-foreground hover:bg-warning/90' 
                  : 'bg-warning/40 hover:bg-warning/50 text-warning'
              }`}
            >
              <div className="h-4 w-4 rounded-full border-2 border-current" />
              {isEraserMode ? 'Radír BE' : 'Radír'}
            </Button>
            
            <Button
              onClick={handleFinishDrawing}
              className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground border-0"
            >
              <CheckCircle className="h-4 w-4" />
              Kész
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {traceComplete && (
        <div className={`text-center p-4 rounded-lg mb-4 ${
          showSuccess ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          <p className="text-xl font-semibold">
            {showSuccess ? 'Nagyszerű! Sikeres rajzolás!' : 'Próbáld újra! Több ponton kövesd a betűt.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TraceLetterGame;