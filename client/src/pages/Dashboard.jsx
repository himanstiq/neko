import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Container from "../components/Layout/Container";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.getRooms();
      setRooms(response.rooms);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.displayName || user?.username}!
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rooms</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? "Cancel" : "Create Room"}
        </button>
      </div>

      {showCreateForm && (
        <CreateRoomForm
          onRoomCreated={fetchRooms}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No rooms available. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </Container>
  );
}

function CreateRoomForm({ onRoomCreated, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
    maxParticipants: 6,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createRoom(formData);
      onRoomCreated();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4">Create New Room</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 font-medium mb-2"
          >
            Room Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-gray-700 font-medium mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="maxParticipants"
            className="block text-gray-700 font-medium mb-2"
          >
            Max Participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min={2}
            max={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-gray-700">Make room public</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </form>
    </div>
  );
}

function RoomCard({ room }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold mb-2">{room.name}</h3>
      {room.description && (
        <p className="text-gray-600 mb-4 text-sm">{room.description}</p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>
          {room.currentParticipants}/{room.maxParticipants} participants
        </span>
        <span
          className={`px-2 py-1 rounded ${
            room.isPublic
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {room.isPublic ? "Public" : "Private"}
        </span>
      </div>
      <Link
        to={`/room/${room.roomId}`}
        className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Join Room
      </Link>
    </div>
  );
}
