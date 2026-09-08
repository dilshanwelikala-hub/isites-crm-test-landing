'use client'

import { useState } from 'react'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

type InquiryFormProps = {
  packageSlug?: string
  packageTitle?: string
  siteId?: number | string
}

export function InquiryForm({ packageSlug, packageTitle, siteId }: InquiryFormProps) {
  const [state, setState] = useState<FormState>('idle')

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
      sourcePageUrl: window.location.href,
      status: 'new',
    }

    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    setState(response.ok ? 'sent' : 'error')
  }

  return (
    <form action={submitInquiry} className="inquiryForm">
      <label>
        Name
        <input name="name" required />
      </label>
      <label>
        Email
        <input name="email" required type="email" />
      </label>
      <label>
        Phone
        <input name="phone" />
      </label>
      <label>
        Group or company
        <input name="company" />
      </label>
      <label>
        Guests
        <input min="1" name="guestCount" type="number" />
      </label>
      <label>
        Message
        <textarea
          name="message"
          required
          rows={5}
          defaultValue={
            packageTitle ? `I am interested in ${packageTitle}. Please send me more details.` : ''
          }
        />
      </label>
      <label className="inquiryFormConsent">
        <input name="consentToContact" required type="checkbox" />
        I agree to be contacted about this inquiry.
      </label>
      <button disabled={state === 'sending'} type="submit">
        {state === 'sending' ? 'Sending...' : 'Send inquiry'}
      </button>
      {state === 'sent' ? <p>Your inquiry has been sent.</p> : null}
      {state === 'error' ? <p>Something went wrong. Please try again.</p> : null}
    </form>
  )
}
