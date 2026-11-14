import React, { type RefObject } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import type { ViewerVideoStatus } from '../../hooks/useLiveKitViewer';

interface LiveVideoPlayerProps {
  isLive: boolean;
  title?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  videoStatus: ViewerVideoStatus;
  hasVideo: boolean;
  videoMutedBySeller: boolean;
  muted: boolean;
  videoError: string;
  onToggleMute: () => void;
  onRetry: () => void;
}

export const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({
  isLive,
  title,
  videoRef,
  audioRef,
  videoStatus,
  hasVideo,
  videoMutedBySeller,
  muted,
  videoError,
  onToggleMute,
  onRetry,
}) => {
  const showVideoElement = isLive && hasVideo && !videoMutedBySeller;

  return (
    <Box
      sx={{
        flex: 2,
        bgcolor: '#0b1120',
        borderRadius: 2,
        mr: 2,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: showVideoElement ? 'block' : 'none',
        }}
      />
      <audio ref={audioRef} autoPlay muted={muted} style={{ display: 'none' }} />

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            bgcolor: isLive ? '#dc2626' : '#64748b',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {isLive ? 'LIVE' : 'OFFLINE'}
        </Box>
        {title && (
          <Typography
            variant="subtitle1"
            color="white"
            noWrap
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.72)',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            📺 {title}
          </Typography>
        )}
      </Box>

      {!showVideoElement && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            color: 'rgba(255,255,255,0.88)',
            px: 3,
            textAlign: 'center',
            zIndex: 5,
          }}
        >
          {!isLive ? (
            <>
              <LiveTvIcon sx={{ fontSize: 56, color: '#64748b' }} />
              <Typography variant="h6">
                [CHƯA CÓ LIVESTREAM ĐANG PHÁT]
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Khi Seller bấm Bắt đầu Livestream, video trực tiếp sẽ tự động hiển thị tại đây.
              </Typography>
            </>
          ) : videoStatus === 'connecting' ? (
            <>
              <CircularProgress size={36} color="inherit" />
              <Typography variant="body1">
                Đang kết nối luồng video LiveKit...
              </Typography>
            </>
          ) : videoStatus === 'error' ? (
            <>
              <VideocamOffIcon sx={{ fontSize: 48, color: '#f87171' }} />
              <Typography variant="body1">
                {videoError || 'Mất kết nối luồng video livestream.'}
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Thử kết nối lại
              </Button>
            </>
          ) : (
            <>
              <VideocamOffIcon sx={{ fontSize: 48, color: '#fbbf24' }} />
              <Typography variant="body1">
                {videoMutedBySeller
                  ? 'Seller đang tạm tắt camera.'
                  : 'Đang chờ Seller bật luồng video...'}
              </Typography>
            </>
          )}
        </Box>
      )}

      {isLive && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 10,
          }}
        >
          {videoError && showVideoElement && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(185, 28, 28, 0.85)',
                color: 'white',
                px: 1.25,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {videoError}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            color={muted ? 'warning' : 'success'}
            startIcon={muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            onClick={onToggleMute}
            sx={{ fontWeight: 'bold' }}
          >
            {muted ? 'Bật tiếng' : 'Tắt tiếng'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

