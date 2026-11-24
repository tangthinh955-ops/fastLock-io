import React from 'react';
import { Paper, Typography, Stack, Avatar, Box, Chip } from '@mui/material';
import { PersonOutlined, ChatBubbleOutlined } from '@mui/icons-material';

export interface CommentItem {
    id: string;
    buyerName: string;
    content: string;
    isOrder?: boolean;
    sku?: string;
    orderSuccess?: boolean;
    outOfStock?: boolean;
    createdAt: Date;
}

interface LiveChatSidebarProps {
    comments: CommentItem[];
}

export const LiveChatSidebar: React.FC<LiveChatSidebarProps> = ({ comments }) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                height: { xs: 360, md: 'calc(100dvh - 196px)' },
                minHeight: { md: 460 },
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 3,
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <ChatBubbleOutlined fontSize="small" color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Bình luận trực tiếp ({comments.length})
                </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
                {comments.length === 0 ? (
                    <Stack spacing={1} sx={{ color: 'text.secondary', py: 6, textAlign: 'center', alignItems: 'center' }}>
                        <ChatBubbleOutlined sx={{ fontSize: 32, color: 'text.disabled' }} />
                        <Typography variant="body2">Chưa có bình luận nào...</Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.25}>
                        {comments.map((c) => {
                            const isFailedOrder = Boolean(c.isOrder && (c.orderSuccess === false || c.outOfStock));
                            const isOrderSuccess = Boolean(c.isOrder && !isFailedOrder);
                            return (
                            <Box
                                key={c.id}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isOrderSuccess
                                        ? '#ECFDF5'
                                        : isFailedOrder
                                            ? '#FEF2F2'
                                            : 'background.default',
                                    border: '1px solid',
                                    borderColor: isOrderSuccess
                                        ? '#A7F3D0'
                                        : isFailedOrder
                                            ? '#FECACA'
                                            : 'divider',
                                }}
                            >
                                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: isOrderSuccess
                                                ? 'success.main'
                                                : isFailedOrder
                                                    ? 'error.main'
                                                    : 'primary.main',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PersonOutlined fontSize="small" />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            useFlexGap
                                            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                                        >
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                {c.buyerName}
                                            </Typography>
                                            {isOrderSuccess && c.sku && (
                                                <Chip
                                                    label={`SKU: ${c.sku}`}
                                                    color="success"
                                                    size="small"
                                                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                                                />
                                            )}
                                            {isFailedOrder && c.sku && (
                                                <Chip
                                                    label={`Hết hàng: ${c.sku}`}
                                                    color="error"
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                                                />
                                            )}
                                        </Stack>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isOrderSuccess
                                                    ? '#065F46'
                                                    : isFailedOrder
                                                        ? '#991B1B'
                                                        : 'text.secondary',
                                                mt: 0.25,
                                                overflowWrap: 'anywhere',
                                            }}
                                        >
                                            {c.content}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Paper>
    );
};
