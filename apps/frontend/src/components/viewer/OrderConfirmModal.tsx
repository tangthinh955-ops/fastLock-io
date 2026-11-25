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
    Chip,
    Alert,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Divider,
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import apiClient from '../../api/client';

export interface DraftOrderProduct {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
}

export interface DefaultShippingInfo {
    recipientName: string;
    shippingPhone: string;
    shippingAddress: string;
}

export interface DraftOrderData {
    buyerId: string;
    livestreamId: string;
    product: DraftOrderProduct;
    defaultShipping: DefaultShippingInfo;
}

interface OrderConfirmModalProps {
    open: boolean;
    data: DraftOrderData | null;
    onClose: () => void;
    onSuccess: (order: any) => void;
}

export const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
    open,
    data,
    onClose,
    onSuccess,
}) => {
    const [recipientName, setRecipientName] = useState('');
    const [shippingPhone, setShippingPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingNote, setShippingNote] = useState('');
    const [saveAsDefault, setSaveAsDefault] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successOrder, setSuccessOrder] = useState<any>(null);

    // Tự động điền (Pre-fill) thông tin giao hàng đã lưu của tài khoản
    useEffect(() => {
        if (!data) return;
        setRecipientName(data.defaultShipping.recipientName || '');
        setShippingPhone(data.defaultShipping.shippingPhone || '');
        setShippingAddress(data.defaultShipping.shippingAddress || '');
        setShippingNote('');
        setErrorMessage('');
        setSuccessOrder(null);
    }, [data]);

    if (!data) return null;

    const { product } = data;

    const handleConfirm = async () => {
        if (!recipientName.trim()) {
            setErrorMessage('Vui lòng nhập họ tên người nhận hàng');
            return;
        }
        if (!shippingPhone.trim()) {
            setErrorMessage('Vui lòng nhập số điện thoại nhận hàng');
            return;
        }
        if (!shippingAddress.trim()) {
            setErrorMessage('Vui lòng nhập địa chỉ nhận hàng chi tiết');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const res = await apiClient.post('/orders/confirm', {
                livestreamId: data.livestreamId,
                productId: product.id,
                quantity: 1,
                recipientName: recipientName.trim(),
                shippingPhone: shippingPhone.trim(),
                shippingAddress: shippingAddress.trim(),
                shippingNote: shippingNote.trim() || undefined,
                saveAsDefault,
            });

            setSuccessOrder(res.data);
            onSuccess(res.data);
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                'Không thể xác nhận chốt đơn. Sản phẩm có thể đã hết hàng!';
            setErrorMessage(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <ShoppingBagOutlinedIcon color="error" />
                    <Typography component="div" variant="h6" sx={{ fontWeight: 800 }}>
                        Xác nhận Chốt Đơn
                    </Typography>
                </Stack>
                <Chip
                    label={product.sku}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 800 }}
                />
            </DialogTitle>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {successOrder ? (
                    <Box sx={{ py: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56 }} />
                        <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                            Chốt Đơn Thành Công!
                        </Typography>
                        <Typography component="div" variant="body2" color="text.secondary">
                            Đơn hàng <strong>#{successOrder.id.slice(0, 8)}</strong> đã được tạo. Mã thanh toán VietQR đã được gửi tự động vào Hộp thư của bạn!
                        </Typography>
                        <Alert severity="warning" sx={{ width: '100%', textAlign: 'left', borderRadius: 2 }}>
                            Giữ hàng trong <strong>2 phút</strong> — quá hạn chưa thanh toán, đơn hàng sẽ tự động hủy và hoàn lại kho.
                        </Alert>
                        {successOrder.payment?.qrUrl && (
                            <Box
                                component="img"
                                src={successOrder.payment.qrUrl}
                                alt="Mã thanh toán VietQR payOS"
                                sx={{
                                    width: '100%',
                                    maxWidth: 210,
                                    height: 'auto',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 1,
                                    bgcolor: '#FFFFFF',
                                }}
                            />
                        )}
                        {successOrder.payment?.checkoutUrl && (
                            <Button
                                component="a"
                                href={successOrder.payment.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="contained"
                                color="error"
                                endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                sx={{ fontWeight: 700, minHeight: 44, px: 3 }}
                            >
                                Thanh toán ngay qua payOS
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        {errorMessage && (
                            <Alert severity="error" onClose={() => setErrorMessage('')}>
                                {errorMessage}
                            </Alert>
                        )}

                        {/* Tóm tắt sản phẩm đang chốt */}
                        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0, pr: 1 }}>
                                    <Typography component="div" variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                                        {product.name}
                                    </Typography>
                                    <Typography component="div" variant="caption" color="text.secondary">
                                        Mã SKU: <strong>{product.sku}</strong> | Còn lại: {product.stock} cái
                                    </Typography>
                                </Box>
                                <Typography component="div" variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main' }}>
                                    {product.price.toLocaleString('vi-VN')} đ
                                </Typography>
                            </Stack>
                        </Box>

                        <Divider>
                            <Typography component="div" variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                THÔNG TIN GIAO HÀNG
                            </Typography>
                        </Divider>

                        <TextField
                            label="Họ và tên người nhận"
                            required
                            fullWidth
                            size="small"
                            value={recipientName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientName(e.target.value)}
                            placeholder="VD: Nguyễn Văn A"
                        />

                        <TextField
                            label="Số điện thoại nhận hàng"
                            required
                            fullWidth
                            size="small"
                            value={shippingPhone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingPhone(e.target.value)}
                            placeholder="VD: 0912345678"
                        />

                        <TextField
                            label="Địa chỉ giao hàng chi tiết"
                            required
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            value={shippingAddress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingAddress(e.target.value)}
                            placeholder="VD: Số 12, Đường Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                        />

                        <TextField
                            label="Ghi chú đơn hàng (Tùy chọn)"
                            fullWidth
                            size="small"
                            value={shippingNote}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingNote(e.target.value)}
                            placeholder="VD: Giao giờ hành chính, gọi trước khi giao"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={saveAsDefault}
                                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label={
                                <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                                    Lưu làm thông tin giao hàng mặc định cho các lần mua sau
                                </Typography>
                            }
                        />
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                {successOrder ? (
                    <Button variant="contained" color="primary" fullWidth onClick={onClose} sx={{ fontWeight: 700 }}>
                        Đã hiểu, quay lại Live
                    </Button>
                ) : (
                    <>
                        <Button onClick={onClose} disabled={submitting} color="inherit">
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleConfirm}
                            disabled={submitting}
                            sx={{ px: 3, fontWeight: 700 }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận Chốt Đơn'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
