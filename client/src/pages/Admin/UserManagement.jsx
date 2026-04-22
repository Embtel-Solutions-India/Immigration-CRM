import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, registerUser } from '../../api/userApi.js';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

export default function UserManagement() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', team: 'Sales', role: 'user' });
  const [saving, setSaving] = useState(false);

  const fetch = () => getUsers().then(setUsers).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const toggleActive = async (u) => {
    await updateUser(u._id, { isActive: !u.isActive });
    dispatch(showToast({ message: `${u.name} ${u.isActive ? 'deactivated' : 'activated'}` }));
    fetch();
  };

  const changeRole = async (u, role) => {
    await updateUser(u._id, { role });
    dispatch(showToast({ message: `${u.name} is now ${role}` }));
    fetch();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await registerUser(newUser);
      dispatch(showToast({ message: 'User created' }));
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', team: 'Sales', role: 'user' });
      fetch();
    } catch (err) {
      dispatch(showToast({ message: err.response?.data?.error || 'Error creating user', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">User Management <span className="text-gray-400 font-normal text-base">({users.length})</span></h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add User</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {u.name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.team}</td>
                <td className="px-4 py-3">
                  <select
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    value={u.role}
                    onChange={e => changeRole(u, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs hover:underline ${u.isActive ? 'text-red-500' : 'text-green-600'}`}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Add New User" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={newUser.name} onChange={e => setNewUser(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" required value={newUser.email} onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" required value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Team</label>
                <select className="input" value={newUser.team} onChange={e => setNewUser(f => ({ ...f, team: e.target.value }))}>
                  <option>Sales</option><option>Marketing</option><option>Production</option>
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create User'}</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
