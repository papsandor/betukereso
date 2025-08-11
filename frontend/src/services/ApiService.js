import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API service for Betűkereső app
class ApiService {
  // Children endpoints
  static async getChildren() {
    try {
      const response = await axios.get(`${API}/children/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  }

  static async createChild(name) {
    try {
      const response = await axios.post(`${API}/children/`, { name });
      return response.data;
    } catch (error) {
      console.error('Error creating child:', error);
      throw error;
    }
  }

  static async deleteChild(childId) {
    try {
      await axios.delete(`${API}/children/${childId}`);
      return true;
    } catch (error) {
      console.error('Error deleting child:', error);
      throw error;
    }
  }

  static async getChild(childId) {
    try {
      const response = await axios.get(`${API}/children/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching child:', error);
      throw error;
    }
  }

  static async updateChild(childId, updateData) {
    try {
      const response = await axios.put(`${API}/children/${childId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    }
  }

  // Game progress endpoints
  static async recordProgress(childId, gameData) {
    try {
      const response = await axios.post(`${API}/children/${childId}/progress`, gameData);
      return response.data;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  }

  static async getChildStickers(childId) {
    try {
      const response = await axios.get(`${API}/children/${childId}/stickers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stickers:', error);
      throw error;
    }
  }

  // Settings endpoints
  static async updateSetting(childId, key, value) {
    try {
      const response = await axios.put(`${API}/children/${childId}/settings`, null, {
        params: { key, value }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  // Game data endpoints
  static async getGraphemes() {
    try {
      const response = await axios.get(`${API}/game/graphemes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching graphemes:', error);
      throw error;
    }
  }

  static async getRandomGraphemes(count = 9, includeForeign = false, troubleBias = true) {
    try {
      const response = await axios.get(`${API}/game/graphemes/random`, {
        params: {
          count,
          include_foreign: includeForeign,
          trouble_bias: troubleBias
        }
      });
      return response.data.graphemes;
    } catch (error) {
      console.error('Error fetching random graphemes:', error);
      throw error;
    }
  }

  static async getGraphemeAudio(grapheme) {
    try {
      const response = await axios.get(`${API}/game/audio/${grapheme}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching grapheme audio:', error);
      throw error;
    }
  }
}

// Helper functions for grapheme case handling
export const getGraphemeCase = (grapheme, caseType) => {
  switch (caseType) {
    case "uppercase":
      return grapheme.toUpperCase();
    case "titlecase":
      return grapheme.charAt(0).toUpperCase() + grapheme.slice(1).toLowerCase();
    case "lowercase":
    default:
      return grapheme.toLowerCase();
  }
};

export const generateSessionSeed = (childName) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${date}_${childName}`;
};

export default ApiService;