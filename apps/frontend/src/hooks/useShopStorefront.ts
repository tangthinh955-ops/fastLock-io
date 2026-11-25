import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../api/client';

export interface StorefrontProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  sellerId?: string;
  createdAt?: string;
}

export type StorefrontFilterMode = 'ALL' | 'LIVE' | 'IN_STOCK';

interface UseShopStorefrontParams {
  sellerId: string | null;
  activeStreamId?: string | null;
}

export const useShopStorefront = ({
  sellerId,
  activeStreamId = null,
}: UseShopStorefrontParams) => {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [liveProducts, setLiveProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<StorefrontFilterMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const requestIdRef = useRef(0);

  const loadStorefront = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!sellerId) {
      setProducts([]);
      setLiveProducts([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productsPromise = apiClient
        .get<StorefrontProduct[]>('/products', { params: { sellerId } })
        .then((res) => (Array.isArray(res.data) ? res.data : []));

      const liveProductsPromise = activeStreamId
        ? apiClient
            .get<StorefrontProduct[]>(`/livestreams/${activeStreamId}/products`)
            .then((res) => (Array.isArray(res.data) ? res.data : []))
            .catch(() => [] as StorefrontProduct[])
        : Promise.resolve([] as StorefrontProduct[]);

      const [shopItems, liveItems] = await Promise.all([
        productsPromise,
        liveProductsPromise,
      ]);

      if (requestId !== requestIdRef.current) return;

      setProducts(shopItems);
      setLiveProducts(liveItems);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      console.error('Lỗi khi tải danh mục sản phẩm của shop:', requestError);
      setError('Không thể tải danh sách sản phẩm của cửa hàng.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeStreamId, sellerId]);

  useEffect(() => {
    setProducts([]);
    setLiveProducts([]);
    setError('');
    setFilterMode('ALL');
    setSearchQuery('');
  }, [sellerId]);

  useEffect(() => {
    if (!activeStreamId) {
      setFilterMode((prev) => (prev === 'LIVE' ? 'ALL' : prev));
    }
  }, [activeStreamId]);

  useEffect(() => {
    void loadStorefront();
  }, [loadStorefront]);

  const liveProductIds = useMemo(
    () => new Set(liveProducts.map((item) => item.id)),
    [liveProducts],
  );

  const totalProducts = products.length;

  const inStockCount = useMemo(
    () => products.filter((item) => item.stock > 0).length,
    [products],
  );

  const liveProductCount = useMemo(
    () => products.filter((item) => liveProductIds.has(item.id)).length,
    [liveProductIds, products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...products]
      .filter((item) => {
        if (filterMode === 'LIVE' && !liveProductIds.has(item.id)) {
          return false;
        }
        if (filterMode === 'IN_STOCK' && item.stock <= 0) {
          return false;
        }
        if (!normalizedQuery) return true;
        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.sku.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        const aLive = liveProductIds.has(a.id);
        const bLive = liveProductIds.has(b.id);
        if (aLive !== bLive) {
          return aLive ? -1 : 1;
        }
        const aInStock = a.stock > 0;
        const bInStock = b.stock > 0;
        if (aInStock !== bInStock) {
          return aInStock ? -1 : 1;
        }
        return a.sku.localeCompare(b.sku, 'vi');
      });
  }, [filterMode, liveProductIds, products, searchQuery]);

  const refresh = useCallback(() => {
    void loadStorefront();
  }, [loadStorefront]);

  return {
    products,
    filteredProducts,
    liveProductIds,
    totalProducts,
    inStockCount,
    liveProductCount,
    loading,
    error,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
    refresh,
  };
};
