import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faDollarSign,
  faShoppingCart,
  faBroom,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../api/analyticsApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const isoDate = (d) => {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const daysAgo = (n) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - n);
  return dt;
};

const money = (n) => {
  const x = Number(n) || 0;
  return `${x.toFixed(2)} EGP`;
};

const Card = ({ title, value, icon }) => (
  <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-5 hover:border-gold transition-colors">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-woody-light font-semibold uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-beige mt-1 truncate">{value}</p>
      </div>
      <div className="w-11 h-11 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
        <FontAwesomeIcon icon={icon} className="text-dark-base text-lg" />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gold">{title}</h2>
    </div>
    <div className="h-[280px]">{children}</div>
  </div>
);

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#E7D7BE' } },
    tooltip: { enabled: true },
  },
  scales: {
    x: { ticks: { color: '#A98C65' }, grid: { color: 'rgba(169,140,101,0.18)' } },
    y: { ticks: { color: '#A98C65' }, grid: { color: 'rgba(169,140,101,0.18)' } },
  },
};

const Analytics = () => {
  const { token } = useAuth();
  const [preset, setPreset] = useState('7d');
  const [from, setFrom] = useState(isoDate(daysAgo(7)));
  const [to, setTo] = useState(isoDate(new Date()));

  const range = useMemo(() => ({ from, to }), [from, to]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [topProducts, setTopProducts] = useState(null);

  const refresh = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const [o, tp] = await Promise.all([
        analyticsApi.overview(range, token),
        analyticsApi.topProducts({ ...range, limit: 10 }, token),
      ]);
      setOverview(o);
      setTopProducts(tp);
    } catch (e) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, from, to]);

  useEffect(() => {
    if (preset === '7d') {
      setFrom(isoDate(daysAgo(7)));
      setTo(isoDate(new Date()));
    }
    if (preset === '30d') {
      setFrom(isoDate(daysAgo(30)));
      setTo(isoDate(new Date()));
    }
  }, [preset]);

  const kpis = overview?.kpis;

  const handleClearAll = async () => {
    if (!token) return;
    const ok = window.confirm('Clear ALL analytics events? This cannot be undone.');
    if (!ok) return;
    try {
      await analyticsApi.clearAll(token);
      await refresh();
    } catch (e) {
      setError(e?.message || 'Failed to clear analytics');
    }
  };

  const handleDeleteRange = async () => {
    if (!token) return;
    const ok = window.confirm(`Delete analytics between ${from} and ${to}? This cannot be undone.`);
    if (!ok) return;
    try {
      await analyticsApi.deleteByRange({ from, to }, token);
      await refresh();
    } catch (e) {
      setError(e?.message || 'Failed to delete analytics by range');
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold">Analytics</h1>
          <p className="text-beige mt-1">
            Sales insights based on orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
              preset === '7d' ? 'border-gold bg-gold/10 text-gold' : 'border-woody text-beige hover:border-gold hover:text-gold'
            }`}
            onClick={() => setPreset('7d')}
          >
            Last 7 days
          </button>
          <button
            className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
              preset === '30d' ? 'border-gold bg-gold/10 text-gold' : 'border-woody text-beige hover:border-gold hover:text-gold'
            }`}
            onClick={() => setPreset('30d')}
          >
            Last 30 days
          </button>
          <button
            className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
              preset === 'custom' ? 'border-gold bg-gold/10 text-gold' : 'border-woody text-beige hover:border-gold hover:text-gold'
            }`}
            onClick={() => setPreset('custom')}
          >
            Custom
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setPreset('custom');
                setFrom(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-woody bg-black text-beige text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
            />
            <span className="text-woody-light text-sm">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setPreset('custom');
                setTo(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-woody bg-black text-beige text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-woody/30 text-gold border border-gold rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-dark-light border border-woody rounded-xl p-6 text-beige">
          Loading analytics…
        </div>
      )}

      {!loading && kpis && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card title="Revenue" value={money(kpis.revenue)} icon={faDollarSign} />
            <Card title="Orders" value={String(kpis.orders)} icon={faShoppingCart} />
            <Card title="AOV" value={money(kpis.aov)} icon={faChartBar} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-5">
              <p className="text-xs text-woody-light font-semibold uppercase tracking-wide">Data management</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={handleDeleteRange}
                  className="w-full px-3 py-2 rounded-lg border border-woody text-beige hover:border-gold hover:text-gold transition text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faBroom} /> Delete by date range
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-2 rounded-lg border border-gold bg-gold/10 text-gold hover:bg-gold hover:text-dark-base transition text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} /> Clear all analytics
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Top products">
              {topProducts ? (
                <Bar
                  data={topProducts}
                  options={{
                    ...baseChartOptions,
                    scales: {
                      x: { ticks: { color: '#A98C65' }, grid: { color: 'rgba(169,140,101,0.18)' } },
                      y: { ticks: { color: '#A98C65' }, grid: { color: 'rgba(169,140,101,0.18)' } },
                    },
                  }}
                />
              ) : (
                <div className="text-woody-light">No data</div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
