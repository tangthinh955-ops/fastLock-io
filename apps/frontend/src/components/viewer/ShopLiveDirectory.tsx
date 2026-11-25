import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { ShopLiveItem } from '../../hooks/useViewerLivestream';
import { surfaceTokens } from '../../theme';
import { ShopLiveCard } from './ShopLiveCard';

interface ShopLiveDirectoryProps {
  shops: ShopLiveItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSelectShop: (sellerId: string) => void;
  onOpenStore: (sellerId: string) => void;
  onOpenConsult: (sellerId: string) => void;
}

export const ShopLiveDirectory: React.FC<ShopLiveDirectoryProps> = ({
  shops,
  loading,
  error,
  onRefresh,
  onSelectShop,
  onOpenStore,
  onOpenConsult,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'LIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const liveShopsCount = shops.filter((shop) => shop.isLive).length;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredShops = shops.filter((shop) => {
    if (filterMode === 'LIVE' && !shop.isLive) return false;
    if (!normalizedQuery) return true;
    const matchesName = shop.name.toLowerCase().includes(normalizedQuery);
    const matchesTitle = (shop.activeStream?.title ?? '')
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesName || matchesTitle;
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header & Filter Bar */}
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, bgcolor: 'background.paper' }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: surfaceTokens.primarySoft,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <StorefrontOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 0.5 }}
              >
                Khám phá Cửa hàng &amp; Phòng Live
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chọn Shop đang phát sóng để xem Livestream &amp; chốt đơn nhanh, hoặc mở tư vấn AI 24/7.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            sx={{
              alignItems: 'center',
              justifyContent: { xs: 'space-between', md: 'flex-end' },
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <Chip
              icon={
                <LiveTvRoundedIcon
                  sx={{
                    fontSize: 16,
                    color: liveShopsCount > 0 ? `${surfaceTokens.liveRed} !important` : 'inherit',
                  }}
                />
              }
              label={liveShopsCount > 0 ? `${liveShopsCount} Shop đang Live` : 'Chưa có phòng Live'}
              sx={{
                height: 36,
                px: 0.5,
                bgcolor: liveShopsCount > 0 ? surfaceTokens.liveRedSoft : surfaceTokens.mutedBg,
                color: liveShopsCount > 0 ? surfaceTokens.liveRedText : 'text.secondary',
                border: '1px solid',
                borderColor: liveShopsCount > 0 ? '#FECACA' : surfaceTokens.borderSubtle,
              }}
            />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshRoundedIcon />}
              onClick={onRefresh}
              disabled={loading}
              sx={{ minHeight: 44, borderRadius: 2, borderColor: 'divider', color: 'text.primary', fontWeight: 600 }}
            >
              Làm mới
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ mt: 2.5, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant={filterMode === 'ALL' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setFilterMode('ALL')}
              sx={{ minHeight: 44, borderRadius: 2 }}
            >
              Tất cả Shop ({shops.length})
            </Button>
            <Button
              variant={filterMode === 'LIVE' ? 'contained' : 'outlined'}
              color={filterMode === 'LIVE' ? 'error' : 'inherit'}
              onClick={() => setFilterMode('LIVE')}
              sx={{
                minHeight: 44,
                borderRadius: 2,
                ...(filterMode !== 'LIVE' && { borderColor: 'divider', color: 'text.primary' }),
              }}
            >
              Đang phát Live ({liveShopsCount})
            </Button>
          </Stack>

          <TextField
            size="small"
            placeholder="Tìm theo tên Shop hoặc tiêu đề Live..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Xóa từ khóa tìm kiếm"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2.5 }}
          action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && shops.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, borderRadius: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Đang tải danh sách Cửa hàng &amp; Phòng Live...
          </Typography>
        </Paper>
      ) : error && shops.length === 0 ? null : filteredShops.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 4, sm: 6 }, borderRadius: 3, textAlign: 'center' }}>
          <StorefrontOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            {shops.length === 0
              ? 'Chưa có cửa hàng nào trong hệ thống'
              : filterMode === 'LIVE' && liveShopsCount === 0
                ? 'Hiện chưa có cửa hàng nào đang phát Live'
                : 'Không tìm thấy cửa hàng phù hợp'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filterMode === 'LIVE' && liveShopsCount === 0
              ? 'Bạn vẫn có thể xem tất cả Shop để nhắn tin tư vấn AI hoặc chờ Shop bật phiên phát sóng.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang chế độ xem tất cả cửa hàng.'}
          </Typography>
          {(filterMode !== 'ALL' || searchQuery) && (
            <Button
              variant="outlined"
              onClick={() => {
                setFilterMode('ALL');
                setSearchQuery('');
              }}
              sx={{ minHeight: 44 }}
            >
              Xem tất cả Shop
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredShops.map((shop) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={shop.id}>
              <ShopLiveCard
                shop={shop}
                onSelectShop={onSelectShop}
                onOpenStore={onOpenStore}
                onOpenConsult={onOpenConsult}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
