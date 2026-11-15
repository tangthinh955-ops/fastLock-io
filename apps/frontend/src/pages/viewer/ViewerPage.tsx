import React, { useEffect, useRef, useState } from 'react';
import { Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LiveCommentPanel } from '../../components/viewer/LiveCommentPanel';
import { LiveVideoPlayer } from '../../components/viewer/LiveVideoPlayer';
import { useAuth } from '../../context/AuthContext';
import { useLiveKitViewer } from '../../hooks/useLiveKitViewer';
import { useViewerLivestream } from '../../hooks/useViewerLivestream';

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const livestream = useViewerLivestream({
    buyerId: user?.id,
    buyerName: user?.name,
    token,
  });
  const livekit = useLiveKitViewer({
    livestreamId: livestream.activeStream?.id,
    isLive: Boolean(livestream.activeStream),
    authToken: token,
  });
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [livestream.comments]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    if (livestream.sendComment(text)) {
      setInputText('');
    }
  };

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        flex: 1,
        minHeight: 0,
        height: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
        px: { xs: 0, md: 3 },
        py: { xs: 0, md: 2.5 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 0, md: 2.5 },
        }}
      >
        <LiveVideoPlayer
          isLive={Boolean(livestream.activeStream)}
          title={livestream.activeStream?.title}
          videoRef={livekit.videoRef}
          audioRef={livekit.audioRef}
          videoStatus={livekit.videoStatus}
          hasVideo={livekit.hasVideo}
          videoMutedBySeller={livekit.videoMutedBySeller}
          muted={livekit.muted}
          videoError={livekit.videoError}
          onToggleMute={() => {
            void livekit.toggleMute();
          }}
          onRetry={livekit.retry}
        />

        <LiveCommentPanel
          activeStream={livestream.activeStream}
          loading={livestream.loading}
          connected={livestream.connected}
          error={livestream.error}
          comments={livestream.comments}
          currentUserName={user?.name}
          inputText={inputText}
          onInputChange={setInputText}
          onSend={handleSendMessage}
          onRetry={livestream.loadActiveStream}
          onOpenConsult={() => {
            if (livestream.activeStream?.sellerId) {
              navigate(`/inbox?sellerId=${livestream.activeStream.sellerId}`);
            }
          }}
          chatEndRef={chatEndRef}
        />
      </Box>
    </Container>
  );
};

export default ViewerPage;
