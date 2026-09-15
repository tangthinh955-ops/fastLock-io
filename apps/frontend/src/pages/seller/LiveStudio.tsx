import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid } from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { StreamControlHeader } from '../../components/stream/StreamControlHeader';
import { WebCamPlayer } from '../../components/stream/WebCamPlayer';
import { RecentOrdersList, type OrderNotification } from '../../components/stream/RecentOrdersList';
import { LiveChatSidebar, type CommentItem } from '../../components/stream/LiveChatSidebar';

export const LiveStudio: React.FC = () => {
    const { user } = useAuth();
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamTitle, setStreamTitle] = useState('PHIÊN LIVESTREAM CHỐT ĐƠN HÔM NAY 🚀');
    const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

    const [camEnabled, setCamEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const [comments, setComments] = useState<CommentItem[]>([]);
    const [recentOrders, setRecentOrders] = useState<OrderNotification[]>([]);
    const [latestOrder, setLatestOrder] = useState<OrderNotification | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const API_BASE = 'http://localhost:3001';

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error('Khởi động WebCam thất bại:', err);
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    };

    const toggleCamera = () => {
        if (mediaStreamRef.current) {
            const track = mediaStreamRef.current.getVideoTracks()[0];
            if (track) { track.enabled = !track.enabled; setCamEnabled(track.enabled); }
        }
    };

    const toggleMic = () => {
        if (mediaStreamRef.current) {
            const track = mediaStreamRef.current.getAudioTracks()[0];
            if (track) { track.enabled = !track.enabled; setMicEnabled(track.enabled); }
        }
    };

    const handleStartLive = async () => {
        if (!user) return;
        try {
            const res = await axios.post(`${API_BASE}/livestreams`, { title: streamTitle, sellerId: user.id });
            const streamData = res.data;
            setCurrentStreamId(streamData.id);
            setIsStreaming(true);

            const socket = io(API_BASE);
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
        } catch (err) {
            alert('Không thể tạo phiên Live. Vui lòng kiểm tra lại Backend NestJS!');
        }
    };

    const handleEndLive = async () => {
        if (currentStreamId) {
            try { await axios.patch(`${API_BASE}/livestreams/${currentStreamId}/end`); } catch {}
        }
        if (socketRef.current) {
            socketRef.current.emit('leave_room', { livestreamId: currentStreamId });
            socketRef.current.disconnect();
        }
        setIsStreaming(false);
        setCurrentStreamId(null);
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#0f0f1e', minHeight: '100vh', color: '#ffffff' }}>
            <StreamControlHeader
                isStreaming={isStreaming} streamTitle={streamTitle}
                onTitleChange={setStreamTitle} onStartLive={handleStartLive} onEndLive={handleEndLive}
            />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <WebCamPlayer
                        videoRef={videoRef} camEnabled={camEnabled} micEnabled={micEnabled}
                        onToggleCam={toggleCamera} onToggleMic={toggleMic}
                    />
                    <RecentOrdersList latestOrder={latestOrder} recentOrders={recentOrders} />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <LiveChatSidebar comments={comments} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default LiveStudio;
