import React from 'react';
import { Paper, Box, Typography, Button, Grid, Stack } from '@mui/material';
import {
    Refresh as RefreshIcon,
    Videocam as VideocamIcon,
    StorefrontOutlined as StorefrontOutlinedIcon,
    Inventory2Outlined as Inventory2OutlinedIcon,
    LayersOutlined as LayersOutlinedIcon,
    WarningAmberOutlined as WarningAmberOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../pages/seller/SellerDashboard';

interface ProductStatsHeaderProps {
    products: Product[];
    onRefresh: () => void;
}

export const ProductStatsHeader: React.FC<ProductStatsHeaderProps> = ({ products, onRefresh }) => {
    const navigate = useNavigate();

    const totalProducts = products.length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

    const kpiCards = [
        {
            label: 'Tổng sản phẩm trên kho',
            value: totalProducts.toLocaleString('vi-VN'),
            unit: 'mặt hàng',
            accentColor: '#1D4ED8',
            bgColor: '#EFF6FF',
            icon: <Inventory2OutlinedIcon sx={{ fontSize: 20, color: '#1D4ED8' }} />,
        },
        {
            label: 'Tổng số lượng tồn kho',
            value: totalStockUnits.toLocaleString('vi-VN'),
            unit: 'sản phẩm',
            accentColor: '#047857',
            bgColor: '#ECFDF5',
            icon: <LayersOutlinedIcon sx={{ fontSize: 20, color: '#047857' }} />,
        },
        {
            label: 'Sản phẩm hết hàng',
            value: outOfStockCount.toLocaleString('vi-VN'),
            unit: 'cần bổ sung',
            accentColor: outOfStockCount > 0 ? '#DC2626' : '#475569',
            bgColor: outOfStockCount > 0 ? '#FEF2F2' : '#F1F5F9',
            icon: (
                <WarningAmberOutlinedIcon
                    sx={{ fontSize: 20, color: outOfStockCount > 0 ? '#DC2626' : '#475569' }}
                />
            ),
        },
    ];

    return (
        <>
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                }}
            >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: '#EFF6FF',
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
                            sx={{
                                fontWeight: 800,
                                color: 'text.primary',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                mb: 0.5,
                            }}
                        >
                            Kho hàng & Livestream
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Quản lý mã SKU chốt đơn tự động, theo dõi tồn kho và phát sóng trực tiếp.
                        </Typography>
                    </Box>
                </Stack>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ flexShrink: 0 }}
                >
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{
                            minHeight: 44,
                            borderRadius: 2,
                            borderColor: 'divider',
                            color: 'text.primary',
                            fontWeight: 600,
                        }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate('/seller/live-studio')}
                        sx={{
                            minHeight: 44,
                            borderRadius: 2,
                            fontWeight: 700,
                            px: 2.5,
                        }}
                    >
                        Vào Live Studio
                    </Button>
                </Stack>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {kpiCards.map((card) => (
                    <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                height: '100%',
                            }}
                        >
                            <Stack
                                direction="row"
                                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8125rem' }}
                                >
                                    {card.label}
                                </Typography>
                                <Box
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 2,
                                        bgcolor: card.bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {card.icon}
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        color: card.accentColor,
                                        fontVariantNumeric: 'tabular-nums',
                                        fontSize: { xs: '1.625rem', sm: '1.875rem' },
                                    }}
                                >
                                    {card.value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                    {card.unit}
                                </Typography>
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};
