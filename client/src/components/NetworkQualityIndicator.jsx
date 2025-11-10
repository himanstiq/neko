import { useState, useEffect } from "react";
import networkQualityMonitor from "../services/networkQualityMonitor";

export default function NetworkQualityIndicator({ peers = [] }) {
  const [quality, setQuality] = useState(
    networkQualityMonitor.getCurrentQuality()
  );
  const [metrics, setMetrics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Start monitoring when component mounts
    if (peers.length > 0) {
      networkQualityMonitor.startMonitoring(peers, 3000);
    }

    const unsubscribe = networkQualityMonitor.onQualityChange(
      (newQuality, newMetrics) => {
        setQuality(newQuality);
        setMetrics(newMetrics);
      }
    );

    return () => {
      unsubscribe();
      networkQualityMonitor.stopMonitoring();
    };
  }, [peers]);

  const qualityInfo = networkQualityMonitor.getQualityInfo(quality);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        title="Network Quality"
      >
        <span className="text-lg">{qualityInfo.icon}</span>
        <span className="text-white font-medium">{qualityInfo.text}</span>
      </button>

      {showDetails && metrics && (
        <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <h3 className="text-white font-semibold mb-3 text-sm">
            Connection Details
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Quality:</span>
              <span className={`font-medium text-${qualityInfo.color}-400`}>
                {qualityInfo.text}
              </span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>Round Trip Time:</span>
              <span className="font-mono">
                {(metrics.avgRtt * 1000).toFixed(0)} ms
              </span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>Jitter:</span>
              <span className="font-mono">
                {(metrics.avgJitter * 1000).toFixed(0)} ms
              </span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>Packet Loss:</span>
              <span className="font-mono">{metrics.packetLoss} packets</span>
            </div>

            <div className="flex justify-between text-gray-300">
              <span>Bitrate Limit:</span>
              <span className="font-mono">
                {metrics.recommendedBitrate} kbps
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Connection quality is automatically adjusted based on network
              conditions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
