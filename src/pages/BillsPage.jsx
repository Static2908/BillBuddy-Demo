import { useCallback, useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import {

  Activity,

  ArrowDownRight,

  ArrowLeft,

  ArrowRight,

  ArrowUpRight,

  CalendarDays,

  Check,

  CheckCircle2,

  ChevronDown,

  CircleAlert,

  Clock3,

  Droplets,

  FilePlus2,

  FileText,

  Filter,

  Flame,

  LoaderCircle,

  Pencil,

  Plus,

  Receipt,

  RotateCcw,

  Search,

  Trash2,

  Wifi,

  X,

  Zap,

} from 'lucide-react'



import { billsApi } from '../services/api'

import { formatCurrency } from '../utils/formatCurrency'



const emptyForm = {

  utilityType: 'ELECTRICITY',

  providerName: '',

  billingPeriod: '',

  totalAmount: '',

  usageAmount: '',

  usageUnit: '',

  dueDate: '',

  status: 'UNPAID',

}



const initialFilters = {

  utilityType: '',

  status: '',

  startDate: '',

  endDate: '',

}



const utilityConfig = {

  ELECTRICITY: {

    label: 'Electricity',

    icon: Zap,

    iconClass: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',

    accent: 'bg-amber-400',

  },

  WATER: {

    label: 'Water',

    icon: Droplets,

    iconClass: 'bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',

    accent: 'bg-sky-400',

  },

  INTERNET: {

    label: 'Internet',

    icon: Wifi,

    iconClass: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',

    accent: 'bg-violet-400',

  },

}



const statusConfig = {

  PAID: {

    label: 'Paid',

    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',

    dot: 'bg-emerald-500',

    icon: CheckCircle2,

  },

  UNPAID: {

    label: 'Unpaid',

    className: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',

    dot: 'bg-amber-500',

    icon: Clock3,

  },

  OVERDUE: {

    label: 'Overdue',

    className: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',

    dot: 'bg-rose-500',

    icon: CircleAlert,

  },

}



const inputClass =

  'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-indigo-400'



const selectClass =

  'mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:border-indigo-400'



function formatDate(value) {

  if (!value) return 'Not specified'



  const date = new Date(`${value}T00:00:00`)



  if (Number.isNaN(date.getTime())) return value



  return new Intl.DateTimeFormat('en-IN', {

    day: '2-digit',

    month: 'short',

    year: 'numeric',

  }).format(date)

}



function getUtility(utilityType) {

  return utilityConfig[utilityType] || {

    label: utilityType || 'Utility',

    icon: Activity,

    iconClass: 'bg-slate-100 text-slate-600 ring-slate-200',

    accent: 'bg-slate-400',

  }

}



function getStatus(status) {

  return statusConfig[status] || {

    label: status || 'Unknown',

    className: 'bg-slate-100 text-slate-600 ring-slate-500/15',

    dot: 'bg-slate-400',

    icon: Clock3,

  }

}



function getFriendlyError(requestError, fallback) {

  return (

    requestError.response?.data?.error ||

    requestError.response?.data?.message ||

    requestError.message ||

    fallback

  )

}



function BillsPage() {

  const [pageData, setPageData] = useState({

    content: [],

    page: 0,

    totalPages: 0,

    totalElements: 0,

  })



  const [form, setForm] = useState({ ...emptyForm })

  const [filters, setFilters] = useState({ ...initialFilters })

  const [search, setSearch] = useState('')

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')

  const [busy, setBusy] = useState(false)

  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState(null)

  const [showForm, setShowForm] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)



  const load = useCallback(async () => {

    if (

      filters.startDate &&

      filters.endDate &&

      filters.startDate > filters.endDate

    ) {

      setError('The start date must not be after the end date.')

      setLoading(false)

      return

    }



    setLoading(true)

    setError('')



    try {

      const params = {

        page: pageData.page,

        size: 10,

        sort: 'billingPeriod,desc',

      }



      Object.entries(filters).forEach(([key, value]) => {

        if (value) params[key] = value

      })



      const { data } = await billsApi.list(params)



      setPageData({

        content: Array.isArray(data.content) ? data.content : [],

        page: data.page ?? pageData.page,

        totalPages: data.totalPages ?? 0,

        totalElements: data.totalElements ?? data.content?.length ?? 0,

      })

    } catch (requestError) {

      setError(

        getFriendlyError(requestError, 'Unable to load bills. Please try again.'),

      )

    } finally {

      setLoading(false)

    }

  }, [filters, pageData.page, refreshKey])



  useEffect(() => {

    load()

  }, [load])



  const updateFilter = (key, value) => {

    setPageData((current) => ({ ...current, page: 0 }))

    setFilters((current) => ({ ...current, [key]: value }))

    setSuccess('')

  }



  const resetForm = () => {

    setForm({ ...emptyForm })

    setEditingId(null)

    setShowForm(false)

  }



  const startCreate = () => {

    setError('')

    setSuccess('')

    setForm({ ...emptyForm })

    setEditingId(null)

    setShowForm(true)

  }



  const startEdit = (bill) => {

    setError('')

    setSuccess('')

    setEditingId(bill.id)

    setForm({

      utilityType: bill.utilityType,

      providerName: bill.providerName || '',

      billingPeriod: bill.billingPeriod || '',

      totalAmount: String(bill.totalAmount ?? ''),

      usageAmount:

        bill.usageAmount == null ? '' : String(bill.usageAmount),

      usageUnit: bill.usageUnit || '',

      dueDate: bill.dueDate || '',

      status: bill.status || 'UNPAID',

    })

    setShowForm(true)

  }



  const submit = async (event) => {

    event.preventDefault()



    const providerName = form.providerName.trim()

    const totalAmount = Number(form.totalAmount)

    const usageAmount =

      form.usageAmount === '' ? null : Number(form.usageAmount)



    if (!providerName) {

      setError('Please enter the utility provider.')

      return

    }



    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {

      setError('Enter a bill amount greater than zero.')

      return

    }



    if (

      usageAmount !== null &&

      (!Number.isFinite(usageAmount) || usageAmount < 0)

    ) {

      setError('Usage must be zero or greater.')

      return

    }



    setBusy(true)

    setError('')

    setSuccess('')



    const payload = {

      ...form,

      providerName,

      totalAmount,

      usageAmount,

      usageUnit: form.usageUnit.trim() || null,

      dueDate: form.dueDate || null,

    }



    try {

      if (editingId) {

        await billsApi.update(editingId, payload)

        setSuccess('Bill updated successfully.')

      } else {

        await billsApi.create(payload)

        setSuccess('Bill added successfully.')

      }



      resetForm()

      setPageData((current) => ({ ...current, page: 0 }))

      setRefreshKey((key) => key + 1)

    } catch (requestError) {

      setError(

        getFriendlyError(

          requestError,

          'Unable to save the bill. Check your entries and try again.',

        ),

      )

    } finally {

      setBusy(false)

    }

  }



  const remove = async (id) => {

    const confirmed = window.confirm(

      'Permanently delete this bill? This action cannot be undone.',

    )



    if (!confirmed) return



    setError('')

    setSuccess('')



    try {

      await billsApi.remove(id)



      if (editingId === id) resetForm()



      setSuccess('Bill deleted successfully.')



      if (pageData.content.length === 1 && pageData.page > 0) {

        setPageData((current) => ({

          ...current,

          page: current.page - 1,

        }))

      } else {

        setRefreshKey((key) => key + 1)

      }

    } catch (requestError) {

      setError(

        getFriendlyError(requestError, 'Unable to delete this bill.'),

      )

    }

  }



  const changePage = (nextPage) => {

    setPageData((current) => ({ ...current, page: nextPage }))

  }



  const clearFilters = () => {

    setFilters({ ...initialFilters })

    setSearch('')

    setPageData((current) => ({ ...current, page: 0 }))

    setError('')

    setSuccess('')

  }



  // Search is deliberately limited to the current server-loaded page.

  // It does not pretend to search all records on the server.

  const visibleBills = useMemo(() => {

    const normalizedSearch = search.trim().toLowerCase()



    if (!normalizedSearch) return pageData.content



    return pageData.content.filter((bill) =>

      [

        bill.providerName,

        bill.utilityType,

        bill.status,

        String(bill.id),

      ].some((value) =>

        String(value || '').toLowerCase().includes(normalizedSearch),

      ),

    )

  }, [pageData.content, search])



  const pageSummary = useMemo(() => {

    const bills = pageData.content



    return {

      amount: bills.reduce(

        (sum, bill) => sum + Number(bill.totalAmount || 0),

        0,

      ),

      paid: bills.filter((bill) => bill.status === 'PAID').length,

      unpaid: bills.filter((bill) => bill.status === 'UNPAID').length,

      overdue: bills.filter((bill) => bill.status === 'OVERDUE').length,

    }

  }, [pageData.content])



  const hasActiveFilters =

    Boolean(filters.utilityType) ||

    Boolean(filters.status) ||

    Boolean(filters.startDate) ||

    Boolean(filters.endDate)



  return (

    <section className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">

      {/* Page heading */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">

            <Receipt size={16} />

            <span>Bill management</span>

          </div>



          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">

            Your bills

          </h1>



          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">

            Keep track of your utility expenses, payment status, and billing

            dates in one place.

          </p>

        </div>


      </div>



      {/* Feedback */}

      {error && (

        <div

          role="alert"

          className="flex items-start gap-3 rounded-xl border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"

        >

          <CircleAlert className="mt-0.5 shrink-0" size={18} />

          <div className="flex-1">{error}</div>

          <button

            type="button"

            onClick={() => setError('')}

            aria-label="Dismiss error"

            className="rounded-md p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40"

          >

            <X size={16} />

          </button>

        </div>

      )}



      {success && (

        <div

          role="status"

          className="flex items-center gap-3 rounded-xl border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"

        >

          <CheckCircle2 size={18} />

          <span className="flex-1">{success}</span>

          <button

            type="button"

            onClick={() => setSuccess('')}

            aria-label="Dismiss message"

            className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"

          >

            <X size={16} />

          </button>

        </div>

      )}



      {/* Summary cards: these explicitly describe the current loaded page. */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard

          label="Total records"

          value={loading ? '—' : pageData.totalElements.toLocaleString('en-IN')}

          caption="Across all result pages"

          icon={FileText}

          iconClass="bg-indigo-50 text-indigo-600"

        />



        <SummaryCard

          label="Paid on this page"

          value={loading ? '—' : String(pageSummary.paid)}

          caption="Current page only"

          icon={CheckCircle2}

          iconClass="bg-emerald-50 text-emerald-600"

        />



        <SummaryCard

          label="Unpaid on this page"

          value={loading ? '—' : String(pageSummary.unpaid)}

          caption="Current page only"

          icon={Clock3}

          iconClass="bg-amber-50 text-amber-600"

        />



        <SummaryCard

          label="Page bill total"

          value={loading ? '—' : formatCurrency(pageSummary.amount)}

          caption="Current page only"

          icon={Activity}

          iconClass="bg-sky-50 text-sky-600"

        />

      </div>



      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">

        {/* Bills list */}

        <div className="min-w-0 space-y-5">

          {/* Search and filters */}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">

            <div className="flex-col justify-between gap-3 sm:flex-row sm:items-center">

              <div>

                <h2 className="font-semibold text-slate-900 dark:text-slate-100">

                  All utility bills

                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

                  Showing up to 10 records per page

                </p>

              </div>



              <button

                type="button"

                onClick={() => setRefreshKey((key) => key + 1)}

                disabled={loading}

                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 sm:self-auto"

              >

                <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />

                Refresh

              </button>

            </div>



            <div className="relative mt-4">

              <Search

                size={17}

                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"

              />

              <input

                type="search"

                value={search}

                onChange={(event) => setSearch(event.target.value)}

                placeholder="Search this page by provider, utility, status, or ID…"

                aria-label="Search currently loaded bills"

                className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10"

              />

            </div>



            <div className="mb-3 mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

              <Filter size={14} />

              Filters

              {hasActiveFilters && (

                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">

                  Active

                </span>

              )}

            </div>



            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">

                Utility type

                <select

                  value={filters.utilityType}

                  onChange={(event) =>

                    updateFilter('utilityType', event.target.value)

                  }

                  className={selectClass}

                >

                  <option value="">All utilities</option>

                  <option value="ELECTRICITY">Electricity</option>

                  <option value="WATER">Water</option>

                  <option value="INTERNET">Internet</option>

                </select>

              </label>



              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">

                Payment status

                <select

                  value={filters.status}

                  onChange={(event) =>

                    updateFilter('status', event.target.value)

                  }

                  className={selectClass}

                >

                  <option value="">All statuses</option>

                  <option value="UNPAID">Unpaid</option>

                  <option value="PAID">Paid</option>

                  <option value="OVERDUE">Overdue</option>

                </select>

              </label>



              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">

                Billing date from

                <input

                  type="date"

                  value={filters.startDate}

                  onChange={(event) =>

                    updateFilter('startDate', event.target.value)

                  }

                  className={inputClass}

                />

              </label>



              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">

                Billing date to

                <input

                  type="date"

                  value={filters.endDate}

                  onChange={(event) =>

                    updateFilter('endDate', event.target.value)

                  }

                  className={inputClass}

                />

              </label>

            </div>



            {hasActiveFilters && (

              <button

                type="button"

                onClick={clearFilters}

                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-800"

              >

                <RotateCcw size={14} />

                Clear all filters

              </button>

            )}

          </div>



          {/* List heading */}

          <div className="flex-wrap items-center justify-between gap-3">

            <div>

              <h2 className="font-semibold text-slate-900 dark:text-slate-100">

                {search ? 'Search results on this page' : 'Your records'}

              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                {loading

                  ? 'Loading records…'

                  : search

                    ? `${visibleBills.length} matching records on this page`

                    : `${pageData.totalElements} total records`}

              </p>

            </div>



            {pageData.totalPages > 0 && (

              <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">

                Page {pageData.page + 1} of {pageData.totalPages}

              </span>

            )}

          </div>



          {/* Loading */}

          {loading ? (

            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8">

              <LoaderCircle

                size={30}

                className="animate-spin text-indigo-600"

              />

              <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">

                Loading your bills

              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">

                Fetching your latest utility records…

              </p>

            </div>

          ) : visibleBills.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                {search || hasActiveFilters ? (

                  <Search size={25} />

                ) : (

                  <Receipt size={25} />

                )}

              </div>



              <h3 className="mt-5 font-semibold text-slate-900 dark:text-slate-100">

                {search || hasActiveFilters

                  ? 'No matching bills'

                  : 'Your bill list is empty'}

              </h3>



              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">

                {search || hasActiveFilters

                  ? 'Try another search term or clear your filters to see more records.'

                  : 'Add your first utility bill to start tracking expenses and reviewing payment details.'}

              </p>



              {search || hasActiveFilters ? (

                <button

                  type="button"

                  onClick={clearFilters}

                  className="mt-5 inline-flex items-center gap-2 rounded-xl border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"

                >

                  <RotateCcw size={15} />

                  Reset filters

                </button>

              ) : (

                <button

                  type="button"

                  onClick={startCreate}

                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"

                >

                  <Plus size={16} />

                  Add your first bill

                </button>

              )}

            </div>

          ) : (

            <div className="space-y-3">

              {visibleBills.map((bill) => (

                <BillCard

                  key={bill.id}

                  bill={bill}

                  onEdit={() => startEdit(bill)}

                  onDelete={() => remove(bill.id)}

                />

              ))}

            </div>

          )}



          {/* Pagination */}

          {!loading && pageData.totalPages > 1 && !search && (

            <div className="flex-col justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:flex-row sm:items-center">

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Page <span className="font-semibold text-slate-800 dark:text-slate-200">{pageData.page + 1}</span>{' '}

                of <span className="font-semibold text-slate-800 dark:text-slate-200">{pageData.totalPages}</span>

              </p>



              <div className="flex items-center gap-2">

                <button

                  type="button"

                  disabled={pageData.page <= 0}

                  onClick={() => changePage(pageData.page - 1)}

                  className="inline-flex items-center gap-2 rounded-xl border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"

                >

                  <ArrowLeft size={15} />

                  Previous

                </button>



                <button

                  type="button"

                  disabled={pageData.page >= pageData.totalPages - 1}

                  onClick={() => changePage(pageData.page + 1)}

                  className="inline-flex items-center gap-2 rounded-xl border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"

                >

                  Next

                  <ArrowRight size={15} />

                </button>

              </div>

            </div>

          )}

        </div>



        {/* Add / Edit form */}

        <aside className="xl:sticky xl:top-6">

          {showForm ? (

            <form

              onSubmit={submit}

              className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"

            >

              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white">

                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">

                      {editingId ? (

                        <Pencil size={20} />

                      ) : (

                        <FilePlus2 size={20} />

                      )}

                    </div>



                    <div>

                      <h2 className="text-lg font-semibold">

                        {editingId ? 'Edit bill' : 'Add a new bill'}

                      </h2>

                      <p className="mt-1 text-xs text-indigo-100">

                        {editingId

                          ? `Updating record #${editingId}`

                          : 'Enter your utility details'}

                      </p>

                    </div>

                  </div>



                  <button

                    type="button"

                    onClick={resetForm}

                    aria-label="Close bill form"

                    className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"

                  >

                    <X size={18} />

                  </button>

                </div>

              </div>



              <div className="space-y-4 p-5">

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Utility type <span className="text-rose-500">*</span>

                  <select

                    required

                    value={form.utilityType}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        utilityType: event.target.value,

                      }))

                    }

                    className={selectClass}

                  >

                    <option value="ELECTRICITY">Electricity</option>

                    <option value="WATER">Water</option>

                    <option value="INTERNET">Internet</option>

                  </select>

                </label>



                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Provider name <span className="text-rose-500">*</span>

                  <input

                    required

                    maxLength={100}

                    value={form.providerName}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        providerName: event.target.value,

                      }))

                    }

                    placeholder="e.g. HMWSSB"

                    className={inputClass}

                  />

                </label>



                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Billing period <span className="text-rose-500">*</span>

                  <input

                    required

                    type="date"

                    value={form.billingPeriod}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        billingPeriod: event.target.value,

                      }))

                    }

                    className={inputClass}

                  />

                </label>



                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Total amount (₹) <span className="text-rose-500">*</span>

                  <div className="relative mt-1.5">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500">

                      ₹

                    </span>

                    <input

                      required

                      min="0.01"

                      step="0.01"

                      type="number"

                      value={form.totalAmount}

                      onChange={(event) =>

                        setForm((current) => ({

                          ...current,

                          totalAmount: event.target.value,

                        }))

                      }

                      placeholder="0.00"

                      className={`${inputClass} mt-0 pl-8`}

                    />

                  </div>

                </label>



                <div className="grid grid-cols-2 gap-3">

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Usage

                    <input

                      min="0"

                      step="0.001"

                      type="number"

                      value={form.usageAmount}

                      onChange={(event) =>

                        setForm((current) => ({

                          ...current,

                          usageAmount: event.target.value,

                        }))

                      }

                      placeholder="Optional"

                      className={inputClass}

                    />

                  </label>



                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Unit

                    <input

                      maxLength={20}

                      value={form.usageUnit}

                      onChange={(event) =>

                        setForm((current) => ({

                          ...current,

                          usageUnit: event.target.value,

                        }))

                      }

                      placeholder="kWh, kL, GB"

                      className={inputClass}

                    />

                  </label>

                </div>



                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Due date

                  <input

                    type="date"

                    value={form.dueDate}

                    onChange={(event) =>

                      setForm((current) => ({

                        ...current,

                        dueDate: event.target.value,

                      }))

                    }

                    className={inputClass}

                  />

                </label>



                {editingId && (

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Payment status

                    <select

                      value={form.status}

                      onChange={(event) =>

                        setForm((current) => ({

                          ...current,

                          status: event.target.value,

                        }))

                      }

                      className={selectClass}

                    >

                      <option value="UNPAID">Unpaid</option>

                      <option value="PAID">Paid</option>

                      <option value="OVERDUE">Overdue</option>

                    </select>

                  </label>

                )}



                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">

                  <button

                    type="submit"

                    disabled={busy}

                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"

                  >

                    {busy ? (

                      <>

                        <LoaderCircle size={17} className="animate-spin" />

                        Saving bill…

                      </>

                    ) : (

                      <>

                        <Check size={17} />

                        {editingId ? 'Save changes' : 'Add bill'}

                      </>

                    )}

                  </button>



                  <button

                    type="button"

                    disabled={busy}

                    onClick={resetForm}

                    className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-50"

                  >

                    Cancel

                  </button>

                </div>

              </div>

            </form>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">

              <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">

                  <Receipt size={23} />

                </div>



                <h2 className="mt-5 text-xl font-semibold">

                  Stay on top of your bills

                </h2>



                <p className="mt-2 text-sm leading-6 text-indigo-100">

                  Keep your utility records organized and make it easier to

                  review payment status and billing history.

                </p>



                <button

                  type="button"

                  onClick={startCreate}

                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"

                >

                  <Plus size={17} />

                  Add a utility bill

                </button>

              </div>



              <div className="space-y-4 p-5">

                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Supported utilities

                </h3>



                <UtilityInfo

                  icon={Zap}

                  label="Electricity"

                  description="Power and energy usage"

                  iconClass="bg-amber-50 text-amber-600"

                />



                <UtilityInfo

                  icon={Droplets}

                  label="Water"

                  description="Water consumption"

                  iconClass="bg-sky-50 text-sky-600"

                />



                <UtilityInfo

                  icon={Wifi}

                  label="Internet"

                  description="Connectivity and data plans"

                  iconClass="bg-violet-50 text-violet-600"

                />

              </div>

            </div>

          )}

        </aside>

      </div>

    </section>

  )

}



function SummaryCard({ label, value, caption, icon: Icon, iconClass }) {

  return (

    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">

      <div className="flex items-start justify-between gap-2">

        <div className="min-w-0">

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">

            {label}

          </p>

          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">

            {value}

          </p>

        </div>



        <div

          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}

        >

          <Icon size={20} />

        </div>

      </div>



      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{caption}</p>

    </article>

  )

}



function BillCard({ bill, onEdit, onDelete }) {

  const utility = getUtility(bill.utilityType)

  const status = getStatus(bill.status)

  const UtilityIcon = utility.icon

  const StatusIcon = status.icon



  return (

    <article className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition duration-200 hover:border-indigo-200 hover:shadow-md">

      <div className={`h-1 w-full ${utility.accent}`} />



      <div className="p-4 sm:p-5">

        <div className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex min-w-0 items-start gap-3">

            <div

              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${utility.iconClass}`}

            >

              <UtilityIcon size={23} />

            </div>



            <div className="min-w-0">

              <div className="flex-wrap items-center gap-2">

                <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">

                  {bill.providerName}

                </h3>

                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">

                  #{bill.id}

                </span>

              </div>



              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                {utility.label}

                <span className="mx-1.5 text-slate-300">·</span>

                {formatDate(bill.billingPeriod)}

              </p>



              {bill.usageAmount != null && (

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">

                  Usage:{' '}

                  <span className="font-medium text-slate-700 dark:text-slate-300">

                    {bill.usageAmount} {bill.usageUnit || ''}

                  </span>

                </p>

              )}

            </div>

          </div>



          <div className="sm:text-right">

            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">

              Total amount

            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">

              {formatCurrency(bill.totalAmount)}

            </p>

          </div>

        </div>



        <div className="mt-5 flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">

          <span

            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}

          >

            <StatusIcon size={13} />

            {status.label}

          </span>



          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">

            <CalendarDays size={14} />

            Due: {formatDate(bill.dueDate)}

          </span>



          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">

            <Link

              to={`/bills/${bill.id}`}

              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 sm:flex-none"

            >

              View details

              <ArrowUpRight size={14} />

            </Link>



            <button

              type="button"

              onClick={onEdit}

              aria-label={`Edit bill ${bill.id}`}

              className="inline-flex items-center justify-center gap-1.5 rounded-lg border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"

            >

              <Pencil size={14} />

              Edit

            </button>



            <button

              type="button"

              onClick={onDelete}

              aria-label={`Delete bill ${bill.id}`}

              className="inline-flex items-center justify-center gap-1.5 rounded-lg border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"

            >

              <Trash2 size={14} />

              Delete

            </button>

          </div>

        </div>

      </div>

    </article>

  )

}



function UtilityInfo({ icon: Icon, label, description, iconClass }) {

  return (

    <div className="flex items-center gap-3">

      <div

        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}

      >

        <Icon size={19} />

      </div>



      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>

        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>

      </div>



      <CheckCircle2 size={17} className="text-emerald-500" />

    </div>

  )

}



export default BillsPage