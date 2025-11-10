import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSignaling } from "../contexts/SignalingContext";
import { useActiveSpeaker } from "../hooks/useActiveSpeaker";
import Container from "../components/Layout/Container";
import AudioLevelIndicator from "../components/AudioLevelIndicator";
import NetworkQualityIndicator from "../components/NetworkQualityIndicator";
import Chat from "../components/Chat";
import QualitySelector from "../components/QualitySelector";
import mediaService from "../services/mediaService";
import peerConnectionManager from "../services/peerConnectionManager";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const signaling = useSignaling();
  const { joinRoom, leaveRoom, isConnected } = signaling;

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [screenSharingUsers, setScreenSharingUsers] = useState(new Set());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const localVideoRef = useRef(null);
  const processedParticipants = useRef(new Set());

  // Active speaker detection
  const { activeSpeakerId, audioLevels } = useActiveSpeaker(
    Array.from(remoteStreams.values()),
    localStream,
    remoteStreams
  );

  // Initialize room
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!isConnected || isInitialized) return;

      try {
        setError(null);
        console.log("Initializing room...");

        const stream = await mediaService.getUserMedia();

        if (!mounted) {
          mediaService.stopLocalStream();
          return;
        }

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnectionManager.initialize(
          signaling,
          (userId, username, stream) => {
            console.log("✅ Received remote stream from", userId, username);
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(userId, { userId, username, stream });
              return newMap;
            });
          },
          (userId, state) => {
            console.log("Peer connection state:", userId, state);
            if (
              state === "failed" ||
              state === "closed" ||
              state === "disconnected"
            ) {
              setRemoteStreams((prev) => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
              });
            }
          }
        );

        setIsInitialized(true);
      } catch (err) {
        console.error("Error initializing room:", err);
        setError(err.message);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [isConnected, isInitialized, signaling]); // Keep dependencies minimal

  // Join room
  useEffect(() => {
    if (isInitialized && !hasJoinedRoom) {
      console.log("Joining room:", roomId);
      joinRoom(roomId, user?.displayName || user?.username);
      setHasJoinedRoom(true);
    }
  }, [isInitialized, hasJoinedRoom, roomId, user, joinRoom]);

  // Handle room-joined message
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = signaling.onMessage("room-joined", (message) => {
      console.log(
        "✅ Room joined successfully. Existing participants:",
        message.participants
      );

      if (message.participants && message.participants.length > 0) {
        message.participants.forEach((participant) => {
          if (!processedParticipants.current.has(participant.userId)) {
            console.log(
              "📤 Creating offer for existing participant:",
              participant.userId,
              participant.username
            );
            processedParticipants.current.add(participant.userId);
            peerConnectionManager.createOffer(
              participant.userId,
              participant.username
            );
          }
        });
      }
    });

    return unsubscribe;
  }, [isInitialized, signaling]);

  // Handle user-joined message
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = signaling.onMessage("user-joined", (message) => {
      console.log("✅ New user joined:", message.userId, message.username);

      if (processedParticipants.current.has(message.userId)) {
        console.log("Already have connection to", message.userId);
        return;
      }

      console.log("⏳ Waiting for offer from new user:", message.userId);
      processedParticipants.current.add(message.userId);
    });

    return unsubscribe;
  }, [isInitialized, signaling]);

  // Handle user-left message
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = signaling.onMessage("user-left", (message) => {
      console.log("❌ User left:", message.userId, message.username);
      processedParticipants.current.delete(message.userId);
      // Remove from screen sharing users if they were sharing
      setScreenSharingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message.userId);
        return newSet;
      });
    });

    return unsubscribe;
  }, [isInitialized, signaling]);

  // Handle screen-share-started message
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = signaling.onMessage(
      "screen-share-started",
      (message) => {
        console.log(
          "🖥️ User started screen sharing:",
          message.userId,
          message.username
        );
        setScreenSharingUsers((prev) => new Set(prev).add(message.userId));
      }
    );

    return unsubscribe;
  }, [isInitialized, signaling]);

  // Handle screen-share-stopped message
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = signaling.onMessage(
      "screen-share-stopped",
      (message) => {
        console.log(
          "🖥️ User stopped screen sharing:",
          message.userId,
          message.username
        );
        setScreenSharingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(message.userId);
          return newSet;
        });
      }
    );

    return unsubscribe;
  }, [isInitialized, signaling]);

  // Cleanup on unmount
  useEffect(() => {
    const currentProcessedParticipants = processedParticipants.current;
    const currentScreenStream = screenStream;

    return () => {
      console.log("Cleaning up room...");

      // Stop screen share if active
      if (currentScreenStream) {
        currentScreenStream.getTracks().forEach((track) => track.stop());
      }

      leaveRoom();
      peerConnectionManager.closeAllConnections();
      mediaService.stopLocalStream();
      setIsInitialized(false);
      setHasJoinedRoom(false);
      currentProcessedParticipants.clear();
    };
  }, [leaveRoom, screenStream]);

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    mediaService.toggleAudio(newState);
    setIsAudioEnabled(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    mediaService.toggleVideo(newState);
    setIsVideoEnabled(newState);
  };

  const startScreenShare = async () => {
    try {
      console.log("Starting screen share...");

      const stream = await mediaService.getDisplayMedia();
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Listen for screen share ending
      const screenTrack = stream.getVideoTracks()[0];
      screenTrack.onended = () => {
        console.log("Screen share ended by user");
        stopScreenShare();
      };

      // Replace video track in all peer connections
      const peers = peerConnectionManager.getAllPeers();

      for (const peer of peers) {
        const senders = peer.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
          console.log("Replaced video track with screen for", peer.username);
        }
      }

      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.classList.remove("mirror");
      }

      // Notify other participants
      signaling.sendMessage({
        type: "screen-share-started",
        userId: user?.id,
        username: user?.displayName || user?.username,
      });

      console.log("Screen sharing started");
    } catch (error) {
      console.error("Failed to start screen share:", error);
      setError(error.message);
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = async () => {
    try {
      console.log("Stopping screen share...");

      // Stop screen share tracks
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }

      setIsScreenSharing(false);

      // Replace back to camera track in all peer connections
      const cameraStream = mediaService.getLocalStream();
      if (!cameraStream) {
        console.error("No camera stream available");
        return;
      }

      const cameraTrack = cameraStream.getVideoTracks()[0];
      const peers = peerConnectionManager.getAllPeers();

      for (const peer of peers) {
        const senders = peer.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(cameraTrack);
          console.log("Replaced screen with camera track for", peer.username);
        }
      }

      // Update local video display back to camera
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
        localVideoRef.current.classList.add("mirror");
      }

      // Notify other participants
      signaling.sendMessage({
        type: "screen-share-stopped",
        userId: user?.id,
        username: user?.displayName || user?.username,
      });

      console.log("Screen sharing stopped");
    } catch (error) {
      console.error("Failed to stop screen share:", error);
      setError(error.message);
    }
  };

  const handleLeaveRoom = () => {
    navigate("/dashboard");
  };

  if (error) {
    return (
      <Container>
        <div className="text-center py-16">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Room Info */}
      <div className="bg-gray-800 px-4 py-2 text-white text-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            Room: {roomId} | Participants: {remoteStreams.size + 1}
          </span>
          {isScreenSharing && (
            <span className="bg-blue-600 px-2 py-1 rounded text-xs font-semibold">
              🖥️ You are presenting
            </span>
          )}
          <NetworkQualityIndicator
            peers={peerConnectionManager.getAllPeers()}
          />
        </div>
        <div className="text-xs text-gray-400">
          {activeSpeakerId &&
            (activeSpeakerId === "local"
              ? "You are speaking"
              : "Someone is speaking")}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        {viewMode === "grid" ? (
          isScreenSharing || screenSharingUsers.size > 0 ? (
            // Screen Share Layout - Large screen + thumbnails on side
            <div className="flex gap-4 h-full max-w-7xl mx-auto">
              {/* Main screen share area */}
              <div className="flex-1 min-w-0">
                {isScreenSharing ? (
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden h-full">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />

                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
                      <span className="text-xl">🖥️</span>
                      <span>You are presenting</span>
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-4 py-2 rounded-lg text-white text-sm">
                      <div className="flex items-center gap-2">
                        <AudioLevelIndicator
                          level={audioLevels.get("local") || 0}
                          isSpeaking={activeSpeakerId === "local"}
                        />
                        <span className="font-medium">You (Presenting)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show the first remote user who is screen sharing
                  (() => {
                    const sharingUserId = Array.from(screenSharingUsers)[0];
                    const sharingUser = remoteStreams.get(sharingUserId);
                    if (!sharingUser) return null;

                    return (
                      <RemoteScreenShare
                        username={sharingUser.username}
                        stream={sharingUser.stream}
                        audioLevel={audioLevels.get(sharingUserId) || 0}
                        isActiveSpeaker={activeSpeakerId === sharingUserId}
                      />
                    );
                  })()
                )}
              </div>

              {/* Sidebar with participant thumbnails */}
              <div className="w-64 flex flex-col gap-3 overflow-y-auto">
                {/* Local camera thumbnail (when not screen sharing) */}
                {!isScreenSharing && (
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shrink-0">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 px-2 py-1 rounded text-white text-xs">
                      You
                    </div>
                    {activeSpeakerId === "local" && (
                      <div className="absolute inset-0 ring-2 ring-green-500 rounded-lg"></div>
                    )}
                  </div>
                )}

                {/* Remote participant thumbnails (excluding those who are screen sharing in main view) */}
                {Array.from(remoteStreams.values())
                  .filter(
                    ({ userId }) =>
                      !screenSharingUsers.has(userId) || isScreenSharing
                  )
                  .map(({ userId, username, stream }) => (
                    <SidebarThumbnail
                      key={userId}
                      username={username}
                      stream={stream}
                      isActiveSpeaker={activeSpeakerId === userId}
                      audioLevel={audioLevels.get(userId) || 0}
                    />
                  ))}
              </div>
            </div>
          ) : (
            // Regular Grid View - No screen sharing
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {/* Local Video */}
              <div
                className={`relative bg-gray-800 rounded-lg overflow-hidden aspect-video transition-all ${
                  activeSpeakerId === "local"
                    ? "ring-4 ring-green-500 scale-105"
                    : ""
                }`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />

                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm flex items-center gap-2">
                  <AudioLevelIndicator
                    level={audioLevels.get("local") || 0}
                    isSpeaking={activeSpeakerId === "local"}
                  />
                  <span>You {!isVideoEnabled && "(Camera Off)"}</span>
                </div>

                {activeSpeakerId === "local" && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    SPEAKING
                  </div>
                )}

                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <div className="text-white text-6xl">
                      {(user?.displayName ||
                        user?.username)?.[0]?.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {Array.from(remoteStreams.values()).map(
                ({ userId, username, stream }) => (
                  <RemoteVideo
                    key={userId}
                    userId={userId}
                    username={username}
                    stream={stream}
                    isActiveSpeaker={activeSpeakerId === userId}
                    audioLevel={audioLevels.get(userId) || 0}
                    isScreenSharing={screenSharingUsers.has(userId)}
                  />
                )
              )}

              {/* Waiting for others placeholder */}
              {remoteStreams.size === 0 && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <div>Waiting for others to join...</div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <SpeakerView
            activeSpeakerId={activeSpeakerId}
            localVideoRef={localVideoRef}
            audioLevels={audioLevels}
            remoteStreams={remoteStreams}
            isScreenSharing={isScreenSharing}
          />
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full ${
              isAudioEnabled
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            } text-white transition-colors`}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            <span className="text-2xl">{isAudioEnabled ? "🎤" : "🔇"}</span>
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${
              isVideoEnabled
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            } text-white transition-colors`}
            title={isVideoEnabled ? "Stop Video" : "Start Video"}
          >
            <span className="text-2xl">{isVideoEnabled ? "📹" : "🚫"}</span>
          </button>

          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-4 rounded-full ${
              isScreenSharing
                ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400"
                : "bg-gray-700 hover:bg-gray-600"
            } text-white transition-colors`}
            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
          >
            <span className="text-2xl">🖥️</span>
          </button>

          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "speaker" : "grid")
            }
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
            title="Toggle View Mode"
          >
            {viewMode === "grid" ? "👤 Speaker View" : "📊 Grid View"}
          </button>

          <QualitySelector />

          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors font-medium"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Chat Component */}
      <Chat
        signaling={signaling}
        currentUser={user}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}

function RemoteVideo({
  username,
  stream,
  isActiveSpeaker,
  audioLevel,
  isScreenSharing = false,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.log("Video play prevented:", err);
      });
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-gray-800 rounded-lg overflow-hidden aspect-video transition-all ${
        isActiveSpeaker ? "ring-4 ring-green-500 scale-105" : ""
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {isScreenSharing && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <span>🖥️</span>
          <span>PRESENTING</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm flex items-center gap-2">
        <AudioLevelIndicator
          level={audioLevel || 0}
          isSpeaking={isActiveSpeaker}
        />
        <span>{username}</span>
      </div>
      {isActiveSpeaker && !isScreenSharing && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
          SPEAKING
        </div>
      )}
    </div>
  );
}

function RemoteScreenShare({ username, stream, audioLevel, isActiveSpeaker }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.log("Video play prevented:", err);
      });
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg">
        <span className="text-xl">🖥️</span>
        <span>{username} is presenting</span>
      </div>

      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-4 py-2 rounded-lg text-white text-sm">
        <div className="flex items-center gap-2">
          <AudioLevelIndicator
            level={audioLevel || 0}
            isSpeaking={isActiveSpeaker}
          />
          <span className="font-medium">{username}</span>
        </div>
      </div>
    </div>
  );
}

function SpeakerView({
  activeSpeakerId,
  localVideoRef,
  audioLevels,
  remoteStreams,
  isScreenSharing,
}) {
  const activeSpeakerVideoRef = useRef(null);

  useEffect(() => {
    if (activeSpeakerId && activeSpeakerId !== "local") {
      const activeStream = remoteStreams.get(activeSpeakerId);
      if (activeSpeakerVideoRef.current && activeStream?.stream) {
        activeSpeakerVideoRef.current.srcObject = activeStream.stream;
      }
    }
  }, [activeSpeakerId, remoteStreams]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 min-h-0">
        {activeSpeakerId ? (
          activeSpeakerId === "local" ? (
            <div className="relative bg-gray-800 rounded-lg overflow-hidden h-full ring-4 ring-green-500">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${
                  !isScreenSharing ? "mirror" : ""
                }`}
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-4 py-2 rounded text-white">
                <div className="flex items-center gap-3">
                  <AudioLevelIndicator
                    level={audioLevels.get("local") || 0}
                    isSpeaking={true}
                  />
                  <span className="text-lg font-semibold">
                    You {isScreenSharing ? "(Sharing)" : "(Speaking)"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            (() => {
              const activeStream = remoteStreams.get(activeSpeakerId);
              if (!activeStream) return null;
              return (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden h-full ring-4 ring-green-500">
                  <video
                    ref={activeSpeakerVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 px-4 py-2 rounded text-white">
                    <div className="flex items-center gap-3">
                      <AudioLevelIndicator
                        level={audioLevels.get(activeSpeakerId) || 0}
                        isSpeaking={true}
                      />
                      <span className="text-lg font-semibold">
                        {activeStream.username} (Speaking)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          )
        ) : (
          <div className="bg-gray-800 rounded-lg h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">🎤</div>
              <div className="text-xl">Waiting for someone to speak...</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeSpeakerId !== "local" && (
          <Thumbnail
            videoRef={localVideoRef}
            username="You"
            isMirrored={true}
          />
        )}

        {Array.from(remoteStreams.values())
          .filter(({ userId }) => userId !== activeSpeakerId)
          .map(({ userId, username, stream }) => (
            <Thumbnail key={userId} username={username} stream={stream} />
          ))}
      </div>
    </div>
  );
}

function Thumbnail({
  username,
  stream,
  videoRef: externalVideoRef,
  isMirrored = false,
}) {
  const localVideoRef = useRef(null);

  useEffect(() => {
    const videoElement = externalVideoRef?.current || localVideoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
    }
  }, [stream, externalVideoRef]);

  return (
    <div className="shrink-0 w-32 h-24 relative bg-gray-800 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500">
      {externalVideoRef ? (
        <video
          ref={externalVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? "mirror" : ""}`}
        />
      ) : (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs truncate max-w-full">
        {username}
      </div>
    </div>
  );
}

function SidebarThumbnail({ username, stream, isActiveSpeaker, audioLevel }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.log("Video play prevented:", err);
      });
    }
  }, [stream]);

  return (
    <div
      className={`relative bg-gray-800 rounded-lg overflow-hidden aspect-video shrink-0 transition-all ${
        isActiveSpeaker ? "ring-2 ring-green-500" : ""
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
        <AudioLevelIndicator level={audioLevel} isSpeaking={isActiveSpeaker} />
        <span className="truncate max-w-[140px]">{username}</span>
      </div>
      {isActiveSpeaker && (
        <div className="absolute top-1 left-1 bg-green-500 text-white px-1 py-0.5 rounded text-[10px] font-bold">
          SPEAKING
        </div>
      )}
    </div>
  );
}
