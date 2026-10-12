
import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Droplets,
  FileText,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { useGreeting } from '../hooks/useGreeting'
import { formatCurrency } from '../utils/formatCurrency'
import { analyticsApi } from '../services/api'

function formatMonth(value) {
  if (!value) return 'Unknown'

  const [year, month] = value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getUtilityIcon(utilityType) {
  const type = String(utilityType || '').toUpperCase()

  if (type.includes('ELECTRIC')) return Zap
  if (type.includes('WATER')) return Droplets
  if (type.includes('INTERNET') || type.includes('WIFI')) return Wifi
  if (type.includes('GAS')) return Activity

  return FileText
}

function getStatusClasses(status) {
  const normalized = String(status || '').toUpperCase()

  if (normalized === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
  }

  if (normalized === 'OVERDUE') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
}

function getSeverityClasses(severity) {
  const normalized = String(severity || '').toUpperCase()

  if (normalized === 'HIGH') {
    return {
      badge:
        'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-800',
      icon:
        'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300',
      border: 'border-red-200 dark:border-red-900',
    }
  }

  if (normalized === 'MEDIUM') {
    return {
      badge:
        'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
      icon:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900',
    }
  }

  return {
    badge:
      'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    icon:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  }
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            {eyebrow}
          </p>
        )}

        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h4>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function DashboardPage() {
  const greeting = useGreeting()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await analyticsApi.summary()
      setSummary(data)
    } catch {
      setError('Analytics are temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const monthlySpending = summary?.monthlySpending ?? []
  const anomalies = summary?.anomalies ?? []
  const recentBills = summary?.recentBills ?? []
  const upcomingDueDates = summary?.upcomingDueDates ?? []

  const openBills = summary ? summary.unpaidCount ?? 0 : 0
  const overdueCount = summary?.overdueCount ?? 0

  const highSeverityCount = anomalies.filter(
    (item) => String(item.severity).toUpperCase() === 'HIGH',
  ).length

  const chartTotal = monthlySpending.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  )

  const latestMonth = monthlySpending[monthlySpending.length - 1]
  const previousMonth = monthlySpending[monthlySpending.length - 2]

  const spendingChange =
    latestMonth && previousMonth && Number(previousMonth.amount) !== 0
      ? ((Number(latestMonth.amount) - Number(previousMonth.amount)) /
          Number(previousMonth.amount)) *
        100
      : null

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')

  const chartGridColor = isDark ? '#2b394f' : '#e9edf5'
  const chartTextColor = isDark ? '#94a3b8' : '#64748b'
  const tooltipBackground = isDark ? '#151e30' : '#ffffff'
  const tooltipBorder = isDark ? '#2b394f' : '#e2e8f0'

  return (
    <section className="space-y-7">
      {/* Welcome banner */}
      <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 -z-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Your personal bill intelligence
            </div>

            <p className="text-sm font-medium text-indigo-200">
              {greeting}, welcome back.
            </p>

            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Your bills.
              <br className="hidden sm:block" /> Under better control.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100/80 sm:text-base">
              Track utility expenses, stay ahead of due dates, and discover
              unusual changes in your bills—all from one workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/bills"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 shadow-sm transition hover:bg-indigo-50"
              >
                View all bills
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={loadSummary}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh overview
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[290px] lg:shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-indigo-100">
                <Wallet className="h-[18px] w-[18px]" />
              </div>
              <p className="text-xs text-indigo-200">Total spending</p>
              <p className="mt-1 break-words text-lg font-bold tracking-tight sm:text-xl">
                {loading ? '—' : formatCurrency(summary?.totalSpending ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                <CheckCircle2 className="h-[18px] w-[18px]" />
              </div>
              <p className="text-xs text-indigo-200">Bills paid</p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                {loading ? '—' : summary?.paidCount ?? 0}
              </p>
            </div>

            <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200">Upcoming due dates</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {loading
                      ? 'Checking your bills...'
                      : `${upcomingDueDates.length} bill${
                          upcomingDueDates.length === 1 ? '' : 's'
                        } to review`}
                  </p>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-indigo-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load your overview</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSummary}
            className="self-start rounded-lg border border-amber-300 bg-white px-4 py-2 font-semibold transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 sm:self-center"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div>
        <SectionHeading
          eyebrow="At a glance"
          title="Your financial overview"
          description="A snapshot of your saved utility bills and payment status."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Spend"
            value={loading ? '—' : formatCurrency(summary?.totalSpending ?? 0)}
            delta="Based on saved bills"
          />

          <StatCard
            label="Paid Bills"
            value={loading ? '—' : summary?.paidCount ?? 0}
            delta={
              loading ? 'Loading...' : formatCurrency(summary?.paidAmount ?? 0)
            }
          />

          <StatCard
            label="Open Bills"
            value={loading ? '—' : openBills}
            delta={loading ? 'Loading...' : `${overdueCount} overdue`}
          />

          <StatCard
            label="Upcoming Due"
            value={loading ? '—' : upcomingDueDates.length}
            delta="Needs attention"
          />
        </div>
      </div>

      {/* Spending trend */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-700 dark:bg-[#151e30] sm:p-6 lg:p-7">
        <SectionHeading
          eyebrow="Spending analytics"
          title="Monthly spending trend"
          description="Understand how your recorded utility expenses change over time."
          action={
            !loading && monthlySpending.length > 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Period total
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(chartTotal)}
                </p>
              </div>
            ) : null
          }
        />

        {!loading && monthlySpending.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Monthly expenses
            </span>

            {spendingChange !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  spendingChange > 0
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : spendingChange < 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {spendingChange > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : spendingChange < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : null}
                {Math.abs(spendingChange).toFixed(1)}% vs previous month
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading spending data...
              </p>
            </div>
          </div>
        ) : monthlySpending.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Your spending trend starts here"
            description="Once you have bills recorded across billing periods, your monthly spending trend will appear here."
            action={
              <Link
                to="/bills"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
              >
                Explore bills
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
        ) : (
          <div className="h-[280px] w-full sm:h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySpending}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke={chartGridColor}
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  axisLine={false}
                  tickLine={false}
                  stroke={chartTextColor}
                  tick={{ fontSize: 11, fill: chartTextColor }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  stroke={chartTextColor}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('en-IN', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                  tick={{ fontSize: 11, fill: chartTextColor }}
                  width={55}
                />

                <Tooltip
                  labelFormatter={formatMonth}
                  formatter={(value) => [formatCurrency(value), 'Spending']}
                  contentStyle={{
                    backgroundColor: tooltipBackground,
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: 14,
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
                    padding: '12px 14px',
                  }}
                  itemStyle={{
                    color: isDark ? '#c7d2fe' : '#4338ca',
                  }}
                  labelStyle={{
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                  cursor={{
                    stroke: isDark ? '#6366f1' : '#c7d2fe',
                    strokeDasharray: '4 4',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Spending"
                  stroke="#818cf8"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: isDark ? '#151e30' : '#ffffff',
                    stroke: '#818cf8',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#818cf8',
                    stroke: isDark ? '#151e30' : '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      {/* Anomaly highlights */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-700 dark:bg-[#151e30] sm:p-6 lg:p-7">
        <SectionHeading
          eyebrow="Automated monitoring"
          title="Anomaly highlights"
          description="Potential billing changes flagged by your backend detection rules."
          action={
            !loading ? (
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                {anomalies.length} detected
              </span>
            ) : null
          }
        />

        {!loading && anomalies.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">
                  {highSeverityCount}
                </strong>{' '}
                high-severity
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Rule-based detection
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : anomalies.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No anomalies reported"
            description="There are no detected anomalies in the analytics response for your saved bills."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {anomalies.slice(0, 4).map((anomaly, index) => {
              const severity = getSeverityClasses(anomaly.severity)

              const relatedBill = [
                ...recentBills,
                ...upcomingDueDates,
              ].find((bill) => String(bill.id) === String(anomaly.billId))

              const utilityType =
                anomaly.utilityType || relatedBill?.utilityType || ''
              const providerName =
                anomaly.providerName || relatedBill?.providerName || ''

              const UtilityIcon = getUtilityIcon(utilityType)

              const utilityLabel = String(utilityType)
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (character) => character.toUpperCase())

              return (
                <div
                  key={`${anomaly.billId}-${anomaly.ruleCode}-${index}`}
                  className={`rounded-xl border p-4 transition hover:shadow-sm dark:hover:shadow-black/20 ${severity.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severity.icon}`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {utilityType && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <UtilityIcon className="h-3.5 w-3.5" />
                            {utilityLabel}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${severity.badge}`}
                        >
                          {anomaly.severity || 'INFO'}
                        </span>

                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          Bill #{anomaly.billId}
                        </span>
                      </div>

                      {providerName ? (
                        <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
                          Provider:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {providerName}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          Provider details unavailable
                        </p>
                      )}

                      <h4 className="mt-2 text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">
                        {anomaly.title || anomaly.ruleCode || 'Detected anomaly'}
                      </h4>

                      {anomaly.evidence && (
                        <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {anomaly.evidence}
                        </p>
                      )}

                      {anomaly.billId && (
                        <Link
                          to={`/bills/${anomaly.billId}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Review {utilityType ? utilityLabel.toLowerCase() : 'bill'} bill
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && anomalies.length > 4 && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Showing 4 of {anomalies.length} detected anomalies.
          </p>
        )}
      </article>

      {/* Due dates and recent bills */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Upcoming due dates */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-700 dark:bg-[#151e30] sm:p-6">
          <SectionHeading
            eyebrow="Payment reminders"
            title="Upcoming due dates"
            description="Bills that may need your attention."
            action={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <CalendarClock className="h-5 w-5" />
              </div>
            }
          />

          {loading ? (
            <div className="space-y-4 py-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : upcomingDueDates.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You're all caught up"
              description="No upcoming due dates were returned by the analytics service."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingDueDates.slice(0, 5).map((bill) => {
                const UtilityIcon = getUtilityIcon(bill.utilityType)

                return (
                  <Link
                    key={bill.id}
                    to={`/bills/${bill.id}`}
                    className="group flex items-center gap-3 py-3.5 transition"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-300">
                      <UtilityIcon className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                        {bill.providerName || 'Utility provider'}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock3 className="h-3 w-3" />
                        Due {formatDate(bill.dueDate)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(bill.amount)}
                      </p>
                      <span className="mt-1 inline-flex text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!loading && upcomingDueDates.length > 0 && (
            <Link
              to="/bills"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              View all bills
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </article>

        {/* Recent bills */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-700 dark:bg-[#151e30] sm:p-6">
          <SectionHeading
            eyebrow="Your records"
            title="Recent bills"
            description="Your latest saved billing records."
            action={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                <FileText className="h-5 w-5" />
              </div>
            }
          />

          {loading ? (
            <div className="space-y-4 py-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : recentBills.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No bills added yet"
              description="Your saved bills will appear here after you add your first billing record."
              action={
                <Link
                  to="/bills"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                >
                  Open bill manager
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBills.slice(0, 5).map((bill) => {
                const UtilityIcon = getUtilityIcon(bill.utilityType)

                return (
                  <Link
                    key={bill.id}
                    to={`/bills/${bill.id}`}
                    className="group flex items-center gap-3 py-3.5 transition"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:group-hover:bg-indigo-900/60">
                      <UtilityIcon className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                        {bill.providerName || 'Utility provider'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {bill.utilityType || 'Utility'} ·{' '}
                        {bill.billingPeriod || 'Billing period unavailable'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusClasses(
                          bill.status,
                        )}`}
                      >
                        {bill.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!loading && recentBills.length > 0 && (
            <Link
              to="/bills"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
            >
              Browse bill history
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </article>
      </div>

      {/* Footer insight */}
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 p-5 dark:border-indigo-900/60 dark:from-indigo-950/50 dark:to-violet-950/30 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
            <Lightbulb className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Make your bill data work for you
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">
              Review bill details to compare line items and access the
              available AI-generated explanations for unusual charges.
            </p>
          </div>
        </div>

        <Link
          to="/bills"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 sm:self-center"
        >
          Explore bills
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

export default DashboardPage
