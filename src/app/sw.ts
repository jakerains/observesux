import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

// Serwist configuration injected at build time
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache API responses with network-first strategy
    {
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache external weather/traffic images
    {
      urlPattern: /^https:\/\/(iowadotsnapshot|webpubcontent|weathercams)\..*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "external-images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 2, // 2 minutes (cameras update frequently)
        },
      },
    },
    // Default caching from Serwist
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data = {
    title: "Siouxland Alert",
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "default",
    url: "/",
  }

  try {
    const payload = event.data.json()
    data = {
      title: payload.title || data.title,
      body: payload.body || data.body,
      icon: payload.icon || data.icon,
      badge: payload.badge || data.badge,
      tag: payload.tag || data.tag,
      url: payload.url || data.url,
    }
  } catch {
    data.body = event.data.text()
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    requireInteraction: data.tag !== "default",
    data: { url: data.url },
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "dismiss") return

  const urlToOpen = (event.notification.data?.url as string) || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close (for analytics)
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag)
})

serwist.addEventListeners()
