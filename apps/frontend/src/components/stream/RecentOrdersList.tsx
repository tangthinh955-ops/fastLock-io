import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

export interface OrderNotification {
    orderId: string;
    productName: string;
    sku: string;
    price: number;
    totalAmount: number;
    buyerName: string;
    phone: string;
    createdAt: Date;
}

interface RecentOrdersListProps {
    latestOrder: OrderNotification | null;
    recentOrders: OrderNotification[];
}

export const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ latestOrder, recentOrders }) => {
    return (
        <Box sx={{ mt: 3 }}>
            {latestOrder && (
                <Alert
                    icon={<ShoppingCart fontSize="inherit" />}
                    severity="success"
                    variant="filled"
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        boxShadow: '0px 0px 20px rgba(76, 175, 80, 0.8)',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                    }}
                >
                    🔥 🎉 NỔ ĐƠN TỰ ĐỘNG! KHÁCH HÀNG <b>{latestOrder.buyerName}</b> ({latestOrder.phone}) ĐÃ CHỐT SP: <b>{latestOrder.productName}</b> (SKU: {latestOrder.sku}) - {latestOrder.price.toLocaleString('vi-VN')} VNĐ
                </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart color="success" /> Đơn hàng chốt tự động ({recentOrders.length})
            </Typography>

            <Grid container spacing={2}>
                {recentOrders.slice(0, 4).map((ord, idx) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                        <Card sx={{ background: '#1e1e38', color: '#fff', borderLeft: '4px solid #4caf50', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#81c784' }}>
                                    ✅ {ord.productName} ({ord.sku})
                                </Typography>
                                <Typography variant="body2">
                                    👤 KH: {ord.buyerName} - SĐT: {ord.phone}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#aaa' }}>
                                    💰 Giá: {ord.price.toLocaleString('vi-VN')} VNĐ • Đã gửi mã VietQR
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
