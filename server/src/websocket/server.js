import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";
import Room from "../models/Room.js";
import { verifyToken } from "../utils/jwt.js";
import logger from "../utils/logger.js";
import { handleMessage } from "./messageHandler.js";

class SignalingServer {
  constructor(server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    this.clients = new Map();
    this.userConnections = new Map();
    this.rooms = new Map();

    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on("connection", (ws, req) => {
      logger.info("New WebSocket connection attempt");

      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        logger.warn("WebSocket connection rejected: No token provided");
        ws.close(1008, "Authentication required");
        return;
      }

      try {
        const decoded = verifyToken(token);
        const connectionId = this.generateConnectionId();

        const client = {
          ws,
          userId: decoded.id,
          roomId: null,
          username: null,
          connectionId,
        };

        this.clients.set(connectionId, client);

        if (!this.userConnections.has(client.userId)) {
          this.userConnections.set(client.userId, new Set());
        }
        this.userConnections.get(client.userId).add(connectionId);

        logger.info("WebSocket authenticated", {
          userId: decoded.id,
          connectionId,
        });

        ws.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(client, message);
          } catch (error) {
            logger.error("Error parsing message", { error: error.message });
            this.sendError(ws, "Invalid message format");
          }
        });

        ws.on("close", () => {
          this.handleDisconnect(client).catch((error) => {
            logger.error("WebSocket disconnect handler error", {
              userId: client.userId,
              connectionId: client.connectionId,
              error: error.message,
            });
          });
        });

        ws.on("error", (error) => {
          logger.error("WebSocket error", {
            userId: client.userId,
            connectionId: client.connectionId,
            error: error.message,
          });
        });

        this.send(ws, {
          type: "connected",
          userId: decoded.id,
          connectionId,
        });
      } catch (error) {
        logger.warn("WebSocket authentication failed", {
          error: error.message,
        });
        ws.close(1008, "Invalid token");
      }
    });

    logger.info("WebSocket signaling server initialized");
  }

  handleMessage(client, message) {
    const correlationId = message.correlationId || this.generateCorrelationId();

    logger.debug("Received message", {
      type: message.type,
      userId: client.userId,
      connectionId: client.connectionId,
      roomId: client.roomId,
      correlationId,
    });

    handleMessage(this, client, message, correlationId);
  }

  async handleDisconnect(client) {
    if (client.roomId) {
      await this.leaveRoom(client);
    }

    this.clients.delete(client.connectionId);

    const connections = this.userConnections.get(client.userId);
    if (connections) {
      connections.delete(client.connectionId);
      if (connections.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }

    logger.info("Client disconnected", {
      userId: client.userId,
      username: client.username,
      connectionId: client.connectionId,
    });
  }

  async leaveRoom(client, { notifyClient = false, correlationId = null } = {}) {
    if (!client.roomId) return;

    const roomId = client.roomId;
    const roomConnections = this.rooms.get(roomId);

    if (roomConnections) {
      roomConnections.delete(client.connectionId);

      if (roomConnections.size === 0) {
        this.rooms.delete(roomId);
        logger.info("Room closed (empty)", { roomId });
      } else {
        this.broadcastToRoom(
          roomId,
          {
            type: "user-left",
            userId: client.userId,
            username: client.username,
            connectionId: client.connectionId,
            correlationId,
          },
          client.connectionId
        );
      }
    }

    try {
      await this.updateRoomOnLeave(roomId, client);
    } catch (error) {
      logger.error("Room leave persistence error", {
        roomId,
        userId: client.userId,
        connectionId: client.connectionId,
        error: error.message,
      });
    }

    client.roomId = null;

    if (notifyClient) {
      this.send(client.ws, {
        type: "room-left",
        roomId,
        connectionId: client.connectionId,
        correlationId,
      });
    }
  }

  send(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, message, correlationId = null) {
    this.send(ws, {
      type: "error",
      message,
      correlationId,
    });
  }

  broadcastToRoom(roomId, message, excludeConnectionId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach((connectionId) => {
      if (connectionId !== excludeConnectionId) {
        const client = this.clients.get(connectionId);
        if (client) {
          this.send(client.ws, message);
        }
      }
    });
  }

  sendToUser(userId, message) {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    connections.forEach((connectionId) => {
      const client = this.clients.get(connectionId);
      if (client) {
        this.send(client.ws, message);
      }
    });
  }

  sendToConnection(connectionId, message) {
    const client = this.clients.get(connectionId);
    if (client) {
      this.send(client.ws, message);
    }
  }

  getRoomParticipants(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room)
      .map((connectionId) => {
        const client = this.clients.get(connectionId);
        if (!client) return null;

        return {
          connectionId,
          userId: client.userId,
          username: client.username,
        };
      })
      .filter(Boolean);
  }

  getUniqueRoomUsers(roomId) {
    const participants = this.getRoomParticipants(roomId);
    const unique = new Map();

    participants.forEach((participant) => {
      if (!unique.has(participant.userId)) {
        unique.set(participant.userId, participant);
      }
    });

    return Array.from(unique.values());
  }

  getUniqueRoomUserCount(roomId) {
    return this.getUniqueRoomUsers(roomId).length;
  }

  assignClientToRoom(client, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const roomConnections = this.rooms.get(roomId);
    roomConnections.add(client.connectionId);
    client.roomId = roomId;
  }

  async registerRoomJoin(roomDoc, client) {
    this.assignClientToRoom(client, roomDoc.roomId);

    roomDoc.participants.push({
      userId: client.userId,
      connectionId: client.connectionId,
      joinedAt: new Date(),
    });

    roomDoc.currentParticipants = this.getUniqueRoomUserCount(roomDoc.roomId);

    await roomDoc.save();
  }

  async updateRoomOnLeave(roomId, client) {
    const roomDoc = await Room.findOne({ roomId });
    if (!roomDoc) {
      logger.warn("Room document not found during leave", {
        roomId,
        userId: client.userId,
        connectionId: client.connectionId,
      });
      return;
    }

    const participant = roomDoc.participants
      .slice()
      .reverse()
      .find((entry) => {
        if (entry.connectionId) {
          return entry.connectionId === client.connectionId && !entry.leftAt;
        }

        return entry.userId?.toString() === client.userId && !entry.leftAt;
      });

    if (participant && !participant.leftAt) {
      participant.leftAt = new Date();
      participant.duration = Math.max(
        0,
        Math.floor((participant.leftAt - participant.joinedAt) / 1000)
      );
    }

    roomDoc.currentParticipants = this.getUniqueRoomUserCount(roomId);

    await roomDoc.save();
  }

  generateCorrelationId() {
    return randomUUID();
  }

  generateConnectionId() {
    return randomUUID();
  }
}

export default SignalingServer;
