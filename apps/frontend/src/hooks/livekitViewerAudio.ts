export interface MinimalRemoteAudioTrack {
  attach: (element: HTMLMediaElement) => unknown;
  detach: (element: HTMLMediaElement) => unknown;
}

/**
 * Đồng bộ Audio track theo trạng thái mute; chỉ attach khi người xem chủ động bật tiếng
 * để tránh Track.attach() ép element.muted = false và kích hoạt autoplay ngoài ý muốn.
 */
export function syncRemoteAudioAttachment(
  track: MinimalRemoteAudioTrack | null,
  audioEl: HTMLAudioElement | null,
  muted: boolean,
): void {
  if (!track || !audioEl) return;

  if (muted) {
    track.detach(audioEl);
    audioEl.muted = true;
    return;
  }

  track.attach(audioEl);
  audioEl.muted = false;
}
