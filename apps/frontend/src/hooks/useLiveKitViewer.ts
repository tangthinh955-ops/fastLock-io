import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type RemoteTrack,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from 'livekit-client';
import apiClient from '../api/client';
import { syncRemoteAudioAttachment } from './livekitViewerAudio';

export type ViewerVideoStatus =
  | 'idle'
  | 'connecting'
  | 'waiting_track'
  | 'playing'
  | 'error';

interface LivekitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  canPublish: boolean;
}

interface UseLiveKitViewerOptions {
  livestreamId?: string;
  isLive: boolean;
  authToken?: string | null;
}

export const useLiveKitViewer = ({
  livestreamId,
  isLive,
  authToken,
}: UseLiveKitViewerOptions) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const remoteAudioTrackRef = useRef<RemoteTrack | null>(null);
  const mutedRef = useRef(true);

  const [videoStatus, setVideoStatus] = useState<ViewerVideoStatus>('idle');
  const [hasVideo, setHasVideo] = useState(false);
  const [videoMutedBySeller, setVideoMutedBySeller] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState('');
  const [retrySeed, setRetrySeed] = useState(0);

  const retry = useCallback(() => {
    setRetrySeed((seed) => seed + 1);
  }, []);

  const toggleMute = useCallback(async () => {
    const nextMuted = !mutedRef.current;
    const activeRoom = roomRef.current;

    if (!nextMuted && activeRoom) {
      try {
        await activeRoom.startAudio();
      } catch {
        setVideoError(
          'Trình duyệt đang chặn tự phát âm thanh. Hãy bấm lại nút Bật tiếng.',
        );
        return;
      }
    }

    mutedRef.current = nextMuted;
    setMuted(nextMuted);
    setVideoError('');

    syncRemoteAudioAttachment(
      remoteAudioTrackRef.current,
      audioRef.current,
      nextMuted,
    );

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted) {
        void audioRef.current.play().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    remoteAudioTrackRef.current = null;
    if (!isLive || !livestreamId || !authToken) {
      roomRef.current = null;
      setVideoStatus('idle');
      setHasVideo(false);
      setVideoMutedBySeller(false);
      setVideoError('');
      return;
    }

    let cancelled = false;
    let activeRoom: Room | null = null;
    let remoteVideoTrack: RemoteTrack | null = null;
    let remoteAudioTrack: RemoteTrack | null = null;

    setVideoStatus('connecting');
    setHasVideo(false);
    setVideoMutedBySeller(false);
    setVideoError('');

    const connectRoom = async () => {
      try {
        const { data } = await apiClient.post<LivekitTokenResponse>(
          `/livestreams/${livestreamId}/token`,
        );

        if (cancelled) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        activeRoom = room;
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
          if (cancelled) return;

          if (track.kind === Track.Kind.Video) {
            remoteVideoTrack?.detach();
            remoteVideoTrack = track;
            if (videoRef.current) {
              track.attach(videoRef.current);
            }
            setHasVideo(true);
            setVideoMutedBySeller(track.isMuted);
            setVideoStatus('playing');
          } else if (track.kind === Track.Kind.Audio) {
            remoteAudioTrack?.detach();
            remoteAudioTrack = track;
            remoteAudioTrackRef.current = track;
            syncRemoteAudioAttachment(track, audioRef.current, mutedRef.current);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
          if (cancelled) return;

          if (track.kind === Track.Kind.Video) {
            remoteVideoTrack = null;
            setHasVideo(false);
            setVideoMutedBySeller(false);
            setVideoStatus('waiting_track');
          } else if (track.kind === Track.Kind.Audio) {
            remoteAudioTrack = null;
            if (remoteAudioTrackRef.current === track) {
              remoteAudioTrackRef.current = null;
            }
          }
        });

        const handleMuteChange = (publication: TrackPublication) => {
          if (!cancelled && publication.kind === Track.Kind.Video) {
            setVideoMutedBySeller(publication.isMuted);
          }
        };

        room.on(RoomEvent.TrackMuted, handleMuteChange);
        room.on(RoomEvent.TrackUnmuted, handleMuteChange);

        room.on(RoomEvent.Disconnected, () => {
          if (cancelled) return;
          remoteAudioTrackRef.current = null;
          setHasVideo(false);
          setVideoMutedBySeller(false);
          setVideoStatus((current) => (current === 'idle' ? 'idle' : 'error'));
        });

        await room.connect(data.url, data.token);

        if (cancelled) {
          await room.disconnect();
          return;
        }

        setVideoStatus((current) =>
          current === 'playing' ? 'playing' : 'waiting_track',
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Kết nối LiveKit Viewer thất bại:', error);
        setHasVideo(false);
        setVideoStatus('error');
        setVideoError('Không thể kết nối luồng video livestream.');
      }
    };

    void connectRoom();

    return () => {
      cancelled = true;
      roomRef.current = null;
      remoteVideoTrack?.detach();
      remoteAudioTrack?.detach();
      void activeRoom?.disconnect();
    };
  }, [authToken, isLive, livestreamId, retrySeed]);

  return {
    videoRef,
    audioRef,
    videoStatus,
    hasVideo,
    videoMutedBySeller,
    muted,
    videoError,
    toggleMute,
    retry,
  };
};

