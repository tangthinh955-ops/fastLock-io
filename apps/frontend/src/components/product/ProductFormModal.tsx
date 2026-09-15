import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Grid,
    TextField,
    InputAdornment,
    Button,
    CircularProgress,
} from '@mui/material';
import type { Product } from '../../pages/seller/SellerDashboard';

interface ProductFormModalProps {
    open: boolean;
    editingProduct: Product | null;
    formSku: string;
    formName: string;
    formPrice: string;
    formStock: string;
    formImageUrl: string;
    formError: string | null;
    submitting: boolean;
    onClose: () => void;
    onSkuChange: (val: string) => void;
    onNameChange: (val: string) => void;
    onPriceChange: (val: string) => void;
    onStockChange: (val: string) => void;
    onImageUrlChange: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
    open,
    editingProduct,
    formSku,
    formName,
    formPrice,
    formStock,
    formImageUrl,
    formError,
    submitting,
    onClose,
    onSkuChange,
    onNameChange,
    onPriceChange,
    onStockChange,
    onImageUrlChange,
    onSubmit,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
                {editingProduct ? `✏️ Cập nhật Sản Phẩm: ${editingProduct.sku}` : '➕ Thêm Sản Phẩm Mới'}
            </DialogTitle>
            <form onSubmit={onSubmit}>
                <DialogContent sx={{ pt: 3 }}>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {formError}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                label="Mã SKU (Ví dụ: SP01, AO_THUN_01)"
                                fullWidth
                                required
                                value={formSku}
                                onChange={(e) => onSkuChange(e.target.value.toUpperCase())}
                                placeholder="SP01"
                                helperText="Mã SKU duy nhất để thuật toán Aho-Corasick bóc tách khi Livestream"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Tên sản phẩm"
                                fullWidth
                                required
                                value={formName}
                                onChange={(e) => onNameChange(e.target.value)}
                                placeholder="Áo Polo Nam Cao Cấp"
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Giá bán (VNĐ)"
                                type="number"
                                fullWidth
                                required
                                value={formPrice}
                                onChange={(e) => onPriceChange(e.target.value)}
                                placeholder="199000"
                                slotProps={{
                                    input: {
                                        endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Số lượng tồn kho"
                                type="number"
                                fullWidth
                                required
                                value={formStock}
                                onChange={(e) => onStockChange(e.target.value)}
                                placeholder="100"
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Đường dẫn ảnh sản phẩm (Không bắt buộc)"
                                fullWidth
                                value={formImageUrl}
                                onChange={(e) => onImageUrlChange(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={onClose} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {submitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Tạo sản phẩm'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
