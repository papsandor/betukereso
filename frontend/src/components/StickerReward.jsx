import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Award, Star, X, Sparkles, Info } from 'lucide-react';

const StickerReward = ({ sticker, onClose, soundEnabled }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (sticker) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sticker, onClose]);

  if (!sticker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      {/* Confetti */}
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

      <Card className={`w-96 bg-yellow-100 border-yellow-400 text-yellow-900 border-4 shadow-2xl animate-in zoom-in duration-500`}>
        <CardContent className="text-center p-8 relative">
          {/* Close button */}
          <Button
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 bg-gray-100 hover:bg-gray-200 text-gray-600 border-0 rounded-full p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Sticker Icon */}
          <div className="text-8xl mb-4 animate-bounce">
            {sticker.emoji || '🏅'}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-2">
            Matrica megszerzve!
          </h2>

          {/* Sticker Name */}
          <div className="mb-2">
            <Badge variant="outline" className="text-lg px-4 py-2 font-bold">
              <Award className="h-5 w-5 mr-2" />
              {sticker.name}
            </Badge>
          </div>

          {/* Short description if available */}
          {sticker.description && (
            <div className="text-sm text-yellow-900/80 mb-3">
              {sticker.description}
            </div>
          )}

          {/* Achievement Details */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {sticker.streak_level} helyes válasz sorban!
              </span>
            </div>
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