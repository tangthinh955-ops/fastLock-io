import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createLocalTracks,
  type LocalTrack,
  Room,
  RoomEvent,
  type TrackPublishOptions,
  VideoPresets,
} from 'livekit-client';
import apiClient from '../api/client';
import {
  acquireMediaTracksWithWarning,
  createPublisherCoordinator,
  type MinimalRoomLike,
} from './livekitPublisherSession';

interface LivekitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  canPublish: boolean;
}

type LiveKitRoomAdapter = MinimalRoomLike<LocalTrack>;

const VIDEO_PUBLISH_BITRATE = 1_200_000;

export const useLiveKitPublisher = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const coordinatorRef = useRef<ReturnType<
    typeof createPublisherCoordinator<LocalTrack, LiveKitRoomAdapter>
  > | null>(null);

  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [videoError, setVideoError] = useState('');

  const getCoordinator = useCallback(() => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = createPublisherCoordinator<
        LocalTrack,
        LiveKitRoomAdapter
      >({
        acquireTracks: () =>
          acquireMediaTracksWithWarning(createLocalTracks, {
            resolution: VideoPresets.h720.resolution,
          }),
      });
    }
    return coordinatorRef.current;
  }, []);

  const syncTrackStateFromCoordinator = useCallback(() => {
    const coordinator = getCoordinator();
    const { videoTrack, audioTrack, warning } = coordinator.getTracks();
    setCamEnabled(Boolean(videoTrack && !videoTrack.isMuted));
    setMicEnabled(Boolean(audioTrack && !audioTrack.isMuted));
    setVideoError(warning);
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
    }
  }, [getCoordinator]);

  useEffect(() => {
    let effectUnmounted = false;
    const coordinator = getCoordinator();
    const mount = coordinator.mountPreview();

    mount.ready
      .then((result) => {
        if (effectUnmounted || !result.adopted) return;
        setCamEnabled(Boolean(result.videoTrack && !result.videoTrack.isMuted));
        setMicEnabled(Boolean(result.audioTrack && !result.audioTrack.isMuted));
        setVideoError(result.warning);
        if (result.videoTrack && videoRef.current) {
          result.videoTrack.attach(videoRef.current);
        }
      })
      .catch((error: unknown) => {
        if (effectUnmounted) return;
        console.error('Khởi tạo camera/mic LiveKit thất bại:', error);
        setCamEnabled(false);
        setMicEnabled(false);
        setVideoError(
          error instanceof Error
            ? error.message
            : 'Không truy cập được camera/micro. Hãy cấp quyền thiết bị để phát video.',
        );
      });

    return () => {
      effectUnmounted = true;
      mount.unmount();
    };
  }, [getCoordinator]);

  const toggleCamera = useCallback(async () => {
    const { videoTrack } = getCoordinator().getTracks();
    if (!videoTrack) return;

    try {
      if (videoTrack.isMuted) {
        await videoTrack.unmute();
        setCamEnabled(true);
        return;
      }

      await videoTrack.mute();
      setCamEnabled(false);
    } catch (error) {
      console.error('Chuyển trạng thái camera thất bại:', error);
      setVideoError('Không thể bật/tắt camera. Hãy kiểm tra quyền thiết bị.');
    }
  }, [getCoordinator]);

  const toggleMic = useCallback(async () => {
    const { audioTrack } = getCoordinator().getTracks();
    if (!audioTrack) return;

    try {
      if (audioTrack.isMuted) {
        await audioTrack.unmute();
        setMicEnabled(true);
        return;
      }

      await audioTrack.mute();
      setMicEnabled(false);
    } catch (error) {
      console.error('Chuyển trạng thái micro thất bại:', error);
      setVideoError('Không thể bật/tắt micro. Hãy kiểm tra quyền thiết bị.');
    }
  }, [getCoordinator]);

  const stopPublishing = useCallback(async () => {
    const coordinator = getCoordinator();
    await coordinator.stopPublishing();
    if (coordinator.isMounted()) {
      setPublishing(false);
    }
  }, [getCoordinator]);

  const startPublishing = useCallback(
    async (livestreamId: string): Promise<boolean> => {
      const coordinator = getCoordinator();
      setVideoError('');

      try {
        const started = await coordinator.publish({
          fetchToken: async () => {
            const { data } = await apiClient.post<LivekitTokenResponse>(
              `/livestreams/${livestreamId}/token`,
            );
            return { token: data.token, url: data.url };
          },
          createRoom: () => {
            const room = new Room({
              adaptiveStream: true,
              dynacast: true,
            });
            const adapter: LiveKitRoomAdapter = {
              connect: (url, token) => room.connect(url, token),
              disconnect: (stopTracks) => room.disconnect(stopTracks),
              publishTrack: (track, options) =>
                room.localParticipant.publishTrack(
                  track,
                  options as TrackPublishOptions | undefined,
                ),
              unpublishTrack: (track, stopOnUnpublish) =>
                room.localParticipant.unpublishTrack(track, stopOnUnpublish),
            };

            room.on(RoomEvent.Disconnected, () => {
              if (
                coordinator.isMounted() &&
                coordinator.isActiveRoom(adapter)
              ) {
                setPublishing(false);
              }
            });

            return adapter;
          },
          videoPublishOptions: {
            simulcast: true,
            videoEncoding: {
              maxBitrate: VIDEO_PUBLISH_BITRATE,
              maxFramerate: 30,
            },
          },
        });

        if (coordinator.isMounted()) {
          if (started) {
            syncTrackStateFromCoordinator();
          }
          setPublishing(started);
        }
        return started;
      } catch (error) {
        console.error('Phát video LiveKit thất bại:', error);
        await coordinator.stopPublishing();
        if (coordinator.isMounted()) {
          const { videoTrack, audioTrack } = coordinator.getTracks();
          setPublishing(false);
          if (!videoTrack && !audioTrack) {
            setVideoError(
              error instanceof Error
                ? error.message
                : 'Không truy cập được camera/micro. Hãy cấp quyền thiết bị để phát video.',
            );
          } else {
            setVideoError(
              'Phiên Live đã mở nhưng kết nối phát video LiveKit thất bại. Hãy kiểm tra quyền camera hoặc biến LIVEKIT_* trên server.',
            );
          }
        }
        return false;
      }
    },
    [getCoordinator, syncTrackStateFromCoordinator],
  );

  return {
    videoRef,
    camEnabled,
    micEnabled,
    publishing,
    videoError,
    toggleCamera,
    toggleMic,
    startPublishing,
    stopPublishing,
  };
};
