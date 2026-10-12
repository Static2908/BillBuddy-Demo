
import { useEffect, useState } from 'react'
import {
  UserRound,
  ShieldCheck,
  Palette,
  Trash2,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

function getErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (data?.error && typeof data.error === 'string') return data.error

  return fallback
}

function SettingsPage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('billbuddy-theme') === 'dark'
        ? 'dark'
        : 'light'
    } catch {
      return 'light'
    }
  })

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [notice, setNotice] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoadingProfile(true)

      try {
        const response = await usersApi.getMe()

        if (!active) return

        const currentUser = response.data
        setProfile({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
        })
      } catch (error) {
        if (active) {
          setProfileError(
            getErrorMessage(error, 'Could not load your profile.')
          )
        }
      } finally {
        if (active) setLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const showNotice = (type, message) => {
    setNotice({ type, message })
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }))
  }

  const handleSaveProfile = async (event) => {
  event.preventDefault()
  setProfileError('')
  setNotice(null)

  const fullName = profile.fullName.trim()
  const email = profile.email.trim().toLowerCase()

  if (!fullName || !email) {
    setProfileError('Name and email are required.')
    return
  }

  if (fullName.length > 100) {
    setProfileError('Name cannot exceed 100 characters.')
    return
  }

  if (
    email.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setProfileError('Enter a valid email address.')
    return
  }

  setSavingProfile(true)

  try {
    const response = await usersApi.updateMe({ fullName, email })
    const data = response.data

    // The backend should return { token, user }.
    const updatedUser = {
      ...(user || {}),
      ...(data.user || data),
      fullName,
      email,
    }

    // Use the newly issued token when available.
    const newToken = data.token || localStorage.getItem('billbuddy_token')

    if (!newToken) {
      throw new Error('Your session could not be updated. Please log in again.')
    }

    login({
      token: newToken,
      user: updatedUser,
    })

    setProfile({
      fullName: updatedUser.fullName || fullName,
      email: updatedUser.email || email,
    })

    showNotice('success', 'Your profile has been updated.')
  } catch (error) {
    setProfileError(
      getErrorMessage(error, 'Unable to update your profile.')
    )
  } finally {
    setSavingProfile(false)
  }
}

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setNotice(null)

    if (!passwords.currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError('Your new password must contain at least 8 characters.')
      return
    }

    if (passwords.newPassword.length > 100) {
      setPasswordError('Your new password cannot exceed 100 characters.')
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setPasswordError('Choose a password different from your current one.')
      return
    }

    setChangingPassword(true)

    try {
      await usersApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      showNotice('success', 'Your password has been changed successfully.')
    } catch (error) {
      setPasswordError(
        getErrorMessage(error, 'Unable to change your password.')
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme)

    try {
      localStorage.setItem('billbuddy-theme', nextTheme)
    } catch {
      // The theme still applies to this browser session.
    }

    document.documentElement.classList.toggle(
      'dark',
      nextTheme === 'dark'
    )

    // Let AppLayout update its theme-toggle icon and internal state.
    window.dispatchEvent(
      new CustomEvent('billbuddy-theme-change', {
        detail: { theme: nextTheme },
      })
    )
  }

  const handleDeleteAccount = async (event) => {
    event.preventDefault()
    setDeleteError('')
    setNotice(null)

    if (!confirmDelete) {
      setDeleteError('Confirm that you understand this action is permanent.')
      return
    }

    if (!deletePassword) {
      setDeleteError('Enter your current password to continue.')
      return
    }

    setDeletingAccount(true)

    try {
      await usersApi.deleteMe({
        currentPassword: deletePassword,
      })

      logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, 'Unable to delete your account.')
      )
    } finally {
      setDeletingAccount(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

  const labelClass =
    'text-sm font-semibold text-slate-700 dark:text-slate-200'

  const cardClass =
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#111a2b]'

  const sectionTitleClass =
    'text-lg font-bold text-slate-900 dark:text-white'

  const sectionDescriptionClass =
    'mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'

  const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400'

  const renderNotice = () => {
    if (!notice) return null

    const isSuccess = notice.type === 'success'

    return (
      <div
        role="status"
        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          isSuccess
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <p>{notice.message}</p>
      </div>
    )
  }

  const renderError = (message) => {
    if (!message) return null

    return (
      <p
        role="alert"
        className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </p>
    )
  }

  const renderPasswordInput = (
    label,
    name,
    value,
    visibilityKey,
    placeholder
  ) => (
    <div>
      <label className={labelClass} htmlFor={name}>
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPasswords[visibilityKey] ? 'text' : 'password'}
          value={value}
          onChange={handlePasswordChange}
          autoComplete="off"
          placeholder={placeholder}
          className={`${inputClass} pr-12`}
          required
        />

        <button
          type="button"
          onClick={() => togglePasswordVisibility(visibilityKey)}
          aria-label={
            showPasswords[visibilityKey] ? 'Hide password' : 'Show password'
          }
          className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {showPasswords[visibilityKey] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          ACCOUNT
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your profile, security, appearance, and account preferences.
        </p>
      </div>

      {renderNotice()}

      {/* Profile */}
      <section className={cardClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className={sectionTitleClass}>Profile information</h2>
            <p className={sectionDescriptionClass}>
              Update the name and email address associated with your account.
            </p>
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={profile.fullName}
                  onChange={handleProfileChange}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  maxLength={150}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {renderError(profileError)}

            <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                type="submit"
                disabled={savingProfile}
                className={primaryButtonClass}
              >
                {savingProfile ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Password */}
      <section className={cardClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className={sectionTitleClass}>Password and security</h2>
            <p className={sectionDescriptionClass}>
              Use your current password to authorize a password change.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
          {renderPasswordInput(
            'Current password',
            'currentPassword',
            passwords.currentPassword,
            'current',
            'Enter current password'
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {renderPasswordInput(
              'New password',
              'newPassword',
              passwords.newPassword,
              'new',
              'At least 8 characters'
            )}

            {renderPasswordInput(
              'Confirm new password',
              'confirmPassword',
              passwords.confirmPassword,
              'confirm',
              'Re-enter new password'
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use at least 8 characters. Make sure both new-password fields match.
          </p>

          {renderError(passwordError)}

          <div className="flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="submit"
              disabled={changingPassword}
              className={primaryButtonClass}
            >
              {changingPassword ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="h-4 w-4" />
              )}
              {changingPassword ? 'Updating...' : 'Change password'}
            </button>
          </div>
        </form>
      </section>

      {/* Appearance */}
      <section className={cardClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
            <Palette className="h-5 w-5" />
          </div>

          <div>
            <h2 className={sectionTitleClass}>Appearance</h2>
            <p className={sectionDescriptionClass}>
              Choose how BillBuddy looks on this device. Your preference is saved locally.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            {
              value: 'light',
              title: 'Light theme',
              description: 'Bright surfaces and dark text.',
              Icon: Sun,
            },
            {
              value: 'dark',
              title: 'Dark theme',
              description: 'Dark surfaces and lighter text.',
              Icon: Moon,
            },
          ].map(({ value, title, description, Icon }) => {
            const selected = theme === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => applyTheme(value)}
                aria-pressed={selected}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {description}
                  </span>
                </span>

                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-slate-950'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selected && <CheckCircle2 className="h-4 w-4" />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Delete account */}
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6 dark:border-red-950 dark:bg-[#111a2b]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-red-700 dark:text-red-300">
              Delete account
            </h2>
            <p className={sectionDescriptionClass}>
              Permanently delete your account and associated bill data. This action cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleDeleteAccount} className="mt-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="deletePassword">
              Confirm your current password
            </label>
            <input
              id="deletePassword"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password to continue"
              className={inputClass}
              required
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/70 p-4 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-300">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span>
              I understand that deleting my account is permanent and my account data may not be recoverable.
            </span>
          </label>

          {renderError(deleteError)}

          <div className="flex justify-end border-t border-red-100 pt-5 dark:border-red-950">
            <button
              type="submit"
              disabled={deletingAccount}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingAccount ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deletingAccount ? 'Deleting...' : 'Permanently delete account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SettingsPage
