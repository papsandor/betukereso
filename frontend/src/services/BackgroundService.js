class BackgroundService {
  constructor() {
    this.backgrounds = [
      'https://customer-assets.emergentagent.com/job_litkids/artifacts/xnke5eg5_ChatGPT%20Image%202025.%20szept.%202.%2021_16_10.png',
      'https://customer-assets.emergentagent.com/job_litkids/artifacts/jol2dcum_ChatGPT%20Image%202025.%20szept.%202.%2021_16_16.png',
      'https://customer-assets.emergentagent.com/job_litkids/artifacts/4n7vk9er_ChatGPT%20Image%202025.%20szept.%202.%2021_18_14.png',
      'https://customer-assets.emergentagent.com/job_litkids/artifacts/y0wmzldb_ChatGPT%20Image%202025.%20szept.%202.%2021_49_30.png',
      'https://customer-assets.emergentagent.com/job_litkids/artifacts/7mo2y790_ChatGPT%20Image%202025.%20szept.%203.%2010_27_43.png'
    ];
    
    this.usedBackgrounds = new Set();
    this.currentBackground = null;
    this.listeners = new Set();

    // Preload all background images
    this.preloadBackgrounds();
  }

  preloadBackgrounds() {
    this.backgrounds.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  getNextBackground() {
    // If all backgrounds have been used, reset the set
    if (this.usedBackgrounds.size >= this.backgrounds.length) {
      this.usedBackgrounds = new Set();
    }

    // Get available backgrounds (not yet used)
    const availableBackgrounds = this.backgrounds.filter(bg => !this.usedBackgrounds.has(bg));
    
    // Pick a random one from available
    const randomIndex = Math.floor(Math.random() * availableBackgrounds.length);
    const selectedBackground = availableBackgrounds[randomIndex];
    
    // Mark as used
    this.usedBackgrounds.add(selectedBackground);
    this.currentBackground = selectedBackground;
    
    // Notify listeners
    this.notifyListeners();
    
    return selectedBackground;
  }

  getCurrentBackground() {
    return this.currentBackground;
  }

  // Subscribe to background changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentBackground));
  }

  // Force background change (for navigation)
  changeBackground() {
    return this.getNextBackground();
  }
}

// Export singleton instance
const backgroundService = new BackgroundService();
export default backgroundService;