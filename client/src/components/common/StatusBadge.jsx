import React from 'react';

const statusStyles = {
  Pending:     'bg-yellow-100 text-yellow-700',
  'In Progress':'bg-blue-100 text-blue-700',
  Completed:   'bg-green-100 text-green-700',
  Blocked:     'bg-red-100 text-red-700',
  Received:    'bg-gray-100 text-gray-600',
  Review:      'bg-purple-100 text-purple-700',
  Submitted:   'bg-indigo-100 text-indigo-700',
  Delivered:   'bg-teal-100 text-teal-700',
  Hot:         'bg-red-100 text-red-700',
  Warm:        'bg-orange-100 text-orange-700',
  Cold:        'bg-sky-100 text-sky-700',
  Won:         'bg-green-100 text-green-700',
  Lost:        'bg-gray-100 text-gray-500',
};

export default function StatusBadge({ value }) {
  const cls = statusStyles[value] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>
      {value}
    </span>
  );
}
