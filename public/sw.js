console.log("[SW] Service Worker loaded")

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received", event.data?.text())

  let data
  try {
    data = event.data?.json()
  } catch {
    console.log("[SW] Invalid push data")
    return
  }
  if (!data?.title) {
    console.log("[SW] No title in push data")
    return
  }

  console.log("[SW] Push data:", data.title, data.body)

  const { title, body, icon, url } = data

  const promise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      console.log("[SW] Active clients:", clients.length)

      const hasVisible = clients.some(
        (c) => c.visibilityState === "visible"
      )

      if (hasVisible) {
        console.log("[SW] Client is visible — suppressing notification")
        return
      }

      clients.forEach((c) =>
        console.log("[SW] Client visibility:", c.visibilityState, "focused:", c.focused)
      )

      console.log("[SW] Showing notification")
      return self.registration.showNotification(title, {
        body: body ?? "",
        icon: icon ?? "/portal-logo.svg",
        badge: "/portal-logo.svg",
        data: { url: url ?? "/student" },
        tag: "student-portal",
        renotify: true,
      })
    })
    .catch((err) => console.log("[SW] Push handler error:", err))

  event.waitUntil(promise)
})

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")
  event.notification.close()

  const url = event.notification.data?.url ?? "/student"
  const origin = self.location.origin
  const fullUrl = url.startsWith("/") ? origin + url : url

  console.log("[SW] Navigating to:", fullUrl)

  const promise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(origin) && "focus" in client) {
          console.log("[SW] Focusing existing client")
          return client.focus().then((c) => c.navigate(fullUrl))
        }
      }
      console.log("[SW] Opening new window")
      return self.clients.openWindow(fullUrl)
    })
    .catch((err) => console.log("[SW] Click handler error:", err))

  event.waitUntil(promise)
})
