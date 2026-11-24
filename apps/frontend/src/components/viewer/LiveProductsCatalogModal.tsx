import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputAdornment,
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import apiClient from '../../api/client';

export interface LiveProductItem {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
}

interface LiveProductsCatalogModalProps {
    open: boolean;
    livestreamId?: string | null;
    shopName?: string;
    onClose: () => void;
    onSelectSku: (sku: string) => void;
}

export const LiveProductsCatalogModal: React.FC<LiveProductsCatalogModalProps> = ({
    open,
    livestreamId,
    shopName,
    onClose,
    onSelectSku,
}) => {
    const [products, setProducts] = useState<LiveProductItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open || !livestreamId) return;
        let isMounted = true;
        setLoading(true);
        apiClient
            .get<LiveProductItem[]>(`/livestreams/${livestreamId}/products`)
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
    }, [open, livestreamId]);

    const filtered = products.filter(
        (p) =>
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.name.toLowerCase().includes(search.toLowerCase()),
    );

    const handlePick = (sku: string) => {
        onSelectSku(sku);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <ShoppingBagOutlinedIcon color="error" />
                    <Typography component="div" variant="h6" sx={{ fontWeight: 800 }}>
                        Sản phẩm mở bán trong Live
                    </Typography>
                </Stack>
                {shopName && (
                    <Chip label={shopName} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
            </DialogTitle>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SKU..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Mã SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Tên sản phẩm</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Giá bán</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Tồn kho</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            {products.length === 0
                                                ? 'Chưa có sản phẩm nào được chọn trong phiên live này.'
                                                : 'Không tìm thấy sản phẩm phù hợp.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((p) => (
                                        <TableRow key={p.id} hover>
                                            <TableCell>
                                                <Chip
                                                    label={p.sku}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 800 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography component="div" variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                    {p.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography component="div" variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                                                    {p.price.toLocaleString('vi-VN')} đ
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${p.stock} cái`}
                                                    size="small"
                                                    color={p.stock > 0 ? 'success' : 'default'}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem', height: 22 }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    disabled={p.stock <= 0}
                                                    startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => handlePick(p.sku)}
                                                    sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.25, px: 1.5 }}
                                                >
                                                    Chốt đơn
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} color="inherit">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};
