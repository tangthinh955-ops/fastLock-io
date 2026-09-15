import React from 'react';
import {
    Paper,
    TextField,
    InputAdornment,
    Button,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Typography,
    Chip,
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Inventory as InventoryIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Product } from '../../pages/seller/SellerDashboard';

interface ProductTableListProps {
    products: Product[];
    loading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (product: Product) => void;
    onDelete: (product: Product) => void;
}

export const ProductTableList: React.FC<ProductTableListProps> = ({
    products,
    loading,
    searchQuery,
    onSearchChange,
    onOpenAddModal,
    onOpenEditModal,
    onDelete,
}) => {
    return (
        <>
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    placeholder="Tìm theo mã SKU hoặc Tên sản phẩm..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{ minWidth: 320 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={onOpenAddModal}
                    sx={{ borderRadius: 2, fontWeight: 'bold', px: 3 }}
                >
                    Thêm Sản Phẩm Mới
                </Button>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>STT</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>MÃ SKU</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>TÊN SẢN PHẨM</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }} align="right">ĐƠN GIÁ</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }} align="center">TỒN KHO</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }} align="center">TRẠNG THÁI</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569' }} align="center">THAO TÁC</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={40} />
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                        Đang tải danh sách sản phẩm từ máy chủ...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <InventoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                                    <Typography variant="h6" color="textSecondary">
                                        {searchQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào trong kho'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product, idx) => (
                                <TableRow key={product.id} hover>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>
                                        <Chip label={product.sku} color="primary" variant="outlined" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {product.price.toLocaleString('vi-VN')} đ
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                                        {product.stock}
                                    </TableCell>
                                    <TableCell align="center">
                                        {product.stock === 0 ? (
                                            <Chip icon={<ErrorIcon />} label="Hết hàng" color="error" size="small" sx={{ fontWeight: 600 }} />
                                        ) : product.stock <= 10 ? (
                                            <Chip icon={<WarningIcon />} label="Sắp hết" color="warning" size="small" sx={{ fontWeight: 600 }} />
                                        ) : (
                                            <Chip icon={<CheckCircleIcon />} label="Còn hàng" color="success" size="small" sx={{ fontWeight: 600 }} />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Chỉnh sửa sản phẩm">
                                            <IconButton color="info" size="small" onClick={() => onOpenEditModal(product)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa sản phẩm">
                                            <IconButton color="error" size="small" onClick={() => onDelete(product)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};
