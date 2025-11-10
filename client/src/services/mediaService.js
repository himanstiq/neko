import { MEDIA_CONSTRAINTS, SCREEN_SHARE_CONSTRAINTS } from "../config/webrtc";

class MediaService {
  constructor() {
    this.localStream = null;
    this.devices = {
      audioInputs: [],
      videoInputs: [],
      audioOutputs: [],
    };
  }

  async getUserMedia(constraints = MEDIA_CONSTRAINTS) {
    try {
      console.log("Requesting user media with constraints:", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      console.log(
        "Got local stream:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
        }))
      );

      return stream;
    } catch (error) {
      console.error("Error getting user media:", error);

      if (error.name === "NotAllowedError") {
        throw new Error("Camera/Microphone permission denied");
      } else if (error.name === "NotFoundError") {
        throw new Error("No camera/microphone found");
      } else {
        throw new Error("Failed to get media: " + error.message);
      }
    }
  }

  async getDisplayMedia(constraints = SCREEN_SHARE_CONSTRAINTS) {
    try {
      console.log("Requesting screen share...");

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      console.log(
        "Got screen share stream:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          label: t.label,
        }))
      );

      return stream;
    } catch (error) {
      console.error("Error getting screen share:", error);

      if (error.name === "NotAllowedError") {
        throw new Error("Screen share permission denied");
      } else if (error.name === "NotFoundError") {
        throw new Error("No screen available to share");
      } else {
        throw new Error("Failed to start screen share: " + error.message);
      }
    }
  }

  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      this.devices.audioInputs = devices.filter((d) => d.kind === "audioinput");
      this.devices.videoInputs = devices.filter((d) => d.kind === "videoinput");
      this.devices.audioOutputs = devices.filter(
        (d) => d.kind === "audiooutput"
      );

      console.log("Available devices:", {
        audioInputs: this.devices.audioInputs.length,
        videoInputs: this.devices.videoInputs.length,
        audioOutputs: this.devices.audioOutputs.length,
      });

      return this.devices;
    } catch (error) {
      console.error("Error enumerating devices:", error);
      throw error;
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("Audio", enabled ? "enabled" : "disabled");
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      console.log("Video", enabled ? "enabled" : "disabled");
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      console.log("Local stream stopped");
      this.localStream = null;
    }
  }

  getLocalStream() {
    return this.localStream;
  }

  isAudioEnabled() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  isVideoEnabled() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }
}

export default new MediaService();
