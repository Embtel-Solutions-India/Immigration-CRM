import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, loading } = useSelector(s => s.auth);
  return {
    user,
    loading,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    team: user?.team,
  };
}
