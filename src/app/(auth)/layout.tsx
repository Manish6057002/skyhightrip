import React, { FC } from 'react'
import Header from '@/components/Header/Header'
import Footer2 from '@/components/Footer2'
import Aside from '@/components/aside'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'

export const dynamic = 'force-dynamic'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <Aside.Provider>
      <Header />
      {children}
      <Footer2 />
      <AsideSidebarNavigation />
    </Aside.Provider>
  )
}

export default Layout
