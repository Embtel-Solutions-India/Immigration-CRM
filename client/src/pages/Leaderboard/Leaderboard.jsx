import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getMarketingLeaderboard,
  getSalesLeaderboard,
  getProductionLeaderboard,
} from "../../api/orgApi.js";
import Spinner from "../../components/common/Spinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const RANK_STYLES = [
  "bg-yellow-50 border-yellow-300 text-yellow-700",
  "bg-gray-50 border-gray-300 text-gray-600",
  "bg-orange-50 border-orange-300 text-orange-600",
];

const SALES_METRICS = [
  { key: "dealValue", label: "Revenue" },
  { key: "dealsWon", label: "Deals Won" },
  { key: "callsMade", label: "Calls Made" },
  { key: "emailsSent", label: "Emails Sent" },
];

const MARKETING_METRICS = [
  { key: "leadsGenerated", label: "Leads Generated" },
  { key: "conversionsToSales", label: "Conversions" },
  { key: "emailsSent", label: "Emails Sent" },
  { key: "openRate", label: "Open Rate" },
  { key: "clickRate", label: "Click Rate" },
];

const PRODUCTION_METRICS = [
  { key: "totalTasks", label: "Total Tasks" },
  { key: "completedTasks", label: "Completed Tasks" },
  { key: "completionRate", label: "Completion Rate" },
  { key: "avgCompletionTime", label: "Avg Completion Time" },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCeo = user?.role === "superadmin";
  const team = isCeo ? "CEO" : user?.team;

  const [salesData, setSalesData] = useState([]);
  const [marketingData, setMarketingData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [singleData, setSingleData] = useState([]);

  const [salesMetric, setSalesMetric] = useState("dealValue");
  const [marketingMetric, setMarketingMetric] = useState("leadsGenerated");
  const [productionMetric, setProductionMetric] = useState("totalTasks");

  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allowedAdminTeams = ["Sales", "Marketing", "Production"];
    if (user?.role === "admin" && !allowedAdminTeams.includes(user.team)) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    setLoading(true);
    if (isCeo) {
      Promise.all([
        getSalesLeaderboard({ metric: salesMetric, period }),
        getMarketingLeaderboard({ metric: marketingMetric, period }),
        getProductionLeaderboard({ metric: productionMetric, period }),
      ])
        .then(([salesRes, marketingRes, productionRes]) => {
          setSalesData(salesRes.leaderboard || []);
          setMarketingData(marketingRes.leaderboard || []);
          setProductionData(productionRes.leaderboard || []);
        })
        .finally(() => setLoading(false));
      return;
    }

    if (team === "Marketing") {
      getMarketingLeaderboard({ metric: marketingMetric, period })
        .then((res) => setSingleData(res.leaderboard || []))
        .finally(() => setLoading(false));
      return;
    }

    if (team === "Production") {
      getProductionLeaderboard({ metric: productionMetric, period })
        .then((res) => setSingleData(res.leaderboard || []))
        .finally(() => setLoading(false));
      return;
    }

    getSalesLeaderboard({ metric: salesMetric, period })
      .then((res) => setSingleData(res.leaderboard || []))
      .finally(() => setLoading(false));
  }, [isCeo, marketingMetric, period, salesMetric, productionMetric, team]);

  const formatValue = (metric, val) => {
    if (metric === "dealValue" || metric === "campaignCost")
      return `$${(val || 0).toLocaleString()}`;
    if (metric === "openRate" || metric === "clickRate" || metric === "completionRate")
      return `${Number(val || 0).toFixed(1)}%`;
    if (metric === "avgCompletionTime")
      return `${Number(val || 0).toFixed(1)}h`;
    return (val || 0).toString();
  };

  const renderBoard = (title, data, metric, setMetric, metrics) => (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex gap-1 flex-wrap">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${metric === m.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {data.map((entry, i) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-shadow hover:shadow-md ${i < 3 ? RANK_STYLES[i] : "bg-white border-gray-100"}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {i + 1}
            </div>
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
              {entry.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {entry.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-base text-gray-900">
                {formatValue(metric, entry[metric])}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {metrics.find((m) => m.key === metric)?.label}
              </p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No data for this period
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">
            {isCeo ? "CEO Leaderboards" : `${team} Leaderboard`}
          </h1>
        </div>
        <div className="flex gap-1">
          {["weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${period === p ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isCeo ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {renderBoard(
            "Sales Leaderboard",
            salesData,
            salesMetric,
            setSalesMetric,
            SALES_METRICS,
          )}
          {renderBoard(
            "Marketing Leaderboard",
            marketingData,
            marketingMetric,
            setMarketingMetric,
            MARKETING_METRICS,
          )}
          {renderBoard(
            "Production Leaderboard",
            productionData,
            productionMetric,
            setProductionMetric,
            PRODUCTION_METRICS,
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {team === "Marketing"
            ? renderBoard(
                "Marketing Leaderboard",
                singleData,
                marketingMetric,
                setMarketingMetric,
                MARKETING_METRICS,
              )
            : team === "Production"
            ? renderBoard(
                "Production Leaderboard",
                singleData,
                productionMetric,
                setProductionMetric,
                PRODUCTION_METRICS,
              )
            : renderBoard(
                "Sales Leaderboard",
                singleData,
                salesMetric,
                setSalesMetric,
                SALES_METRICS,
              )}
        </div>
      )}
    </div>
  );
}
