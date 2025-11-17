'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { Airplane02Icon, House04Icon, HotAirBalloonIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const navigationLinks = [
  {
    name: 'Flights',
    href: '/flight-categories/all',
    icon: Airplane02Icon,
  },
  {
    name: 'Hotels',
    href: '/stay-categories/all',
    icon: House04Icon,
  },
  {
    name: 'Activities',
    href: '/experience-categories/all',
    icon: HotAirBalloonIcon,
  },
]

export default function DropdownTravelers() {
  const pathName = usePathname()

  return (
    <nav className="flex items-center gap-x-6">
      {navigationLinks.map((link) => {
        const isActive = pathName === link.href || pathName.startsWith(link.href + '/')
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex items-center gap-2 text-sm font-medium transition-colors',
              isActive
                ? 'text-neutral-950 dark:text-neutral-100'
                : 'text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-100'
            )}
          >
            <HugeiconsIcon
              icon={link.icon}
              size={18}
              className={clsx(
                isActive
                  ? 'text-neutral-950 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400'
              )}
            />
            <span>{link.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
