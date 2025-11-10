const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request("/auth/me");
  }

  async refreshToken(refreshToken) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async createRoom(roomData) {
    return this.request("/rooms", {
      method: "POST",
      body: JSON.stringify(roomData),
    });
  }

  async getRooms(query = {}) {
    const params = new URLSearchParams(query).toString();
    return this.request(`/rooms${params ? `?${params}` : ""}`);
  }

  async getRoomById(roomId) {
    return this.request(`/rooms/${roomId}`);
  }

  async validateRoomAccess(roomId, accessToken) {
    return this.request(`/rooms/${roomId}/validate`, {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    });
  }

  async deleteRoom(roomId) {
    return this.request(`/rooms/${roomId}`, {
      method: "DELETE",
    });
  }
}

export default new ApiService();
