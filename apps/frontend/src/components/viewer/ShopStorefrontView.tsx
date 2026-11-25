import React, { useMemo } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Grid, IconButton, InputAdornment,
  Paper, Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { useShopStorefront } from '../../hooks/useShopStorefront';
import { surfaceTokens } from '../../theme';
import { ShopProductCard } from './ShopProductCard';

export interface ShopKbHighlight {
  id: string;
  keyword: string;
  answer: string;
}

export interface ShopStorefrontInfo {
  id: string;
  name: string;
  email?: string;
  productCount: number;
  isLive: boolean;
  activeStream: {
    id: string;
    title: string;
    description?: string | null;
    startedAt?: string;
  } | null;
  kbHighlights?: ShopKbHighlight[];
}

export interface ShopStorefrontViewProps {
  shop: ShopStorefrontInfo;
  onGoToLive: () => void;
  onBuyInLive: (sku: string) => void;
  onAskAi: (prefillPrompt: string) => void;
}

const TRUST_HIGHLIGHTS = [
  {
    key: 'fast-order',
    title: 'Chốt đơn Livestream nhanh',
    description: 'Nhập mã SKU + SĐT giữ hàng trực tiếp theo tồn kho thực.',
    Icon: BoltRoundedIcon,
    iconBg: surfaceTokens.liveRedSoft,
    iconColor: surfaceTokens.liveRedText,
  },
  {
    key: 'vietqr',
    title: 'Thanh toán VietQR tự động',
    description: 'Nhận mã QR riêng trong Hộp thư ngay sau khi xác nhận đơn.',
    Icon: QrCode2RoundedIcon,
    iconBg: surfaceTokens.primarySoft,
    iconColor: surfaceTokens.primaryMain,
  },
  {
    key: 'support-24-7',
    title: 'Hỗ trợ khách hàng 24/7',
    description: 'Tư vấn nhanh về size, chất liệu và tồn kho từng sản phẩm.',
    Icon: SupportAgentRoundedIcon,
    iconBg: surfaceTokens.aiSoft,
    iconColor: surfaceTokens.aiText,
  },
] as const;

const TOUCH_BTN_SX = { minHeight: 44, borderRadius: 2 } as const;

export const ShopStorefrontView: React.FC<ShopStorefrontViewProps> = ({
  shop, onGoToLive, onBuyInLive, onAskAi,
}) => {
  const {
    products, filteredProducts, liveProductIds, totalProducts, inStockCount,
    liveProductCount, loading, error, filterMode, setFilterMode, searchQuery,
    setSearchQuery, refresh,
  } = useShopStorefront({
    sellerId: shop.id,
    activeStreamId: shop.isLive ? (shop.activeStream?.id ?? null) : null,
  });

  const displayedTotalProducts =
    loading && products.length === 0 ? shop.productCount : totalProducts;

  const { featuredNames, priceRangeText } = useMemo(() => {
    if (products.length === 0) {
      return { featuredNames: [] as string[], priceRangeText: '' };
    }
    const uniqueNames = Array.from(
      new Set(products.map((p) => p.name.trim()).filter(Boolean)),
    ).slice(0, 4);
    const prices = products.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const formattedPrice =
      minPrice === maxPrice
        ? `${minPrice.toLocaleString('vi-VN')} ₫`
        : `${minPrice.toLocaleString('vi-VN')} ₫ – ${maxPrice.toLocaleString('vi-VN')} ₫`;
    return { featuredNames: uniqueNames, priceRangeText: formattedPrice };
  }, [products]);

  const liveSummaryText = useMemo(() => {
    const streamDesc = shop.activeStream?.description?.trim();
    if (streamDesc) return streamDesc;
    if (featuredNames.length > 0) {
      return `Đang mở bán ${featuredNames.join(', ')}${products.length > 4 ? ' và nhiều sản phẩm khác' : ''}${priceRangeText ? ` (${priceRangeText})` : ''}.`;
    }
    return 'Xem nhanh danh mục sản phẩm bên dưới và bấm "Chốt trên Live" để chọn nhanh mã SKU.';
  }, [featuredNames, priceRangeText, products.length, shop.activeStream?.description]);

  const offlineSummaryText = useMemo(() => {
    if (featuredNames.length > 0) {
      return `Gian hàng ${shop.name} chuyên cung cấp ${featuredNames.join(', ')}${products.length > 4 ? ' và nhiều sản phẩm khác' : ''}.${priceRangeText ? ` Mức giá tham khảo từ ${priceRangeText}.` : ''}`;
    }
    return `Gian hàng ${shop.name} — xem danh mục sản phẩm bên dưới và theo dõi các phiên phát sóng Livestream sắp tới.`;
  }, [featuredNames, priceRangeText, products.length, shop.name]);

  const heroGradient = shop.isLive
    ? 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 55%, #C2410C 100%)'
    : 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #1E40AF 100%)';

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. Shop Hero Banner & Overview */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, background: heroGradient, color: '#FFFFFF' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 60, height: 60, fontSize: '1.5rem', fontWeight: 800,
                  bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF',
                  border: '2px solid rgba(255, 255, 255, 0.45)', flexShrink: 0,
                }}
              >
                {shop.name.charAt(0).toUpperCase() || 'S'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '1.25rem', sm: '1.5rem' }, wordBreak: 'break-word' }}>
                    {shop.name}
                  </Typography>
                  <Chip
                    size="small"
                    icon={
                      shop.isLive
                        ? <LiveTvRoundedIcon sx={{ fontSize: 15, color: `${surfaceTokens.liveRedText} !important` }} />
                        : <StorefrontOutlinedIcon sx={{ fontSize: 15, color: '#FFFFFF !important' }} />
                    }
                    label={shop.isLive ? 'ĐANG LIVE' : 'CHƯA PHÁT LIVE'}
                    sx={{
                      fontWeight: 700, fontSize: '0.72rem',
                      bgcolor: shop.isLive ? '#FFFFFF' : 'rgba(15, 23, 42, 0.35)',
                      color: shop.isLive ? surfaceTokens.liveRedText : '#FFFFFF',
                    }}
                  />
                </Stack>
                {shop.email && (
                  <Typography variant="caption" sx={{ color: '#FFFFFF', display: 'block', wordBreak: 'break-all' }}>
                    {shop.email}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ flexShrink: 0 }}>
              {shop.isLive ? (
                <>
                  <Button
                    variant="contained" startIcon={<PlayCircleOutlineRoundedIcon />} onClick={onGoToLive}
                    sx={{ ...TOUCH_BTN_SX, bgcolor: '#FFFFFF', color: surfaceTokens.liveRedText, fontWeight: 700, '&:hover': { bgcolor: '#FEF2F2' } }}
                  >
                    Vào xem Live ngay
                  </Button>
                  <Button
                    variant="outlined" startIcon={<SmartToyOutlinedIcon />} onClick={() => onAskAi('')}
                    sx={{
                      ...TOUCH_BTN_SX, borderColor: 'rgba(255, 255, 255, 0.85)', bgcolor: 'rgba(15, 23, 42, 0.24)',
                      color: '#FFFFFF', fontWeight: 700, '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(15, 23, 42, 0.38)' },
                    }}
                  >
                    Tư vấn AI
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained" startIcon={<SmartToyOutlinedIcon />} onClick={() => onAskAi('')}
                  sx={{ ...TOUCH_BTN_SX, bgcolor: '#FFFFFF', color: '#1E3A8A', fontWeight: 700, '&:hover': { bgcolor: surfaceTokens.primarySoft } }}
                >
                  Tư vấn AI 24/7
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          {/* Main Shop / Live Description Callout */}
          <Box
            sx={{
              p: 1.75, borderRadius: 2, border: '1px solid',
              bgcolor: shop.isLive ? surfaceTokens.liveRedSoft : surfaceTokens.primarySoft,
              borderColor: shop.isLive ? '#FECACA' : surfaceTokens.primaryBorder,
            }}
          >
            {shop.isLive ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: surfaceTokens.liveRedText }}>
                  {shop.activeStream?.title || 'Phiên livestream đang phát sóng'}
                </Typography>
                <Typography variant="body2" sx={{ color: surfaceTokens.textPrimary }}>
                  {liveSummaryText}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: surfaceTokens.textPrimary }}>
                {offlineSummaryText}
              </Typography>
            )}
          </Box>

          {/* Stats Chips Row */}
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
            <Chip icon={<Inventory2OutlinedIcon sx={{ fontSize: 16, color: `${surfaceTokens.textPrimary} !important` }} />} label={`Tổng ${displayedTotalProducts} sản phẩm`} sx={{ bgcolor: surfaceTokens.mutedBg, color: surfaceTokens.textPrimary }} />
            <Chip icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: `${surfaceTokens.successText} !important` }} />} label={`Còn hàng: ${inStockCount}`} sx={{ bgcolor: surfaceTokens.successSoft, color: surfaceTokens.successText }} />
            {shop.isLive && (
              <Chip icon={<LiveTvRoundedIcon sx={{ fontSize: 16, color: `${surfaceTokens.liveRedText} !important` }} />} label={`Mở bán trên Live: ${liveProductCount}`} sx={{ bgcolor: surfaceTokens.liveRedSoft, color: surfaceTokens.liveRedText }} />
            )}
            {priceRangeText && (
              <Chip icon={<LocalOfferOutlinedIcon sx={{ fontSize: 16, color: `${surfaceTokens.primaryMain} !important` }} />} label={`Giá: ${priceRangeText}`} sx={{ bgcolor: surfaceTokens.primarySoft, color: surfaceTokens.primaryMain }} />
            )}
          </Stack>

          {/* Compact Trust / Shopping Highlights Strip */}
          <Grid container spacing={1.5} sx={{ mt: 2 }}>
            {TRUST_HIGHLIGHTS.map(({ key, title, description, Icon, iconBg, iconColor }) => (
              <Grid size={{ xs: 12, sm: 4 }} key={key}>
                <Box
                  sx={{
                    p: 1.5,
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: surfaceTokens.pageBg,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.75,
                      bgcolor: iconBg,
                      color: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.15,
                    }}
                  >
                    <Icon sx={{ fontSize: 19 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.35 }}>
                      {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.35, lineHeight: 1.45 }}>
                      {description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* 2. Product Catalog Section */}
      <Box sx={{ pb: 18 }}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 2.5, bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant={filterMode === 'ALL' ? 'contained' : 'outlined'} color="primary" onClick={() => setFilterMode('ALL')} sx={TOUCH_BTN_SX}>
                Tất cả ({displayedTotalProducts})
              </Button>
              {shop.isLive && (
                <Button
                  variant={filterMode === 'LIVE' ? 'contained' : 'outlined'} color={filterMode === 'LIVE' ? 'error' : 'inherit'}
                  onClick={() => setFilterMode('LIVE')}
                  sx={{ ...TOUCH_BTN_SX, ...(filterMode !== 'LIVE' && { borderColor: 'divider', color: 'text.primary' }) }}
                >
                  Đang bán trên Live ({liveProductCount})
                </Button>
              )}
              <Button
                variant={filterMode === 'IN_STOCK' ? 'contained' : 'outlined'} color={filterMode === 'IN_STOCK' ? 'success' : 'inherit'}
                onClick={() => setFilterMode('IN_STOCK')}
                sx={{ ...TOUCH_BTN_SX, ...(filterMode !== 'IN_STOCK' && { borderColor: 'divider', color: 'text.primary' }) }}
              >
                Còn hàng ({inStockCount})
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
              <TextField
                size="small" placeholder="Tìm theo tên hoặc mã SKU..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: 270 } }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" color="action" /></InputAdornment>,
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" aria-label="Xóa từ khóa tìm kiếm" onClick={() => setSearchQuery('')} edge="end">
                          <ClearRoundedIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <IconButton
                aria-label="Làm mới danh sách sản phẩm" onClick={refresh} disabled={loading}
                sx={{ minWidth: 44, minHeight: 44, borderRadius: 2, border: `1px solid ${surfaceTokens.borderSubtle}`, color: 'text.primary', flexShrink: 0 }}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }} action={<Button color="inherit" size="small" onClick={refresh}>Thử lại</Button>}>
            {error}
          </Alert>
        )}

        {loading && products.length === 0 ? (
          <Grid container spacing={2.5}>
            {[0, 1, 2, 3].map((idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Skeleton variant="rectangular" height={176} />
                  <Stack spacing={1.25} sx={{ p: 2 }}>
                    <Skeleton variant="text" width="85%" height={24} />
                    <Skeleton variant="text" width="55%" height={24} />
                    <Skeleton variant="rounded" height={44} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : error && products.length === 0 ? null : filteredProducts.length === 0 ? (
          <Paper variant="outlined" sx={{ p: { xs: 4, sm: 6 }, borderRadius: 3, textAlign: 'center' }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 46, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {products.length === 0 ? 'Cửa hàng hiện chưa đăng sản phẩm nào' : 'Không tìm thấy sản phẩm phù hợp'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {products.length === 0
                ? 'Bạn có thể mở trợ lý AI để hỏi thêm thông tin về các mẫu sắp mở bán của shop.'
                : 'Thử xóa từ khóa tìm kiếm hoặc chuyển bộ lọc sang tất cả sản phẩm.'}
            </Typography>
            {(filterMode !== 'ALL' || searchQuery) && (
              <Button variant="outlined" onClick={() => { setFilterMode('ALL'); setSearchQuery(''); }} sx={TOUCH_BTN_SX}>
                Xóa bộ lọc
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filteredProducts.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <ShopProductCard
                  product={product}
                  isLiveSession={shop.isLive}
                  isFeaturedInLive={liveProductIds.has(product.id)}
                  onBuyInLive={onBuyInLive}
                  onAskAiProduct={(item) => onAskAi(`Tư vấn giúp mình sản phẩm ${item.name} (Mã ${item.sku}) còn hàng và thông tin chi tiết nhé!`)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};
