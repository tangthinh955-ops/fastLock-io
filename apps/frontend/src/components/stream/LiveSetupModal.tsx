import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Stack,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import apiClient from '../../api/client';

export interface ProductItem {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
}

export interface LiveSetupData {
    title: string;
    description: string;
    productIds: string[];
}

interface LiveSetupModalProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onStartLive: (data: LiveSetupData) => void;
}

export const LiveSetupModal: React.FC<LiveSetupModalProps> = ({
    open,
    loading,
    onClose,
    onStartLive,
}) => {
    const [title, setTitle] = useState('Phiên Livestream chốt đơn hôm nay');
    const [description, setDescription] = useState('');
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!open) return;
        let isMounted = true;
        setFetching(true);
        apiClient
            .get<ProductItem[]>('/products')
            .then((res) => {
                if (isMounted) {
                    const list = res.data || [];
                    setProducts(list);
                    setSelectedIds(list.map((p) => p.id));
                }
            })
            .catch(() => {
                if (isMounted) setProducts([]);
            })
            .finally(() => {
                if (isMounted) setFetching(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open]);

    const filteredProducts = products.filter(
        (p) =>
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.name.toLowerCase().includes(search.toLowerCase()),
    );

    const handleToggleAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map((p) => p.id));
        }
    };

    const handleToggleOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    const handleSubmit = () => {
        if (!title.trim()) return;
        onStartLive({
            title: title.trim(),
            description: description.trim(),
            productIds: selectedIds,
        });
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LiveTvIcon color="error" />
                <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
                    Thiết lập phiên Livestream
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Tiêu đề phiên Live"
                    required
                    fullWidth
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="VD: Xả kho đồ vintage siêu độc bản - Đồng giá 99k"
                />

                <TextField
                    label="Mô tả / Thông báo phiên Live (Tùy chọn)"
                    fullWidth
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    placeholder="VD: Khách chốt đơn gõ đúng cú pháp mã SP. Chốt thành công kiểm tra Inbox để nhận VietQR!"
                />

                <Box sx={{ mt: 1 }}>
                    <Stack
                        direction="row"
                        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}
                    >
                        <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Sản phẩm mở bán trong phiên live ({selectedIds.length}/{products.length})
                        </Typography>
                        <Button size="small" onClick={handleToggleAll} disabled={fetching || products.length === 0}>
                            {selectedIds.length === products.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </Button>
                    </Stack>

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
                        sx={{ mb: 1.5 }}
                    />

                    {fetching ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={products.length > 0 && selectedIds.length === products.length}
                                                indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                                                onChange={handleToggleAll}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Mã SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Tên sản phẩm</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Giá bán</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Tồn kho</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                {products.length === 0 ? 'Bạn chưa có sản phẩm nào trong kho.' : 'Không tìm thấy sản phẩm phù hợp.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((p) => {
                                            const isSelected = selectedIds.includes(p.id);
                                            return (
                                                <TableRow
                                                    key={p.id}
                                                    hover
                                                    onClick={() => handleToggleOne(p.id)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Checkbox checked={isSelected} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={p.sku} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography component="div" variant="body2" noWrap sx={{ maxWidth: 220, fontWeight: 600 }}>
                                                            {p.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography component="div" variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                                                            {p.price.toLocaleString('vi-VN')} đ
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`${p.stock} cái`}
                                                            size="small"
                                                            color={p.stock > 0 ? 'success' : 'default'}
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem', height: 22 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    startIcon={<LiveTvIcon />}
                    onClick={handleSubmit}
                    disabled={loading || !title.trim()}
                    sx={{ px: 3, fontWeight: 700 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Bắt đầu phát Live'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
