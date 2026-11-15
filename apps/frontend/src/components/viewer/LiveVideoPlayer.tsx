import React, { type RefObject } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import type { ViewerVideoStatus } from '../../hooks/useLiveKitViewer';
import { surfaceTokens } from '../../theme';

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
        flex: { xs: 'none', md: 2 },
        width: { xs: '100%', md: 'auto' },
        aspectRatio: { xs: '16 / 9', md: 'auto' },
        maxHeight: { xs: '36dvh', md: 'none' },
        minWidth: 0,
        minHeight: { xs: 200, md: 360 },
        bgcolor: surfaceTokens.videoStageBg,
        borderRadius: { xs: 0, md: 3 },
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
          top: { xs: 10, md: 16 },
          left: { xs: 10, md: 16 },
          right: { xs: 10, md: 16 },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            bgcolor: isLive ? surfaceTokens.liveRed : 'rgba(15, 23, 42, 0.8)',
            color: '#FFFFFF',
            px: 1.25,
            py: 0.4,
            borderRadius: 1.5,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            flexShrink: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: isLive ? '#FFFFFF' : '#94A3B8',
            }}
          />
          {isLive ? 'LIVE' : 'OFFLINE'}
        </Box>
        {title && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              bgcolor: 'rgba(15, 23, 42, 0.78)',
              color: '#F8FAFC',
              px: 1.25,
              py: 0.4,
              borderRadius: 1.5,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <LiveTvRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: 'inherit' }}
            >
              {title}
            </Typography>
          </Box>
        )}
      </Box>

      {!showVideoElement && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            color: '#F8FAFC',
            px: 2.5,
            textAlign: 'center',
            zIndex: 5,
            maxWidth: 420,
          }}
        >
          {!isLive ? (
            <>
              <LiveTvRoundedIcon sx={{ fontSize: { xs: 36, md: 48 }, color: '#64748B' }} />
              <Typography
                sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', md: '1.1rem' } }}
              >
                Chưa có phiên Livestream đang phát
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#94A3B8', fontSize: { xs: '0.8rem', md: '0.875rem' } }}
              >
                Video trực tiếp sẽ tự động hiển thị ngay khi Shop bắt đầu phát sóng.
              </Typography>
            </>
          ) : videoStatus === 'connecting' ? (
            <>
              <CircularProgress size={32} color="inherit" />
              <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                Đang kết nối luồng video trực tiếp...
              </Typography>
            </>
          ) : videoStatus === 'error' ? (
            <>
              <VideocamOffRoundedIcon sx={{ fontSize: { xs: 36, md: 44 }, color: '#F87171' }} />
              <Typography variant="body2" sx={{ color: '#F8FAFC' }}>
                {videoError || 'Mất kết nối luồng video livestream.'}
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={onRetry}
                sx={{ mt: 0.5, borderColor: 'rgba(255,255,255,0.4)' }}
              >
                Thử kết nối lại
              </Button>
            </>
          ) : (
            <>
              <VideocamOffRoundedIcon sx={{ fontSize: { xs: 36, md: 44 }, color: '#FBBF24' }} />
              <Typography variant="body2" sx={{ color: '#E2E8F0' }}>
                {videoMutedBySeller
                  ? 'Shop đang tạm tắt camera.'
                  : 'Đang chờ Shop bật luồng video...'}
              </Typography>
            </>
          )}
        </Box>
      )}

      {isLive && (
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 10, md: 16 },
            right: { xs: 10, md: 16 },
            left: { xs: 10, md: 'auto' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            zIndex: 10,
          }}
        >
          {videoError && showVideoElement && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(153, 27, 27, 0.92)',
                color: '#FFFFFF',
                px: 1.25,
                py: 0.5,
                borderRadius: 1,
                minWidth: 0,
              }}
            >
              {videoError}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            color={muted ? 'warning' : 'success'}
            startIcon={muted ? <VolumeOffRoundedIcon /> : <VolumeUpRoundedIcon />}
            onClick={onToggleMute}
            aria-label={muted ? 'Bật âm thanh livestream' : 'Tắt âm thanh livestream'}
            sx={{ fontWeight: 700, flexShrink: 0 }}
          >
            {muted ? 'Bật tiếng' : 'Tắt tiếng'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

