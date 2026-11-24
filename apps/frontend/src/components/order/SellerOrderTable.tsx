import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  ButtonGroup,
  CircularProgress,
  Pagination,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CancelOutlined as CancelIcon,
  ShoppingBagOutlined as ShoppingBagIcon,
} from '@mui/icons-material';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    imageUrl?: string;
  };
}

export interface Order {
  id: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  buyerId: string;
  livestreamId: string;
  createdAt: string;
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  livestream?: {
    id: string;
    title: string;
    status: string;
  };
  items: OrderItem[];
}

interface SellerOrderTableProps {
  orders: Order[];
  loading: boolean;
  updatingOrderId?: string | null;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onUpdateStatus: (orderId: string, newStatus: 'PAID' | 'CANCELLED') => void;
  onRefresh: () => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const ORDER_STATUS_META: Record<
  Order['status'],
  { label: string; color: 'success' | 'error' | 'warning'; variant: 'filled' | 'outlined' }
> = {
  PAID: { label: 'Đã thanh toán', color: 'success', variant: 'filled' },
  CANCELLED: { label: 'Đã hủy / Hoàn kho', color: 'error', variant: 'outlined' },
  PENDING: { label: 'Chờ thanh toán', color: 'warning', variant: 'filled' },
};

const DESKTOP_COLUMNS = [
  'MÃ ĐƠN',
  'KHÁCH HÀNG',
  'PHIÊN LIVE',
  'CHI TIẾT SẢN PHẨM',
  'TỔNG TIỀN',
  'TRẠNG THÁI',
] as const;

const getStatusChip = (status: Order['status']) => {
  const meta = ORDER_STATUS_META[status];
  return <Chip label={meta.label} color={meta.color} size="small" variant={meta.variant} />;
};

interface OrderActionButtonsProps {
  order: Order;
  compact?: boolean;
  disabled?: boolean;
  onUpdateStatus: (orderId: string, newStatus: 'PAID' | 'CANCELLED') => void;
}

const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  order,
  compact = false,
  disabled = false,
  onUpdateStatus,
}) => {
  if (order.status !== 'PENDING') {
    return compact ? null : (
      <Typography variant="body2" color="text.disabled">
        Đã xử lý
      </Typography>
    );
  }

  const actions = (
    <>
      <Button
        fullWidth={compact}
        variant="outlined"
        color="success"
        disabled={disabled}
        startIcon={<CheckCircleIcon />}
        onClick={() => onUpdateStatus(order.id, 'PAID')}
        sx={compact ? { minHeight: 44, borderRadius: 2, fontSize: '0.8125rem' } : undefined}
      >
        Xác nhận
      </Button>
      <Button
        fullWidth={compact}
        variant="outlined"
        color="error"
        disabled={disabled}
        startIcon={<CancelIcon />}
        onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
        sx={compact ? { minHeight: 44, borderRadius: 2, fontSize: '0.8125rem' } : undefined}
      >
        {compact ? 'Hủy đơn' : 'Hủy & Hoàn kho'}
      </Button>
    </>
  );

  if (!compact) {
    return (
      <ButtonGroup size="small" variant="outlined">
        {actions}
      </ButtonGroup>
    );
  }

  return (
    <>
      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" spacing={1}>
        {actions}
      </Stack>
    </>
  );
};

export const SellerOrderTable: React.FC<SellerOrderTableProps> = ({
  orders,
  loading,
  updatingOrderId,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onRefresh,
  page,
  totalPages,
  onPageChange,
}) => {
  const renderOrderItems = (items: OrderItem[]) =>
    items.map((item) => (
      <Box key={item.id} sx={{ mb: 0.5, '&:last-child': { mb: 0 } }}>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
          <strong>[{item.product?.sku || 'SKU'}]</strong> {item.product?.name || 'Sản phẩm'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          SL: {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} ₫
        </Typography>
      </Box>
    ));

  const renderStateContent = () => {
    if (loading) {
      return (
        <Stack spacing={1} sx={{ py: 5, alignItems: 'center' }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary">
            Đang tải danh sách đơn hàng...
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack spacing={1} sx={{ py: 5, px: 2, textAlign: 'center', alignItems: 'center' }}>
        <ShoppingBagIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="body1" color="text.secondary">
          Chưa có đơn hàng nào trong bộ lọc này.
        </Typography>
      </Stack>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper' }}>
      {/* Header & Filter Controls */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: '#EFF6FF',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShoppingBagIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Đơn hàng Livestream
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi trạng thái chốt đơn và hoàn kho khi hủy đơn
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ flex: { xs: 1, sm: 'none' }, minWidth: { xs: 0, sm: 200 } }}>
            <InputLabel id="order-status-filter-label">Trạng thái</InputLabel>
            <Select
              labelId="order-status-filter-label"
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="">Tất cả đơn</MenuItem>
              <MenuItem value="PENDING">Chờ thanh toán</MenuItem>
              <MenuItem value="PAID">Đã thanh toán</MenuItem>
              <MenuItem value="CANCELLED">Đã hủy</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Tải lại danh sách">
            <IconButton
              onClick={onRefresh}
              color="primary"
              aria-label="Tải lại danh sách đơn hàng"
              sx={{
                width: 44,
                height: 44,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                {DESKTOP_COLUMNS.map((label) => (
                  <TableCell key={label} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {label}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  HÀNH ĐỘNG
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>{renderStateContent()}</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        #{order.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.buyer?.name || 'Khách vãng lai'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {order.buyer?.email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {order.livestream?.title || 'Phiên Live'}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderOrderItems(order.items)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {order.totalAmount.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell align="center">
                      <OrderActionButtons
                        order={order}
                        disabled={updatingOrderId === order.id}
                        onUpdateStatus={onUpdateStatus}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Order Cards */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {loading || orders.length === 0 ? (
          renderStateContent()
        ) : (
          orders.map((order) => (
            <Paper key={order.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  #{order.id.slice(0, 8)}
                </Typography>
                {getStatusChip(order.status)}
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {order.buyer?.name || 'Khách vãng lai'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mb: 1 }}>
                {order.buyer?.email || 'N/A'} • {new Date(order.createdAt).toLocaleString('vi-VN')}
              </Typography>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 1.5,
                }}
              >
                {renderOrderItems(order.items)}
              </Box>

              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '55%' }}>
                  {order.livestream?.title || 'Phiên Live'}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 800, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
                >
                  {order.totalAmount.toLocaleString('vi-VN')} ₫
                </Typography>
              </Stack>

              <OrderActionButtons
                order={order}
                compact
                disabled={updatingOrderId === order.id}
                onUpdateStatus={onUpdateStatus}
              />
            </Paper>
          ))
        )}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" sx={{ justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => onPageChange(val)}
            color="primary"
            shape="rounded"
            siblingCount={0}
          />
        </Stack>
      )}
    </Paper>
  );
};
