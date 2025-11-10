import logger from "../utils/logger.js";
import User from "../models/User.js";
import Room from "../models/Room.js";

export async function handleMessage(server, client, message, correlationId) {
  const { type } = message;

  const handlers = {
    "join-room": handleJoinRoom,
    "leave-room": handleLeaveRoom,
    offer: handleOffer,
    answer: handleAnswer,
    "ice-candidate": handleIceCandidate,
    "screen-share-started": handleScreenShareStarted,
    "screen-share-stopped": handleScreenShareStopped,
    "chat-message": handleChatMessage,
    typing: handleTyping,
    ping: handlePing,
  };

  const handler = handlers[type];

  if (handler) {
    try {
      await handler(server, client, message, correlationId);
    } catch (error) {
      logger.error("Message handler error", {
        type,
        userId: client.userId,
        error: error.message,
        correlationId,
      });

      server.sendError(client.ws, error.message, correlationId);
    }
  } else {
    logger.warn("Unknown message type", { type, userId: client.userId });
    server.sendError(client.ws, "Unknown message type", correlationId);
  }
}

async function handleJoinRoom(server, client, message, correlationId) {
  const { roomId, username } = message;

  if (!roomId) {
    throw new Error("Room ID is required");
  }

  const room = await Room.findOne({ roomId, isActive: true });
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.currentParticipants >= room.maxParticipants) {
    throw new Error("Room is full");
  }

  const user = await User.findById(client.userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (client.roomId && client.roomId !== roomId) {
    await server.leaveRoom(client);
  }

  if (client.roomId === roomId) {
    client.username = username || user.displayName || user.username;

    const participants = server
      .getRoomParticipants(roomId)
      .filter((p) => p.connectionId !== client.connectionId);

    server.send(client.ws, {
      type: "room-joined",
      roomId,
      participants,
      correlationId,
    });

    return;
  }

  client.username = username || user.displayName || user.username;

  await server.registerRoomJoin(room, client);

  const participants = server.getRoomParticipants(roomId);

  server.send(client.ws, {
    type: "room-joined",
    roomId,
    participants: participants.filter(
      (p) => p.connectionId !== client.connectionId
    ),
    correlationId,
  });

  server.broadcastToRoom(
    roomId,
    {
      type: "user-joined",
      userId: client.userId,
      username: client.username,
      connectionId: client.connectionId,
    },
    client.connectionId
  );

  logger.info("User joined room", {
    userId: client.userId,
    username: client.username,
    roomId,
    connectionId: client.connectionId,
    participantCount: server.getUniqueRoomUserCount(roomId),
    correlationId,
  });
}

async function handleLeaveRoom(server, client, message, correlationId) {
  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  const roomId = client.roomId;
  await server.leaveRoom(client, { notifyClient: true, correlationId });

  logger.info("User left room", {
    userId: client.userId,
    username: client.username,
    roomId,
    connectionId: client.connectionId,
    correlationId,
  });
}

async function handleOffer(server, client, message, correlationId) {
  const { targetUserId, targetConnectionId, offer } = message;

  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  if (!offer) {
    throw new Error("Offer is required");
  }

  const targets = resolveTargets(server, client, {
    targetUserId,
    targetConnectionId,
  });

  if (targets.length === 0) {
    throw new Error("Target not in the same room");
  }

  targets.forEach((targetClient) => {
    server.send(targetClient.ws, {
      type: "offer",
      fromUserId: client.userId,
      fromUsername: client.username,
      fromConnectionId: client.connectionId,
      offer,
      correlationId,
    });
  });

  logger.debug("Offer relayed", {
    fromUserId: client.userId,
    fromConnectionId: client.connectionId,
    toUserId: targetUserId,
    toConnectionId: targetConnectionId,
    roomId: client.roomId,
    correlationId,
  });
}

async function handleAnswer(server, client, message, correlationId) {
  const { targetUserId, targetConnectionId, answer } = message;

  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  if (!answer) {
    throw new Error("Answer is required");
  }

  const targets = resolveTargets(server, client, {
    targetUserId,
    targetConnectionId,
  });

  if (targets.length === 0) {
    throw new Error("Target not in the same room");
  }

  targets.forEach((targetClient) => {
    server.send(targetClient.ws, {
      type: "answer",
      fromUserId: client.userId,
      fromUsername: client.username,
      fromConnectionId: client.connectionId,
      answer,
      correlationId,
    });
  });

  logger.debug("Answer relayed", {
    fromUserId: client.userId,
    fromConnectionId: client.connectionId,
    toUserId: targetUserId,
    toConnectionId: targetConnectionId,
    roomId: client.roomId,
    correlationId,
  });
}

async function handleIceCandidate(server, client, message, correlationId) {
  const { targetUserId, targetConnectionId, candidate } = message;

  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  if (!candidate) {
    throw new Error("ICE candidate is required");
  }

  const targets = resolveTargets(server, client, {
    targetUserId,
    targetConnectionId,
  });

  if (targets.length === 0) {
    throw new Error("Target not in the same room");
  }

  targets.forEach((targetClient) => {
    server.send(targetClient.ws, {
      type: "ice-candidate",
      fromUserId: client.userId,
      fromConnectionId: client.connectionId,
      candidate,
      correlationId,
    });
  });

  logger.debug("ICE candidate relayed", {
    fromUserId: client.userId,
    fromConnectionId: client.connectionId,
    toUserId: targetUserId,
    toConnectionId: targetConnectionId,
    roomId: client.roomId,
    correlationId,
  });
}

async function handleScreenShareStarted(
  server,
  client,
  message,
  correlationId
) {
  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  server.broadcastToRoom(
    client.roomId,
    {
      type: "screen-share-started",
      userId: client.userId,
      username: client.username,
      connectionId: client.connectionId,
      correlationId,
    },
    client.connectionId
  );

  logger.info("Screen share started", {
    userId: client.userId,
    roomId: client.roomId,
    connectionId: client.connectionId,
    correlationId,
  });
}

async function handleScreenShareStopped(
  server,
  client,
  message,
  correlationId
) {
  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  server.broadcastToRoom(
    client.roomId,
    {
      type: "screen-share-stopped",
      userId: client.userId,
      username: client.username,
      connectionId: client.connectionId,
      correlationId,
    },
    client.connectionId
  );

  logger.info("Screen share stopped", {
    userId: client.userId,
    roomId: client.roomId,
    connectionId: client.connectionId,
    correlationId,
  });
}

async function handlePing(server, client, message, correlationId) {
  server.send(client.ws, {
    type: "pong",
    timestamp: Date.now(),
    correlationId,
  });
}

async function handleChatMessage(server, client, message, correlationId) {
  const { text } = message;

  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Message text is required");
  }

  if (text.length > 500) {
    throw new Error("Message too long (max 500 characters)");
  }

  const messageId = Date.now() + Math.random().toString(36).substr(2, 9);

  server.broadcastToRoom(client.roomId, {
    type: "chat-message",
    messageId,
    fromUserId: client.userId,
    fromUsername: client.username,
    text: text.trim(),
    timestamp: Date.now(),
    correlationId,
  });

  logger.info("Chat message sent", {
    userId: client.userId,
    roomId: client.roomId,
    messageLength: text.length,
    correlationId,
  });
}

async function handleTyping(server, client, message, correlationId) {
  const { isTyping } = message;

  if (!client.roomId) {
    throw new Error("Not in a room");
  }

  server.broadcastToRoom(
    client.roomId,
    {
      type: "typing",
      userId: client.userId,
      username: client.username,
      isTyping: !!isTyping,
      correlationId,
    },
    client.connectionId
  );
}

function resolveTargets(server, client, { targetUserId, targetConnectionId }) {
  const targets = [];

  if (targetConnectionId) {
    const targetClient = server.clients.get(targetConnectionId);
    if (targetClient && targetClient.roomId === client.roomId) {
      targets.push(targetClient);
    }
  } else if (targetUserId) {
    const connections = server.userConnections?.get(targetUserId);
    if (connections) {
      connections.forEach((connectionId) => {
        const targetClient = server.clients.get(connectionId);
        if (targetClient && targetClient.roomId === client.roomId) {
          targets.push(targetClient);
        }
      });
    }
  }

  return targets;
}
