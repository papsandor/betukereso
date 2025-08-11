import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Award, Star, X, Sparkles } from 'lucide-react';

const StickerReward = ({ sticker, onClose, soundEnabled }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (sticker) {
      setShowConfetti(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [sticker, onClose]);

  if (!sticker) return null;

  const getStickerDesign = (streakLevel) => {
    const designs = {
      3: { emoji: '🌟', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', name: 'Arany Csillag' },
      5: { emoji: '📚', color: 'bg-blue-100 border-blue-400 text-blue-800', name: 'Szuper Olvasó' },
      10: { emoji: '🏆', color: 'bg-purple-100 border-purple-400 text-purple-800', name: 'Betű Mester' },
      15: { emoji: '👑', color: 'bg-indigo-100 border-indigo-400 text-indigo-800', name: 'Király Olvasó' },
      20: { emoji: '🎯', color: 'bg-green-100 border-green-400 text-green-800', name: 'Tökéletes Teljesítmény' }
    };
    
    return designs[streakLevel] || { 
      emoji: '🎉', 
      color: 'bg-pink-100 border-pink-400 text-pink-800', 
      name: `${streakLevel} Sorozat Champion!` 
    };
  };

  const stickerDesign = getStickerDesign(sticker.streak_level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              <div className="text-2xl">
                {['🎉', '⭐', '🎊', '✨', '🏆'][Math.floor(Math.random() * 5)]}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className={`w-96 ${stickerDesign.color} border-4 shadow-2xl animate-in zoom-in duration-500`}>
        <CardContent className="text-center p-8">
          {/* Close button */}
          <Button
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 bg-gray-100 hover:bg-gray-200 text-gray-600 border-0 rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Sticker Icon */}
          <div className="text-8xl mb-4 animate-bounce">
            {stickerDesign.emoji}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-2">
            Matrica megszerzve!
          </h2>

          {/* Sticker Name */}
          <div className="mb-4">
            <Badge variant="outline" className="text-lg px-4 py-2 font-bold">
              <Award className="h-5 w-5 mr-2" />
              {stickerDesign.name}
            </Badge>
          </div>

          {/* Achievement Details */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {sticker.streak_level} helyes válasz sorban!
              </span>
            </div>
            <p className="text-sm opacity-80">
              Fantasztikus munka! Így tovább!
            </p>
          </div>

          {/* Sparkles decoration */}
          <div className="flex justify-center gap-4 mb-4">
            <Sparkles className="h-6 w-6 animate-spin" />
            <Sparkles className="h-8 w-8 animate-pulse" />
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>

          {/* Continue Button */}
          <Button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-current border-2 border-current font-bold"
          >
            Folytatás 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StickerReward;