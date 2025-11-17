'use client'

import { Button } from '@/shared/Button'
import { useState } from 'react'
import AuthModal from './AuthModal'

export default function AuthButtons() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Button className="-mx-1 py-1.75!" onClick={openModal}>
        Login / Sign Up
      </Button>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialMode="login"
      />
    </>
  )
}

