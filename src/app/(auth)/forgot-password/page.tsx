'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import Link from 'next/link'
import { useState } from 'react'

const Page = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="my-16 flex justify-center">
        <Logo className="w-32" />
      </div>

      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Forgot Password</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* FORM */}
        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <ButtonPrimary type="submit" disabled={loading || success}>
            {loading ? 'Sending...' : success ? 'Email Sent' : T['common']['Continue']}
          </ButtonPrimary>
        </form>

        {/* ==== */}
        <div className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          {T['login']['New user?']} {` `}
          <Link href="/signup" className="font-medium underline">
            {T['login']['Create an account']}
          </Link>
          {`  or  `}
          <Link href="/login" className="font-medium underline">
            {T['login']['Sign in']}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
