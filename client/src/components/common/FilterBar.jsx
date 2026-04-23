import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function FilterBar({ filters, onChange }) {
  const { isSuperAdmin, isHrAdmin } = useAuth();

  const update = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div>
        <label className="label">From</label>
        <input type="date" className="input w-36" value={filters.from || ''} onChange={e => update('from', e.target.value)} />
      </div>
      <div>
        <label className="label">To</label>
        <input type="date" className="input w-36" value={filters.to || ''} onChange={e => update('to', e.target.value)} />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input w-36" value={filters.status || ''} onChange={e => update('status', e.target.value)}>
          <option value="">All</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Blocked</option>
        </select>
      </div>
      {(isSuperAdmin || isHrAdmin) && (
        <div>
          <label className="label">Team</label>
          <select className="input w-32" value={filters.team || ''} onChange={e => update('team', e.target.value)}>
            <option value="">All</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>Production</option>
            <option>HR</option>
          </select>
        </div>
      )}
      <button
        className="btn-secondary mt-4"
        onClick={() => onChange({ from: '', to: '', status: '', team: '' })}
      >
        Clear
      </button>
    </div>
  );
}
