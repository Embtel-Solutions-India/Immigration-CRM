import React, { useState } from 'react';
import { useTimer } from '../../hooks/useTimer.js';
import { timerStart, timerStop } from '../../api/workUnitApi.js';

export default function WorkTimer({ unit, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { display } = useTimer(unit.startTime, unit.timerActive);

  const toggle = async () => {
    setLoading(true);
    try {
      const updated = unit.timerActive
        ? await timerStop(unit._id)
        : await timerStart(unit._id);
      onUpdate?.(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-lg font-semibold text-gray-800">{display}</span>
      <button
        onClick={toggle}
        disabled={loading}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          unit.timerActive
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {unit.timerActive ? '⏹ Stop' : '▶ Start'}
      </button>
    </div>
  );
}
