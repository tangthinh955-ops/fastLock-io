import React, { useState, useEffect } from 'react';
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
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import apiClient from '../../api/client';

export interface KbEntry {
  id: string;
  keyword: string;
  answer: string;
  sellerId: string;
}

export const AiSettingsPage: React.FC = () => {
  const [rules, setRules] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [formKeyword, setFormKeyword] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/knowledge');
      setRules(res.data);
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Lỗi tải danh sách kiến thức AI', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeyword.trim() || !formAnswer.trim()) {
      setToast({ open: true, message: 'Vui lòng nhập đầy đủ Tiêu đề và Nội dung kiến thức', severity: 'error' });
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.post('/ai/knowledge', {
        keyword: formKeyword,
        answer: formAnswer,
      });
      setFormKeyword('');
      setFormAnswer('');
      setToast({ open: true, message: 'Thêm kiến thức thành công', severity: 'success' });
      fetchRules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi thêm kiến thức';
      setToast({ open: true, message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kiến thức này?')) return;
    try {
      await apiClient.delete(`/ai/knowledge/${id}`);
      setToast({ open: true, message: 'Đã xóa kiến thức', severity: 'success' });
      fetchRules();
    } catch (err) {
      setToast({ open: true, message: 'Lỗi xóa kiến thức', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AutoAwesomeIcon fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Cấu hình Trí tuệ Nhân tạo (AI)</Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Thêm bảng size, thông tin và chính sách của Shop để AI tìm kiến thức phù hợp khi tư vấn khách hàng.
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Khung Thêm Quy Tắc */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Thêm kiến thức mới</Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Đã lưu {rules.length} mục kiến thức.
            </Typography>

            <form onSubmit={handleAddRule}>
              <TextField
                label="Tiêu đề"
                placeholder="VD: Chính sách giao hàng"
                helperText="Tối đa 100 ký tự"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                fullWidth
                size="small"
                margin="normal"
                value={formKeyword}
                onChange={(e) => setFormKeyword(e.target.value)}
                disabled={submitting}
              />
              <TextField
                label="Nội dung kiến thức"
                placeholder="VD: Phí giao hàng 25.000đ. Miễn phí với đơn từ 500.000đ."
                helperText="Tối đa 1.000 ký tự"
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                disabled={submitting}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                disabled={submitting}
                sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Lưu kiến thức
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Khung Danh sách Quy Tắc */}
        <Grid size={{ xs: 12, md: 8 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Tiêu đề</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Nội dung kiến thức</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} align="center">Đang tải...</TableCell></TableRow>
                ) : rules.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có kiến thức nào.</TableCell></TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>{rule.keyword}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{rule.answer}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => handleDelete(rule.id)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Container>
  );
};
