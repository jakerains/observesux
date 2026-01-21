import { redirect } from 'next/navigation'

/**
 * Redirect /account to /account/settings
 */
export default function AccountRedirect() {
  redirect('/account/settings')
}
