import { getStayCategories } from '@/data/categories'
import { getNavMegaMenu } from '@/data/navigation'
import Logo from '@/shared/Logo'
import clsx from 'clsx'
import { FC } from 'react'
import AvatarDropdown from './AvatarDropdown'
import CategoriesDropdown from './CategoriesDropdown'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import MegaMenuPopover from './MegaMenuPopover'
import AuthButtons from './AuthButtons'
import { getCurrentUser } from '@/utils/auth'

interface HeaderProps {
  hasBorderBottom?: boolean
  className?: string
}

const Header: FC<HeaderProps> = async ({ hasBorderBottom = true, className }) => {
  const megamenu = await getNavMegaMenu()
  const featuredCategory = (await getStayCategories())[7]
  const user = await getCurrentUser()

  return (
    <div className={clsx('relative', className)}>
      <div className="container">
        <div
          className={clsx(
            'flex h-20 justify-between gap-x-2.5 border-neutral-200 dark:border-neutral-700',
            hasBorderBottom && 'border-b',
            !hasBorderBottom && 'has-[.header-popover-full-panel]:border-b'
          )}
        >
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-8">
            <Logo />
            <div className="hidden h-7 border-l border-neutral-200 md:block dark:border-neutral-700"></div>
            <div className="hidden md:block">
              <CategoriesDropdown />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-2.5 sm:gap-x-6">
            <div className="block lg:hidden">
              <HamburgerBtnMenu />
            </div>
            <MegaMenuPopover megamenu={megamenu} featuredCategory={featuredCategory} />
            {user && user.email ? (
              <AvatarDropdown user={user} />
            ) : (
              <AuthButtons />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
