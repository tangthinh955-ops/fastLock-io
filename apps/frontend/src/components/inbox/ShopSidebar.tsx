import React from 'react';
import { ContactSidebar } from './ContactSidebar';
import type { InboxContact } from './types';

interface ShopSidebarProps {
  shops: InboxContact[];
  selectedShopId: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (shopId: string) => void;
}

export const ShopSidebar: React.FC<ShopSidebarProps> = ({
  shops,
  selectedShopId,
  loading,
  disabled,
  onSelect,
}) => (
  <ContactSidebar
    title="Kênh trò chuyện"
    itemSubtitle="Tư vấn & chốt đơn"
    emptyText="Chưa có cuộc trò chuyện nào."
    contacts={shops}
    selectedId={selectedShopId}
    loading={loading}
    disabled={disabled}
    onSelect={onSelect}
  />
);
