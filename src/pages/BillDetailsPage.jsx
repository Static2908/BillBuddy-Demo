import { useCallback, useEffect, useRef, useState } from 'react'

import { Link, useParams } from 'react-router-dom'

import {

  ArrowLeft,

  Pencil,

  Plus,

  ReceiptText,

  RefreshCw,

  Trash2,

  X,

  CheckCircle2,

  BrainCircuit,

  AlertTriangle,

  BookOpen,

  Sparkles,

  ClipboardCheck,

  CalendarDays,

  Wallet,

  Zap,

  Droplets,

  Flame,

  Wifi,

  FileText,

  Clock,

  Info,

} from 'lucide-react'

import { billsApi } from '../services/api'



const emptyItem = {

  description: '',

  category: '',

  amount: '',

}



function formatCurrency(value) {

  return new Intl.NumberFormat('en-IN', {

    style: 'currency',

    currency: 'INR',

    maximumFractionDigits: 2,

  }).format(Number(value) || 0)

}



function formatDate(value) {

  if (!value) return 'Not specified'



  const date = new Date(

    /^\d{4}-\d{2}-\d{2}$/.test(String(value))

      ? `${value}T00:00:00`

      : value,

  )



  if (Number.isNaN(date.getTime())) return 'Not specified'



  return date.toLocaleDateString('en-IN', {

    day: '2-digit',

    month: 'short',

    year: 'numeric',

  })

}



function getErrorMessage(error, fallback) {

  return (

    error.response?.data?.message ||

    error.response?.data?.error ||

    error.message ||

    fallback

  )

}



function getSeverityClasses(severity) {

  switch (severity?.toUpperCase()) {

    case 'HIGH':

      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'

    case 'MEDIUM':

      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'

    case 'LOW':

      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'

    default:

      return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'

  }

}



function getStatusClasses(status) {

  switch (status?.toUpperCase()) {

    case 'PAID':

      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'

    case 'OVERDUE':

      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'

    default:

      return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 text-indigo-700'

  }

}



function getUtilityIcon(utilityType) {

  const type = String(utilityType || '').toUpperCase()



  if (type.includes('WATER')) return Droplets

  if (type.includes('GAS')) return Flame

  if (type.includes('INTERNET') || type.includes('BROADBAND')) {

    return Wifi

  }

  if (type.includes('ELECTRIC')) return Zap



  return ReceiptText

}



function normalizeHeading(value) {

  return value

    .replace(/[\*#\_`]/g, '')

    .replace(/:$/, '')

    .trim()

    .toLowerCase()

}



function extractSection(text, heading, nextHeading) {

  if (!text) return ''



  const lines = text.split('\n')

  const headingIndex = lines.findIndex(

    (line) => normalizeHeading(line) === normalizeHeading(heading),

  )



  if (headingIndex === -1) return ''



  const nextIndex = nextHeading

    ? lines.findIndex(

        (line, index) =>

          index > headingIndex &&

          normalizeHeading(line) === normalizeHeading(nextHeading),

      )

    : -1



  return lines

    .slice(headingIndex + 1, nextIndex === -1 ? undefined : nextIndex)

    .join('\n')

    .trim()

}



function ExplanationContent({ text }) {

  if (!text) return null



  const lines = text

    .split('\n')

    .map((line) => line.trim())

    .filter(Boolean)



  const items = []

  let paragraph = []



  const flushParagraph = () => {

    if (paragraph.length) {

      items.push({

        type: 'paragraph',

        text: paragraph.join(' '),

      })

      paragraph = []

    }

  }



  lines.forEach((line) => {

    const bullet = line.match(/^(?:[-\*•]|\d+[.)])\s+(.+)$/)



    if (bullet) {

      flushParagraph()

      items.push({

        type: 'bullet',

        text: bullet[1],

      })

    } else {

      paragraph.push(line)

    }

  })



  flushParagraph()



  return (

    <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">

      {items.map((item, index) =>

        item.type === 'bullet' ? (

          <div key={index} className="flex items-start gap-3">

            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

            <p>{item.text}</p>

          </div>

        ) : (

          <p key={index}>{item.text}</p>

        ),

      )}

    </div>

  )

}



function SectionHeading({ icon: Icon, title, description }) {

  return (

    <div className="flex items-start gap-3">

      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">

        <Icon className="h-5 w-5" />

      </div>



      <div>

        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>

        {description && (

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">

            {description}

          </p>

        )}

      </div>

    </div>

  )

}



function SummaryCard({ icon: Icon, label, value, detail, accent }) {

  const accents = {

    indigo: 'bg-indigo-50 text-indigo-600',

    blue: 'bg-blue-50 text-blue-600',

    amber: 'bg-amber-50 text-amber-600',

  }



  return (

    <article className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm transition-shadow hover:shadow-md">

      <div className="flex items-center justify-between gap-3">

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>

        <div

          className={`rounded-xl p-2 ${

            accents[accent] || accents.indigo

          }`}

        >

          <Icon className="h-5 w-5" />

        </div>

      </div>



      <p className="mt-4 break-words text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">

        {value}

      </p>



      {detail && (

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>

      )}

    </article>

  )

}



function BillDetailsPage() {

  const { id } = useParams()



  const [bill, setBill] = useState(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [statusUpdating, setStatusUpdating] = useState(false)

  const [deletingId, setDeletingId] = useState(null)



  const [error, setError] = useState('')

  const [message, setMessage] = useState('')

  const [form, setForm] = useState(emptyItem)

  const [editingItemId, setEditingItemId] = useState(null)

  const [formError, setFormError] = useState('')



  const [aiData, setAiData] = useState(null)

  const [aiLoading, setAiLoading] = useState(true)

  const [aiError, setAiError] = useState('')



  const aiRequestInProgress = useRef(false)



  const loadBill = useCallback(async () => {

    setLoading(true)

    setError('')



    try {

      const response = await billsApi.get(id)

      setBill(response.data)

    } catch (requestError) {

      setBill(null)

      setError(

        getErrorMessage(

          requestError,

          'Unable to load this bill. Please try again.',

        ),

      )

    } finally {

      setLoading(false)

    }

  }, [id])



  const loadExplanation = useCallback(async () => {

    if (aiRequestInProgress.current) return



    aiRequestInProgress.current = true

    setAiLoading(true)

    setAiError('')



    try {

      const response = await billsApi.getExplanation(id)



      if (!response.data) {

        throw new Error('The server returned an empty AI analysis.')

      }



      setAiData(response.data)

    } catch (requestError) {

      console.error('AI explanation request failed:', {

        billId: id,

        message: requestError.message,

        status: requestError.response?.status,

        response: requestError.response?.data,

        code: requestError.code,

      })



      setAiError(

        getErrorMessage(

          requestError,

          requestError.code === 'ECONNABORTED'

            ? 'The analysis took too long to respond. Please try again.'

            : 'Unable to load the AI explanation. Please try again.',

        ),

      )

    } finally {

      aiRequestInProgress.current = false

      setAiLoading(false)

    }

  }, [id])



  useEffect(() => {

    loadBill()

    loadExplanation()

  }, [loadBill, loadExplanation])



  const resetForm = () => {

    setForm(emptyItem)

    setEditingItemId(null)

    setFormError('')

  }



  const handleStatusUpdate = async () => {

    if (!bill || bill.status === 'PAID' || statusUpdating) return



    if (

      !window.confirm(

        'Mark this bill as paid? This will update its payment status.',

      )

    ) {

      return

    }



    setStatusUpdating(true)

    setError('')

    setMessage('')



    try {

      await billsApi.updateStatus(id, 'PAID')

      await loadBill()

      setMessage('Bill marked as paid successfully.')

    } catch (requestError) {

      setError(

        getErrorMessage(

          requestError,

          'Unable to update payment status. Please try again.',

        ),

      )

    } finally {

      setStatusUpdating(false)

    }

  }



  const handleSubmit = async (event) => {

    event.preventDefault()

    setFormError('')

    setMessage('')



    const description = form.description.trim()

    const category = form.category.trim()

    const amountText = form.amount.trim()

    const amount = Number(amountText)



    if (!description || !category) {

      setFormError('Description and category are required.')

      return

    }



    if (description.length > 100 || category.length > 40) {

      setFormError(

        'Description must be at most 100 characters and category at most 40.',

      )

      return

    }



    if (

      amountText === '' ||

      !Number.isFinite(amount) ||

      amount < 0 ||

      !/^\d+(\.\d{1,2})?$/.test(amountText)

    ) {

      setFormError(

        'Enter a non-negative amount with up to 2 decimal places.',

      )

      return

    }



    const payload = { description, category, amount }



    setSaving(true)



    try {

      if (editingItemId !== null) {

        await billsApi.updateLineItem(id, editingItemId, payload)

        setMessage('Line item updated successfully.')

      } else {

        await billsApi.addLineItem(id, payload)

        setMessage('Line item added successfully.')

      }



      resetForm()

      await loadBill()

    } catch (requestError) {

      setFormError(

        getErrorMessage(

          requestError,

          'Unable to save this line item. Please try again.',

        ),

      )

    } finally {

      setSaving(false)

    }

  }



  const startEditing = (item) => {

    setEditingItemId(item.id)

    setForm({

      description: item.description || '',

      category: item.category || '',

      amount: String(item.amount ?? ''),

    })

    setFormError('')

    setMessage('')

  }



  const handleDelete = async (item) => {

    if (

      !window.confirm(

        `Delete the line item "${item.description}"? This cannot be undone.`,

      )

    ) {

      return

    }



    setDeletingId(item.id)

    setError('')

    setMessage('')

    setFormError('')



    try {

      await billsApi.removeLineItem(id, item.id)



      if (editingItemId === item.id) {

        resetForm()

      }



      setMessage('Line item deleted successfully.')

      await loadBill()

    } catch (requestError) {

      setError(

        getErrorMessage(requestError, 'Unable to delete this line item.'),

      )

    } finally {

      setDeletingId(null)

    }

  }



  if (loading) {

    return (

      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">

        <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />

        <p className="font-medium text-slate-700 dark:text-slate-300">Loading bill details...</p>

        <p className="text-sm text-slate-500 dark:text-slate-400">

          Please wait while we retrieve your bill.

        </p>

      </div>

    )

  }



  if (error && !bill) {

    return (

      <section className="space-y-5">

        <Link

          to="/bills"

          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"

        >

          <ArrowLeft className="h-4 w-4" />

          Back to bills

        </Link>



        <div className="rounded-2xl border border-red-200 bg-white dark:bg-slate-900 p-6 sm:p-8">

          <div className="flex items-start gap-3">

            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>

              <h2 className="font-semibold text-slate-900 dark:text-slate-100">

                Unable to load bill

              </h2>

              <p role="alert" className="mt-2 text-sm leading-6 text-red-700">

                {error}

              </p>

            </div>

          </div>



          <button

            type="button"

            onClick={loadBill}

            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"

          >

            <RefreshCw className="h-4 w-4" />

            Try again

          </button>

        </div>

      </section>

    )

  }



  if (!bill) return null



  const lineItems = bill.lineItems || []

  const anomalies = aiData?.anomalies || []

  const explanation = aiData?.explanation || ''



  const interpretation = extractSection(

    explanation,

    'Interpretation',

    'Recommended Checks',

  )



  const recommendedChecks = extractSection(

    explanation,

    'Recommended Checks',

  )



  const UtilityIcon = getUtilityIcon(bill.utilityType)



  return (

    <section className="mx-auto w-full max-w-7xl space-y-6">

      {/* Header */}

      <header className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">

        <div className="p-5 sm:p-7">

          <Link

            to="/bills"

            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 transition hover:text-indigo-700"

          >

            <ArrowLeft className="h-4 w-4" />

            Back to bills

          </Link>



          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div className="flex min-w-0 items-start gap-4">

              <div className="shrink-0 rounded-2xl bg-indigo-50 p-3.5 text-indigo-600">

                <UtilityIcon className="h-7 w-7" />

              </div>



              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">

                    BillBuddy · Bill #{bill.id}

                  </p>



                  <span

                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(

                      bill.status,

                    )}`}

                  >

                    {bill.status || 'UNKNOWN'}

                  </span>

                </div>



                <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">

                  {bill.providerName || 'Utility bill'}

                </h1>



                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">

                  {bill.utilityType || 'Utility'} bill details and analysis

                </p>

              </div>

            </div>



            {bill.status !== 'PAID' ? (

              <button

                type="button"

                onClick={handleStatusUpdate}

                disabled={statusUpdating}

                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"

              >

                {statusUpdating ? (

                  <RefreshCw className="h-4 w-4 animate-spin" />

                ) : (

                  <CheckCircle2 className="h-4 w-4" />

                )}

                {statusUpdating ? 'Updating...' : 'Mark as Paid'}

              </button>

            ) : (

              <div className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">

                <CheckCircle2 className="h-5 w-5" />

                Payment completed

              </div>

            )}

          </div>

        </div>

      </header>



      {/* Notifications */}

      {error && (

        <div

          role="alert"

          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"

        >

          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <p>{error}</p>

        </div>

      )}



      {message && (

        <div

          role="status"

          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"

        >

          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <p>{message}</p>

        </div>

      )}



      {/* Bill summary */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <SummaryCard

          icon={Wallet}

          label="Total bill amount"

          value={formatCurrency(bill.totalAmount)}

          detail="Recorded amount for this bill"

          accent="indigo"

        />



        <SummaryCard

          icon={Zap}

          label="Recorded usage"

          value={bill.usageAmount ?? 'Not recorded'}

          detail={

            bill.usageAmount != null

              ? bill.usageUnit || 'Units'

              : 'Usage information is unavailable'

          }

          accent="blue"

        />



        <SummaryCard

          icon={CalendarDays}

          label="Payment due date"

          value={formatDate(bill.dueDate)}

          detail="Check the due date before paying"

          accent="amber"

        />

      </div>



      {/* Bill information */}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-7">

        <SectionHeading

          icon={FileText}

          title="Bill information"

          description="Review the details recorded for this bill."

        />



        <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {[

            {

              label: 'Provider',

              value: bill.providerName || 'Not specified',

            },

            {

              label: 'Utility type',

              value: bill.utilityType || 'Not specified',

            },

            {

              label: 'Billing period',

              value: formatDate(bill.billingPeriod),

            },

            {

              label: 'Payment status',

              value: bill.status || 'Unknown',

            },

          ].map((item) => (

            <div

              key={item.label}

              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 dark:bg-slate-800/60 p-4"

            >

              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">

                {item.label}

              </dt>

              <dd className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">

                {item.value}

              </dd>

            </div>

          ))}

        </dl>

      </section>



      {/* AI analysis */}

      <section className="overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm">

        <div className="border-b border-indigo-100 dark:border-indigo-900/70 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:p-7">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div className="flex items-start gap-3">

              <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">

                <BrainCircuit className="h-6 w-6" />

              </div>



              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">

                    AI bill analysis

                  </h2>

                  <span className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-indigo-700">

                    BillBuddy AI

                  </span>

                </div>



                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">

                  Review unusual billing patterns, understand the findings,

                  and see what to check next.

                </p>

              </div>

            </div>



            <button

              type="button"

              onClick={loadExplanation}

              disabled={aiLoading}

              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <RefreshCw

                className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`}

              />

              {aiLoading ? 'Analyzing...' : 'Refresh analysis'}

            </button>

          </div>

        </div>



        <div className="space-y-7 p-5 sm:p-7">

          {aiLoading ? (

            <div

              role="status"

              className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 text-center"

            >

              <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />

              <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">

                Analyzing your bill

              </p>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">

                The AI is preparing an explanation using the bill details and

                available billing reference information. This may take a

                little while.

              </p>

            </div>

          ) : aiError && !aiData ? (

            <div

              role="alert"

              className="rounded-xl border border-red-200 bg-red-50 p-5"

            >

              <div className="flex items-start gap-3">

                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>

                  <h3 className="font-semibold text-red-900">

                    AI analysis could not be loaded

                  </h3>

                  <p className="mt-2 text-sm leading-6 text-red-700">

                    {aiError}

                  </p>



                  <button

                    type="button"

                    onClick={loadExplanation}

                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"

                  >

                    <RefreshCw className="h-4 w-4" />

                    Try again

                  </button>

                </div>

              </div>

            </div>

          ) : (

            <>

              {aiError && aiData && (

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

                  The latest refresh failed. Your previous successful analysis

                  is still displayed.

                </div>

              )}



              {/* Anomalies */}

              <div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                  <SectionHeading

                    icon={AlertTriangle}

                    title="Detected anomalies"

                    description="Potentially unusual patterns identified by the configured detection rules."

                  />



                  <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">

                    {anomalies.length}{' '}

                    {anomalies.length === 1 ? 'finding' : 'findings'}

                  </span>

                </div>



                {anomalies.length === 0 ? (

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

                    <div className="flex items-start gap-3">

                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                      <div>

                        <h4 className="font-semibold text-emerald-900">

                          No anomalies detected

                        </h4>

                        <p className="mt-1 text-sm leading-6 text-emerald-800">

                          The configured detection rules did not identify

                          anomalies in this bill. This does not guarantee that

                          every charge is correct.

                        </p>

                      </div>

                    </div>

                  </div>

                ) : (

                  <div className="grid gap-4 xl:grid-cols-2">

                    {anomalies.map((anomaly, index) => (

                      <article

                        key={`${anomaly.ruleCode || 'anomaly'}-${index}`}

                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-shadow hover:shadow-sm sm:p-5"

                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-start gap-3">

                            <div className="shrink-0 rounded-xl bg-amber-50 p-2.5 text-amber-600">

                              <AlertTriangle className="h-5 w-5" />

                            </div>



                            <div className="min-w-0">

                              <h4 className="break-words font-semibold text-slate-900 dark:text-slate-100">

                                {anomaly.title ||

                                  anomaly.ruleCode ||

                                  'Detected anomaly'}

                              </h4>

                              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">

                                {anomaly.ruleCode || 'Detection rule'}

                              </p>

                            </div>

                          </div>



                          <span

                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(

                              anomaly.severity,

                            )}`}

                          >

                            {anomaly.severity || 'Unspecified'}

                          </span>

                        </div>



                        {anomaly.evidence && (

                          <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3.5">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">

                              Evidence

                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">

                              {anomaly.evidence}

                            </p>

                          </div>

                        )}



                        {anomaly.threshold != null && (

                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">

                            <Info className="h-4 w-4 shrink-0 text-slate-400" />

                            Configured threshold:

                            <span className="font-semibold text-slate-900 dark:text-slate-100">

                              {anomaly.threshold}%

                            </span>

                          </div>

                        )}

                      </article>

                    ))}

                  </div>

                )}

              </div>



              {/* Interpretation */}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">

                <SectionHeading

                  icon={Sparkles}

                  title="What this means"

                  description="A readable explanation of the analysis results."

                />



                <div className="mt-4 rounded-xl border border-indigo-100 dark:border-indigo-900/70 bg-indigo-50/40 p-4 sm:p-5">

                  {interpretation ? (

                    <ExplanationContent text={interpretation} />

                  ) : (

                    <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">

                      A separate interpretation was not returned. Review the

                      detected anomalies and their evidence above for the

                      available findings.

                    </p>

                  )}

                </div>



                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">

                  An anomaly indicates an unusual pattern. It does not, by

                  itself, prove that the bill is incorrect.

                </p>

              </div>



              {/* Recommended checks */}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">

                <SectionHeading

                  icon={ClipboardCheck}

                  title="Recommended next steps"

                  description="Practical checks to help you investigate the findings."

                />



                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">

                  {recommendedChecks ? (

                    <ExplanationContent text={recommendedChecks} />

                  ) : (

                    <div className="flex items-start gap-3">

                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />

                      <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">

                        Compare your recorded usage with the previous bill

                        and review the itemized breakdown. If the increase

                        remains unexplained, contact your utility provider

                        for clarification.

                      </p>

                    </div>

                  )}

                </div>

              </div>



              {/* RAG transparency */}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 sm:p-5">

                  <div className="shrink-0 rounded-xl bg-white dark:bg-slate-900 p-2.5 text-indigo-600 shadow-sm">

                    <BookOpen className="h-5 w-5" />

                  </div>



                  <div>

                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">

                      About this analysis

                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">

                      This explanation uses your bill information, detected

                      anomalies, and relevant billing reference information.

                      The reference information provides general guidance; it

                      does not establish the cause of an anomaly in your

                      particular bill.

                    </p>



                    {Array.isArray(aiData?.sources) &&

                      aiData.sources.length > 0 && (

                        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">

                          <BookOpen className="h-3.5 w-3.5" />

                          {aiData.sources.length} reference{' '}

                          {aiData.sources.length === 1

                            ? 'passage'

                            : 'passages'}{' '}

                          retrieved

                        </p>

                      )}

                  </div>

                </div>

              </div>

            </>

          )}

        </div>

      </section>



      {/* Line items */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:p-6">

          <SectionHeading

            icon={ReceiptText}

            title="Bill line items"

            description="View and manage the individual charges recorded for this bill."

          />



          <span className="self-start rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 sm:self-center">

            {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}

          </span>

        </div>



        {lineItems.length === 0 ? (

          <div className="p-6 sm:p-8">

            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800 px-5 py-9 text-center">

              <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 text-slate-400 shadow-sm">

                <ReceiptText className="h-7 w-7" />

              </div>

              <h4 className="mt-4 font-semibold text-slate-800 dark:text-slate-200">

                No line items yet

              </h4>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">

                Add individual charges below to keep a more detailed record of

                this bill.

              </p>

            </div>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead className="bg-slate-50 dark:bg-slate-800">

                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">

                  <th className="px-5 py-4 font-semibold sm:px-6">

                    Description

                  </th>

                  <th className="px-5 py-4 font-semibold">Category</th>

                  <th className="px-5 py-4 text-right font-semibold">

                    Amount

                  </th>

                  <th className="px-5 py-4 text-right font-semibold sm:px-6">

                    Actions

                  </th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {lineItems.map((item) => (

                  <tr

                    key={item.id}

                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800/70 dark:hover:bg-slate-800/70"

                  >

                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100 sm:px-6">

                      {item.description}

                    </td>



                    <td className="px-5 py-4">

                      <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">

                        {item.category}

                      </span>

                    </td>



                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">

                      {formatCurrency(item.amount)}

                    </td>



                    <td className="px-5 py-4 text-right sm:px-6">

                      <div className="inline-flex items-center justify-end gap-2">

                        <button

                          type="button"

                          onClick={() => startEditing(item)}

                          aria-label={`Edit ${item.description}`}

                          title="Edit line item"

                          className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 transition hover:border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 hover:text-indigo-700"

                        >

                          <Pencil className="h-4 w-4" />

                        </button>



                        <button

                          type="button"

                          onClick={() => handleDelete(item)}

                          disabled={

                            deletingId !== null || saving

                          }

                          aria-label={`Delete ${item.description}`}

                          title="Delete line item"

                          className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"

                        >

                          {deletingId === item.id ? (

                            <RefreshCw className="h-4 w-4 animate-spin" />

                          ) : (

                            <Trash2 className="h-4 w-4" />

                          )}

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>



      {/* Add/edit form */}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-7">

        <div className="flex items-start gap-3">

          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">

            {editingItemId !== null ? (

              <Pencil className="h-5 w-5" />

            ) : (

              <Plus className="h-5 w-5" />

            )}

          </div>



          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-slate-100">

                  {editingItemId !== null

                    ? 'Edit line item'

                    : 'Add a line item'}

                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">

                  {editingItemId !== null

                    ? 'Update the description, category, or amount.'

                    : 'Record an individual charge from your bill.'}

                </p>

              </div>



              {editingItemId !== null && (

                <button

                  type="button"

                  onClick={resetForm}

                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-100"

                >

                  <X className="h-4 w-4" />

                  Cancel

                </button>

              )}

            </div>

          </div>

        </div>



        <form onSubmit={handleSubmit} className="mt-6 space-y-5">

          {formError && (

            <div

              role="alert"

              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"

            >

              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>{formError}</p>

            </div>

          )}



          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

              Description

              <input

                required

                maxLength={100}

                value={form.description}

                onChange={(event) =>

                  setForm({ ...form, description: event.target.value })

                }

                placeholder="e.g. Water consumption"

                className="mt-2 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-900 px-3.5 py-3 font-normal text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"

              />

              <span className="mt-1.5 block text-xs font-normal text-slate-400">

                Maximum 100 characters

              </span>

            </label>



            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">

              Category

              <input

                required

                maxLength={40}

                value={form.category}

                onChange={(event) =>

                  setForm({ ...form, category: event.target.value })

                }

                placeholder="e.g. Usage charge"

                className="mt-2 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-900 px-3.5 py-3 font-normal text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"

              />

              <span className="mt-1.5 block text-xs font-normal text-slate-400">

                Maximum 40 characters

              </span>

            </label>



            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2 xl:col-span-1">

              Amount (₹)

              <input

                required

                type="number"

                min="0"

                step="0.01"

                value={form.amount}

                onChange={(event) =>

                  setForm({ ...form, amount: event.target.value })

                }

                placeholder="0.00"

                className="mt-2 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-900 px-3.5 py-3 font-normal text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"

              />

              <span className="mt-1.5 block text-xs font-normal text-slate-400">

                Use up to 2 decimal places

              </span>

            </label>

          </div>



          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">

            <button

              type="submit"

              disabled={saving || deletingId !== null}

              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {saving ? (

                <RefreshCw className="h-4 w-4 animate-spin" />

              ) : editingItemId !== null ? (

                <Pencil className="h-4 w-4" />

              ) : (

                <Plus className="h-4 w-4" />

              )}



              {saving

                ? 'Saving...'

                : editingItemId !== null

                  ? 'Update line item'

                  : 'Add line item'}

            </button>



            {editingItemId === null && (

              <button

                type="button"

                onClick={() => {

                  setForm(emptyItem)

                  setFormError('')

                }}

                disabled={saving}

                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 disabled:opacity-50"

              >

                Clear fields

              </button>

            )}

          </div>



          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">

            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <p>

              Line-item changes do not automatically change the bill's total

              amount. The displayed total remains the value returned by your

              backend.

            </p>

          </div>

        </form>

      </section>



      <div className="flex items-start gap-2 pb-2 text-xs leading-5 text-slate-400">

        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />

        <p>

          Review AI-generated findings alongside your actual bill. Contact

          your utility provider if you need confirmation of a charge.

        </p>

      </div>

    </section>

  )

}



export default BillDetailsPage