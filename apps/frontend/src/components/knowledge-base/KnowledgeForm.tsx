import { useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import type { KnowledgeDraft } from './types';

interface KnowledgeFormProps {
  disabled: boolean;
  onSubmit: (draft: KnowledgeDraft) => Promise<boolean>;
}

export const KnowledgeForm = ({ disabled, onSubmit }: KnowledgeFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [touched, setTouched] = useState({ title: false, content: false });
  const [submitting, setSubmitting] = useState(false);
  const titleError = !title.trim() ? 'Nhập tiêu đề cho mục kiến thức này.' : '';
  const contentError = !content.trim()
    ? 'Nhập nội dung để Shop sử dụng khi tư vấn.'
    : '';
  const busy = disabled || submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setTouched({ title: true, content: true });
    if (titleError || contentError) {
      event.currentTarget
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${titleError ? 'title' : 'content'}"]`,
        )
        ?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const saved = await onSubmit({
        keyword: title.trim(),
        answer: content.trim(),
      });
      if (saved) {
        setTitle('');
        setContent('');
        setTouched({ title: false, content: false });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      component="section"
      aria-labelledby="knowledge-form-heading"
      variant="outlined"
      sx={{ p: { xs: 2.5, sm: 3 }, position: { md: 'sticky' }, top: 24 }}
    >
      <Typography
        id="knowledge-form-heading"
        component="h2"
        variant="h6"
        sx={{ fontWeight: 750 }}
      >
        Thêm kiến thức mới
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.75, mb: 3, lineHeight: 1.7 }}
      >
        Ghi lại những thông tin Shop thường dùng để trả lời khách hàng.
      </Typography>

      <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2.5}>
        <TextField
          id="knowledge-title"
          name="title"
          label="Tiêu đề"
          placeholder="Ví dụ: Chính sách đổi trả"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, title: true }))}
          error={touched.title && !!titleError}
          helperText={
            touched.title && titleError
              ? titleError
              : `${title.length}/100 ký tự`
          }
          slotProps={{ htmlInput: { maxLength: 100 } }}
          disabled={busy}
          fullWidth
          required
        />
        <TextField
          id="knowledge-content"
          name="content"
          label="Nội dung kiến thức"
          placeholder={
            'Ví dụ: Shop hỗ trợ đổi size trong 7 ngày.\nSản phẩm cần còn tem và chưa qua sử dụng.'
          }
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={() =>
            setTouched((current) => ({ ...current, content: true }))
          }
          error={touched.content && !!contentError}
          helperText={
            touched.content && contentError
              ? contentError
              : `${content.length.toLocaleString('vi-VN')}/1.000 ký tự`
          }
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          disabled={busy}
          multiline
          minRows={7}
          fullWidth
          required
        />
        <Button
          type="submit"
          variant="contained"
          disabled={busy}
          startIcon={
            submitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AddRoundedIcon />
            )
          }
          sx={{ minHeight: 48 }}
        >
          {submitting ? 'Đang lưu kiến thức…' : 'Lưu kiến thức'}
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          mt: 3,
          p: 1.75,
          bgcolor: 'primary.light',
          borderRadius: 2,
        }}
      >
        <LightbulbOutlinedIcon
          sx={{ color: 'primary.main', fontSize: 21, mt: 0.25 }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.65 }}
        >
          Mỗi mục nên tập trung vào một chủ đề. Ghi rõ mã sản phẩm nếu nội dung
          chỉ áp dụng cho một mẫu.
        </Typography>
      </Box>
    </Paper>
  );
};
