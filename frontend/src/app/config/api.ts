import { Capacitor } from '@capacitor/core';

// L'APK parle à l'API distante ; le navigateur de développement garde l'API locale.
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://daily-note-cs.onrender.com/api'
  : 'http://localhost:3000/api';
