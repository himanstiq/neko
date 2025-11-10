import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ConnectionStatus from "../ConnectionStatus";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            WebRTC Conference
          </Link>
          <div className="flex items-center gap-6">
            {isAuthenticated && <ConnectionStatus />}
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 hover:bg-blue-700 rounded"
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm">
                    Hello, {user?.displayName || user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 hover:bg-blue-700 rounded"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
