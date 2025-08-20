// src/api/axios.js
import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, 
});

API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});