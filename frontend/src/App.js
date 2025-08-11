import React, { useState, useEffect } from 'react';
import './App.css';
import ChildSelector from './components/ChildSelector';
import GameModeSelector from './components/GameModeSelector';
import FindLetterGame from './components/FindLetterGame';
import { mockSettings } from './data/mock';

function App() {
  const [currentChild, setCurrentChild] = useState(null);
  const [currentGameMode, setCurrentGameMode] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(mockSettings.soundEnabled);
  const [showSettings, setShowSettings] = useState(false);

  // Game progress handler
  const handleProgress = (grapheme, isCorrect) => {
    console.log(`Child ${currentChild.name} ${isCorrect ? 'correctly' : 'incorrectly'} identified: ${grapheme}`);
    // This would update the child's progress in the backend
  };

  const handleModeSelect = (modeId) => {
    setCurrentGameMode(modeId);
  };

  const handleBackToModes = () => {
    setCurrentGameMode(null);
  };

  const handleBackToChildren = () => {
    setCurrentChild(null);
    setCurrentGameMode(null);
  };

  const renderCurrentScreen = () => {
    if (!currentChild) {
      return (
        <ChildSelector 
          onChildSelect={setCurrentChild}
          currentChild={currentChild}
        />
      );
    }

    if (currentGameMode === 'find-letter') {
      return (
        <FindLetterGame
          child={currentChild}
          onBack={handleBackToModes}
          onProgress={handleProgress}
          soundEnabled={soundEnabled}
        />
      );
    }

    if (currentGameMode === 'trace-letter') {
      return (
        <div className="w-full max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Rajzold le a betűt!</h2>
          <p className="text-gray-600 mb-8">Ez a játékmód hamarosan elérhető lesz...</p>
          <button 
            onClick={handleBackToModes}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Vissza a játékmódokhoz
          </button>
        </div>
      );
    }

    if (currentGameMode === 'match-case') {
      return (
        <div className="w-full max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Párosítsd a betűket!</h2>
          <p className="text-gray-600 mb-8">Ez a játékmód hamarosan elérhető lesz...</p>
          <button 
            onClick={handleBackToModes}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Vissza a játékmódokhoz
          </button>
        </div>
      );
    }

    if (currentGameMode === 'show-mark') {
      return (
        <div className="w-full max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Mutasd & Jelöld - Tanár mód</h2>
          <p className="text-gray-600 mb-8">Ez a játékmód hamarosan elérhető lesz...</p>
          <button 
            onClick={handleBackToModes}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Vissza a játékmódokhoz
          </button>
        </div>
      );
    }

    return (
      <GameModeSelector
        child={currentChild}
        onModeSelect={handleModeSelect}
        onSettingsOpen={() => setShowSettings(true)}
        onChildChange={handleBackToChildren}
        soundEnabled={soundEnabled}
        onSoundToggle={setSoundEnabled}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;