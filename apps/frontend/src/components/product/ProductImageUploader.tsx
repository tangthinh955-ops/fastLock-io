import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FC } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  BrokenImageOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ImageOutlined,
} from '@mui/icons-material';
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  uploadProductImageToCloudinary,
  validateProductImageFile,
} from '../../api/cloudinary';
import { isCloudinaryConfigured } from '../../config/env';

export interface ProductImageUploaderProps {
  imageUrl: string;
  disabled?: boolean;
  onImageUrlChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export const ProductImageUploader: FC<ProductImageUploaderProps> = ({
  imageUrl,
  disabled = false,
  onImageUrlChange,
  onUploadingChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onUploadingChangeRef = useRef(onUploadingChange);

  useEffect(() => {
    onUploadingChangeRef.current = onUploadingChange;
  }, [onUploadingChange]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      onUploadingChangeRef.current?.(false);
    };
  }, []);

  useEffect(() => {
    setPreviewError(false);
  }, [imageUrl]);

  const trimmedUrl = imageUrl.trim();
  const hasValidPreviewUrl = /^https?:\/\/\S+$/i.test(trimmedUrl);
  const canUpload = !disabled && !uploading && isCloudinaryConfigured;

  const handleFileSelected = async (file: File) => {
    if (!canUpload) {
      return;
    }

    const validationError = validateProductImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);
    onUploadingChangeRef.current?.(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const secureUrl = await uploadProductImageToCloudinary(file, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (!controller.signal.aborted) {
            setProgress(percent);
          }
        },
      });
      if (!controller.signal.aborted) {
        onImageUrlChange(secureUrl);
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.';
        setUploadError(message);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setUploading(false);
        onUploadingChangeRef.current?.(false);
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      void handleFileSelected(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!canUpload) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!canUpload) {
      return;
    }
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!canUpload) {
      return;
    }
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadError(null);
    onImageUrlChange('');
  };

  return (
    <Stack spacing={1.5}>
      <Paper
        variant="outlined"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 1.5,
          borderRadius: 2,
          borderStyle: isDragging ? 'dashed' : 'solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
          ...(canUpload
            ? {
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }
            : {}),
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hasValidPreviewUrl && !previewError ? (
              <Box
                component="img"
                src={trimmedUrl}
                alt="Ảnh xem trước sản phẩm"
                onError={() => setPreviewError(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : hasValidPreviewUrl && previewError ? (
              <BrokenImageOutlined color="disabled" fontSize="large" />
            ) : (
              <ImageOutlined color="disabled" fontSize="large" />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Ảnh sản phẩm
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25, mb: 1.25 }}
            >
              Kéo-thả hoặc chọn ảnh từ máy (JPG, PNG, WEBP, GIF — tối đa 5 MB)
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<CloudUploadOutlined />}
                disabled={disabled || uploading || !isCloudinaryConfigured}
                onClick={() => fileInputRef.current?.click()}
              >
                {trimmedUrl ? 'Đổi ảnh' : 'Tải ảnh từ máy'}
              </Button>

              {trimmedUrl && (
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlined />}
                  disabled={disabled || uploading}
                  onClick={handleRemoveImage}
                >
                  Xóa ảnh
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_PRODUCT_IMAGE_TYPES.join(',')}
          aria-label="Chọn ảnh sản phẩm"
          hidden
          onChange={handleFileInputChange}
        />

        {uploading && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant={progress > 0 ? 'determinate' : 'indeterminate'}
              value={progress}
              sx={{ borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {`Đang tải ảnh lên Cloudinary... ${progress}%`}
            </Typography>
          </Box>
        )}
      </Paper>

      {!isCloudinaryConfigured && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Chưa cấu hình Cloudinary (<code>VITE_CLOUDINARY_CLOUD_NAME</code> &amp;{' '}
          <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>). Bạn vẫn có thể dán đường dẫn ảnh
          trực tiếp bên dưới.
        </Alert>
      )}

      {uploadError && (
        <Alert
          severity="error"
          onClose={() => setUploadError(null)}
          sx={{ borderRadius: 2 }}
        >
          {uploadError}
        </Alert>
      )}

      <TextField
        size="small"
        fullWidth
        label="Hoặc dán đường dẫn ảnh (https://...)"
        placeholder="https://res.cloudinary.com/..."
        value={imageUrl}
        onChange={(e) => {
          setUploadError(null);
          onImageUrlChange(e.target.value);
        }}
        disabled={disabled || uploading}
      />
    </Stack>
  );
};
