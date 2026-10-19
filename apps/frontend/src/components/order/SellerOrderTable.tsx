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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ShoppingBag as ShoppingBagIcon,
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
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onUpdateStatus: (orderId: string, newStatus: 'PAID' | 'CANCELLED') => void;
  onRefresh: () => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const SellerOrderTable: React.FC<SellerOrderTableProps> = ({
  orders,
  loading,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onRefresh,
  page,
  totalPages,
  onPageChange,
}) => {
  const getStatusChip = (status: 'PENDING' | 'PAID' | 'CANCELLED') => {
    switch (status) {
      case 'PAID':
        return <Chip label="Đã thanh toán" color="success" size="small" variant="filled" />;
      case 'CANCELLED':
        return <Chip label="Đã hủy / Hoàn kho" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label="Chờ thanh toán" color="warning" size="small" variant="filled" />;
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
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
          <ShoppingBagIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Danh sách Đơn hàng Livestream
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi trạng thái chốt đơn và xử lý hoàn kho khi hủy
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="order-status-filter-label">Trạng thái</InputLabel>
            <Select
              labelId="order-status-filter-label"
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="">Tất cả đơn</MenuItem>
              <MenuItem value="PENDING">Chờ thanh toán (PENDING)</MenuItem>
              <MenuItem value="PAID">Đã thanh toán (PAID)</MenuItem>
              <MenuItem value="CANCELLED">Đã hủy (CANCELLED)</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Tải lại danh sách">
            <IconButton onClick={onRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Table Section */}
      <TableContainer>
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mã đơn</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phiên Live</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chi tiết sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tổng tiền</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Hành động
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Đang tải danh sách đơn hàng...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    Chưa có đơn hàng nào trong phiên live này!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      #{order.id.slice(0, 8)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {order.buyer?.name || 'Khách vãng lai'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.buyer?.email || 'N/A'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                      {order.livestream?.title || 'Phiên Live'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {order.items.map((item) => (
                      <Box key={item.id} sx={{ mb: 0.5 }}>
                        <Typography variant="body2">
                          <strong>[{item.product?.sku || 'SKU'}]</strong> {item.product?.name || 'Sản phẩm'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SL: {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    ))}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </Typography>
                  </TableCell>

                  <TableCell>{getStatusChip(order.status)}</TableCell>

                  <TableCell align="center">
                    {order.status === 'PENDING' ? (
                      <ButtonGroup size="small" variant="outlined">
                        <Button
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => onUpdateStatus(order.id, 'PAID')}
                        >
                          Xác nhận
                        </Button>
                        <Button
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                        >
                          Hủy & Hoàn kho
                        </Button>
                      </ButtonGroup>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        Đã chốt
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" sx={{ justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => onPageChange(val)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Paper>
  );
};
