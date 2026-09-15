import React from 'react';
import { Paper, Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { Refresh as RefreshIcon, Videocam as VideocamIcon } from '@mui/icons-material';
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

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#38bdf8', mb: 1 }}>
                        🏪 SELLER DASHBOARD
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                        Quản lý kho sản phẩm, thiết lập SKU chốt đơn tự động & sẵn sàng Livestream.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="info"
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{ borderRadius: 2 }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate('/seller/live-studio')}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #f43f5e 30%, #fb7185 90%)',
                            boxShadow: '0 3px 10px rgba(244, 63, 94, 0.4)',
                        }}
                    >
                        Vào Live Studio WebCam
                    </Button>
                </Box>
            </Paper>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, borderLeft: '5px solid #0284c7', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                                TỔNG SẢN PHẨM TRÊN KHO
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0284c7' }}>
                                {totalProducts} <Typography component="span" variant="body2" color="textSecondary">Mặt hàng</Typography>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, borderLeft: '5px solid #16a34a', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                                TỔNG SỐ LƯỢNG TỒN KHO
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a' }}>
                                {totalStockUnits.toLocaleString('vi-VN')} <Typography component="span" variant="body2" color="textSecondary">Sản phẩm</Typography>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, borderLeft: '5px solid #dc2626', boxShadow: 2 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                                SẢN PHẨM HẾT HÀNG
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                                {outOfStockCount} <Typography component="span" variant="body2" color="textSecondary">Cần bổ sung</Typography>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};
