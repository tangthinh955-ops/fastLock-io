import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiClient from '../../api/client';

export interface LiveProductStock {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
}

interface LiveInventoryListProps {
    livestreamId: string | null;
    refreshTrigger?: number | unknown;
}

export const LiveInventoryList: React.FC<LiveInventoryListProps> = ({
    livestreamId,
    refreshTrigger,
}) => {
    const [products, setProducts] = useState<LiveProductStock[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!livestreamId) {
            setProducts([]);
            return;
        }
        let isMounted = true;
        setLoading(true);
        apiClient
            .get<LiveProductStock[]>(`/livestreams/${livestreamId}/products`)
            .then((res) => {
                if (isMounted) setProducts(res.data || []);
            })
            .catch(() => {
                if (isMounted) setProducts([]);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [livestreamId, refreshTrigger]);

    const handleManualRefresh = () => {
        if (!livestreamId) return;
        setLoading(true);
        apiClient
            .get<LiveProductStock[]>(`/livestreams/${livestreamId}/products`)
            .then((res) => {
                setProducts(res.data || []);
            })
            .catch(() => {
                setProducts([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    if (!livestreamId) return null;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
            }}
        >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Inventory2OutlinedIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Kho sản phẩm phiên Live ({products.length})
                    </Typography>
                </Stack>
                <Tooltip title="Làm mới tồn kho">
                    <IconButton size="small" onClick={handleManualRefresh} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {loading && products.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : products.length === 0 ? (
                <Typography component="div" variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                    Chưa chọn sản phẩm nào cho phiên live này.
                </Typography>
            ) : (
                <TableContainer sx={{ maxHeight: 240 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tên</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Giá</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Còn</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((p) => (
                                <TableRow key={p.id} hover>
                                    <TableCell>
                                        <Chip label={p.sku} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
                                    </TableCell>
                                    <TableCell>
                                        <Typography component="div" variant="body2" sx={{ fontWeight: 600, maxWidth: 120 }} noWrap>
                                            {p.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography component="div" variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>
                                            {p.price.toLocaleString('vi-VN')}đ
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={p.stock}
                                            size="small"
                                            color={p.stock > 0 ? 'success' : 'default'}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};
