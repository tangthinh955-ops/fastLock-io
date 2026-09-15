import React from 'react';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import { Videocam, VideocamOff, Mic, MicOff } from '@mui/icons-material';

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
            elevation={4}
            sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: '#000',
                aspectRatio: '16/9',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '2px solid rgba(255, 255, 255, 0.1)',
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
                <Typography variant="h6" sx={{ position: 'absolute', color: '#ff9800' }}>
                    Camera đã tắt
                </Typography>
            )}

            <Box
                sx={{
                    position: 'absolute',
                    bottom: 16,
                    display: 'flex',
                    gap: 2,
                    background: 'rgba(0, 0, 0, 0.6)',
                    p: 1,
                    borderRadius: 5,
                    backdropFilter: 'blur(5px)',
                }}
            >
                <IconButton onClick={onToggleCam} color={camEnabled ? 'primary' : 'error'}>
                    {camEnabled ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton onClick={onToggleMic} color={micEnabled ? 'primary' : 'error'}>
                    {micEnabled ? <Mic /> : <MicOff />}
                </IconButton>
            </Box>
        </Paper>
    );
};
