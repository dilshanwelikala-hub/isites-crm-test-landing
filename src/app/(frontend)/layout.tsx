import type { Metadata } from 'next'
import React from 'react'

import './styles.css'

export const metadata: Metadata = {
  title: 'Packages & Experiences | Test Landing CMS',
  description: 'A CMS-managed landing page for resort packages and experiences.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
