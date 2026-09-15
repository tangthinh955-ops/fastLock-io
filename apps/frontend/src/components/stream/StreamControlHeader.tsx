import React from 'react';
import { Paper, Grid, Box, Chip, TextField, Button } from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';

interface StreamControlHeaderProps {
    isStreaming: boolean;
    streamTitle: string;
    onTitleChange: (title: string) => void;
    onStartLive: () => void;
    onEndLive: () => void;
}

export const StreamControlHeader: React.FC<StreamControlHeaderProps> = ({
    isStreaming,
    streamTitle,
    onTitleChange,
    onStartLive,
    onEndLive,
}) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                mb: 3,
                background: 'rgba(26, 26, 46, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
            }}
        >
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={isStreaming ? '🔴 ĐANG PHÁT LIVE' : '⚪ CHỜ PHÁT SÓNG'}
                            color={isStreaming ? 'error' : 'default'}
                            sx={{ fontWeight: 'bold', px: 1 }}
                        />
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            disabled={isStreaming}
                            value={streamTitle}
                            onChange={(e) => onTitleChange(e.target.value)}
                            sx={{
                                input: { color: '#fff' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                },
                            }}
                        />
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {!isStreaming ? (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<PlayArrow />}
                            onClick={onStartLive}
                            sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                        >
                            Bắt đầu Livestream
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<Stop />}
                            onClick={onEndLive}
                            sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                        >
                            Kết thúc Live
                        </Button>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
};
