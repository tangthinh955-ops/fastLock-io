import React from 'react';
import { Box, Paper, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { Videocam, VideocamOff, Mic, MicOff, VisibilityOutlined } from '@mui/icons-material';
import { surfaceTokens } from '../../theme';

interface WebCamPlayerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    camEnabled: boolean;
    micEnabled: boolean;
    isStreaming?: boolean;
    viewerCount?: number;
    onToggleCam: () => void;
    onToggleMic: () => void;
}

export const WebCamPlayer: React.FC<WebCamPlayerProps> = ({
    videoRef,
    camEnabled,
    micEnabled,
    isStreaming = false,
    viewerCount = 0,
    onToggleCam,
    onToggleMic,
}) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: surfaceTokens.videoStageBg,
                aspectRatio: '16/9',
                maxHeight: { xs: '42dvh', md: 'none' },
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: 'divider',
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
                    objectFit: 'cover',
                    filter: camEnabled ? 'none' : 'brightness(0.2)',
                }}
            />

            {isStreaming && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: surfaceTokens.liveRed,
                            color: '#FFFFFF',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: 1.5,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                        }}
                    >
                        <Box
                            component="span"
                            sx={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                bgcolor: '#FFFFFF',
                            }}
                        />
                        LIVE
                    </Box>
                    <Box
                        aria-label={`${viewerCount} người đang xem`}
                        sx={{
                            bgcolor: 'rgba(15, 23, 42, 0.84)',
                            color: '#FFFFFF',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: 1.5,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.65,
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        <VisibilityOutlined sx={{ fontSize: 15 }} />
                        {viewerCount.toLocaleString('vi-VN')} mắt xem
                    </Box>
                </Stack>
            )}

            {!camEnabled && (
                <Stack
                    spacing={1}
                    sx={{ position: 'absolute', pointerEvents: 'none', px: 2, textAlign: 'center', alignItems: 'center' }}
                >
                    <VideocamOff sx={{ fontSize: 36, color: '#F59E0B' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                        Camera đã tắt
                    </Typography>
                </Stack>
            )}

            <Stack
                direction="row"
                spacing={1.5}
                sx={{
                    position: 'absolute',
                    bottom: 14,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 999,
                    bgcolor: 'rgba(15, 23, 42, 0.86)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Tooltip title={camEnabled ? 'Tắt camera' : 'Bật camera'}>
                    <IconButton
                        onClick={onToggleCam}
                        aria-label={camEnabled ? 'Tắt camera' : 'Bật camera'}
                        sx={{
                            width: 44,
                            height: 44,
                            color: '#FFFFFF',
                            bgcolor: camEnabled ? 'rgba(255, 255, 255, 0.14)' : '#DC2626',
                            '&:hover': {
                                bgcolor: camEnabled ? 'rgba(255, 255, 255, 0.24)' : '#B91C1C',
                            },
                        }}
                    >
                        {camEnabled ? <Videocam /> : <VideocamOff />}
                    </IconButton>
                </Tooltip>

                <Tooltip title={micEnabled ? 'Tắt micro' : 'Bật micro'}>
                    <IconButton
                        onClick={onToggleMic}
                        aria-label={micEnabled ? 'Tắt micro' : 'Bật micro'}
                        sx={{
                            width: 44,
                            height: 44,
                            color: '#FFFFFF',
                            bgcolor: micEnabled ? 'rgba(255, 255, 255, 0.14)' : '#DC2626',
                            '&:hover': {
                                bgcolor: micEnabled ? 'rgba(255, 255, 255, 0.24)' : '#B91C1C',
                            },
                        }}
                    >
                        {micEnabled ? <Mic /> : <MicOff />}
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};
