'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import ButtonClose from '@/shared/ButtonClose'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup' | 'forgot-password'
  redirectTo?: string // Optional redirect path after login
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', redirectTo }: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode)
  
  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Signup form state
  const [name, setName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setError('')
      setSuccess('')
      setEmail('')
      setPassword('')
      setName('')
      setSignupEmail('')
      setSignupPassword('')
      setSignupError('')
      setForgotEmail('')
      setForgotError('')
      setForgotSuccess(false)
    }
  }, [isOpen])

  // Switch to signup mode when clicking signup link
  const switchToSignup = () => {
    setMode('signup')
    setError('')
    setSuccess('')
  }

  // Switch to login mode when clicking login link
  const switchToLogin = () => {
    setMode('login')
    setSignupError('')
    setForgotError('')
    setForgotSuccess(false)
  }

  // Switch to forgot password mode
  const switchToForgotPassword = () => {
    setMode('forgot-password')
    setError('')
    setSuccess('')
  }

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Check if user is admin and redirect accordingly
      const userResponse = await fetch('/api/auth/me')
      const userData = await userResponse.json()
      
      // Close modal and refresh
      onClose()
      
      // Redirect to specified path, or check if admin and redirect to /admin, or default to /
      if (redirectTo) {
        router.push(redirectTo)
      } else if (userData.user?.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSignupError('')
    setSignupLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: signupEmail,
          password: signupPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSignupError(data.error || 'Signup failed')
        setSignupLoading(false)
        return
      }

      // Switch to login mode and show success
      setMode('login')
      setSuccess('Account created successfully! Please login.')
      setSignupError('')
      setSignupLoading(false)
    } catch (error: any) {
      console.error('Signup error:', error)
      setSignupError('An error occurred. Please try again.')
      setSignupLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess(false)
    setForgotLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setForgotError(data.error || 'Failed to send reset email')
        setForgotLoading(false)
        return
      }

      setForgotSuccess(true)
      setForgotLoading(false)
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setForgotError('An error occurred. Please try again.')
      setForgotLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-900/50 duration-300 ease-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition duration-200 ease-in-out data-closed:scale-95 data-closed:opacity-0 dark:bg-neutral-800"
        >
          <div className="relative flex items-center justify-between border-b border-neutral-100 px-6 py-4 md:py-5 dark:border-neutral-700">
            <DialogTitle as="h3" className="text-base font-semibold text-neutral-900 lg:text-xl dark:text-neutral-200">
              {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Forgot Password'}
            </DialogTitle>
            <ButtonClose
              onClick={onClose}
              className="z-10 scale-75"
            />
          </div>

          <div className="px-6 py-6">
            {mode === 'login' ? (
              <form className="grid grid-cols-1 gap-6" onSubmit={handleLoginSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {success}
                  </div>
                )}
                <Field className="block">
                  <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
                  <Input 
                    type="email" 
                    placeholder="example@example.com" 
                    className="mt-1" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field className="block">
                  <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                    <Label>{T['login']['Password']}</Label>
                    <button
                      type="button"
                      onClick={switchToForgotPassword}
                      className="text-sm font-medium underline"
                    >
                      {T['login']['Forgot password?']}
                    </button>
                  </div>
                  <Input 
                    type="password" 
                    placeholder="Enter your password"
                    className="mt-1" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field className="block">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Remember me</span>
                  </label>
                </Field>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </ButtonPrimary>
                <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
                  {T['login']['New user?']} {` `}
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className="font-medium underline"
                  >
                    {T['login']['Create an account']}
                  </button>
                </div>
              </form>
            ) : mode === 'signup' ? (
              <form className="grid grid-cols-1 gap-6" onSubmit={handleSignupSubmit}>
                {signupError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {signupError}
                  </div>
                )}
                <Field className="block">
                  <Label className="text-neutral-800 dark:text-neutral-200">Name</Label>
                  <Input 
                    type="text" 
                    placeholder="Your name" 
                    className="mt-1" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field className="block">
                  <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
                  <Input 
                    type="email" 
                    placeholder="example@example.com" 
                    className="mt-1" 
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field className="block">
                  <Label className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                    {T['login']['Password']}
                  </Label>
                  <Input 
                    type="password" 
                    placeholder="Create a password (min. 6 characters)"
                    className="mt-1" 
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Password must be at least 6 characters long
                  </p>
                </Field>
                <ButtonPrimary type="submit" disabled={signupLoading}>
                  {signupLoading ? 'Creating account...' : T['common']['Continue']}
                </ButtonPrimary>
                <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
                  {T['login']['Already have an account?']} {` `}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-medium underline"
                  >
                    {T['login']['Sign in']}
                  </button>
                </div>
              </form>
            ) : (
              <form className="grid grid-cols-1 gap-6" onSubmit={handleForgotPasswordSubmit}>
                <div className="text-center">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>
                {forgotError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {forgotError}
                  </div>
                )}
                {forgotSuccess && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    If an account with that email exists, a password reset link has been sent.
                  </div>
                )}
                <Field className="block">
                  <Label className="text-neutral-800 dark:text-neutral-200">{T['login']['Email address']}</Label>
                  <Input 
                    type="email" 
                    placeholder="example@example.com" 
                    className="mt-1" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotSuccess}
                  />
                </Field>
                <ButtonPrimary type="submit" disabled={forgotLoading || forgotSuccess}>
                  {forgotLoading ? 'Sending...' : forgotSuccess ? 'Email Sent' : T['common']['Continue']}
                </ButtonPrimary>
                <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
                  Remember your password? {` `}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-medium underline"
                  >
                    {T['login']['Sign in']}
                  </button>
                </div>
              </form>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

