import React, { useState, useEffect, useRef } from 'react';
import { Alert, Box, Container, Grid } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { SOCKET_URL } from '../../config/env';
import { useLiveKitPublisher } from '../../hooks/useLiveKitPublisher';
import { StreamControlHeader } from '../../components/stream/StreamControlHeader';
import { WebCamPlayer } from '../../components/stream/WebCamPlayer';
import { RecentOrdersList, type OrderNotification } from '../../components/stream/RecentOrdersList';
import { LiveChatSidebar, type CommentItem } from '../../components/stream/LiveChatSidebar';

export const LiveStudio: React.FC = () => {
    const { user, token } = useAuth();
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamTitle, setStreamTitle] = useState('Phiên Livestream chốt đơn hôm nay');
    const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
    const startingRef = useRef(false);
    const studioMountedRef = useRef(true);
    const activeStreamIdRef = useRef<string | null>(null);

    const {
        videoRef,
        camEnabled,
        micEnabled,
        videoError,
        toggleCamera,
        toggleMic,
        startPublishing,
        stopPublishing,
    } = useLiveKitPublisher();

    const [comments, setComments] = useState<CommentItem[]>([]);
    const [recentOrders, setRecentOrders] = useState<OrderNotification[]>([]);
    const [latestOrder, setLatestOrder] = useState<OrderNotification | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        studioMountedRef.current = true;
        return () => {
            studioMountedRef.current = false;
            activeStreamIdRef.current = null;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const handleStartLive = async () => {
        if (!user || isStreaming || startingRef.current) return;
        startingRef.current = true;
        try {
            const res = await apiClient.post('/livestreams', { title: streamTitle });
            const streamData = res.data;

            if (!studioMountedRef.current) {
                void apiClient.patch(`/livestreams/${streamData.id}/end`).catch(() => {});
                return;
            }

            activeStreamIdRef.current = streamData.id;
            setCurrentStreamId(streamData.id);
            setIsStreaming(true);

            const socket = io(SOCKET_URL, {
                auth: { token },
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join_room', { livestreamId: streamData.id });
            });

            socket.on('comment_received', (comment: CommentItem) => {
                setComments((prev) => [comment, ...prev]);
            });

            socket.on('new_order', (orderData: OrderNotification) => {
                setLatestOrder(orderData);
                setRecentOrders((prev) => [orderData, ...prev]);
                setTimeout(() => setLatestOrder(null), 6000);
            });

            await startPublishing(streamData.id);
        } catch {
            if (studioMountedRef.current) {
                alert('Không thể tạo phiên Live. Vui lòng kiểm tra lại Backend NestJS!');
            }
        } finally {
            startingRef.current = false;
        }
    };

    const handleEndLive = async () => {
        const targetStreamId = activeStreamIdRef.current ?? currentStreamId;
        activeStreamIdRef.current = null;
        await stopPublishing();
        if (targetStreamId) {
            try { await apiClient.patch(`/livestreams/${targetStreamId}/end`); } catch {}
        }
        if (socketRef.current) {
            socketRef.current.emit('leave_room', { livestreamId: targetStreamId });
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (studioMountedRef.current) {
            setIsStreaming(false);
            setCurrentStreamId(null);
        }
    };

    return (
        <Box
            sx={{
                bgcolor: 'background.default',
                minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
                color: 'text.primary',
                py: { xs: 2, md: 3 },
            }}
        >
            <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
                <StreamControlHeader
                    isStreaming={isStreaming}
                    streamTitle={streamTitle}
                    onTitleChange={setStreamTitle}
                    onStartLive={handleStartLive}
                    onEndLive={handleEndLive}
                />

                {videoError && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        {videoError}
                    </Alert>
                )}

                <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <WebCamPlayer
                            videoRef={videoRef}
                            camEnabled={camEnabled}
                            micEnabled={micEnabled}
                            onToggleCam={() => { void toggleCamera(); }}
                            onToggleMic={() => { void toggleMic(); }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                        <RecentOrdersList latestOrder={latestOrder} recentOrders={recentOrders} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                        <LiveChatSidebar comments={comments} />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default LiveStudio;
