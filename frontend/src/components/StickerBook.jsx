import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Award, Calendar, Sparkles, Loader2, Info } from 'lucide-react';
import ApiService from '../services/ApiService';

const TOTAL_SLOTS = 102; // 102-as rács

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
      const ordered = [...stickerData].sort((a, b) => new Date(a.earned_at) - new Date(b.earned_at));
      setStickers(ordered);
    } catch (err) {
      setError('A matrica gyűjtemény betöltése sikertelen');
      console.error('Error loading stickers:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderGrid = () => {
    const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-4">
        {slots.map((idx) => {
          const sticker = stickers[idx];
          if (sticker) {
            return (
              <Card key={`slot-${idx}`} className="bg-white border-2 border-green-300 shadow-sm hover:shadow-md transition-all">
                <CardContent className="text-center p-4">
                  <div className="text-5xl mb-2">{sticker.emoji || '🏅'}</div>
                  <h3 className="text-base font-bold mb-1">{sticker.name}</h3>
                  {sticker.description && (
                    <p className="text-xs text-gray-600 mb-2">{sticker.description}</p>
                  )}
                  <Badge variant="outline" className="mb-2">{sticker.streak_level} sorozat</Badge>
                  <div className="flex items-center justify-center gap-1 text-xs opacity-75">
                    <Calendar className="h-3 w-3" />
                    {new Date(sticker.earned_at).toLocaleDateString('hu-HU')}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={`slot-${idx}`} className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="text-center p-6">
                <div className="text-5xl mb-2 opacity-40">❓</div>
                <p className="text-sm text-gray-400">Még nincs megszerezve</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Matrica gyűjtemény betöltése...</p>
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
          Újra
        </Button>
      </div>
    );
  }

  const stickersEnabled = child?.settings?.stickers_enabled !== false;

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
            {stickers.length} / {TOTAL_SLOTS} megszerzett matrica
          </Badge>
        </div>
        
        <div></div>
      </div>

      {!stickersEnabled && (
        <div className="max-w-3xl mx-auto bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 mt-0.5" />
          <div>
            <div className="font-semibold">A matricák jelenleg ki vannak kapcsolva.</div>
            <div className="text-sm">Kapcsold be a Szülői Beállításokban, hogy jutalmakat kapjon a gyerek, és megjelenjenek a matricahelyek.</div>
          </div>
        </div>
      )}

      {stickersEnabled ? (
        <>
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
                      {stickers.length > 0 ? Math.max(...stickers.map(s => s.streak_level)) : 0}
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
                      {stickers.length > 0 ? Math.round((new Date() - new Date(Math.min(...stickers.map(s => new Date(s.earned_at))))) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Napja tanul</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {renderGrid()}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">ℹ️</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-4">A matricák ki vannak kapcsolva</h2>
          <p className="text-gray-500">Kapcsold be a Szülői Beállításokban, hogy megjelenjen a 102-es matricarács.</p>
        </div>
      )}
    </div>
  );
};

export default StickerBook;