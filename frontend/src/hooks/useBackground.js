import { useState, useEffect, useRef } from 'react';
import backgroundService from '../services/BackgroundService';

export const useBackground = (shouldChangeOnMount = true) => {
  const [currentBackground, setCurrentBackground] = useState(backgroundService.getCurrentBackground());
  const hasChangedOnMount = useRef(false);

  useEffect(() => {
    // Subscribe to background changes
    const unsubscribe = backgroundService.subscribe((newBackground) => {
      setCurrentBackground(newBackground);
    });

    // Change background on mount (navigation)
    if (shouldChangeOnMount && !hasChangedOnMount.current) {
      backgroundService.changeBackground();
      hasChangedOnMount.current = true;
    }

    return unsubscribe;
  }, [shouldChangeOnMount]);

  return {
    currentBackground,
    changeBackground: () => backgroundService.changeBackground()
  };
};