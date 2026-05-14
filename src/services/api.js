import axios from 'axios';

const API_URL = 'https://admin.vinayak-associates.com/backend/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Assuming Bearer token is needed
      config.headers.token = token; // some apis expect it in token header
    }
  }
  return config;
});

export const loginAPI = async (username, password) => {
  try {
    const response = await apiClient.post('/loginForWebInventory', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('An error occurred during login. Please ensure the backend is running.');
  }
};

export const fetchYards = async () => {
  try {
    const response = await apiClient.get('/getYard');
    return response.data.yards || [];
  } catch (error) {
    console.error("Error fetching yards", error);
    return [];
  }
};

export const fetchBanks = async () => {
  try {
    const response = await apiClient.get('/get-bank-by-staff');
    return response.data.banks || [];
  } catch (error) {
    console.error("Error fetching banks", error);
    return [];
  }
};

export const fetchInventory = async (params) => {
  try {
    const response = await apiClient.get('/getInventory', { params });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching inventory", error);
    return [];
  }
};

export const generateInventoryPdf = async (regNo, inventoryId) => {
  try {
    const response = await apiClient.get('/generatePdf', {
      params: { regNo, inventoryId }
    });
    const fileName = response.data.fileName;
    return `https://admin.vinayak-associates.com/backend/uploads/${fileName}`;
  } catch (error) {
    console.error("Error generating PDF", error);
    throw error;
  }
};

