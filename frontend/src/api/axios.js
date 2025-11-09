import axios from "axios";

// Centralizo la configuración de Axios para reutilizar la baseURL en todos los servicios.
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});
