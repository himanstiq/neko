import { useState, useEffect, useRef } from "react";
import audioMonitor from "../services/audioMonitor";

export function useActiveSpeaker(participants, localStream, remoteStreams) {
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [audioLevels, setAudioLevels] = useState(new Map());
  const volumeHistory = useRef(new Map());

  // Speech detection threshold
  const SPEAKING_THRESHOLD = 15; // 0-100 scale
  const SPEAKING_DURATION = 500; // ms

  const updateVolume = (userId, volume) => {
    setAudioLevels((prev) => {
      const newLevels = new Map(prev);
      newLevels.set(userId, volume);
      return newLevels;
    });

    // Track volume history for stability
    if (!volumeHistory.current.has(userId)) {
      volumeHistory.current.set(userId, []);
    }

    const history = volumeHistory.current.get(userId);
    history.push({ volume, timestamp: Date.now() });

    // Keep only recent history (last 1 second)
    const recent = history.filter((h) => Date.now() - h.timestamp < 1000);
    volumeHistory.current.set(userId, recent);

    // Determine active speaker
    determineActiveSpeaker();
  };

  useEffect(() => {
    // Monitor local stream
    if (localStream) {
      audioMonitor.startMonitoring("local", localStream, (volume) => {
        updateVolume("local", volume);
      });
    }

    // Monitor remote streams
    remoteStreams.forEach(({ userId, stream }) => {
      audioMonitor.startMonitoring(userId, stream, (volume) => {
        updateVolume(userId, volume);
      });
    });

    return () => {
      audioMonitor.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, remoteStreams]);

  const determineActiveSpeaker = () => {
    let maxAvgVolume = 0;
    let speakerId = null;

    volumeHistory.current.forEach((history, userId) => {
      if (history.length === 0) return;

      // Calculate average volume over last SPEAKING_DURATION ms
      const recentHistory = history.filter(
        (h) => Date.now() - h.timestamp < SPEAKING_DURATION
      );

      if (recentHistory.length === 0) return;

      const avgVolume =
        recentHistory.reduce((sum, h) => sum + h.volume, 0) /
        recentHistory.length;

      if (avgVolume > SPEAKING_THRESHOLD && avgVolume > maxAvgVolume) {
        maxAvgVolume = avgVolume;
        speakerId = userId;
      }
    });

    setActiveSpeakerId(speakerId);
  };

  return { activeSpeakerId, audioLevels };
}
