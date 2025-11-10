import { useSignaling } from "../contexts/SignalingContext";

export default function ConnectionStatus() {
  const { connectionState } = useSignaling();

  const statusConfig = {
    connected: {
      color: "bg-green-500",
      text: "Connected",
      icon: "●",
    },
    connecting: {
      color: "bg-yellow-500",
      text: "Connecting...",
      icon: "◐",
    },
    reconnecting: {
      color: "bg-orange-500",
      text: "Reconnecting...",
      icon: "◐",
    },
    disconnected: {
      color: "bg-gray-500",
      text: "Disconnected",
      icon: "○",
    },
    error: {
      color: "bg-red-500",
      text: "Connection Error",
      icon: "✕",
    },
    failed: {
      color: "bg-red-600",
      text: "Connection Failed",
      icon: "✕",
    },
  };

  const config = statusConfig[connectionState] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
      <span className="text-gray-700">{config.text}</span>
    </div>
  );
}
