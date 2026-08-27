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
  LinearProgress,
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

  const MAX_RULES = 20;

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/knowledge');
      setRules(res.data);
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Lỗi tải danh sách quy tắc AI', severity: 'error' });
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
      setToast({ open: true, message: 'Vui lòng nhập đầy đủ Từ khóa và Câu trả lời', severity: 'error' });
      return;
    }
    
    if (rules.length >= MAX_RULES) {
      setToast({ open: true, message: 'Bạn đã đạt giới hạn tối đa 20 quy tắc.', severity: 'error' });
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
      setToast({ open: true, message: 'Thêm quy tắc thành công', severity: 'success' });
      fetchRules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi thêm quy tắc';
      setToast({ open: true, message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quy tắc này?')) return;
    try {
      await apiClient.delete(`/ai/knowledge/${id}`);
      setToast({ open: true, message: 'Đã xóa quy tắc', severity: 'success' });
      fetchRules();
    } catch (err) {
      setToast({ open: true, message: 'Lỗi xóa quy tắc', severity: 'error' });
    }
  };

  const isLimitReached = rules.length >= MAX_RULES;
  const progressPercent = (rules.length / MAX_RULES) * 100;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AutoAwesomeIcon fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Cấu hình Trí tuệ Nhân tạo (AI)</Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Thiết lập các quy tắc và chính sách bán hàng để nhân viên AI trả lời tự động cho khách hàng của bạn.
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Khung Thêm Quy Tắc */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Thêm Quy Tắc Mới</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Số lượng quy tắc:</Typography>
                <Typography variant="body2" color={isLimitReached ? 'error' : 'textSecondary'} sx={{ fontWeight: 'bold' }}>
                  {rules.length} / {MAX_RULES}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercent} 
                color={isLimitReached ? 'error' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {isLimitReached && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                Bạn đã đạt giới hạn tối đa 20 quy tắc để đảm bảo hiệu suất AI. Vui lòng xóa bớt quy tắc cũ để thêm mới.
              </Alert>
            )}

            <form onSubmit={handleAddRule}>
              <TextField
                label="Từ khóa / Tình huống"
                placeholder="VD: Phí ship, Chính sách đổi trả..."
                fullWidth
                size="small"
                margin="normal"
                value={formKeyword}
                onChange={(e) => setFormKeyword(e.target.value)}
                disabled={isLimitReached || submitting}
              />
              <TextField
                label="AI sẽ trả lời là..."
                placeholder="VD: Dạ shop em freeship cho đơn từ 200k ạ."
                fullWidth
                multiline
                rows={4}
                margin="normal"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                disabled={isLimitReached || submitting}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                disabled={isLimitReached || submitting}
                sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Lưu Quy Tắc
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
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Từ khóa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Nội dung trả lời</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} align="center">Đang tải...</TableCell></TableRow>
                ) : rules.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có quy tắc nào.</TableCell></TableRow>
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
