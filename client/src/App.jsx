import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SignalingProvider } from "./contexts/SignalingContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SignalingProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 bg-gray-50">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/room/:roomId"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Room />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </SignalingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
