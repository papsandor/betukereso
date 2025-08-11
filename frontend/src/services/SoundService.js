// Free sound service for Betűkereső app using Web Audio API
class SoundService {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.isEnabled = true;
    this.initAudioContext();
  }

  async initAudioContext() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Generate success sound using oscillators
  async playSuccessSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      
      // Create a cheerful success melody
      const notes = [
        { frequency: 523.25, duration: 0.15 }, // C5
        { frequency: 659.25, duration: 0.15 }, // E5
        { frequency: 783.99, duration: 0.3 }   // G5
      ];
      
      let time = this.audioContext.currentTime;
      
      notes.forEach((note, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, time);
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.3, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
        
        oscillator.start(time);
        oscillator.stop(time + note.duration);
        
        time += note.duration * 0.8; // Slight overlap
      });
      
    } catch (error) {
      console.warn('Error playing success sound:', error);
    }
  }

  // Generate error sound
  async playErrorSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      
      // Create a gentle "try again" sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime); // E4
      oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.5); // A3
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.warn('Error playing error sound:', error);
    }
  }

  // Generate sticker reward sound
  async playStickerSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      
      // Create an exciting reward fanfare
      const notes = [
        { frequency: 523.25, duration: 0.2 }, // C5
        { frequency: 659.25, duration: 0.2 }, // E5
        { frequency: 783.99, duration: 0.2 }, // G5
        { frequency: 1046.5, duration: 0.4 }  // C6
      ];
      
      let time = this.audioContext.currentTime;
      
      notes.forEach((note) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.frequency, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.4, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
        
        oscillator.start(time);
        oscillator.stop(time + note.duration);
        
        time += note.duration * 0.6;
      });
      
    } catch (error) {
      console.warn('Error playing sticker sound:', error);
    }
  }

  // Generate letter pronunciation sound (simplified phonetic)
  async playLetterSound(grapheme) {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      
      // Basic phonetic mapping to frequencies
      const phoneticMap = {
        'a': [800, 1200], 'á': [850, 1250], 'e': [500, 2300], 'é': [550, 2350],
        'i': [300, 2500], 'í': [350, 2550], 'o': [500, 900], 'ó': [550, 950],
        'u': [300, 600], 'ú': [350, 650], 'ö': [450, 1100], 'ő': [500, 1150],
        'ü': [300, 1600], 'ű': [350, 1650]
      };
      
      const frequencies = phoneticMap[grapheme.toLowerCase()] || [440, 880];
      const duration = 0.6;
      
      // Create formant synthesis for vowel-like sounds
      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        const volume = index === 0 ? 0.15 : 0.1;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + duration - 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
      });
      
    } catch (error) {
      console.warn('Error playing letter sound:', error);
    }
  }

  // Play game mode transition sound
  async playTransitionSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.audioContext.resume();
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
      
    } catch (error) {
      console.warn('Error playing transition sound:', error);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  isAudioEnabled() {
    return this.isEnabled && this.audioContext && this.audioContext.state !== 'closed';
  }
}

// Create singleton instance
const soundService = new SoundService();

export default soundService;