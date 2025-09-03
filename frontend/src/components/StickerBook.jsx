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
              <Card key={`slot-${idx}`} className="bg-card border-2 border-success/40 shadow-sm card-float">
                <CardContent className="text-center p-4">
                  <div className="text-5xl mb-2">{sticker.emoji || '🏅'}</div>
                  <h3 className="text-base font-bold mb-1 text-foreground">{sticker.name}</h3>
                  {sticker.description && (
                    <p className="text-xs text-foreground/60 mb-2">{sticker.description}</p>
                  )}
                  <Badge variant="outline" className="mb-2">{sticker.streak_level} sorozat</Badge>
                  <div className="flex items-center justify-center gap-1 text-xs opacity-75 text-foreground/60">
                    <Calendar className="h-3 w-3" />
                    {new Date(sticker.earned_at).toLocaleDateString('hu-HU')}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={`slot-${idx}`} className="border-2 border-dashed border-border bg-muted">
              <CardContent className="text-center p-6">
                <div className="text-5xl mb-2 opacity-40">❓</div>
                <p className="text-sm text-foreground/50">Még nincs megszerezve</p>
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
        <p className="text-foreground/60">Matrica gyűjtemény betöltése...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
          {error}
        </div>
        <Button onClick={loadStickers} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0">
          Újra
        </Button>
      </div>
    );
  }

  const stickersEnabled = child?.settings?.stickers_enabled !== false;

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-semi-transparent p-4 rounded-2xl backdrop-blur-sm">
        <Button onClick={onBack} className="flex items-center gap-2 bg-semi-transparent hover:bg-accent text-foreground border-0 backdrop-blur-sm">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 font-brand-heading">
            <Sparkles className="h-8 w-8 text-warning" />
            {child.name} Matrica Gyűjteménye
            <Sparkles className="h-8 w-8 text-warning" />
          </h1>
          <Badge variant="outline" className="mt-2 text-lg px-4 py-2 bg-semi-transparent backdrop-blur-sm">
            <Award className="h-4 w-4 mr-2" />
            {stickers.length} / {TOTAL_SLOTS} megszerzett matrica
          </Badge>
        </div>
        
        <div></div>
      </div>

      {!stickersEnabled && (
        <div className="max-w-3xl mx-auto bg-semi-transparent backdrop-blur-sm text-secondary-foreground p-4 rounded-lg border border-secondary/30 mb-6 flex items-start gap-3">
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
            <Card className="mb-8 bg-card-semi backdrop-blur-sm border-secondary/30">
              <CardHeader>
                <CardTitle className="text-center text-foreground font-brand-heading">
                  🏆 Teljesítmény Összesítő
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">{stickers.length}</div>
                    <div className="text-sm text-foreground/60">Összegyűjtött matricák</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {stickers.length > 0 ? Math.max(...stickers.map(s => s.streak_level)) : 0}
                    </div>
                    <div className="text-sm text-foreground/60">Leghosszabb sorozat</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-success">
                      {stickers.filter(s => s.streak_level >= 10).length}
                    </div>
                    <div className="text-sm text-foreground/60">Mester szintű matricák</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-warning">
                      {stickers.length > 0 ? Math.round((new Date() - new Date(Math.min(...stickers.map(s => new Date(s.earned_at))))) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-sm text-foreground/60">Napja tanul</div>
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
          <h2 className="text-2xl font-bold text-foreground/80 mb-4">A matricák ki vannak kapcsolva</h2>
          <p className="text-foreground/60">Kapcsold be a Szülői Beállításokban, hogy megjelenjen a 102-es matricarács.</p>
        </div>
      )}
    </div>
  );
};

export default StickerBook;