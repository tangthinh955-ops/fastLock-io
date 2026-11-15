import type { Role } from '../context/AuthContext';
import { surfaceTokens } from '../theme';

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  SELLER: '/seller/dashboard',
  BUYER: '/viewer',
};

export interface RoleMeta {
  label: string;
  bg: string;
  color: string;
  borderColor: string;
}

export const getRoleMeta = (role: Role | string): RoleMeta => {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'ADMIN',
        bg: surfaceTokens.liveRedSoft,
        color: surfaceTokens.liveRedText,
        borderColor: '#FECACA',
      };
    case 'SELLER':
      return {
        label: 'SELLER',
        bg: surfaceTokens.primarySoft,
        color: surfaceTokens.primaryMain,
        borderColor: surfaceTokens.primaryBorder,
      };
    case 'BUYER':
      return {
        label: 'BUYER',
        bg: surfaceTokens.successSoft,
        color: surfaceTokens.successText,
        borderColor: surfaceTokens.successBorder,
      };
    default:
      return {
        label: String(role || 'BUYER'),
        bg: surfaceTokens.mutedBg,
        color: surfaceTokens.textSecondary,
        borderColor: surfaceTokens.borderSubtle,
      };
  }
};

