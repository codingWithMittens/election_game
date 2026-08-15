import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateGameResponse {
  gameId: string;
  gameCode: string;
  playerId: string;
}

export interface JoinGameResponse {
  gameId: string;
  playerId: string;
}

export const createGame = async (playerName: string): Promise<CreateGameResponse> => {
  const response = await api.post('/games/create', { playerName });
  return response.data;
};

export const joinGame = async (gameCode: string, playerName: string): Promise<JoinGameResponse> => {
  const response = await api.post('/games/join', { gameCode, playerName });
  return response.data;
};

export const getGame = async (gameId: string) => {
  const response = await api.get(`/games/${gameId}`);
  return response.data;
};

export default api;
