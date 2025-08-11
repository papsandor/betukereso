import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  Search, 
  PenTool, 
  ArrowLeftRight, 
  Eye, 
  Settings, 
  Volume2, 
  VolumeX,
  User,
  Award,
  Star
} from 'lucide-react';

const GameModeSelector = ({ 
  child, 
  onModeSelect, 
  onSettingsOpen, 
  onStickerBookOpen,
  onChildChange,
  soundEnabled,
  onSoundToggle 
}) => {
  const gameModes = [
    {
      id: 'find-letter',
      title: 'Keresd',
      description: 'Találd meg a helyes betűt!',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600',
      difficulty: 'Könnyű'
    },
    {
      id: 'trace-letter', 
      title: 'Rajzold',
      description: 'Rajzold le a betűt!',
      icon: PenTool,
      color: 'bg-green-500 hover:bg-green-600',
      difficulty: 'Közepes'
    },
    {
      id: 'match-case',
      title: 'Párosítsd', 
      description: 'Párosítsd a kis és nagy betűket!',
      icon: ArrowLeftRight,
      color: 'bg-orange-500 hover:bg-orange-600',
      difficulty: 'Nehéz'
    },
    {
      id: 'show-mark',
      title: 'Mutasd & Jelöld',
      description: 'Tanár mód - mutasd és jelöld!',
      icon: Eye,
      color: 'bg-purple-500 hover:bg-purple-600',
      difficulty: 'Tanár'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header with child info and controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={onChildChange}
            className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 border-0"
          >
            <User className="h-4 w-4" />
            Gyerek váltása
          </Button>
          
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">{child.name}</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {child.streak} sorozat
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {child.total_stickers} matrica
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={onStickerBookOpen}
            className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-0"
          >
            <Award className="h-4 w-4" />
            Matrica Gyűjtemény
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hang nélkül játszom</span>
            <Switch 
              checked={!soundEnabled}
              onCheckedChange={() => onSoundToggle(!soundEnabled)}
            />
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </div>
          
          <Button
            onClick={onSettingsOpen}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
          >
            <Settings className="h-4 w-4" />
            Beállítások
          </Button>
        </div>
      </div>

      {/* Game Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {gameModes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <Card 
              key={mode.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 group"
              onClick={() => onModeSelect(mode.id)}
            >
              <CardHeader className="text-center pb-3">
                <div className={`mx-auto w-16 h-16 rounded-full ${mode.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">{mode.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <p className="text-gray-600 text-sm">{mode.description}</p>
                <Badge variant="outline" className="text-xs">
                  {mode.difficulty}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Haladás</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{Object.keys(child.progress || {}).length}</div>
              <div className="text-sm text-gray-600">Tanult betűk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{child.streak}</div>
              <div className="text-sm text-gray-600">Jelenlegi sorozat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{child.total_stickers}</div>
              <div className="text-sm text-gray-600">Összegyűjtött matricák</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(child.progress).reduce((sum, p) => sum + p.stars, 0)}
              </div>
              <div className="text-sm text-gray-600">Összes csillag</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameModeSelector;