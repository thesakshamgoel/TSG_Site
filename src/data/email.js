/**
 * Sends the contact + review forms to the owner's inbox via Web3Forms
 * (https://web3forms.com) — a free, static-site-friendly form-to-email relay.
 * Set VITE_WEB3FORMS_KEY in .env to enable it. When it's not set, callers fall
 * back to opening the visitor's mail client (mailto), so forms still work.
 */
const KEY = import.meta.env.VITE_WEB3FORMS_KEY

export const emailEnabled = !!KEY

export async function sendEmail(fields) {
  if (!KEY) throw new Error('email-disabled')
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: KEY, ...fields }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.message || 'send-failed')
  return data
}
