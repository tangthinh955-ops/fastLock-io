import React from 'react';
import { Paper, Stack, Chip, TextField, Button } from '@mui/material';
import { PlayArrow, Stop, FiberManualRecord } from '@mui/icons-material';

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
            variant="outlined"
            sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 3,
            }}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
            >
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, flex: 1, minWidth: 0 }}
                >
                    <Chip
                        icon={<FiberManualRecord sx={{ fontSize: 12 }} />}
                        label={isStreaming ? 'Đang phát Live' : 'Chờ phát sóng'}
                        color={isStreaming ? 'error' : 'default'}
                        variant={isStreaming ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, flexShrink: 0 }}
                    />
                    <TextField
                        fullWidth
                        label="Tiêu đề phiên livestream"
                        variant="outlined"
                        size="small"
                        disabled={isStreaming}
                        value={streamTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                    />
                </Stack>

                <Stack direction="row" sx={{ flexShrink: 0 }}>
                    {!isStreaming ? (
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            startIcon={<PlayArrow />}
                            onClick={onStartLive}
                            sx={{ minHeight: 44, borderRadius: 2, px: 3, fontWeight: 700 }}
                        >
                            Bắt đầu Livestream
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            startIcon={<Stop />}
                            onClick={onEndLive}
                            sx={{ minHeight: 44, borderRadius: 2, px: 3, fontWeight: 700 }}
                        >
                            Kết thúc Live
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
};
