import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveCommentPanel } from '../../components/viewer/LiveCommentPanel';
import { LiveShopChatWidget } from '../../components/viewer/LiveShopChatWidget';
import { OrderConfirmModal } from '../../components/viewer/OrderConfirmModal';
import { LiveProductsCatalogModal } from '../../components/viewer/LiveProductsCatalogModal';
import { LiveVideoPlayer } from '../../components/viewer/LiveVideoPlayer';
import { ShopLiveDirectory } from '../../components/viewer/ShopLiveDirectory';
import {
  ShopStorefrontView,
  type ShopStorefrontInfo,
} from '../../components/viewer/ShopStorefrontView';
import { useAuth } from '../../context/AuthContext';
import { useLiveKitViewer } from '../../hooks/useLiveKitViewer';
import { useViewerLivestream } from '../../hooks/useViewerLivestream';
import { surfaceTokens } from '../../theme';

const TOP_BAR_BTN_SX = {
  minHeight: { xs: 44, md: 36 },
  borderRadius: 2,
  fontWeight: 600,
} as const;

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSellerId = searchParams.get('sellerId');
  const chatParam = searchParams.get('chat');
  const tabParam = searchParams.get('tab');
  const { user, token } = useAuth();
  const livestream = useViewerLivestream({
    buyerId: user?.id,
    buyerName: user?.name,
    token,
    selectedSellerId,
  });
  const isShopLive = Boolean(
    livestream.activeStream || livestream.selectedShop?.isLive,
  );
  const activeTab: 'live' | 'store' =
    tabParam === 'store'
      ? 'store'
      : tabParam === 'live'
        ? 'live'
        : isShopLive
          ? 'live'
          : 'store';
  const livekit = useLiveKitViewer({
    livestreamId: livestream.activeStream?.id,
    isLive: Boolean(livestream.activeStream) && activeTab === 'live',
    authToken: token,
  });
  const [inputText, setInputText] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [chatPrefillMessage, setChatPrefillMessage] = useState<string | null>(null);
  const [chatWidgetOpen, setChatWidgetOpen] = useState<boolean>(
    () => searchParams.get('chat') === 'open',
  );
  const prevSellerIdRef = useRef<string | null>(selectedSellerId);
  const prevChatParamRef = useRef<string | null>(chatParam);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputText('');
    setCatalogOpen(false);
    setChatPrefillMessage(null);
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

  const handleConsumePrefill = useCallback(() => setChatPrefillMessage(null), []);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    if (livestream.sendComment(text)) setInputText('');
  };

  const liveShopsCount = livestream.shops.filter((shop) => shop.isLive).length;
  const otherLiveCount = livestream.shops.filter(
    (shop) => shop.isLive && shop.id !== selectedSellerId,
  ).length;
  const currentShopName =
    livestream.selectedShop?.name ||
    livestream.activeStream?.seller.name ||
    'Phòng Livestream';
  const productCount = livestream.selectedShop?.productCount ?? 0;
  const isLiveRoomLayout = Boolean(selectedSellerId && activeTab === 'live');
  const storefrontShop: ShopStorefrontInfo | null = selectedSellerId
    ? livestream.selectedShop
      ? { ...livestream.selectedShop, isLive: isShopLive, activeStream: livestream.activeStream }
      : {
          id: selectedSellerId,
          name: currentShopName,
          productCount: 0,
          isLive: isShopLive,
          activeStream: livestream.activeStream,
          kbHighlights: [],
        }
    : null;

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={
        isLiveRoomLayout
          ? {
              flex: 1,
              minHeight: { xs: 'calc(100dvh - 56px)', md: 0 },
              height: { xs: 'auto', md: 'calc(100dvh - 64px)' },
              px: { xs: 0, md: 3 },
              py: { xs: 0, md: 2.5 },
              display: 'flex',
              flexDirection: 'column',
            }
          : {
              flex: 1,
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
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
          onSelectShop={(id) => setSearchParams({ sellerId: id, tab: 'live' })}
          onOpenStore={(id) => setSearchParams({ sellerId: id, tab: 'store' })}
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
              px: isLiveRoomLayout ? { xs: 1.5, md: 0 } : 0,
              py: isLiveRoomLayout ? { xs: 1, md: 0 } : 0,
              mb: isLiveRoomLayout ? { xs: 0, md: 1.5 } : 2,
              bgcolor: isLiveRoomLayout ? { xs: 'background.paper', md: 'transparent' } : 'transparent',
              borderBottom: isLiveRoomLayout ? { xs: '1px solid', md: 'none' } : 'none',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackRoundedIcon fontSize="small" />}
                onClick={() => setSearchParams({})}
                sx={{
                  minHeight: { xs: 44, md: 40 },
                  borderRadius: 2,
                  borderColor: 'divider',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  flexShrink: 0,
                }}
              >
                Danh sách Shop
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
                  bgcolor: isShopLive ? surfaceTokens.liveRed : surfaceTokens.mutedBg,
                  color: isShopLive ? '#FFFFFF' : 'text.secondary',
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
              <Button
                variant={activeTab === 'live' ? 'contained' : 'outlined'}
                color={isShopLive ? 'error' : 'primary'}
                size="small"
                startIcon={<LiveTvRoundedIcon fontSize="small" />}
                onClick={() => setSearchParams({ sellerId: selectedSellerId, tab: 'live' })}
                sx={TOP_BAR_BTN_SX}
              >
                Phòng Live
              </Button>
              <Button
                variant={activeTab === 'store' ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                startIcon={<StorefrontOutlinedIcon fontSize="small" />}
                onClick={() => setSearchParams({ sellerId: selectedSellerId, tab: 'store' })}
                sx={TOP_BAR_BTN_SX}
              >
                Cửa hàng ({productCount})
              </Button>
              {otherLiveCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwapHorizRoundedIcon fontSize="small" />}
                  onClick={() => setSearchParams({})}
                  sx={{
                    ...TOP_BAR_BTN_SX,
                    bgcolor: surfaceTokens.primarySoft,
                    color: surfaceTokens.primaryMain,
                    borderColor: surfaceTokens.primaryBorder,
                  }}
                >
                  Đổi phòng ({liveShopsCount} đang live)
                </Button>
              )}
            </Stack>
          </Stack>

          {activeTab === 'live' ? (
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
                isLive={isShopLive}
                title={livestream.activeStream?.title}
                videoRef={livekit.videoRef}
                audioRef={livekit.audioRef}
                videoStatus={livekit.videoStatus}
                hasVideo={livekit.hasVideo}
                videoMutedBySeller={livekit.videoMutedBySeller}
                muted={livekit.muted}
                videoError={livekit.videoError}
                onToggleMute={() => { void livekit.toggleMute(); }}
                onRetry={livekit.retry}
              />

              <LiveCommentPanel
                activeStream={livestream.activeStream}
                shopName={livestream.selectedShop?.name || livestream.activeStream?.seller.name}
                canConsult={Boolean(livestream.selectedShop || livestream.activeStream)}
                loading={livestream.loading}
                connected={livestream.connected}
                error={livestream.error}
                comments={livestream.comments}
                currentUserId={user?.id}
                currentUserName={user?.name}
                inputText={inputText}
                onInputChange={setInputText}
                onSend={handleSendMessage}
                onRetry={livestream.loadActiveStream}
                onOpenConsult={() => { if (selectedSellerId) setChatWidgetOpen(true); }}
                onOpenCatalog={() => setCatalogOpen(true)}
                chatEndRef={chatEndRef}
              />
            </Box>
          ) : !tabParam && livestream.loading && !livestream.selectedShop ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : (
            storefrontShop && (
              <ShopStorefrontView
                shop={storefrontShop}
                onGoToLive={() => setSearchParams({ sellerId: selectedSellerId, tab: 'live' })}
                onBuyInLive={(sku) => {
                  setInputText(`${sku} `);
                  setSearchParams({ sellerId: selectedSellerId, tab: 'live' });
                }}
                onAskAi={(prefillPrompt) => {
                  if (prefillPrompt.trim()) setChatPrefillMessage(prefillPrompt);
                  setChatWidgetOpen(true);
                }}
              />
            )
          )}

          {(livestream.selectedShop || livestream.activeStream) && (
            <LiveShopChatWidget
              sellerId={selectedSellerId}
              shopName={currentShopName}
              open={chatWidgetOpen}
              prefillMessage={chatPrefillMessage}
              onConsumePrefill={handleConsumePrefill}
              onOpen={() => setChatWidgetOpen(true)}
              onClose={() => {
                setChatWidgetOpen(false);
                if (searchParams.get('chat')) {
                  setSearchParams(
                    { sellerId: selectedSellerId, ...(tabParam ? { tab: tabParam } : {}) },
                    { replace: true },
                  );
                }
              }}
              onOpenFullInbox={() => navigate(`/inbox?sellerId=${selectedSellerId}`)}
            />
          )}

          <OrderConfirmModal
            open={Boolean(livestream.draftOrder)}
            data={livestream.draftOrder}
            onClose={() => livestream.setDraftOrder(null)}
            onSuccess={() => {}}
          />

          <LiveProductsCatalogModal
            open={catalogOpen}
            livestreamId={livestream.activeStream?.id}
            shopName={currentShopName}
            onClose={() => setCatalogOpen(false)}
            onSelectSku={(sku) => setInputText(sku)}
          />
        </>
      )}
    </Container>
  );
};

export default ViewerPage;
