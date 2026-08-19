import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  createdAt?: string;
}

export const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sellerId = user?.id || 'seller-uuid-001';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State điều khiển Modal Form
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formSku, setFormSku] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formStock, setFormStock] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State thông báo Toast
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 1. Tải danh sách sản phẩm từ backend
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products', {
        params: { sellerId },
      });
      setProducts(res.data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setToast({
        open: true,
        message: 'Không thể kết nối đến máy chủ backend!',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormPrice('');
    setFormStock('');
    setFormImageUrl('');
    setFormError(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormImageUrl(product.imageUrl || '');
    setFormError(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormError(null);
  };

  // 2. Thêm mới hoặc Cập nhật sản phẩm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formSku.trim() || !formName.trim() || !formPrice || !formStock) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc (SKU, Tên, Giá, Tồn kho)!');
      return;
    }

    const priceNum = Number(formPrice);
    const stockNum = Number(formStock);

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Đơn giá phải là số dương hợp lệ!');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Số lượng tồn kho phải là số nguyên dương!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct.id}`, {
          sku: formSku.trim().toUpperCase(),
          name: formName.trim(),
          price: priceNum,
          stock: stockNum,
          imageUrl: formImageUrl.trim() || undefined,
        });
        setToast({ open: true, message: `Đã cập nhật sản phẩm ${formSku}!`, severity: 'success' });
      } else {
        await apiClient.post('/products', {
          sku: formSku.trim().toUpperCase(),
          name: formName.trim(),
          price: priceNum,
          stock: stockNum,
          imageUrl: formImageUrl.trim() || undefined,
          sellerId,
        });
        setToast({ open: true, message: `Thêm sản phẩm ${formSku} thành công!`, severity: 'success' });
      }
      handleCloseModal();
      fetchProducts();
    } catch (err: any) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      const apiMsg = err.response?.data?.message;
      if (Array.isArray(apiMsg)) {
        setFormError(apiMsg.join(', '));
      } else if (apiMsg) {
        setFormError(apiMsg);
      } else {
        setFormError('Không thể lưu sản phẩm. Vui lòng thử lại sau!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Xóa sản phẩm
  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}" (${product.sku})?`)) {
      return;
    }

    try {
      await apiClient.delete(`/products/${product.id}`);
      setToast({ open: true, message: `Đã xóa sản phẩm ${product.sku}`, severity: 'success' });
      fetchProducts();
    } catch (err: any) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      setToast({ open: true, message: 'Xóa sản phẩm thất bại!', severity: 'error' });
    }
  };

  // Lọc sản phẩm tìm kiếm
  const filteredProducts = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Thống kê nhanh
  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* Banner & Nút Chuyển Live Studio */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#38bdf8', mb: 1 }}>
            🏪 SELLER DASHBOARD
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Quản lý kho sản phẩm, thiết lập SKU chốt đơn tự động & sẵn sàng Livestream.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="info"
            startIcon={<RefreshIcon />}
            onClick={fetchProducts}
            sx={{ borderRadius: 2 }}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<VideocamIcon />}
            onClick={() => navigate('/seller/live-studio')}
            sx={{
              borderRadius: 2,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #f43f5e 30%, #fb7185 90%)',
              boxShadow: '0 3px 10px rgba(244, 63, 94, 0.4)',
            }}
          >
            Vào Live Studio WebCam
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #0284c7', boxShadow: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                TỔNG SẢN PHẨM TRÊN KHO
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0284c7' }}>
                {totalProducts} <Typography component="span" variant="body2" color="textSecondary">Mặt hàng</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #16a34a', boxShadow: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                TỔNG SỐ LƯỢNG TỒN KHO
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a' }}>
                {totalStockUnits.toLocaleString('vi-VN')} <Typography component="span" variant="body2" color="textSecondary">Sản phẩm</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, borderLeft: '5px solid #dc2626', boxShadow: 2 }}>
            <CardContent>
              <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                SẢN PHẨM HẾT HÀNG
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                {outOfStockCount} <Typography component="span" variant="body2" color="textSecondary">Cần bổ sung</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Actions Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Tìm theo mã SKU hoặc Tên sản phẩm..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          onClick={handleOpenAddModal}
          sx={{ borderRadius: 2, fontWeight: 'bold', px: 3 }}
        >
          Thêm Sản Phẩm Mới
        </Button>
      </Paper>

      {/* Bảng Danh Sách Sản Phẩm */}
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
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <InventoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    {searchQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào trong kho'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bấm nút "Thêm Sản Phẩm Mới" để tạo mặt hàng đầu tiên của bạn'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, idx) => (
                <TableRow key={product.id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.sku}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 'bold', borderRadius: 1 }}
                    />
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
                      <Chip
                        icon={<ErrorIcon />}
                        label="Hết hàng"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : product.stock <= 10 ? (
                      <Chip
                        icon={<WarningIcon />}
                        label="Sắp hết"
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Còn hàng"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh sửa sản phẩm">
                      <IconButton
                        color="info"
                        size="small"
                        onClick={() => handleOpenEditModal(product)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa sản phẩm">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(product)}
                      >
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

      {/* Modal Dialog: Thêm / Sửa Sản Phẩm */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          {editingProduct ? `✏️ Cập nhật Sản Phẩm: ${editingProduct.sku}` : '➕ Thêm Sản Phẩm Mới'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
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
                  onChange={(e) => setFormSku(e.target.value.toUpperCase())}
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
                  onChange={(e) => setFormName(e.target.value)}
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
                  onChange={(e) => setFormPrice(e.target.value)}
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
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="100"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Đường dẫn ảnh sản phẩm (Không bắt buộc)"
                  fullWidth
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={handleCloseModal} color="inherit">
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

      {/* Toast thông báo */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
