// Free sound service for Betűkereső app
// Provides basic success/error tones and letter pronunciation helpers

class SoundService {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.isEnabled = true;
    // External letter snippet caches and mappings
    this.letterAudioMapLower = new Map(); // lower-case grapheme -> url
    this.letterAudioMapUpper = new Map(); // UPPER-CASE grapheme -> url
    this.audioTagCache = new Map(); // url -> HTMLAudioElement
    this.initAudioContext();

    this._normalize = (s) => (s == null ? '' : String(s).trim().normalize('NFC'));
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  initAudioContext() {
    try {
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) {
      console.warn('AudioContext init failed:', e);
      this.audioContext = null;
    }
  }

  // Basic beep helpers
  playSuccessSound() {
    if (!this.isEnabled || !this.audioContext) return;
    const duration = 0.15;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playErrorSound() {
    if (!this.isEnabled || !this.audioContext) return;
    const duration = 0.2;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playStickerSound() {
    if (!this.isEnabled || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Smooth, short transition cue between screens
  playTransitionSound() {
    if (!this.isEnabled || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Register external snippet url for a LOWERCASE grapheme
  registerLetterSnippet(graphemeLower, url) {
    if (!graphemeLower || !url) return;
    const key = this._normalize(String(graphemeLower)).toLowerCase();
    this.letterAudioMapLower.set(key, url);
  }

  // Register external snippet url for an UPPERCASE grapheme (stored as fully UPPER key)
  registerUpperLetterSnippet(graphemeUpper, url) {
    if (!graphemeUpper || !url) return;
    const key = this._normalize(String(graphemeUpper)).toUpperCase();
    this.letterAudioMapUpper.set(key, url);
  }

  // Internal: get cached audio element for a url
  _getAudioTag(url) {
    if (!this.audioTagCache.has(url)) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      this.audioTagCache.set(url, audio);
    }
    const el = this.audioTagCache.get(url);
    try { el.pause(); el.currentTime = 0; } catch {}
    return el;
  }

  // Determine if the provided grapheme string should use uppercase mapping
  _shouldUseUppercase(input) {
    if (!input) return false;
    const str = String(input);
    // If any uppercase letters present (incl. accented), or fully upper, treat as upper
    const hasUpper = /[A-ZÁÉÍÓÖŐÚÜŰ]/.test(str);
    const notAllLower = str !== str.toLowerCase();
    return hasUpper || notAllLower;
  }

  async playLetterSound(graphemeOrDisplay) {
    if (!this.isEnabled) return;

    const raw = String(graphemeOrDisplay || '');
    const useUpper = this._shouldUseUppercase(raw);
    const lowerKey = this._normalize(raw).toLowerCase();
    const upperKey = this._normalize(raw).toUpperCase();

    // Prefer uploaded snippet (upper or lower depending on display)
    let url = useUpper 
      ? this.letterAudioMapUpper.get(upperKey)
      : this.letterAudioMapLower.get(lowerKey);

    // Fallbacks for multi-char graphemes (Titlecase vs Uppercase)
    if (!url && useUpper) {
      // Try Titlecase key (e.g., 'Cs', 'Gy', 'Ny', 'Sz', 'Ty', 'Zs') if app passes Titlecase
      const titleKey = this._normalize(raw).replace(/^[a-záéíóöőúüű]/i, (m) => m.toUpperCase());
      url = this.letterAudioMapUpper.get(titleKey.toUpperCase());
    }

    if (url) {
      try {
        const audioEl = this._getAudioTag(url);
        await audioEl.play();
        return;
      } catch (e) {
        console.warn('Fallback to synthetic voice, failed to play snippet:', e);
      }
    }

    // Fallback to synthetic tone if no snippet
    if (!this.audioContext) return;
    try {
      await this.audioContext.resume();
      const phoneticMap = {
        'a': [800, 1200], 'á': [850, 1250], 'e': [500, 2300], 'é': [550, 2350],
        'i': [300, 2500], 'í': [350, 2550], 'o': [500, 900], 'ó': [550, 950],
        'u': [300, 600], 'ú': [350, 650], 'ö': [450, 1100], 'ő': [500, 1150],
        'ü': [300, 1600], 'ű': [350, 1650]
      };
      const base = lowerKey;
      const frequencies = phoneticMap[base] || [440, 880];
      const duration = 0.6;
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
}

let soundService = null;
if (!soundService) soundService = new SoundService();

export default soundService;