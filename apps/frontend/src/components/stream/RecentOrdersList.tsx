import React from 'react';
import { Box, Typography, Paper, Stack, Alert, Chip } from '@mui/material';
import { ShoppingCartOutlined, CheckCircleOutlined } from '@mui/icons-material';

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
        <Paper
            variant="outlined"
            sx={{
                height: { xs: 'auto', md: 'calc(100dvh - 196px)' },
                maxHeight: { xs: 420, md: 'none' },
                minHeight: { md: 460 },
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 3,
                overflow: 'hidden',
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <ShoppingCartOutlined color="success" fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Đơn hàng chốt tự động ({recentOrders.length})
                </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
                {latestOrder && (
                    <Alert
                        icon={<ShoppingCartOutlined />}
                        severity="success"
                        variant="outlined"
                        sx={{
                            mb: 1.5,
                            borderRadius: 2,
                            bgcolor: '#ECFDF5',
                            borderColor: '#047857',
                            color: '#065F46',
                            fontSize: '0.875rem',
                        }}
                    >
                        Đơn mới: <strong>{latestOrder.buyerName}</strong> ({latestOrder.phone}) đã chốt{' '}
                        <strong>{latestOrder.productName}</strong> ({latestOrder.sku}) —{' '}
                        {latestOrder.price.toLocaleString('vi-VN')} ₫
                    </Alert>
                )}

                {recentOrders.length === 0 ? (
                    <Stack
                        spacing={1}
                        sx={{ color: 'text.secondary', py: 6, px: 2, textAlign: 'center', alignItems: 'center' }}
                    >
                        <ShoppingCartOutlined sx={{ fontSize: 32, color: 'text.disabled' }} />
                        <Typography variant="body2">
                            Chưa có đơn hàng nào được chốt trong phiên live này.
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.25}>
                        {recentOrders.map((ord) => (
                            <Paper
                                key={ord.orderId}
                                variant="outlined"
                                sx={{
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    borderLeft: '4px solid #047857',
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}
                                >
                                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
                                        <CheckCircleOutlined color="success" sx={{ fontSize: 18, flexShrink: 0 }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                                            {ord.productName}
                                        </Typography>
                                    </Stack>
                                    <Chip
                                        label={ord.sku}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}
                                    />
                                </Stack>
                                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                    Khách hàng: <strong>{ord.buyerName}</strong> • {ord.phone}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {ord.price.toLocaleString('vi-VN')} ₫ • Đã gửi mã VietQR qua Inbox
                                </Typography>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Paper>
    );
};
