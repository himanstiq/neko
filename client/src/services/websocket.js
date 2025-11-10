const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 1000;
    this.maxReconnectInterval = 30000;
    this.messageHandlers = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.heartbeatInterval = null;
    this.connectionStateListeners = new Set();
  }

  connect(token) {
    if (this.isConnecting || this.isConnected) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    if (!token) {
      console.error("No token provided for WebSocket connection");
      return;
    }

    this.shouldReconnect = true;
    this.isConnecting = true;
    this.notifyConnectionState("connecting");

    const wsUrl = `${WS_URL}?token=${token}`;
    console.log("Connecting to WebSocket:", wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionState("connected");

        this.flushMessageQueue();
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.notifyConnectionState("error");
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.notifyConnectionState("disconnected");

        if (this.shouldReconnect && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.isConnecting = false;
      this.notifyConnectionState("error");
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.notifyConnectionState("disconnected");
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      this.notifyConnectionState("failed");
      return;
    }

    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectInterval
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${
        this.maxReconnectAttempts
      })`
    );

    this.reconnectAttempts++;
    this.notifyConnectionState("reconnecting", {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      const token = localStorage.getItem("token");
      if (token) {
        this.connect(token);
      } else {
        console.error("No token available for reconnection");
      }
    }, delay);
  }

  send(message) {
    if (!this.isConnected || !this.ws) {
      console.warn("WebSocket not connected, queuing message");
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      this.messageQueue.push(message);
      return false;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  handleMessage(message) {
    const { type } = message;

    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
        }
      });
    }

    const allHandlers = this.messageHandlers.get("*");
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("Error in wildcard message handler:", error);
        }
      });
    }
  }

  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType).add(handler);

    return () => {
      this.off(messageType, handler);
    };
  }

  off(messageType, handler) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(messageType);
      }
    }
  }

  onConnectionStateChange(listener) {
    this.connectionStateListeners.add(listener);
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }

  notifyConnectionState(state, data = {}) {
    this.connectionStateListeners.forEach((listener) => {
      try {
        listener(state, data);
      } catch (error) {
        console.error("Error in connection state listener:", error);
      }
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: "ping" });
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getConnectionState() {
    if (this.isConnected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }
}

export default new WebSocketService();
