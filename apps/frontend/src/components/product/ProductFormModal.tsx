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
    Stack,
} from '@mui/material';
import {
    EditOutlined as EditOutlinedIcon,
    AddCircleOutlined as AddCircleOutlineIcon,
} from '@mui/icons-material';
import type { Product } from '../../pages/seller/SellerDashboard';
import { ProductImageUploader } from './ProductImageUploader';

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
    const [uploadingImage, setUploadingImage] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setUploadingImage(false);
        }
    }, [open]);

    const isBusy = submitting || uploadingImage;

    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!isBusy) onClose();
            }}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        mx: { xs: 1.5, sm: 3 },
                        width: '100%',
                        borderRadius: 3,
                    },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: 'divider', py: 2, px: { xs: 2.5, sm: 3 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {editingProduct ? (
                        <EditOutlinedIcon color="primary" fontSize="small" />
                    ) : (
                        <AddCircleOutlineIcon color="primary" fontSize="small" />
                    )}
                    <span>
                        {editingProduct ? `Cập nhật sản phẩm: ${editingProduct.sku}` : 'Thêm sản phẩm mới'}
                    </span>
                </Stack>
            </DialogTitle>
            <form
                onSubmit={(e) => {
                    if (isBusy) {
                        e.preventDefault();
                        return;
                    }
                    onSubmit(e);
                }}
            >
                <DialogContent sx={{ pt: 2.5, px: { xs: 2.5, sm: 3 } }}>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
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
                        <Grid size={{ xs: 12, sm: 6 }}>
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
                                        endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
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
                            <ProductImageUploader
                                imageUrl={formImageUrl}
                                disabled={submitting}
                                onImageUrlChange={onImageUrlChange}
                                onUploadingChange={setUploadingImage}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                    <Button onClick={onClose} disabled={isBusy} color="inherit" sx={{ minHeight: 44, px: 2 }}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isBusy}
                        startIcon={isBusy ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ minHeight: 44, px: 2.5, fontWeight: 700 }}
                    >
                        {uploadingImage
                            ? 'Đang tải ảnh...'
                            : submitting
                              ? 'Đang lưu...'
                              : editingProduct
                                ? 'Cập nhật'
                                : 'Tạo sản phẩm'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
