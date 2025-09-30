import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Optionally, auto-redirect:
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post("/users/register", data),
  login: (data) => api.post("/users/login", data),
  me: () => api.get("/users/profile"),
};

export const usersApi = {
  updateProfile: (data) => api.put("/users/profile", data),
  setStatus: (status) => api.put("/users/status", { status }),
  nearby: (params) => api.get("/users/nearby", { params }),
};

export const connectionsApi = {
  sendRequest: (receiverId) => api.post("/connections/request", { receiverId }),
  respondRequest: ({ requestId, action }) =>
    api.post("/connections/respond", { requestId, action }),
  listRequests: () => api.get("/connections/requests"),
  listConnections: () => api.get("/connections"),
};

export default api;
