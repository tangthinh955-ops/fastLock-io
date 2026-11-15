import React from 'react';
import { Paper, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { Videocam, VideocamOff, Mic, MicOff } from '@mui/icons-material';
import { surfaceTokens } from '../../theme';

interface WebCamPlayerProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    camEnabled: boolean;
    micEnabled: boolean;
    onToggleCam: () => void;
    onToggleMic: () => void;
}

export const WebCamPlayer: React.FC<WebCamPlayerProps> = ({
    videoRef,
    camEnabled,
    micEnabled,
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
