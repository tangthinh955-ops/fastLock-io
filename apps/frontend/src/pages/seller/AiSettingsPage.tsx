import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  Alert,
  Box,
  Chip,
  Container,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import apiClient from '../../api/client';
import { KnowledgeForm } from '../../components/knowledge-base/KnowledgeForm';
import { KnowledgeList } from '../../components/knowledge-base/KnowledgeList';
import type {
  KbEntry,
  KnowledgeDraft,
} from '../../components/knowledge-base/types';

const errorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
};

export const AiSettingsPage = () => {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const loadRequest = useRef<AbortController | null>(null);

  const fetchEntries = useCallback(async () => {
    loadRequest.current?.abort();
    const request = new AbortController();
    loadRequest.current = request;
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiClient.get<KbEntry[]>('/ai/knowledge', {
        signal: request.signal,
      });
      if (!request.signal.aborted) setEntries(response.data);
    } catch (error) {
      if (!request.signal.aborted)
        setLoadError(
          errorMessage(error, 'Chưa tải được kho kiến thức. Vui lòng thử lại.'),
        );
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
    return () => loadRequest.current?.abort();
  }, [fetchEntries]);

  const addEntry = async (draft: KnowledgeDraft) => {
    try {
      const response = await apiClient.post<KbEntry>('/ai/knowledge', draft);
      setEntries((current) => [response.data, ...current]);
      setToast({
        message: 'Đã thêm kiến thức vào kho của Shop.',
        severity: 'success',
      });
      return true;
    } catch (error) {
      setToast({
        message: errorMessage(
          error,
          'Chưa lưu được kiến thức. Nội dung bạn nhập vẫn được giữ lại.',
        ),
        severity: 'error',
      });
      return false;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await apiClient.delete(`/ai/knowledge/${id}`);
      setEntries((current) => current.filter((entry) => entry.id !== id));
      setToast({ message: 'Đã xóa mục kiến thức.', severity: 'success' });
      return true;
    } catch (error) {
      setToast({
        message: errorMessage(
          error,
          'Chưa xóa được kiến thức. Vui lòng thử lại.',
        ),
        severity: 'error',
      });
      return false;
    }
  };

  return (
    <>
      <Box
        component="div"
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
          py: { xs: 2.5, md: 4 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Paper
            component="header"
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3.5 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              sx={{
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    borderRadius: 3,
                    width: 50,
                    height: 50,
                    flexShrink: 0,
                  }}
                >
                  <MenuBookRoundedIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.65rem', sm: '2rem' },
                      letterSpacing: '-0.025em',
                      lineHeight: 1.25,
                    }}
                  >
                    Kho kiến thức của Shop
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      maxWidth: 640,
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                    }}
                  >
                    Quản lý bảng size, thông tin và chính sách để trợ lý tư vấn
                    khách hàng đúng với Shop.
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={
                  loading
                    ? 'Đang tải kiến thức…'
                    : loadError
                      ? 'Chưa tải dữ liệu'
                      : `${entries.length} mục đã lưu`
                }
                variant="outlined"
                sx={{
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  flexShrink: 0,
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'primary.main',
                  bgcolor: 'primary.light',
                }}
              />
            </Stack>
          </Paper>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: 'minmax(300px, 0.85fr) minmax(0, 1.55fr)',
              },
              alignItems: 'start',
              gap: 3,
            }}
          >
            <KnowledgeForm
              disabled={loading || !!loadError}
              onSubmit={addEntry}
            />
            <KnowledgeList
              entries={entries}
              loading={loading}
              error={loadError}
              onRetry={() => {
                void fetchEntries();
              }}
              onDelete={deleteEntry}
            />
          </Box>
        </Container>
      </Box>
      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};
