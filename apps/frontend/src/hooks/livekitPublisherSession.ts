export interface MinimalLocalTrack {
  kind: string;
  isMuted: boolean;
  stop: () => void;
  attach: (element: HTMLMediaElement) => unknown;
  detach: () => unknown;
  mute: () => Promise<unknown>;
  unmute: () => Promise<unknown>;
}

export interface MinimalRoomLike<
  TTrack extends MinimalLocalTrack = MinimalLocalTrack,
> {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: (stopTracks?: boolean) => Promise<void>;
  publishTrack: (track: TTrack, options?: unknown) => Promise<unknown>;
  unpublishTrack: (track: TTrack, stopOnUnpublish?: boolean) => Promise<unknown>;
}

export interface AcquiredTracksResult<
  TTrack extends MinimalLocalTrack = MinimalLocalTrack,
> {
  videoTrack: TTrack | null;
  audioTrack: TTrack | null;
  warning: string;
}

export interface MountPreviewResult<
  TTrack extends MinimalLocalTrack = MinimalLocalTrack,
> {
  adopted: boolean;
  videoTrack: TTrack | null;
  audioTrack: TTrack | null;
  warning: string;
}

export interface PublishAttemptParams<
  TTrack extends MinimalLocalTrack,
  TRoom extends MinimalRoomLike<TTrack>,
> {
  fetchToken: () => Promise<{ token: string; url: string }>;
  createRoom: () => TRoom;
  videoPublishOptions?: unknown;
  onStartError?: (error: unknown) => void;
}

/**
 * Thu luồng camera/micro một lần; chỉ fallback sang audio-only/video-only kèm cảnh báo rõ ràng.
 */
export async function acquireMediaTracksWithWarning<
  TTrack extends MinimalLocalTrack,
  TVideoOption = boolean,
>(
  createTracksFn: (options: {
    audio?: boolean;
    video?: TVideoOption | boolean;
  }) => Promise<TTrack[]>,
  videoOption?: TVideoOption,
): Promise<AcquiredTracksResult<TTrack>> {
  const resolvedVideoOption: TVideoOption | boolean = videoOption ?? true;
  const splitTracks = (tracks: TTrack[]) => ({
    videoTrack: tracks.find((track) => track.kind === 'video') ?? null,
    audioTrack: tracks.find((track) => track.kind === 'audio') ?? null,
  });

  try {
    const tracks = await createTracksFn({
      audio: true,
      video: resolvedVideoOption,
    });
    const { videoTrack, audioTrack } = splitTracks(tracks);
    return { videoTrack, audioTrack, warning: '' };
  } catch {
    try {
      const tracks = await createTracksFn({ video: resolvedVideoOption });
      const { videoTrack } = splitTracks(tracks);
      return {
        videoTrack,
        audioTrack: null,
        warning: 'Không truy cập được micro — đang phát chỉ có hình ảnh.',
      };
    } catch {
      try {
        const tracks = await createTracksFn({ audio: true });
        const { audioTrack } = splitTracks(tracks);
        return {
          videoTrack: null,
          audioTrack,
          warning:
            'Không truy cập được camera (có thể đang bị ứng dụng khác sử dụng) — đang chỉ có âm thanh.',
        };
      } catch {
        throw new Error(
          'Không truy cập được camera/micro. Hãy cấp quyền thiết bị để phát video.',
        );
      }
    }
  }
}

/**
 * Bộ điều phối vòng đời preview và publish LiveKit cho Seller, chống race condition StrictMode/unmount.
 */
export function createPublisherCoordinator<
  TTrack extends MinimalLocalTrack,
  TRoom extends MinimalRoomLike<TTrack>,
>({
  acquireTracks,
}: {
  acquireTracks: () => Promise<AcquiredTracksResult<TTrack>>;
}) {
  let activeMounts = 0;
  let pendingAcquire: Promise<AcquiredTracksResult<TTrack>> | null = null;
  let videoTrack: TTrack | null = null;
  let audioTrack: TTrack | null = null;
  let warning = '';
  let publishGeneration = 0;
  let activeRoom: TRoom | null = null;

  const stopTracks = () => {
    const currentVideo = videoTrack;
    const currentAudio = audioTrack;
    videoTrack = null;
    audioTrack = null;
    warning = '';
    currentVideo?.detach();
    currentVideo?.stop();
    currentAudio?.stop();
  };

  const ensureSingleFlightAcquire = () => {
    if (!pendingAcquire) {
      pendingAcquire = acquireTracks().then(
        (result) => {
          pendingAcquire = null;
          if (activeMounts === 0) {
            result.videoTrack?.stop();
            result.audioTrack?.stop();
            return { videoTrack: null, audioTrack: null, warning: '' };
          }
          videoTrack = result.videoTrack;
          audioTrack = result.audioTrack;
          warning = result.warning;
          return result;
        },
        (error) => {
          pendingAcquire = null;
          throw error;
        },
      );
    }
    return pendingAcquire;
  };

  const stopActiveRoom = async (stopHardwareTracks: boolean) => {
    const room = activeRoom;
    activeRoom = null;
    if (!room) return;

    if (!stopHardwareTracks) {
      for (const track of [videoTrack, audioTrack]) {
        if (track) {
          await room.unpublishTrack(track, false).catch(() => {});
        }
      }
    }

    await room.disconnect(stopHardwareTracks).catch(() => {});
  };

  const mountPreview = () => {
    activeMounts += 1;
    let thisMountAlive = true;

    const ready: Promise<MountPreviewResult<TTrack>> = (async () => {
      if (videoTrack || audioTrack) {
        return {
          adopted: thisMountAlive && activeMounts > 0,
          videoTrack: thisMountAlive ? videoTrack : null,
          audioTrack: thisMountAlive ? audioTrack : null,
          warning: thisMountAlive ? warning : '',
        };
      }

      const result = await ensureSingleFlightAcquire();
      if (!thisMountAlive || activeMounts === 0) {
        return {
          adopted: false,
          videoTrack: null,
          audioTrack: null,
          warning: '',
        };
      }

      return {
        adopted: true,
        videoTrack: result.videoTrack,
        audioTrack: result.audioTrack,
        warning: result.warning,
      };
    })();

    const unmount = () => {
      if (!thisMountAlive) return;
      thisMountAlive = false;
      activeMounts = Math.max(0, activeMounts - 1);

      if (activeMounts === 0) {
        publishGeneration += 1;
        void stopActiveRoom(true);
        stopTracks();
      }
    };

    return { ready, unmount };
  };

  const isSessionValid = (sessionId: number) =>
    activeMounts > 0 && publishGeneration === sessionId;

  const stopPublishing = async () => {
    publishGeneration += 1;
    await stopActiveRoom(false);
  };

  const publish = async ({
    fetchToken,
    createRoom,
    videoPublishOptions,
  }: PublishAttemptParams<TTrack, TRoom>): Promise<boolean> => {
    const sessionId = ++publishGeneration;
    await stopActiveRoom(false);
    if (!isSessionValid(sessionId)) return false;

    if (!videoTrack && !audioTrack) {
      await ensureSingleFlightAcquire();
    }
    if (!isSessionValid(sessionId) || (!videoTrack && !audioTrack)) {
      return false;
    }

    const { token, url } = await fetchToken();
    if (!isSessionValid(sessionId)) {
      return false;
    }

    const room = createRoom();
    activeRoom = room;

    await room.connect(url, token);
    if (!isSessionValid(sessionId)) {
      if (activeRoom === room) {
        activeRoom = null;
      }
      await room.disconnect(activeMounts === 0).catch(() => {});
      return false;
    }

    if (videoTrack) {
      await room.publishTrack(videoTrack, videoPublishOptions);
      if (!isSessionValid(sessionId)) {
        if (activeRoom === room) {
          activeRoom = null;
        }
        await room.disconnect(activeMounts === 0).catch(() => {});
        return false;
      }
    }

    if (audioTrack) {
      await room.publishTrack(audioTrack);
      if (!isSessionValid(sessionId)) {
        if (activeRoom === room) {
          activeRoom = null;
        }
        await room.disconnect(activeMounts === 0).catch(() => {});
        return false;
      }
    }

    return true;
  };

  return {
    mountPreview,
    publish,
    stopPublishing,
    getTracks: () => ({ videoTrack, audioTrack, warning }),
    isMounted: () => activeMounts > 0,
    isActiveRoom: (room: TRoom) => activeRoom === room,
  };
}
