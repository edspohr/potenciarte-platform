import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      console.log(`🔑 Attaching token for user: ${user.email}`); // Debug Log
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  } else {
    console.warn('⚠️ No user found in Auth module, request sent without token');
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
