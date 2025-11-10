import Room from "../models/Room.js";
import logger from "../utils/logger.js";

export const createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, maxParticipants } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const room = await Room.create({
      name,
      description,
      isPublic: isPublic || false,
      maxParticipants: maxParticipants || 6,
      createdBy: req.user.id,
    });

    await room.populate("createdBy", "username displayName avatar");

    logger.info("Room created", {
      roomId: room.roomId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        accessToken: room.accessToken,
        isPublic: room.isPublic,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    logger.error("Create room error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, isPublic } = req.query;

    const query = { isActive: true };
    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    const rooms = await Room.find(query)
      .populate("createdBy", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Room.countDocuments(query);

    res.status(200).json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        isPublic: room.isPublic,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRooms: count,
      },
    });
  } catch (error) {
    logger.error("Get rooms error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error fetching rooms", error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId, isActive: true })
      .populate("createdBy", "username displayName avatar")
      .populate("participants.userId", "username displayName avatar");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        description: room.description,
        isPublic: room.isPublic,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
        createdBy: room.createdBy,
        participants: room.participants,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    logger.error("Get room by ID error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error fetching room", error: error.message });
  }
};

export const validateRoomAccess = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { accessToken } = req.body;

    const room = await Room.findOne({ roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isPublic && room.accessToken !== accessToken) {
      return res.status(403).json({ message: "Invalid access token" });
    }

    if (room.currentParticipants >= room.maxParticipants) {
      return res.status(403).json({ message: "Room is full" });
    }

    res.status(200).json({
      success: true,
      message: "Access granted",
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        maxParticipants: room.maxParticipants,
        currentParticipants: room.currentParticipants,
      },
    });
  } catch (error) {
    logger.error("Validate room access error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error validating access", error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this room" });
    }

    room.isActive = false;
    room.closedAt = Date.now();
    await room.save();

    logger.info("Room deleted", { roomId, deletedBy: req.user.id });

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    logger.error("Delete room error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error deleting room", error: error.message });
  }
};
