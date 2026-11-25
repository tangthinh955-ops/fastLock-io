import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { ShopLiveItem } from '../../hooks/useViewerLivestream';
import { surfaceTokens } from '../../theme';

export interface ShopLiveCardProps {
  shop: ShopLiveItem;
  onSelectShop: (sellerId: string) => void;
  onOpenStore: (sellerId: string) => void;
  onOpenConsult: (sellerId: string) => void;
}

export const ShopLiveCard: React.FC<ShopLiveCardProps> = ({
  shop,
  onSelectShop,
  onOpenStore,
  onOpenConsult,
}) => {
  const streamDescription = shop.activeStream?.description?.trim() ?? '';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2,
        bgcolor: 'background.paper',
        borderColor: shop.isLive ? 'rgba(220, 38, 38, 0.35)' : 'divider',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
        },
      }}
    >
      <Box>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontWeight: 700,
                bgcolor: shop.isLive
                  ? surfaceTokens.liveRedSoft
                  : surfaceTokens.primarySoft,
                color: shop.isLive
                  ? surfaceTokens.liveRed
                  : surfaceTokens.primaryMain,
                flexShrink: 0,
              }}
            >
              {shop.name.charAt(0).toUpperCase() || 'S'}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 700, color: 'text.primary' }}
                title={shop.name}
              >
                {shop.name}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'text.secondary', display: 'block' }}
                title={shop.email}
              >
                {shop.email
                  ? `${shop.email} · ${shop.productCount} sản phẩm`
                  : `${shop.productCount} sản phẩm`}
              </Typography>
            </Box>
          </Stack>

          {shop.isLive ? (
            <Chip
              size="small"
              label="ĐANG LIVE"
              sx={{
                bgcolor: surfaceTokens.liveRed,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.72rem',
                flexShrink: 0,
              }}
            />
          ) : (
            <Chip
              size="small"
              label="OFFLINE"
              sx={{
                bgcolor: surfaceTokens.mutedBg,
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.72rem',
                flexShrink: 0,
              }}
            />
          )}
        </Stack>

        {shop.isLive ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: surfaceTokens.liveRedSoft,
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <LiveTvRoundedIcon
              sx={{
                fontSize: 18,
                color: surfaceTokens.liveRed,
                mt: 0.15,
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: surfaceTokens.liveRedText,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {shop.activeStream?.title || 'Phiên livestream đang phát'}
              </Typography>
              {streamDescription && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.35,
                    color: 'text.secondary',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {streamDescription}
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: surfaceTokens.pageBg,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              Xem trước danh mục sản phẩm và lịch mở bán của cửa hàng
            </Typography>
          </Box>
        )}
      </Box>

      {shop.isLive ? (
        <Stack spacing={1}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<PlayCircleOutlineRoundedIcon />}
            onClick={() => onSelectShop(shop.id)}
            sx={{ minHeight: 44, borderRadius: 2, fontWeight: 700 }}
          >
            Vào xem Live
          </Button>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<StorefrontOutlinedIcon />}
              onClick={() => onOpenStore(shop.id)}
              sx={{
                minHeight: 44,
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              Cửa hàng
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ForumOutlinedIcon />}
              onClick={() => onOpenConsult(shop.id)}
              sx={{
                minHeight: 44,
                borderRadius: 2,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Tư vấn AI
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<StorefrontOutlinedIcon />}
            onClick={() => onOpenStore(shop.id)}
            sx={{ minHeight: 44, borderRadius: 2, fontWeight: 700 }}
          >
            Xem Cửa hàng
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ForumOutlinedIcon />}
            onClick={() => onOpenConsult(shop.id)}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' },
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Tư vấn AI
          </Button>
        </Stack>
      )}
    </Paper>
  );
};
