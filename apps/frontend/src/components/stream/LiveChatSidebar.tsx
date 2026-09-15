import React from 'react';
import { Paper, Typography, Divider, List, ListItem, ListItemAvatar, Avatar, ListItemText, Box, Chip } from '@mui/material';
import { Person } from '@mui/icons-material';

export interface CommentItem {
    id: string;
    buyerName: string;
    content: string;
    isOrder?: boolean;
    sku?: string;
    orderSuccess?: boolean;
    createdAt: Date;
}

interface LiveChatSidebarProps {
    comments: CommentItem[];
}

export const LiveChatSidebar: React.FC<LiveChatSidebarProps> = ({ comments }) => {
    return (
        <Paper
            elevation={4}
            sx={{
                p: 2,
                height: '75vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#1a1a2e',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                💬 Bình luận Trực tiếp ({comments.length})
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

            <List sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {comments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', color: '#888', mt: 5 }}>
                        Chưa có bình luận nào...
                    </Box>
                ) : (
                    comments.map((c) => (
                        <ListItem
                            key={c.id}
                            alignItems="flex-start"
                            sx={{
                                mb: 1.5,
                                borderRadius: 2,
                                background: c.isOrder ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.05)',
                                border: c.isOrder ? '1px solid #4caf50' : 'none',
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: c.isOrder ? '#4caf50' : '#3f51b5' }}>
                                    <Person />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                            {c.buyerName}
                                        </Typography>
                                        {c.isOrder && (
                                            <Chip label={`SKU: ${c.sku}`} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Typography variant="body2" sx={{ color: c.isOrder ? '#a5d6a7' : '#ddd', mt: 0.5 }}>
                                        {c.content}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </Paper>
    );
};
