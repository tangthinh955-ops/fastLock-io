import React from 'react';
import {
    Box,
    Paper,
    Stack,
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
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Inventory2Outlined as InventoryIcon,
    ErrorOutlined as ErrorIcon,
    WarningAmber as WarningIcon,
    CheckCircleOutlined as CheckCircleIcon,
    EditOutlined as EditIcon,
    DeleteOutlined as DeleteIcon,
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

const renderStockChip = (stock: number) => {
    if (stock === 0) {
        return <Chip icon={<ErrorIcon />} label="Hết hàng" color="error" size="small" sx={{ fontWeight: 600 }} />;
    }
    if (stock <= 10) {
        return <Chip icon={<WarningIcon />} label="Sắp hết" color="warning" size="small" sx={{ fontWeight: 600 }} />;
    }
    return <Chip icon={<CheckCircleIcon />} label="Còn hàng" color="success" size="small" sx={{ fontWeight: 600 }} />;
};

export const ProductTableList: React.FC<ProductTableListProps> = ({
    products,
    loading,
    searchQuery,
    onSearchChange,
    onOpenAddModal,
    onOpenEditModal,
    onDelete,
}) => {
    const renderStatusState = () => {
        if (loading) {
            return (
                <Stack spacing={1.5} sx={{ py: 5, alignItems: 'center' }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary">
                        Đang tải danh sách sản phẩm từ máy chủ...
                    </Typography>
                </Stack>
            );
        }

        return (
            <Stack spacing={1} sx={{ py: 5, px: 2, textAlign: 'center', alignItems: 'center' }}>
                <InventoryIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {searchQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào trong kho'}
                </Typography>
            </Stack>
        );
    };

    return (
        <>
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 2.5,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1.5,
                }}
            >
                <TextField
                    placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 420 } }}
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
                    sx={{
                        minHeight: 44,
                        borderRadius: 2,
                        fontWeight: 700,
                        px: 2.5,
                        flexShrink: 0,
                    }}
                >
                    Thêm sản phẩm mới
                </Button>
            </Paper>

            {/* Desktop Table */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}
                >
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>MÃ SKU</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>TÊN SẢN PHẨM</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }} align="right">ĐƠN GIÁ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }} align="center">TỒN KHO</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }} align="center">TRẠNG THÁI</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }} align="center">THAO TÁC</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading || products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7}>{renderStatusState()}</TableCell>
                                </TableRow>
                            ) : (
                                products.map((product, idx) => (
                                    <TableRow key={product.id} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={product.sku}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {product.price.toLocaleString('vi-VN')} ₫
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                            {product.stock}
                                        </TableCell>
                                        <TableCell align="center">{renderStockChip(product.stock)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                                                <Tooltip title="Chỉnh sửa sản phẩm">
                                                    <IconButton
                                                        color="primary"
                                                        aria-label={`Chỉnh sửa ${product.name}`}
                                                        onClick={() => onOpenEditModal(product)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa sản phẩm">
                                                    <IconButton
                                                        color="error"
                                                        aria-label={`Xóa ${product.name}`}
                                                        onClick={() => onDelete(product)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Mobile Cards */}
            <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
                {loading || products.length === 0 ? (
                    <Paper variant="outlined" sx={{ borderRadius: 3 }}>
                        {renderStatusState()}
                    </Paper>
                ) : (
                    products.map((product) => (
                        <Paper
                            key={product.id}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.paper' }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
                            >
                                <Chip
                                    label={product.sku}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                />
                                {renderStockChip(product.stock)}
                            </Stack>

                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700, color: 'text.primary', mb: 1, overflowWrap: 'anywhere' }}
                            >
                                {product.name}
                            </Typography>

                            <Stack
                                direction="row"
                                sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 800, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {product.price.toLocaleString('vi-VN')} ₫
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Tồn kho: {product.stock}
                                </Typography>
                            </Stack>

                            <Divider sx={{ mb: 1.5 }} />

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    onClick={() => onOpenEditModal(product)}
                                    sx={{ minHeight: 44, borderRadius: 2 }}
                                >
                                    Sửa
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => onDelete(product)}
                                    sx={{ minHeight: 44, borderRadius: 2 }}
                                >
                                    Xóa
                                </Button>
                            </Stack>
                        </Paper>
                    ))
                )}
            </Stack>
        </>
    );
};
