import { useSelector } from 'react-redux';
import { isHrAdminRole, isHrRole, isHrUserRole, isOverallAdminRole, normalizeRole, isDocTeamMember, isDocAdminRole } from '../utils/roles.js';

export function useAuth() {
  const { user, loading } = useSelector(s => s.auth);
  const role = normalizeRole(user?.role);
  return {
    user,
    loading,
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isOverallAdmin: isOverallAdminRole(role),
    isHr: isHrRole(role),
    isHrAdmin: isHrAdminRole(role),
    isHrUser: isHrUserRole(role),
    isGlobalViewer: role === 'superadmin' || role === 'overall_admin' || isHrRole(role),
    isDocTeam: isDocTeamMember(user),
    isDocAdmin: isDocAdminRole(user),
    team: user?.team,
  };
}
