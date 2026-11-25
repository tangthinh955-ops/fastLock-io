import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Box, Container, Grid } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { SOCKET_URL } from '../../config/env';
import { useLiveKitPublisher } from '../../hooks/useLiveKitPublisher';
import { StreamControlHeader } from '../../components/stream/StreamControlHeader';
import { LiveSetupModal, type LiveSetupData } from '../../components/stream/LiveSetupModal';
import { LiveInventoryList } from '../../components/stream/LiveInventoryList';
import { WebCamPlayer } from '../../components/stream/WebCamPlayer';
import { RecentOrdersList, type OrderNotification } from '../../components/stream/RecentOrdersList';
import { LiveChatSidebar, type CommentItem } from '../../components/stream/LiveChatSidebar';

export const LiveStudio: React.FC = () => {
    const { user, token } = useAuth();
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamTitle, setStreamTitle] = useState('Phiên Livestream chốt đơn hôm nay');
    const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
    const [streamError, setStreamError] = useState<string>('');
    const [setupModalOpen, setSetupModalOpen] = useState(false);
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
    const [viewerCount, setViewerCount] = useState<number>(0);
    const socketRef = useRef<Socket | null>(null);
    const latestOrderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const attachStreamSocket = useCallback(
        (streamId: string) => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            const socket = io(SOCKET_URL, {
                auth: { token },
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join_room', { livestreamId: streamId });
            });

            socket.on(
                'room_joined',
                (data: { livestreamId?: string; viewerCount?: number }) => {
                    if (
                        data.livestreamId === streamId &&
                        typeof data.viewerCount === 'number'
                    ) {
                        setViewerCount(data.viewerCount);
                    }
                },
            );

            socket.on(
                'viewer_count',
                (data: { livestreamId?: string; viewerCount?: number }) => {
                    if (
                        data.livestreamId === streamId &&
                        typeof data.viewerCount === 'number'
                    ) {
                        setViewerCount(data.viewerCount);
                    }
                },
            );

            socket.on('comment_received', (comment: CommentItem) => {
                setComments((prev) => [comment, ...prev]);
            });

            socket.on('new_order', (orderData: OrderNotification) => {
                setLatestOrder(orderData);
                setRecentOrders((prev) => [orderData, ...prev]);
                if (latestOrderTimerRef.current) {
                    clearTimeout(latestOrderTimerRef.current);
                }
                latestOrderTimerRef.current = setTimeout(() => {
                    latestOrderTimerRef.current = null;
                    setLatestOrder(null);
                }, 6000);
            });
        },
        [token],
    );

    useEffect(() => {
        studioMountedRef.current = true;
        return () => {
            studioMountedRef.current = false;
            activeStreamIdRef.current = null;
            if (latestOrderTimerRef.current) {
                clearTimeout(latestOrderTimerRef.current);
                latestOrderTimerRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isStreaming) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isStreaming]);

    useEffect(() => {
        if (!user?.id || !token || activeStreamIdRef.current || startingRef.current) {
            return;
        }

        let cancelled = false;

        const restoreActiveStream = async () => {
            try {
                const res = await apiClient.get<{
                    id?: string;
                    title?: string;
                    status?: string;
                } | null>(`/livestreams/active/seller/${user.id}`);

                if (
                    cancelled ||
                    !studioMountedRef.current ||
                    activeStreamIdRef.current ||
                    startingRef.current
                ) {
                    return;
                }

                if (res.data && res.data.id && res.data.status === 'LIVE') {
                    activeStreamIdRef.current = res.data.id;
                    sessionStorage.setItem('active_seller_stream_id', res.data.id);
                    setCurrentStreamId(res.data.id);
                    if (res.data.title) {
                        setStreamTitle(res.data.title);
                    }
                    setIsStreaming(true);
                    attachStreamSocket(res.data.id);
                    void startPublishing(res.data.id);
                } else {
                    sessionStorage.removeItem('active_seller_stream_id');
                }
            } catch {
                // Bỏ qua lỗi khôi phục phiên live để không cản trở thao tác tạo phiên mới
            }
        };

        void restoreActiveStream();

        return () => {
            cancelled = true;
        };
    }, [user?.id, token, attachStreamSocket, startPublishing]);

    const handleStartLive = async (setupData?: LiveSetupData) => {
        if (!user || isStreaming || startingRef.current) return;
        startingRef.current = true;
        setStreamError('');
        try {
            const title = setupData?.title || streamTitle;
            const res = await apiClient.post('/livestreams', {
                title,
                description: setupData?.description || '',
                productIds: setupData?.productIds || [],
            });
            const streamData = res.data;

            if (!studioMountedRef.current) {
                sessionStorage.removeItem('active_seller_stream_id');
                void apiClient.patch(`/livestreams/${streamData.id}/end`).catch(() => {});
                return;
            }

            if (latestOrderTimerRef.current) {
                clearTimeout(latestOrderTimerRef.current);
                latestOrderTimerRef.current = null;
            }
            setComments([]);
            setRecentOrders([]);
            setLatestOrder(null);
            setViewerCount(0);

            activeStreamIdRef.current = streamData.id;
            sessionStorage.setItem('active_seller_stream_id', streamData.id);
            setCurrentStreamId(streamData.id);
            setStreamTitle(streamData.title || title);
            setIsStreaming(true);
            setSetupModalOpen(false);

            attachStreamSocket(streamData.id);

            await startPublishing(streamData.id);
        } catch {
            if (studioMountedRef.current) {
                setStreamError('Không thể tạo phiên Live. Vui lòng kiểm tra lại kết nối máy chủ Backend!');
            }
        } finally {
            startingRef.current = false;
        }
    };

    const handleEndLive = async () => {
        const targetStreamId = activeStreamIdRef.current ?? currentStreamId;
        activeStreamIdRef.current = null;
        sessionStorage.removeItem('active_seller_stream_id');
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
            setViewerCount(0);
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
                    onStartLive={() => setSetupModalOpen(true)}
                    onEndLive={handleEndLive}
                />

                <LiveSetupModal
                    open={setupModalOpen}
                    loading={startingRef.current}
                    onClose={() => setSetupModalOpen(false)}
                    onStartLive={handleStartLive}
                />

                {streamError && (
                    <Alert
                        severity="error"
                        onClose={() => setStreamError('')}
                        sx={{ mb: 2, borderRadius: 2 }}
                    >
                        {streamError}
                    </Alert>
                )}

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
                            isStreaming={isStreaming}
                            viewerCount={viewerCount}
                            onToggleCam={() => { void toggleCamera(); }}
                            onToggleMic={() => { void toggleMic(); }}
                        />
                        {isStreaming && (
                            <Box sx={{ mt: 2.5 }}>
                                <LiveInventoryList
                                    livestreamId={currentStreamId}
                                    refreshTrigger={recentOrders.length}
                                />
                            </Box>
                        )}
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
