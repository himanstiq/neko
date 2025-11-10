class NetworkQualityMonitor {
  constructor() {
    this.qualityLevels = {
      EXCELLENT: "excellent",
      GOOD: "good",
      FAIR: "fair",
      POOR: "poor",
    };
    this.currentQuality = this.qualityLevels.EXCELLENT;
    this.listeners = new Set();
    this.statsInterval = null;
    this.peerConnections = new Map();
  }

  startMonitoring(peers, intervalMs = 3000) {
    this.stopMonitoring();

    this.statsInterval = setInterval(async () => {
      await this.checkQuality(peers);
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  async checkQuality(peers) {
    if (!peers || peers.length === 0) {
      return;
    }

    let totalPacketLoss = 0;
    let totalRtt = 0;
    let totalJitter = 0;
    let count = 0;

    for (const peer of peers) {
      const stats = await peer.getStats();
      if (stats) {
        totalPacketLoss += stats.video.packetsLost + stats.audio.packetsLost;
        totalRtt += stats.video.rtt;
        totalJitter += stats.video.jitter;
        count++;
      }
    }

    if (count === 0) return;

    const avgRtt = totalRtt / count;
    const avgJitter = totalJitter / count;
    const packetLoss = totalPacketLoss;

    // Determine quality based on metrics
    let quality = this.qualityLevels.EXCELLENT;
    let recommendedBitrate = 2500; // kbps

    if (avgRtt > 300 || avgJitter > 50 || packetLoss > 5) {
      quality = this.qualityLevels.POOR;
      recommendedBitrate = 500;
    } else if (avgRtt > 200 || avgJitter > 30 || packetLoss > 2) {
      quality = this.qualityLevels.FAIR;
      recommendedBitrate = 1000;
    } else if (avgRtt > 100 || avgJitter > 15) {
      quality = this.qualityLevels.GOOD;
      recommendedBitrate = 1500;
    }

    // Update quality and notify listeners
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.notifyQualityChange(quality, {
        avgRtt,
        avgJitter,
        packetLoss,
        recommendedBitrate,
      });

      // Automatically adjust bitrate for all peers
      for (const peer of peers) {
        await peer.setBandwidth(recommendedBitrate);
      }
    }
  }

  notifyQualityChange(quality, metrics) {
    this.listeners.forEach((listener) => {
      try {
        listener(quality, metrics);
      } catch (error) {
        console.error("Error in quality change listener:", error);
      }
    });
  }

  onQualityChange(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentQuality() {
    return this.currentQuality;
  }

  // Get network quality icon/color
  getQualityInfo(quality = this.currentQuality) {
    switch (quality) {
      case this.qualityLevels.EXCELLENT:
        return { icon: "🟢", color: "green", text: "Excellent" };
      case this.qualityLevels.GOOD:
        return { icon: "🟡", color: "yellow", text: "Good" };
      case this.qualityLevels.FAIR:
        return { icon: "🟠", color: "orange", text: "Fair" };
      case this.qualityLevels.POOR:
        return { icon: "🔴", color: "red", text: "Poor" };
      default:
        return { icon: "⚪", color: "gray", text: "Unknown" };
    }
  }
}

export default new NetworkQualityMonitor();
