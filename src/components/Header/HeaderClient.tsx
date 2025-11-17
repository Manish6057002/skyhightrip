'use client'

import { useEffect, useState } from 'react'
import AvatarDropdown from './AvatarDropdown'
import AuthButtons from './AuthButtons'

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch((error) => {
        console.error('Error fetching user:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-x-2.5 sm:gap-x-6">
      {user && user.email ? (
        <AvatarDropdown user={user} />
      ) : (
        <AuthButtons />
      )}
    </div>
  )
}

