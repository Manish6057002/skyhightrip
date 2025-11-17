import { ImageAdd02Icon } from '@/components/Icons'
import Avatar from '@/shared/Avatar'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { Divider } from '@/shared/divider'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import T from '@/utils/getT'
import { Metadata } from 'next'
import Form from 'next/form'
import { getCurrentUser } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export const metadata: Metadata = {
  title: 'Account Page',
  description: 'Booking online & rental online Next.js Template',
}

// Helper function to get user initials
function getUserInitials(user: { name?: string | null; email: string } | null): string | null {
  if (!user) return null
  
  if (user.name) {
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  
  return null
}

const Page = async () => {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const initials = getUserInitials(user)

  const handleSubmitForm = async (formData: FormData) => {
    'use server'
    // Handle form submission logic here
  }

  // Render avatar with initials or user icon
  const renderAvatar = () => {
    if (initials) {
      return <Avatar initials={initials} className="h-32 w-32" />
    }
    // Fallback to user icon if no initials
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
        <HugeiconsIcon icon={UserIcon} size={48} className="text-neutral-600 dark:text-neutral-300" />
      </div>
    )
  }

  return (
    <div>
      {/* HEADING */}
      <h1 className="text-3xl font-semibold">{T['accountPage']['Account information']}</h1>

      <Divider className="my-8 w-14!" />

      <Form action={handleSubmitForm} className="flex flex-col md:flex-row">
        <div className="flex shrink-0 items-start">
          <div className="relative flex overflow-hidden rounded-full">
            {renderAvatar()}
            <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 text-neutral-50">
              <ImageAdd02Icon className="h-6 w-6" />
              <span className="mt-1 text-xs">{T['accountPage']['Change Image']}</span>
            </div>
            <input type="file" className="absolute inset-0 cursor-pointer opacity-0" />
          </div>
        </div>
        <div className="mt-10 max-w-3xl grow space-y-6 md:mt-0 md:ps-16">
          <Field>
            <Label>{T['accountPage']['Name']}</Label>
            <Input className="mt-1.5" defaultValue={user.name || ''} placeholder="Your name" />
          </Field>
          {/* ---- */}
          <Field>
            <Label>{T['accountPage']['Gender']}</Label>
            <Select className="mt-1.5">
              <option value="">Select gender</option>
              <option value="Male">{T['accountPage']['Male']}</option>
              <option value="Female">{T['accountPage']['Female']}</option>
              <option value="Other">{T['accountPage']['Other']}</option>
            </Select>
          </Field>

          {/* ---- */}
          <Field>
            <Label>{T['accountPage']['Email']}</Label>
            <Input className="mt-1.5" type="email" defaultValue={user.email} placeholder="example@example.com" readOnly />
          </Field>
          {/* ---- */}
          <Field className="max-w-lg">
            <Label>{T['accountPage']['Date of birth']}</Label>
            <Input className="mt-1.5" type="date" />
          </Field>
          {/* ---- */}
          <Field>
            <Label>{T['accountPage']['Addess']}</Label>
            <Input className="mt-1.5" placeholder="Your address" />
          </Field>
          {/* ---- */}
          <Field>
            <Label>{T['accountPage']['Phone number']}</Label>
            <Input className="mt-1.5" type="tel" placeholder="Your phone number" />
          </Field>
          {/* ---- */}
          <Field>
            <Label>{T['accountPage']['About you']}</Label>
            <Textarea className="mt-1.5" placeholder="Tell us about yourself" />
          </Field>
          <div className="pt-4">
            <ButtonPrimary type="submit">{T['accountPage']['Update information']}</ButtonPrimary>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default Page
