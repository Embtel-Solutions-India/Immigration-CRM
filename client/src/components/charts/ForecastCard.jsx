import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getForecast } from '../../api/forecastApi.js';

const CONFIDENCE_STYLE = {
  high:   { icon: <CheckCircle size={14} className="text-green-500" />, label: 'High Confidence', color: 'text-green-600' },
  medium: { icon: <Info size={14} className="text-amber-500" />,        label: 'Medium Confidence', color: 'text-amber-600' },
  low:    { icon: <AlertCircle size={14} className="text-red-400" />,   label: 'Low Confidence',    color: 'text-red-500' },
};

export default function ForecastCard() {
  const [data, setData] = useState(null);

  useEffect(() => { getForecast({ period: 30 }).then(setData).catch(() => {}); }, []);

  if (!data) return null;
  const { precomputed, requested } = data;
  const conf = CONFIDENCE_STYLE[requested?.confidence || 'low'];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Revenue Forecast</h2>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${conf.color}`}>
          {conf.icon}{conf.label}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '7-Day', value: precomputed?.days7?.forecast },
          { label: '14-Day', value: precomputed?.days14?.forecast },
          { label: '30-Day', value: precomputed?.days30?.forecast },
        ].map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">${(value || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div>Hot leads: <span className="font-medium text-red-600">${(requested?.hotForecast || 0).toLocaleString()}</span></div>
        <div>Warm leads: <span className="font-medium text-amber-600">${(requested?.warmForecast || 0).toLocaleString()}</span></div>
        <div>Pipeline: <span className="font-medium text-blue-600">${(requested?.pipelineForecast || 0).toLocaleString()}</span></div>
      </div>
    </div>
  );
}
