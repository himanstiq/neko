import { Link } from "react-router-dom";
import Container from "../components/Layout/Container";

export default function Home() {
  return (
    <Container>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to WebRTC Conference
        </h1>
        <p className="text-gray-600 mb-8">
          High-quality video conferencing powered by WebRTC
        </p>
        <div className="space-x-4">
          <Link
            to="/room/test"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Join Test Room
          </Link>
        </div>
      </div>
    </Container>
  );
}
