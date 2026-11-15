import React from 'react';
import { ContactSidebar } from './ContactSidebar';
import type { InboxContact } from './types';

interface CustomerSidebarProps {
  customers: InboxContact[];
  selectedCustomerId: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (customerId: string) => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  customers,
  selectedCustomerId,
  loading,
  disabled,
  onSelect,
}) => (
  <ContactSidebar
    title="Khách đã nhắn tin"
    itemSubtitle="Khách hàng"
    emptyText="Chưa có khách hàng nào nhắn tin."
    contacts={customers}
    selectedId={selectedCustomerId}
    loading={loading}
    disabled={disabled}
    onSelect={onSelect}
  />
);
