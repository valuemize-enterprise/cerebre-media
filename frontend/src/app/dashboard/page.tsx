'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, FileText, BarChart2,
  ArrowRight, Zap, AlertTriangle,
} from 'lucide-react';
import { reportsApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';
import { DashboardSkeleton } from '../../components/ui/Skeletons';
import { FunnelVisualizer } from '../../components/reports/FunnelVisualizer';
import Link from 'next/link';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  youtube: '#FF0000',
  google_ads: '#4285F4',
  website: '#10B981',
  email: '#F59E0B',
  linkedin: '#0A66C2',
};

const StatCard = ({ label, value, sub, trend, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
      <div className={clsx('p-2.5 rounded-lg', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={clsx('mt-3 flex items-center gap-1 text-xs font-medium',
        trend >= 0 ? 'text-green-600' : 'text-red-500'
      )}>
        {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {Math.abs(trend)}% vs last period
      </div>
    )}
  </div>
);

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { colors } = useTheme();
  const [dashData, setDashData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  const loadDashboard = async () => {
    try {
      const [dash, history, files] = await Promise.all([
        reportsApi.dashboard(),
        reportsApi.history({ months: 3 }),
        (await import('../../lib/api')).uploadApi.list(1),
      ]);
      setDashData(dash.data);
      setHistoryData(history.data);
      setRecentFiles(files.data.files?.slice(0, 5) || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  // Real-time file updates
  useSocket({
    token,
    onAnalysisComplete: (data) => {
      toast.success('New report ready!');
      loadDashboard();
    },
    onFileFailed: (data) => {
      toast.error(`Processing failed for a file`);
    },
  });

  if (loading) return <DashboardSkeleton />;

  const latestReport = dashData?.latestReport;
  const execSnap = latestReport?.executive_snapshot;
  const topPlatforms = dashData?.topPlatforms || [];

  // Build chart data from history
  const chartData = Object.entries(historyData?.platforms || {}).flatMap(
    ([platform, points]: any) =>
      points.map((p: any) => ({
        platform,
        period: p.period?.slice(0, 7),
        impressions: p.impressions,
        engagement: parseFloat((p.engagementRate * 100).toFixed(2)),
      }))
  );

  // Aggregate by period for multi-line chart
  const periodMap: Record<string, any> = {};
  chartData.forEach(({ platform, period, impressions, engagement }) => {
    if (!periodMap[period]) periodMap[period] = { period };
    periodMap[period][platform] = impressions;
  });
  const trendData = Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));

  const uniquePlatforms = [...new Set(chartData.map((d) => d.platform))];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {user?.company} · Marketing Intelligence Dashboard
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Reports Generated"
          value={dashData?.stats?.totalReports || 0}
          icon={BarChart2}
          color="bg-brand-500"
        />
        <StatCard
          label="Files Uploaded"
          value={dashData?.stats?.totalFiles || 0}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          label="Top Platform"
          value={topPlatforms[0]?.platform || '—'}
          sub={topPlatforms[0] ? `${Number(topPlatforms[0].total_impressions).toLocaleString()} impr.` : ''}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard
          label="Strategic Focus"
          value="Active"
          sub={execSnap?.overall_direction || 'No report yet'}
          icon={Zap}
          color="bg-amber-500"
        />
      </div>

      {/* Executive Snapshot */}
      {execSnap && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Wins */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Key wins — {latestReport?.period_label}
            </h2>
            <ul className="space-y-2">
              {(execSnap.key_wins || []).slice(0, 5).map((win: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 font-bold shrink-0">↑</span>
                  {win}
                </li>
              ))}
            </ul>
          </div>
          {/* Concerns */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Key concerns
            </h2>
            <ul className="space-y-2">
              {(execSnap.key_concerns || []).slice(0, 5).map((c: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-amber-500 font-bold shrink-0">!</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Platform impressions trend chart */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Impressions trend — last 3 months
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
              <Legend />
              {uniquePlatforms.map((p) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={PLATFORM_COLORS[p] || '#8B5CF6'}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform bar chart */}
      {topPlatforms.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Platform performance overview
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topPlatforms} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: colors.textMuted }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="platform" type="category" tick={{ fontSize: 11, fill: colors.textMuted }} width={90} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
              <Bar dataKey="total_impressions" name="Impressions" radius={[0, 4, 4, 0]}
                fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Funnel summary */}
      {dashData?.stats?.totalFiles > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Conversion funnel — latest period
          </h2>
          <FunnelVisualizer />
        </div>
      )}

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent uploads</h2>
            <Link href="/upload" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentFiles.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{f.original_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(f.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  f.status === 'analyzed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  f.status === 'extracted' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  f.status === 'processing' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  f.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  f.status === 'uploaded' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                )}>
                  {f.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {dashData?.stats?.totalFiles === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <UploadCloud className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No reports yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first marketing report to get started</p>
          <Link href="/upload"
            className="mt-4 inline-block px-5 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700">
            Upload a report
          </Link>
        </div>
      )}
    </div>
  );
}

function UploadCloud({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}
