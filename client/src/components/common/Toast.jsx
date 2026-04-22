import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearToast } from '../../store/uiSlice.js';

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(s => s.ui.toast);

  useEffect(() => {
    const t = setTimeout(() => dispatch(clearToast()), 3500);
    return () => clearTimeout(t);
  }, [toast, dispatch]);

  if (!toast) return null;
  const bg = toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900';

  return (
    <div className={`fixed bottom-6 right-6 ${bg} text-white px-5 py-3 rounded-lg shadow-lg text-sm z-50 max-w-sm`}>
      {toast.message}
    </div>
  );
}
