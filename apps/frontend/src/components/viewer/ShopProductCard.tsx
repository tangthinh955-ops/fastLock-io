import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import type { StorefrontProduct } from '../../hooks/useShopStorefront';
import { surfaceTokens } from '../../theme';

export interface ShopProductCardProps {
  product: StorefrontProduct;
  isLiveSession: boolean;
  isFeaturedInLive: boolean;
  onBuyInLive: (sku: string) => void;
  onAskAiProduct: (product: StorefrontProduct) => void;
}

export const ShopProductCard: React.FC<ShopProductCardProps> = ({
  product,
  isLiveSession,
  isFeaturedInLive,
  onBuyInLive,
  onAskAiProduct,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product.imageUrl]);

  const trimmedImageUrl = product.imageUrl?.trim() ?? '';
  const hasImage = trimmedImageUrl.length > 0 && !imgError;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const stockLabel = isOutOfStock
    ? 'Hết hàng'
    : isLowStock
      ? `Sắp hết (${product.stock})`
      : `Còn ${product.stock}`;

  const stockChipStyles = isOutOfStock
    ? {
        bgcolor: surfaceTokens.mutedBg,
        color: surfaceTokens.textSecondary,
        borderColor: surfaceTokens.borderSubtle,
      }
    : isLowStock
      ? {
          bgcolor: surfaceTokens.warningSoft,
          color: surfaceTokens.warningText,
          borderColor: '#FDE68A',
        }
      : {
          bgcolor: surfaceTokens.successSoft,
          color: surfaceTokens.successText,
          borderColor: surfaceTokens.successBorder,
        };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderColor: isFeaturedInLive
          ? 'rgba(220, 38, 38, 0.45)'
          : surfaceTokens.borderSubtle,
        transition:
          'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 176,
          overflow: 'hidden',
          bgcolor: surfaceTokens.mutedBg,
          flexShrink: 0,
        }}
      >
        {hasImage ? (
          <Box
            component="img"
            src={trimmedImageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Stack
            spacing={0.75}
            sx={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              background: isFeaturedInLive
                ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)'
                : 'linear-gradient(135deg, #EFF6FF 0%, #E2E8F0 100%)',
              color: isFeaturedInLive
                ? surfaceTokens.liveRedText
                : surfaceTokens.primaryMain,
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 38, opacity: 0.85 }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.04em',
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {product.sku}
            </Typography>
          </Stack>
        )}

        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            pointerEvents: 'none',
          }}
        >
          <Chip
            size="small"
            label={product.sku}
            sx={{
              minWidth: 0,
              maxWidth: isFeaturedInLive ? '46%' : '100%',
              bgcolor: 'rgba(15, 23, 42, 0.88)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.02em',
            }}
          />

          {isFeaturedInLive && (
            <Chip
              size="small"
              icon={
                <LiveTvRoundedIcon
                  sx={{ fontSize: 14, color: '#FFFFFF !important' }}
                />
              }
              label="BÁN TRÊN LIVE"
              sx={{
                flexShrink: 0,
                bgcolor: surfaceTokens.liveRed,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>

        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              px: 1.5,
              py: 0.75,
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}
            >
              Tạm hết hàng
            </Typography>
          </Box>
        )}
      </Box>

      <Stack spacing={1.5} sx={{ p: 2, flex: 1 }}>
        <Typography
          variant="subtitle1"
          title={product.name}
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            lineHeight: 1.4,
            minHeight: '2.8em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {product.name}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.1rem',
              color: surfaceTokens.liveRed,
              lineHeight: 1.2,
            }}
          >
            {product.price.toLocaleString('vi-VN')} ₫
          </Typography>
          <Chip
            size="small"
            label={stockLabel}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              border: '1px solid',
              ...stockChipStyles,
            }}
          />
        </Stack>

        <Box sx={{ mt: 'auto', pt: 0.5 }}>
          {isLiveSession ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
              <Button
                fullWidth
                variant="contained"
                color="error"
                disabled={isOutOfStock}
                onClick={() => onBuyInLive(product.sku)}
                sx={{ minHeight: 44, borderRadius: 2, fontWeight: 700 }}
              >
                Chốt trên Live
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onAskAiProduct(product)}
                sx={{
                  minHeight: 44,
                  borderRadius: 2,
                  fontWeight: 600,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Hỏi AI
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SmartToyOutlinedIcon />}
              onClick={() => onAskAiProduct(product)}
              sx={{ minHeight: 44, borderRadius: 2, fontWeight: 700 }}
            >
              Hỏi AI mẫu này
            </Button>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};
