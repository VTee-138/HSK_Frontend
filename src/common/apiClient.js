import axios from "axios";
import { checkJwtExistsAndExpired } from "../services/AuthService";
//import { REACT_APP_API_BASE_URL } from "../config/env";

// const REACT_APP_API_BASE_URL = "https://86HSK-server.vercel.app/api/v2";
const REACT_APP_API_BASE_URL = "https://backend.tiengtrung86hsk.com/api/v2";
// const REACT_APP_API_BASE_URL = "https://api.86HSK.edu.vn/api/v2";
// Tạo instance Axios
const apiClient = axios.create({
  baseURL: REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const jwt1 = JSON.parse(jwt);
      config.headers["Authorization"] = `Bearer ${jwt1.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const auth = checkJwtExistsAndExpired();
      //   // Xử lý lỗi 401, 403, 500, v.v.
      if (error.response.status === 401) {
        if (!auth) {
          // Ví dụ: redirect đến trang login
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Các hàm HTTP tiện dụng
export const get = (url, config = {}) => apiClient.get(url, config);
export const post = (url, data, config = {}) => apiClient.post(url, data, config);
export const put = (url, data, config = {}) => apiClient.put(url, data, config);
export const del = (url, config = {}) => apiClient.delete(url, config);
export const patch = (url, data, config = {}) => apiClient.patch(url, data, config);

export default apiClient;
