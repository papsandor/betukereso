import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Settings, Volume2, VolumeX, Eye, Palette, BookOpen, Target, Loader2, Save, RotateCcw, Award, Info } from 'lucide-react';
import ApiService from '../services/ApiService';

const ParentalSettings = ({ child, onBack, onSettingsUpdate }) => {
  const [settings, setSettings] = useState(child.settings || {});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const defaultSettings = {
    letters_per_session: 9,
    letter_case: 'mixed',
    include_foreign_letters: false,
    streak_thresholds: [3, 5, 10],
    sound_enabled: true,
    high_contrast: false,
    difficulty: 'Medium',
    stickers_enabled: true,
    additional_sticker_interval: 5,
  };

  useEffect(() => {
    setSettings(child.settings || defaultSettings);
  }, [child]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleThresholdChange = (index, value) => {
    const newThresholds = [...(settings.streak_thresholds || [3,5,10])];
    newThresholds[index] = parseInt(value) || 0;
    handleSettingChange('streak_thresholds', newThresholds);
  };

  const saveSetting = async (key, value) => {
    try {
      setSaving(true);
      setError(null);
      await ApiService.updateSetting(child.id, key, value);
      if (onSettingsUpdate) {
        onSettingsUpdate({ ...child, settings: { ...settings, [key]: value } });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(`Sikertelen mentés: ${key} beállítás mentése nem sikerült.`);
      console.error('Error saving setting:', err);
      // Revert
      setSettings(prev => ({
        ...prev,
        [key]: (child.settings?.[key] ?? defaultSettings[key])
      }));
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      // Save all settings one by one
      for (const [key, value] of Object.entries(settings)) {
        await ApiService.updateSetting(child.id, key, value);
      }
      if (onSettingsUpdate) {
        onSettingsUpdate({ ...child, settings });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Sikertelen mentés: a beállítások mentése közben hiba történt.');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Beállítások betöltése...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Button onClick={onBack} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
          <ArrowLeft className="h-4 w-4" />
          Vissza
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Szülői Beállítások
          </h1>
          <p className="text-gray-600 mt-2">{child.name} tanulási preferenciái</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" className="bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300">
            <RotateCcw className="h-4 w-4 mr-2" />
            Alaphelyzet
          </Button>
          <Button onClick={saveAllSettings} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white border-0">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Mentés
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 text-center">
          ✅ Beállítások sikeresen elmentve!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 text-center">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Játék Beállítások
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Letters Per Session */}
            <div className="space-y-2">
              <Label htmlFor="letters-per-session">Párok száma a Párosítsd játékban (egykörös)</Label>
              <div className="text-sm text-gray-500 mb-2">
                Hány pár jelenjen meg egyszerre a párosító játékban
              </div>
              <Select 
                value={(settings.letters_per_session ?? 9).toString()} 
                onValueChange={(value) => handleSettingChange('letters_per_session', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 pár</SelectItem>
                  <SelectItem value="9">9 pár</SelectItem>
                  <SelectItem value="12">12 pár</SelectItem>
                  <SelectItem value="15">15 pár</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Nehézségi szint</Label>
              <div className="text-sm text-gray-500 mb-2">
                Hány betű közül kell választani a Keresd/Rajzold játékban
              </div>
              <Select 
                value={settings.difficulty} 
                onValueChange={(value) => handleSettingChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Könnyű</SelectItem>
                  <SelectItem value="Medium">Közepes</SelectItem>
                  <SelectItem value="Hard">Nehéz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Letter Case */}
            <div className="space-y-2">
              <Label htmlFor="letter-case">Betű típus</Label>
              <Select 
                value={settings.letter_case} 
                onValueChange={(value) => handleSettingChange('letter_case', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowercase">Kisbetűk</SelectItem>
                  <SelectItem value="uppercase">Nagybetűk</SelectItem>
                  <SelectItem value="titlecase">Címbetűk</SelectItem>
                  <SelectItem value="mixed">Vegyes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Foreign Letters */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="foreign-letters">Idegen betűk (q, w, x, y)</Label>
                <div className="text-sm text-gray-500">
                  Tartalmazza az angol ábécé betűit is
                </div>
              </div>
              <Switch
                id="foreign-letters"
                checked={!!settings.include_foreign_letters}
                onCheckedChange={(checked) => handleSettingChange('include_foreign_letters', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio & Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              Audio és Vizuális
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sound Enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                {settings.sound_enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <div>
                  <Label htmlFor="sound-enabled">Hangok engedélyezése</Label>
                  <div className="text-sm text-gray-500">
                    Hang effektek és betű kiejtés
                  </div>
                </div>
              </div>
              <Switch
                id="sound-enabled"
                checked={!!settings.sound_enabled}
                onCheckedChange={(checked) => handleSettingChange('sound_enabled', checked)}
              />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <div>
                  <Label htmlFor="high-contrast">Nagy kontraszt mód</Label>
                  <div className="text-sm text-gray-500">
                    Jobb láthatóság érdekében
                  </div>
                </div>
              </div>
              <Switch
                id="high-contrast"
                checked={!!settings.high_contrast}
                onCheckedChange={(checked) => handleSettingChange('high_contrast', checked)}
              />
            </div>

            {/* Matricák engedélyezése */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Award className="h-4 w-4" />
                <div>
                  <Label htmlFor="stickers-enabled">Matricák engedélyezése</Label>
                  <div className="text-sm text-gray-500">
                    Jutalom matricák megjelenítése és kiosztása
                  </div>
                </div>
              </div>
              <Switch
                id="stickers-enabled"
                checked={!!settings.stickers_enabled}
                onCheckedChange={(checked) => handleSettingChange('stickers_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievement Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Teljesítmény és Jutalmak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Matrica jutalom határértékek</Label>
              <div className="text-sm text-gray-500 mb-4">
                Adja meg, hány helyes válasz után kapjon matricát a gyerek
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(settings.streak_thresholds || [3,5,10]).map((threshold, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`threshold-${index}`}>
                      {index === 0 ? 'Első matrica' : index === 1 ? 'Második matrica' : 'Harmadik matrica'}
                    </Label>
                    <Input
                      id={`threshold-${index}`}
                      type="number"
                      min="1"
                      max="50"
                      value={threshold}
                      onChange={(e) => handleThresholdChange(index, e.target.value)}
                      className="text-center"
                    />
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {threshold} helyes válasz
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* További matricák */}
                <div className="space-y-2">
                  <Label htmlFor="additional-sticker-interval">További matricák</Label>
                  <Input
                    id="additional-sticker-interval"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.additional_sticker_interval ?? 5}
                    onChange={(e) => handleSettingChange('additional_sticker_interval', parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <div className="text-xs text-gray-500 text-center">10 után ennyi helyesenként ad új matricát (0 = kikapcsolva)</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mt-4 flex gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-700" />
                <p className="text-sm text-blue-800">
                  💡 Tipp: A 10. sorozat után a rendszer a megadott gyakorisággal ad további matricákat. 20 matrica után a kiosztás esélye matricánként 1%-kal csökken.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings Summary */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Aktuális beállítások áttekintése</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-600">{settings.letters_per_session}</div>
              <div className="text-gray-600">Párok / kör</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{settings.difficulty}</div>
              <div className="text-gray-600">Nehézség</div>
            </div>
            <div>
              <div className="font-semibold text-purple-600">
                {settings.sound_enabled ? 'Bekapcsolva' : 'Kikapcsolva'}
              </div>
              <div className="text-gray-600">Hangok</div>
            </div>
            <div>
              <div className="font-semibold text-orange-600">
                {(settings.streak_thresholds || []).join(', ')} | +{settings.additional_sticker_interval || 0}
              </div>
              <div className="text-gray-600">Matrica jutalmak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentalSettings;