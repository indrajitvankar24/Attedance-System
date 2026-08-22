import axios from "axios";

// Base URL of the Flask backend. Update this (or use REACT_APP_API_URL)
// if you deploy the API somewhere other than localhost.
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT (if we have one) to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("mis_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear it and bounce to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("mis_token");
      localStorage.removeItem("mis_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
