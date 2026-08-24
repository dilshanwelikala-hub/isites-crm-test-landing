'use client'

import { useState } from 'react'

type FormState = 'idle' | 'sending' | 'sent' | 'error'

type InquiryFormProps = {
  packageSlug?: string
  packageTitle?: string
}

export function InquiryForm({ packageSlug, packageTitle }: InquiryFormProps) {
  const [state, setState] = useState<FormState>('idle')

  async function submitInquiry(formData: FormData) {
    setState('sending')

    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      message: String(formData.get('message') || ''),
      packageSlug,
      packageTitle,
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
      <button disabled={state === 'sending'} type="submit">
        {state === 'sending' ? 'Sending...' : 'Send inquiry'}
      </button>
      {state === 'sent' ? <p>Your inquiry has been sent.</p> : null}
      {state === 'error' ? <p>Something went wrong. Please try again.</p> : null}
    </form>
  )
}
