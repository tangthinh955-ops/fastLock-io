import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveCommentPanel } from '../../components/viewer/LiveCommentPanel';
import { LiveShopChatWidget } from '../../components/viewer/LiveShopChatWidget';
import { LiveVideoPlayer } from '../../components/viewer/LiveVideoPlayer';
import { ShopLiveDirectory } from '../../components/viewer/ShopLiveDirectory';
import { useAuth } from '../../context/AuthContext';
import { useLiveKitViewer } from '../../hooks/useLiveKitViewer';
import { useViewerLivestream } from '../../hooks/useViewerLivestream';
import { surfaceTokens } from '../../theme';

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSellerId = searchParams.get('sellerId');
  const chatParam = searchParams.get('chat');
  const { user, token } = useAuth();
  const livestream = useViewerLivestream({
    buyerId: user?.id,
    buyerName: user?.name,
    token,
    selectedSellerId,
  });
  const livekit = useLiveKitViewer({
    livestreamId: livestream.activeStream?.id,
    isLive: Boolean(livestream.activeStream),
    authToken: token,
  });
  const [inputText, setInputText] = useState('');
  const [chatWidgetOpen, setChatWidgetOpen] = useState<boolean>(
    () => searchParams.get('chat') === 'open',
  );
  const prevSellerIdRef = useRef<string | null>(selectedSellerId);
  const prevChatParamRef = useRef<string | null>(chatParam);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputText('');
  }, [selectedSellerId]);

  useEffect(() => {
    if (!selectedSellerId) {
      setChatWidgetOpen(false);
    } else if (chatParam === 'open') {
      setChatWidgetOpen(true);
    } else if (
      prevSellerIdRef.current !== selectedSellerId ||
      prevChatParamRef.current === 'open'
    ) {
      setChatWidgetOpen(false);
    }
    prevSellerIdRef.current = selectedSellerId;
    prevChatParamRef.current = chatParam;
  }, [selectedSellerId, chatParam]);

  useEffect(() => {
    if (livestream.comments.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [livestream.comments]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    if (livestream.sendComment(text)) {
      setInputText('');
    }
  };

  const liveShopsCount = livestream.shops.filter((shop) => shop.isLive).length;
  const otherLiveCount = livestream.shops.filter(
    (shop) => shop.isLive && shop.id !== selectedSellerId,
  ).length;
  const currentShopName =
    livestream.selectedShop?.name ||
    livestream.activeStream?.seller.name ||
    'Phòng Livestream';
  const isShopLive = Boolean(livestream.activeStream);

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={
        selectedSellerId
          ? {
              flex: 1,
              minHeight: 0,
              height: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
              px: { xs: 0, md: 3 },
              py: { xs: 0, md: 2.5 },
              display: 'flex',
              flexDirection: 'column',
            }
          : {
              flex: 1,
              px: { xs: 2, md: 3 },
              py: { xs: 2.5, md: 3 },
              display: 'flex',
              flexDirection: 'column',
            }
      }
    >
      {!selectedSellerId ? (
        <ShopLiveDirectory
          shops={livestream.shops}
          loading={livestream.loading}
          error={livestream.error}
          onRefresh={livestream.loadActiveStream}
          onSelectShop={(id) => setSearchParams({ sellerId: id })}
          onOpenConsult={(id) => setSearchParams({ sellerId: id, chat: 'open' })}
        />
      ) : (
        <>
          {/* Selected Room Top Bar */}
          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              px: { xs: 1.5, md: 0 },
              py: { xs: 1, md: 0 },
              mb: { xs: 0, md: 1.5 },
              bgcolor: { xs: 'background.paper', md: 'transparent' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSearchParams({})}
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  borderColor: 'divider',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  flexShrink: 0,
                }}
              >
                ← Danh sách Shop
              </Button>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 700, color: 'text.primary', minWidth: 0 }}
                title={currentShopName}
              >
                {currentShopName}
              </Typography>
              <Chip
                size="small"
                label={isShopLive ? 'LIVE' : 'OFFLINE'}
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  flexShrink: 0,
                  bgcolor: isShopLive
                    ? surfaceTokens.liveRed
                    : surfaceTokens.mutedBg,
                  color: isShopLive ? '#FFFFFF' : 'text.secondary',
                }}
              />
            </Stack>

            {otherLiveCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapHorizRoundedIcon fontSize="small" />}
                onClick={() => setSearchParams({})}
                sx={{
                  minHeight: { xs: 44, md: 36 },
                  borderRadius: 2,
                  bgcolor: surfaceTokens.primarySoft,
                  color: surfaceTokens.primaryMain,
                  borderColor: surfaceTokens.primaryBorder,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Đổi phòng ({liveShopsCount} đang live)
              </Button>
            )}
          </Stack>

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
              shopName={
                livestream.selectedShop?.name ||
                livestream.activeStream?.seller.name
              }
              canConsult={Boolean(livestream.selectedShop || livestream.activeStream)}
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
                if (selectedSellerId) setChatWidgetOpen(true);
              }}
              chatEndRef={chatEndRef}
            />
          </Box>

          {(livestream.selectedShop || livestream.activeStream) && (
            <LiveShopChatWidget
              sellerId={selectedSellerId}
              shopName={currentShopName}
              open={chatWidgetOpen}
              onOpen={() => setChatWidgetOpen(true)}
              onClose={() => {
                setChatWidgetOpen(false);
                if (searchParams.get('chat')) {
                  setSearchParams({ sellerId: selectedSellerId }, { replace: true });
                }
              }}
              onOpenFullInbox={() => navigate(`/inbox?sellerId=${selectedSellerId}`)}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default ViewerPage;
