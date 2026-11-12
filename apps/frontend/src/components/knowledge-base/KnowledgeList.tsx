import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import type { KbEntry } from './types';

interface KnowledgeListProps {
  entries: KbEntry[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onDelete: (id: string) => Promise<boolean>;
}

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .trim();

export const KnowledgeList = ({
  entries,
  loading,
  error,
  onRetry,
  onDelete,
}: KnowledgeListProps) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KbEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const query = normalizeSearch(search);
  const visibleEntries = entries.filter((entry) =>
    normalizeSearch(`${entry.keyword}\n${entry.answer}`).includes(query),
  );

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      if (await onDelete(deleteTarget.id)) setDeleteTarget(null);
      else setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="knowledge-list-heading"
      sx={{ minWidth: 0 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography
          id="knowledge-list-heading"
          component="h2"
          variant="h6"
          sx={{ fontWeight: 750 }}
        >
          Kiến thức đã lưu
        </Typography>
        {!loading && !error && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {query
              ? `${visibleEntries.length}/${entries.length} mục`
              : `${entries.length} mục`}
          </Typography>
        )}
      </Box>
      <TextField
        id="knowledge-search"
        label="Tìm kiến thức"
        placeholder="Tìm theo tiêu đề hoặc nội dung…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        disabled={loading || !!error}
        fullWidth
        size="small"
        sx={{ mb: 2.5, bgcolor: 'background.paper' }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => setSearch('')}
                  edge="end"
                  sx={{ minWidth: 40, minHeight: 40 }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />

      {loading ? (
        <Stack spacing={2} role="status" aria-label="Đang tải kho kiến thức">
          {[1, 2, 3].map((item) => (
            <Paper key={item} variant="outlined" sx={{ p: 2.5 }}>
              <Skeleton width="55%" height={28} />
              <Skeleton sx={{ mt: 1 }} />
              <Skeleton width="85%" />
              <Skeleton width="70%" />
            </Paper>
          ))}
        </Stack>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={onRetry}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      ) : visibleEntries.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <MenuBookRoundedIcon
            sx={{ fontSize: 42, color: 'primary.main', mb: 1.5 }}
          />
          <Typography
            component="h3"
            variant="subtitle1"
            sx={{ fontWeight: 700 }}
          >
            {entries.length
              ? 'Không tìm thấy kiến thức phù hợp'
              : 'Kho kiến thức đang trống'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, lineHeight: 1.7 }}
          >
            {entries.length
              ? 'Thử một từ khóa khác hoặc xóa nội dung tìm kiếm.'
              : 'Bắt đầu với bảng size, chính sách giao hàng hoặc đổi trả của Shop.'}
          </Typography>
          {query && (
            <Button onClick={() => setSearch('')} sx={{ mt: 2 }}>
              Xóa tìm kiếm
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {visibleEntries.map((entry) => {
            const expandable =
              entry.answer.length > 180 ||
              entry.answer.split(/\r?\n/).length > 3;
            const expanded = expandedId === entry.id;
            return (
              <Paper
                component="article"
                key={entry.id}
                variant="outlined"
                sx={{
                  p: { xs: 2.25, sm: 2.75 },
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    sx={{ fontWeight: 750, pt: 0.75, overflowWrap: 'anywhere' }}
                  >
                    {entry.keyword}
                  </Typography>
                  <Tooltip title="Xóa kiến thức">
                    <IconButton
                      aria-label={`Xóa kiến thức: ${entry.keyword}`}
                      disabled={deleting}
                      onClick={() => {
                        setDeleteTarget(entry);
                        setDeleteError(false);
                      }}
                      sx={{
                        minWidth: 44,
                        minHeight: 44,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'error.light',
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  id={`knowledge-answer-${entry.id}`}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    whiteSpace: 'pre-line',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.85,
                    ...(expandable && !expanded
                      ? {
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 4,
                          overflow: 'hidden',
                        }
                      : {}),
                  }}
                >
                  {entry.answer}
                </Typography>
                {expandable && (
                  <Button
                    size="small"
                    aria-expanded={expanded}
                    aria-controls={`knowledge-answer-${entry.id}`}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    endIcon={
                      expanded ? (
                        <ExpandLessRoundedIcon />
                      ) : (
                        <ExpandMoreRoundedIcon />
                      )
                    }
                    sx={{ mt: 1.5, ml: -0.75, minHeight: 40 }}
                  >
                    {expanded ? 'Thu gọn' : 'Xem đầy đủ'}
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        aria-labelledby="knowledge-delete-title"
        aria-describedby="knowledge-delete-description"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="knowledge-delete-title" sx={{ fontWeight: 750 }}>
          Xóa mục kiến thức?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 700, mb: 1, overflowWrap: 'anywhere' }}>
            {deleteTarget?.keyword}
          </Typography>
          <DialogContentText id="knowledge-delete-description">
            Mục này sẽ được gỡ khỏi kho kiến thức của Shop.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Chưa xóa được kiến thức. Bạn có thể thử lại.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button disabled={deleting} onClick={() => setDeleteTarget(null)}>
            Giữ lại
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={confirmDelete}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {deleting ? 'Đang xóa…' : 'Xóa kiến thức'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
