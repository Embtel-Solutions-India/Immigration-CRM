import { useSelector } from 'react-redux';
import { isHrAdminRole, isHrRole, isHrUserRole, normalizeRole } from '../utils/roles.js';

export function useAuth() {
  const { user, loading } = useSelector(s => s.auth);
  const role = normalizeRole(user?.role);
  return {
    user,
    loading,
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isHr: isHrRole(role),
    isHrAdmin: isHrAdminRole(role),
    isHrUser: isHrUserRole(role),
    isGlobalViewer: role === 'superadmin' || isHrRole(role),
    team: user?.team,
  };
}
