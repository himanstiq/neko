export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const RTC_CONFIG = {
  iceServers: STUN_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Improved media constraints for better quality
export const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
  },
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
    frameRate: { min: 15, ideal: 30, max: 30 },
    facingMode: "user",
  },
};

// For lower bandwidth (optional - use if still laggy)
export const MEDIA_CONSTRAINTS_LOW = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
};

// Screen share constraints
export const SCREEN_SHARE_CONSTRAINTS = {
  video: {
    cursor: "always",
    displaySurface: "monitor",
    width: { max: 1920 },
    height: { max: 1080 },
    frameRate: { max: 30 },
  },
  audio: false, // Most browsers don't support screen audio reliably
};
