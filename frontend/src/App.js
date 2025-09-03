import React, { useState, useEffect } from 'react';
import './App.css';
import ChildSelector from './components/ChildSelector';
import MainMenu from './components/MainMenu';
import FindLetterGame from './components/FindLetterGame';
import TraceLetterGame from './components/TraceLetterGame';
import MatchCaseGame from './components/MatchCaseGame';
import ShowMarkGame from './components/ShowMarkGame';
import StickerBook from './components/StickerBook';
import ParentalSettings from './components/ParentalSettings';
import StickerReward from './components/StickerReward';
import soundService from './services/SoundService';
import { useBackground } from './hooks/useBackground';

function App() {
  const [currentChild, setCurrentChild] = useState(null);
  const [currentGameMode, setCurrentGameMode] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showChildSelector, setShowChildSelector] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [pendingSticker, setPendingSticker] = useState(null);

  // Use background system (change background on screen transitions)
  const { currentBackground, changeBackground } = useBackground(true);

  useEffect(() => {
    soundService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleChildSelect = (child) => {
    setCurrentChild(child);
    if (child) {
      setShowChildSelector(false);
      soundService.playTransitionSound();
      changeBackground(); // Change background on navigation
    }
  };

  const handleModeSelect = (modeId) => {
    setCurrentGameMode(modeId);
    soundService.playTransitionSound();
    changeBackground(); // Change background on navigation
  };

  const handleBackToModes = () => {
    setCurrentGameMode(null);
    soundService.playTransitionSound();
    changeBackground(); // Change background on navigation
  };

  const handleBackToChildren = () => {
    setCurrentChild(null);
    setCurrentGameMode(null);
    setShowChildSelector(true);
    setShowSettings(false);
    setShowStickerBook(false);
    changeBackground(); // Change background on navigation
  };

  const handleSettingsOpen = () => {
    setShowSettings(true);
    // No background change for settings
  };
  
  const handleSettingsClose = () => {
    setShowSettings(false);
    changeBackground(); // Change background when returning from settings
  };
  
  const handleStickerBookOpen = () => {
    setShowStickerBook(true);
    // No background change for sticker book
  };
  
  const handleStickerBookClose = () => {
    setShowStickerBook(false);
    changeBackground(); // Change background when returning from sticker book
  };

  const handleSettingsUpdate = (updatedChild) => setCurrentChild(updatedChild);

  const handleStickerEarned = (sticker) => {
    setPendingSticker(sticker);
    soundService.playStickerSound();
  };
  const closeStickerReward = () => setPendingSticker(null);

  const renderCurrentScreen = () => {
    if (showChildSelector || !currentChild) {
      return (
        <ChildSelector 
          onChildSelect={handleChildSelect}
          currentChild={currentChild}
        />
      );
    }

    if (showSettings) {
      return (
        <ParentalSettings
          child={currentChild}
          onBack={handleSettingsClose}
          onSettingsUpdate={handleSettingsUpdate}
        />
      );
    }

    if (showStickerBook) {
      return (
        <StickerBook
          child={currentChild}
          onBack={handleStickerBookClose}
        />
      );
    }

    if (currentGameMode === 'find-letter') {
      return (
        <FindLetterGame
          child={currentChild}
          onBack={handleBackToModes}
          soundEnabled={soundEnabled}
          onStickerEarned={handleStickerEarned}
        />
      );
    }

    if (currentGameMode === 'trace-letter') {
      return (
        <TraceLetterGame
          child={currentChild}
          onBack={handleBackToModes}
          soundEnabled={soundEnabled}
          onStickerEarned={handleStickerEarned}
        />
      );
    }

    if (currentGameMode === 'match-case') {
      return (
        <MatchCaseGame
          child={currentChild}
          onBack={handleBackToModes}
          soundEnabled={soundEnabled}
          onStickerEarned={handleStickerEarned}
        />
      );
    }

    if (currentGameMode === 'show-mark') {
      return (
        <ShowMarkGame
          child={currentChild}
          onBack={handleBackToModes}
          soundEnabled={soundEnabled}
          onStickerEarned={handleStickerEarned}
        />
      );
    }

    return (
      <MainMenu
        child={currentChild}
        onStartMode={handleModeSelect}
        onOpenSettings={handleSettingsOpen}
        onOpenStickerBook={handleStickerBookOpen}
      />
    );
  };

  return (
    <div className="min-h-screen bg-ivory">
      {renderCurrentScreen()}
      {pendingSticker && (
        <StickerReward
          sticker={pendingSticker}
          onClose={closeStickerReward}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}

export default App;