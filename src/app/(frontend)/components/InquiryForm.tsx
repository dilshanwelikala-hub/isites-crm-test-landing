'use client'

import { useState } from 'react'
import { useInquiryAnalytics } from './SiteAnalytics.client'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

type InquiryFormProps = {
  packageSlug?: string
  packageTitle?: string
  siteId?: number | string
}

export function InquiryForm({ packageSlug, packageTitle, siteId }: InquiryFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const inquiryAnalytics = useInquiryAnalytics()

  async function submitInquiry(formData: FormData) {
    setState('sending')

    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      company: String(formData.get('company') || ''),
      guestCount: Number(formData.get('guestCount') || 0) || undefined,
      message: String(formData.get('message') || ''),
      packageSlug,
      packageTitle,
      site: siteId,
      consentToContact: formData.get('consentToContact') === 'on',
      sourcePageUrl: `${window.location.origin}${window.location.pathname}`,
      status: 'new',
      analyticsInput: inquiryAnalytics?.(),
    }

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setState(response.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <form action={submitInquiry} className="inquiryForm">
      <label>
        Name
        <input maxLength={200} name="name" required />
      </label>
      <label>
        Email
        <input maxLength={254} name="email" required type="email" />
      </label>
      <label>
        Phone
        <input maxLength={80} name="phone" />
      </label>
      <label>
        Group or company
        <input maxLength={200} name="company" />
      </label>
      <label>
        Guests
        <input min="1" max="10000" name="guestCount" type="number" />
      </label>
      <label>
        Message
        <textarea
          maxLength={10000}
          name="message"
          required
          rows={5}
          defaultValue={
            packageTitle ? `I am interested in ${packageTitle}. Please send me more details.` : ''
          }
        />
      </label>
      <label className="inquiryFormConsent">
        <input name="consentToContact" required type="checkbox" />I agree to be contacted about this
        inquiry.
      </label>
      <button disabled={state === 'sending' || state === 'sent'} type="submit">
        {state === 'sending' ? 'Sending...' : 'Send inquiry'}
      </button>
      {state === 'sent' ? <p>Your inquiry has been sent.</p> : null}
      {state === 'error' ? <p>Something went wrong. Please try again.</p> : null}
    </form>
  )
}
