import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Siouxland Online",
  description: "Privacy policy for the Siouxland Online app and website.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 mb-10">Last updated: March 8, 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">The Short Version</h2>
            <p>
              Siouxland Online is built for the people of Sioux City. We don&apos;t sell your data,
              we don&apos;t run ads, and we don&apos;t track you across the internet. The app shows
              publicly available data from government APIs — weather, traffic, river levels, air
              quality, and more. That&apos;s it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What We Collect</h2>
            <p className="mb-3">
              <strong className="text-white">If you use the app without an account:</strong> We
              collect basic, anonymous usage analytics (page views, general device type) through
              Vercel Analytics to understand how the app is used. No personal information is
              collected.
            </p>
            <p>
              <strong className="text-white">If you create an account:</strong> We store your email
              address and any preferences you save (like alert subscriptions or watchlist items).
              This data is stored securely in our database and is never shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Push Notifications</h2>
            <p>
              If you opt in to push notifications (weather alerts, river level warnings, etc.), we
              store a device token to deliver those notifications. You can turn them off at any time
              in your device settings. We never use push notifications for marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Location Data</h2>
            <p>
              The app may request your location to show nearby traffic cameras and local conditions.
              Your location is only used on-device to filter data — it is never sent to our servers
              or stored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">AI Features</h2>
            <p>
              The app includes AI-generated content like council meeting recaps and a chat assistant.
              Chat conversations may be stored to improve the service. AI recaps are generated from
              publicly available YouTube videos of Sioux City Council meetings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>We use the following services to power the app:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong className="text-white">Vercel</strong> — Hosting and analytics
              </li>
              <li>
                <strong className="text-white">Neon</strong> — Database
              </li>
              <li>
                <strong className="text-white">National Weather Service, USGS, AirNow</strong> —
                Public government data APIs
              </li>
            </ul>
            <p className="mt-3">
              Each of these services has their own privacy policies. We don&apos;t share your
              personal data with any of them beyond what&apos;s necessary to operate the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
            <p>
              If you delete your account, all associated data (preferences, alert subscriptions,
              watchlist items) is permanently removed. Anonymous analytics data is retained in
              aggregate form.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Children&apos;s Privacy</h2>
            <p>
              Siouxland Online is not directed at children under 13. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes</h2>
            <p>
              If we update this policy, we&apos;ll post the changes here with a new date. For
              significant changes, we&apos;ll notify users through the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              Questions? Reach out at{" "}
              <a
                href="mailto:hello@siouxland.online"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                hello@siouxland.online
              </a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-white/30 text-sm">
          <p>&copy; 2026 Siouxland Online. Built for the 712.</p>
        </div>
      </div>
    </main>
  )
}
