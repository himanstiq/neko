class AudioMonitor {
  constructor() {
    this.audioContexts = new Map();
    this.analysers = new Map();
    this.volumeCallbacks = new Map();
    this.animationFrames = new Map();
  }

  startMonitoring(userId, stream, onVolumeChange) {
    if (this.audioContexts.has(userId)) {
      console.log("Already monitoring", userId);
      return;
    }

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      this.audioContexts.set(userId, audioContext);
      this.analysers.set(userId, analyser);
      this.volumeCallbacks.set(userId, onVolumeChange);

      this.detectVolume(userId);

      console.log("Started audio monitoring for", userId);
    } catch (error) {
      console.error("Error starting audio monitoring:", error);
    }
  }

  detectVolume(userId) {
    const analyser = this.analysers.get(userId);
    const callback = this.volumeCallbacks.get(userId);

    if (!analyser || !callback) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;

      // Normalize to 0-100
      const volume = Math.min(100, Math.round((average / 255) * 100));

      callback(volume);

      const frameId = requestAnimationFrame(checkVolume);
      this.animationFrames.set(userId, frameId);
    };

    checkVolume();
  }

  stopMonitoring(userId) {
    const frameId = this.animationFrames.get(userId);
    if (frameId) {
      cancelAnimationFrame(frameId);
      this.animationFrames.delete(userId);
    }

    const audioContext = this.audioContexts.get(userId);
    if (audioContext) {
      audioContext.close();
      this.audioContexts.delete(userId);
    }

    this.analysers.delete(userId);
    this.volumeCallbacks.delete(userId);

    console.log("Stopped audio monitoring for", userId);
  }

  stopAll() {
    this.audioContexts.forEach((_, userId) => {
      this.stopMonitoring(userId);
    });
  }
}

export default new AudioMonitor();
