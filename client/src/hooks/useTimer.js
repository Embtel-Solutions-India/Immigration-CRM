import { useState, useEffect, useRef } from 'react';

export function useTimer(startTime, active) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (active && startTime) {
      const base = Date.now() - new Date(startTime).getTime();
      setElapsed(base);
      ref.current = setInterval(() => setElapsed(Date.now() - new Date(startTime).getTime()), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active, startTime]);

  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  const display = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  return { elapsed, display };
}
