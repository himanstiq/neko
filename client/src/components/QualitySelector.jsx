import { useState, useEffect } from "react";
import mediaService from "../services/mediaService";

const QUALITY_PRESETS = {
  high: {
    label: "High (720p)",
    constraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    },
  },
  medium: {
    label: "Medium (480p)",
    constraints: {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24 },
      },
    },
  },
  low: {
    label: "Low (360p)",
    constraints: {
      video: {
        width: { ideal: 480 },
        height: { ideal: 360 },
        frameRate: { ideal: 15 },
      },
    },
  },
};

export default function QualitySelector({ onQualityChange, onDeviceChange }) {
  const [quality, setQuality] = useState("high");
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: "",
    videoInput: "",
    audioOutput: "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const loadDevices = async () => {
    try {
      const deviceList = await mediaService.enumerateDevices();
      setDevices(deviceList);

      // Set default devices
      if (deviceList.audioInputs.length > 0 && !selectedDevices.audioInput) {
        setSelectedDevices((prev) => ({
          ...prev,
          audioInput: deviceList.audioInputs[0].deviceId,
        }));
      }
      if (deviceList.videoInputs.length > 0 && !selectedDevices.videoInput) {
        setSelectedDevices((prev) => ({
          ...prev,
          videoInput: deviceList.videoInputs[0].deviceId,
        }));
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  useEffect(() => {
    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (onQualityChange) {
      onQualityChange(QUALITY_PRESETS[newQuality].constraints);
    }
  };

  const handleDeviceChange = (type, deviceId) => {
    setSelectedDevices((prev) => ({
      ...prev,
      [type]: deviceId,
    }));

    if (onDeviceChange) {
      onDeviceChange(type, deviceId);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Settings"
      >
        <span className="text-2xl">⚙️</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[300px] z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Video Quality */}
            <div>
              <label className="text-white text-sm block mb-2">
                Video Quality
              </label>
              <select
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Microphone */}
            {devices.audioInputs.length > 0 && (
              <div>
                <label className="text-white text-sm block mb-2">
                  🎤 Microphone
                </label>
                <select
                  value={selectedDevices.audioInput}
                  onChange={(e) =>
                    handleDeviceChange("audioInput", e.target.value)
                  }
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {devices.audioInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label ||
                        `Microphone ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Camera */}
            {devices.videoInputs.length > 0 && (
              <div>
                <label className="text-white text-sm block mb-2">
                  📹 Camera
                </label>
                <select
                  value={selectedDevices.videoInput}
                  onChange={(e) =>
                    handleDeviceChange("videoInput", e.target.value)
                  }
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {devices.videoInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speaker */}
            {devices.audioOutputs.length > 0 && (
              <div>
                <label className="text-white text-sm block mb-2">
                  🔊 Speaker
                </label>
                <select
                  value={selectedDevices.audioOutput}
                  onChange={(e) =>
                    handleDeviceChange("audioOutput", e.target.value)
                  }
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {devices.audioOutputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
