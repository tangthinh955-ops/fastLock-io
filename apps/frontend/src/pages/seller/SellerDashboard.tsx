import React, { useState, useEffect, useCallback } from 'react';
import { Container, Snackbar, Alert } from '@mui/material';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ProductStatsHeader } from '../../components/product/ProductStatsHeader';
import { ProductTableList } from '../../components/product/ProductTableList';
import { ProductFormModal } from '../../components/product/ProductFormModal';

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
  const sellerId = user?.id || 'seller-uuid-001';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formSku, setFormSku] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formStock, setFormStock] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/products', { params: { sellerId } });
      setProducts(res.data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setToast({ open: true, message: 'Không thể kết nối đến máy chủ backend!', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormSku(''); setFormName(''); setFormPrice(''); setFormStock(''); setFormImageUrl('');
    setFormError(null); setOpenModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormSku(product.sku); setFormName(product.name); setFormPrice(product.price.toString());
    setFormStock(product.stock.toString()); setFormImageUrl(product.imageUrl || '');
    setFormError(null); setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formSku.trim() || !formName.trim() || !formPrice || !formStock) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }
    const priceNum = Number(formPrice);
    const stockNum = Number(formStock);
    if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
      setFormError('Giá và tồn kho phải là số hợp lệ!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct.id}`, {
          sku: formSku.trim().toUpperCase(), name: formName.trim(), price: priceNum, stock: stockNum, imageUrl: formImageUrl.trim() || undefined,
        });
        setToast({ open: true, message: `Đã cập nhật sản phẩm ${formSku}!`, severity: 'success' });
      } else {
        await apiClient.post('/products', {
          sku: formSku.trim().toUpperCase(), name: formName.trim(), price: priceNum, stock: stockNum, imageUrl: formImageUrl.trim() || undefined, sellerId,
        });
        setToast({ open: true, message: `Thêm sản phẩm ${formSku} thành công!`, severity: 'success' });
      }
      setOpenModal(false);
      fetchProducts();
    } catch (err: any) {
      const apiMsg = err.response?.data?.message;
      setFormError(Array.isArray(apiMsg) ? apiMsg.join(', ') : apiMsg || 'Không thể lưu sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) return;
    try {
      await apiClient.delete(`/products/${product.id}`);
      setToast({ open: true, message: `Đã xóa sản phẩm ${product.sku}`, severity: 'success' });
      fetchProducts();
    } catch {
      setToast({ open: true, message: 'Xóa sản phẩm thất bại!', severity: 'error' });
    }
  };

  const filteredProducts = products.filter(
    (p) => p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <ProductStatsHeader products={products} onRefresh={fetchProducts} />
      <ProductTableList
        products={filteredProducts} loading={loading} searchQuery={searchQuery}
        onSearchChange={setSearchQuery} onOpenAddModal={handleOpenAddModal}
        onOpenEditModal={handleOpenEditModal} onDelete={handleDelete}
      />
      <ProductFormModal
        open={openModal} editingProduct={editingProduct} formSku={formSku} formName={formName}
        formPrice={formPrice} formStock={formStock} formImageUrl={formImageUrl} formError={formError}
        submitting={submitting} onClose={() => setOpenModal(false)} onSkuChange={setFormSku}
        onNameChange={setFormName} onPriceChange={setFormPrice} onStockChange={setFormStock}
        onImageUrlChange={setFormImageUrl} onSubmit={handleSubmit}
      />
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>
    </Container>
  );
};
