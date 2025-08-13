import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Award, Calendar, Sparkles, Loader2 } from 'lucide-react';
import ApiService from '../services/ApiService';

const StickerBook = ({ child, onBack }) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStickers();
  }, [child.id]);

  const loadStickers = async () => {
    try {
      setLoading(true);
      setError(null);
      const stickerData = await ApiService.getChildStickers(child.id);
      setStickers(stickerData);
    } catch (err) {
      setError('Failed to load sticker collection');
      console.error('Error loading stickers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStickerDesign = (streakLevel) => {
    const designs = {
      3: { emoji: '🌟', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', gradient: 'from-yellow-200 to-yellow-300' },
      5: { emoji: '📚', color: 'bg-blue-100 border-blue-400 text-blue-800', gradient: 'from-blue-200 to-blue-300' },
      10: { emoji: '🏆', color: 'bg-purple-100 border-purple-400 text-purple-800', gradient: 'from-purple-200 to-purple-300' },
      15: { emoji: '👑', color: 'bg-indigo-100 border-indigo-400 text-indigo-800', gradient: 'from-indigo-200 to-indigo-300' },
      20: { emoji: '🎯', color: 'bg-green-100 border-green-400 text-green-800', gradient: 'from-green-200 to-green-300' }
    };
    
    return designs[streakLevel] || { 
      emoji: '🎉', 
      color: 'bg-pink-100 border-pink-400 text-pink-800',
      gradient: 'from-pink-200 to-pink-300'
    };
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading sticker collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          {error}
        </div>
        <Button onClick={loadStickers} className="bg-blue-500 hover:bg-blue-600 text-white border-0">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Button onClick={onBack} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            {child.name} Matrica Gyűjteménye
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </h1>
          <Badge variant="outline" className="mt-2 text-lg px-4 py-2">
            <Award className="h-4 w-4 mr-2" />
            {stickers.length} matrica összesen
          </Badge>
        </div>
        
        <div></div> {/* Spacer for centering */}
      </div>

      {/* Achievement Summary - MOVED TO TOP */}
      {stickers.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center text-purple-800">
              🏆 Teljesítmény Összesítő
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">{stickers.length}</div>
                <div className="text-sm text-gray-600">Összegyűjtött matricák</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.max(...stickers.map(s => s.streak_level))}
                </div>
                <div className="text-sm text-gray-600">Leghosszabb sorozat</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {stickers.filter(s => s.streak_level >= 10).length}
                </div>
                <div className="text-sm text-gray-600">Mester szintű matricák</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {Math.round((new Date() - new Date(Math.min(...stickers.map(s => new Date(s.earned_at))))) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-600">Napja tanul</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticker Collection */}
      {stickers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Még nincsenek matricák</h2>
          <p className="text-gray-500">Játssz, és szerezd meg az első matricádat!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stickers.map((sticker, index) => {
            const design = getStickerDesign(sticker.streak_level);
            
            return (
              <Card 
                key={sticker.id} 
                className={`${design.color} border-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer`}
              >
                <CardContent className="text-center p-6">
                  {/* Sticker Icon */}
                  <div className="text-6xl mb-3 animate-pulse">
                    {design.emoji}
                  </div>
                  
                  {/* Sticker Name */}
                  <h3 className="text-lg font-bold mb-2">
                    {sticker.name}
                  </h3>
                  
                  {/* Achievement Badge */}
                  <Badge variant="outline" className="mb-3 font-semibold">
                    {sticker.streak_level} sorozat
                  </Badge>
                  
                  {/* Date Earned */}
                  <div className="flex items-center justify-center gap-1 text-sm opacity-75">
                    <Calendar className="h-3 w-3" />
                    {new Date(sticker.earned_at).toLocaleDateString('hu-HU')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Placeholder cards for motivation */}
          {stickers.length < 12 && [...Array(Math.min(4, 12 - stickers.length))].map((_, index) => (
            <Card 
              key={`placeholder-${index}`} 
              className="border-dashed border-2 border-gray-300 opacity-50"
            >
              <CardContent className="text-center p-6">
                <div className="text-6xl mb-3 opacity-30">❓</div>
                <h3 className="text-lg font-bold mb-2 text-gray-400">
                  Következő matrica
                </h3>
                <p className="text-sm text-gray-400">
                  Folytasd a tanulást!
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StickerBook;