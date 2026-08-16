import type {
  AdminOrder,
  AdminSettings,
  AdminStats,
  AdminUser,
  Athlete,
  AuthResponse,
  CheckoutResult,
  ConsentSummary,
  ClientSearchSession,
  LeadRequest,
  ListResponse,
  Order,
  OrderDownloadPhoto,
  Photo,
  PhotoListResult,
  PlatformHome,
  ProfilePhotosResult,
  ProfileStats,
  ProfileTournament,
  Tournament,
  TournamentStats,
  UploadBatch,
  User,
  UserNotification,
} from '~/types'

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const base = import.meta.server ? config.apiBase : config.public.apiBase

  let refreshPromise: Promise<boolean> | null = null

  function headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { ...extra }
    if (auth.accessToken) {
      h.Authorization = `Bearer ${auth.accessToken}`
    }
    return h
  }

  async function refreshSession(): Promise<boolean> {
    if (!auth.refreshToken) return false
    try {
      const data = await $fetch<AuthResponse>(`${base}/api/v1/auth/refresh`, {
        method: 'POST',
        body: { refresh_token: auth.refreshToken },
      })
      auth.setSession(data)
      return true
    }
    catch {
      auth.logout()
      return false
    }
  }

  async function apiFetch<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${base}${path}`
    const reqHeaders = headers(opts.headers as Record<string, string> | undefined)
    try {
      return await $fetch<T>(url, { ...opts, headers: reqHeaders })
    }
    catch (e: unknown) {
      const err = e as { statusCode?: number; status?: number }
      const status = err.statusCode ?? err.status
      const retried = reqHeaders['X-Retry'] === '1'
      if (status === 401 && auth.refreshToken && !retried) {
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => { refreshPromise = null })
        }
        const ok = await refreshPromise
        if (ok) {
          return apiFetch<T>(path, {
            ...opts,
            headers: { ...(opts.headers as Record<string, string> | undefined), 'X-Retry': '1' },
          })
        }
      }
      throw e
    }
  }

  async function get<T>(path: string, query?: Record<string, string | number | undefined>) {
    return apiFetch<T>(path, { query, headers: headers() })
  }

  async function post<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, { method: 'POST', body, headers: headers() })
  }

  async function put<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, { method: 'PUT', body, headers: headers() })
  }

  async function del<T>(path: string) {
    return apiFetch<T>(path, { method: 'DELETE', headers: headers() })
  }

  async function patch<T>(path: string, body?: unknown) {
    return apiFetch<T>(path, { method: 'PATCH', body, headers: headers() })
  }

  function downloadPath(photoId: string, orderId?: string, guestEmail?: string) {
    const params = new URLSearchParams()
    if (orderId) params.set('order_id', orderId)
    if (guestEmail) params.set('guest_email', guestEmail)
    const qs = params.toString()
    return `/api/v1/photos/${photoId}/download${qs ? `?${qs}` : ''}`
  }

  function startNativeDownload(href: string, name?: string) {
    const isBlob = href.startsWith('blob:')
    const sameOrigin = href.startsWith('/') || href.startsWith(window.location.origin)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    // Cross-origin S3 URL: fetch/blob is blocked by CORS on iOS Safari.
    // Navigate so the browser applies Content-Disposition: attachment.
    if (!isBlob && !sameOrigin && isIOS) {
      window.location.assign(href)
      return
    }

    if (!isBlob && !sameOrigin) {
      const frame = document.createElement('iframe')
      frame.style.display = 'none'
      frame.src = href
      document.body.appendChild(frame)
      setTimeout(() => frame.remove(), 60_000)
      return
    }

    const anchor = document.createElement('a')
    anchor.href = href
    if (name) anchor.download = name
    anchor.rel = 'noopener'
    if (!isBlob && !sameOrigin) {
      anchor.target = '_blank'
    }
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  async function downloadPhoto(photoId: string, filename?: string, orderId?: string, guestEmail?: string) {
    const path = downloadPath(photoId, orderId, guestEmail)
    const url = `${base}${path}`
    const fallbackName = filename || `${photoId.slice(0, 8)}.jpg`
    const res = await fetch(url, {
      headers: { ...headers(), Accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error('download failed')
    }
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json() as { url?: string, filename?: string }
      if (!data.url) {
        throw new Error('download failed')
      }
      startNativeDownload(data.url, data.filename || fallbackName)
      return
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    startNativeDownload(objectUrl, fallbackName)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }

  return {
    getTournaments: (search?: string, period?: 'active' | 'past') =>
      get<ListResponse<Tournament[]>>('/api/v1/tournaments', { search, period, limit: 20 }),

    getPlatformHome: () => get<PlatformHome>('/api/v1/platform/home'),

    getTournament: (slug: string) =>
      get<Tournament>(`/api/v1/tournaments/${slug}`),

    searchAthletes: (slug: string, q: string, params?: { gender?: string; belt?: string; age_group?: string; weight_class?: string }) =>
      get<ListResponse<Athlete[]>>(`/api/v1/tournaments/${slug}/athletes`, { q, limit: 20, ...params }),

    searchByFace: async (slug: string, file: File, consentPersonal: boolean, guestToken?: string) => {
      const form = new FormData()
      form.append('selfie', file)
      form.append('consent_personal', consentPersonal ? 'true' : 'false')
      const extra: Record<string, string> = {}
      if (guestToken) {
        extra['X-Guest-Consent'] = guestToken
      }
      return apiFetch<PhotoListResult>(`/api/v1/tournaments/${slug}/search/face`, {
        method: 'POST',
        body: form,
        headers: headers(extra),
      })
    },

    getPhotos: (slug: string, params?: { athlete_id?: string; gender?: string; belt?: string; age_group?: string; weight_class?: string; page?: number; limit?: number; published?: boolean }) =>
      get<PhotoListResult>(`/api/v1/tournaments/${slug}/photos`, {
        athlete_id: params?.athlete_id,
        gender: params?.gender,
        belt: params?.belt,
        age_group: params?.age_group,
        weight_class: params?.weight_class,
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
        published: params?.published ? '1' : undefined,
      }),

    getPhotographerPhotos: (tournamentId: string, params?: { tagged?: string; page?: number; limit?: number }) =>
      get<PhotoListResult>(`/api/v1/photographer/tournaments/${tournamentId}/photos`, {
        tagged: params?.tagged,
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
      }),

    getPhoto: (id: string, params?: { from?: string; guestToken?: string }) => {
      const extra: Record<string, string> = {}
      if (params?.guestToken) {
        extra['X-Guest-Consent'] = params.guestToken
      }
      return apiFetch<Photo>(`/api/v1/photos/${id}`, {
        query: params?.from ? { from: params.from } : undefined,
        headers: headers(extra),
      })
    },

    register: (data: { email: string; password: string; name?: string; role?: string }) =>
      post<AuthResponse>('/api/v1/auth/register', data),

    login: (data: { email: string; password: string }) =>
      post<AuthResponse>('/api/v1/auth/login', data),

    refreshSession,

    verifyEmail: (code: string) =>
      post<{ status: string }>('/api/v1/auth/verify-email', { code }),

    resendVerification: () =>
      post<{ status: string }>('/api/v1/auth/resend-verification'),

    verifyRegistration: (email: string, code: string) =>
      post<AuthResponse>('/api/v1/auth/verify-registration', { email, code }),

    resendRegistrationCode: (email: string) =>
      post<{ status: string }>('/api/v1/auth/resend-registration-code', { email }),

    forgotPassword: (email: string) =>
      post<{ status: string }>('/api/v1/auth/forgot-password', { email }),

    resetPassword: (email: string, code: string, password: string) =>
      post<{ status: string }>('/api/v1/auth/reset-password', { email, code, password }),

    me: () => get<User>('/api/v1/auth/me'),

    getMyTournaments: () =>
      get<ListResponse<Tournament[]>>('/api/v1/photographer/tournaments'),

    createTournament: (data: Record<string, unknown>) =>
      post<Tournament>('/api/v1/photographer/tournaments', data),

    updateTournament: (id: string, data: {
      name: string
      date?: string
      location?: string
      organizer?: string
      price_single: number
      price_bundle: number
    }) =>
      put<Tournament>(`/api/v1/photographer/tournaments/${id}`, data),

    uploadTournamentCover: async (tournamentId: string, file: File) => {
      const form = new FormData()
      form.append('cover', file)
      return apiFetch<Tournament>(`/api/v1/photographer/tournaments/${tournamentId}/cover`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    publishTournament: (id: string) =>
      post<{ status: string }>(`/api/v1/photographer/tournaments/${id}/publish`),

    getUploadStatus: (id: string) =>
      get<UploadBatch>(`/api/v1/photographer/tournaments/${id}/upload-status`),

    uploadPhotos: (tournamentId: string, files: File[], onProgress?: (loaded: number, total: number) => void) => {
      const form = new FormData()
      for (const file of files) {
        form.append('photos', file)
      }
      return new Promise<UploadBatch>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${base}/api/v1/photographer/tournaments/${tournamentId}/photos`)
        const token = auth.accessToken
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(event.loaded, event.total)
          }
        }
        xhr.onload = () => {
          try {
            const data = xhr.responseText ? JSON.parse(xhr.responseText) as UploadBatch & { error?: string } : null
            if (xhr.status >= 200 && xhr.status < 300 && data && !data.error) {
              resolve(data)
              return
            }
            reject(Object.assign(new Error(data?.error || 'upload failed'), {
              statusCode: xhr.status,
              data,
            }))
          }
          catch {
            reject(new Error('upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('upload failed'))
        xhr.send(form)
      })
    },

    getPhotographerAgreementStatus: () =>
      get<{ agreed: boolean; terms_version: string }>('/api/v1/photographer/agreement/status'),

    recordPhotographerAgreement: (rightsShoot: boolean, rightsDistribute: boolean) =>
      post<{ status: string }>('/api/v1/photographer/agreement', {
        rights_shoot: rightsShoot,
        rights_distribute: rightsDistribute,
      }),

    getTournamentStats: (id: string) =>
      get<TournamentStats>(`/api/v1/photographer/tournaments/${id}/stats`),

    tagPhoto: (photoId: string, data: { name: string; category?: string; gender?: string; belt?: string; age_group?: string; weight_class?: string }) =>
      put<{ status: string }>(`/api/v1/photographer/photos/${photoId}/tags`, data),

    deletePhoto: (photoId: string) =>
      del<{ status: string }>(`/api/v1/photographer/photos/${photoId}`),

    qrUrl: (tournamentId: string) =>
      `${base}/api/v1/photographer/tournaments/${tournamentId}/qr`,

    createOrder: (data: { tournament_id: string; guest_email?: string; items: Array<{ type: string; photo_id?: string; athlete_id?: string }> }) =>
      post<Order>('/api/v1/orders', data),

    createTshirtLead: (data: { name: string; email: string; phone?: string; message?: string; photo_id?: string; tournament_id?: string; shirt_size?: string }) =>
      post<{ id: string; status: string }>('/api/v1/leads/tshirt', data),

    createPhotographerLead: (data: { name: string; email: string; phone?: string; message?: string; event_date?: string; event_location?: string }) =>
      post<{ id: string; status: string }>('/api/v1/leads/photographer', data),

    getFavorites: () =>
      get<{ data: Photo[] }>('/api/v1/favorites'),

    addFavorite: (photoId: string) =>
      post<{ status: string }>(`/api/v1/favorites/${photoId}`),

    removeFavorite: (photoId: string) =>
      del<{ status: string }>(`/api/v1/favorites/${photoId}`),

    syncFavorites: (photoIds: string[]) =>
      post<{ data: Photo[] }>('/api/v1/favorites/sync', { photo_ids: photoIds }),

    getProfileStats: () => get<ProfileStats>('/api/v1/profile/stats'),

    getProfilePhotos: (params?: { filter?: string; tournament_id?: string; page?: number }) =>
      get<ProfilePhotosResult>('/api/v1/profile/photos', {
        filter: params?.filter,
        tournament_id: params?.tournament_id,
        page: params?.page ?? 1,
      }),

    getProfileTournaments: () =>
      get<{ data: ProfileTournament[] }>('/api/v1/profile/tournaments'),

    getProfileTournamentOptions: () =>
      get<{ data: Tournament[] }>('/api/v1/profile/tournament-options'),

    getProfileSelfies: () =>
      get<{ data: ClientSearchSession[] }>('/api/v1/profile/selfies'),

    updateProfile: (data: { name?: string; belt?: string; locale?: string; photos_public?: boolean }) =>
      patch<User>('/api/v1/profile', data),

    getConsentSummary: (tournamentId?: string) =>
      get<ConsentSummary>('/api/v1/consent/summary', { tournament_id: tournamentId }),

    unpublishCatalog: () => post<{ status: string }>('/api/v1/consent/unpublish'),

    revokeConsent: () => post<{ status: string }>('/api/v1/consent/revoke'),

    claimFromFace: (photoIds: string[]) =>
      post<{ status: string; claimed: number }>('/api/v1/consent/claim-from-face', { photo_ids: photoIds }),

    getNotifications: () => get<{ data: UserNotification[] }>('/api/v1/notifications'),

    getUnreadNotificationCount: () => get<{ count: number }>('/api/v1/notifications/unread-count'),

    markNotificationRead: (id: string) =>
      patch<{ status: string }>(`/api/v1/notifications/${id}/read`),

    claimAthlete: (athleteId: string) =>
      post<{ status: string }>('/api/v1/profile/claim-athlete', { athlete_id: athleteId }),

    trackAthlete: (athleteId: string) =>
      post<{ status: string }>('/api/v1/profile/track/athlete', { athlete_id: athleteId }),

    getAdminStats: () => get<AdminStats>('/api/v1/admin/stats'),

    getAdminSettings: () => get<AdminSettings>('/api/v1/admin/settings'),

    updateAdminSettings: (data: { default_price_single: number; default_price_bundle: number }) =>
      put<AdminSettings>('/api/v1/admin/settings', data),

    uploadAdminHero: async (file: File) => {
      const form = new FormData()
      form.append('hero', file)
      return apiFetch<AdminSettings>('/api/v1/admin/settings/hero', {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    getAdminTournaments: (page?: number) =>
      get<ListResponse<Tournament[]>>('/api/v1/admin/tournaments', { page: page ?? 1 }),

    updateAdminTournament: (id: string, data: { price_single: number; price_bundle: number; status: string }) =>
      put<Tournament>(`/api/v1/admin/tournaments/${id}`, data),

    uploadAdminTournamentCover: async (tournamentId: string, file: File) => {
      const form = new FormData()
      form.append('cover', file)
      return apiFetch<Tournament>(`/api/v1/admin/tournaments/${tournamentId}/cover`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    getAdminUsers: (params?: { role?: string; status?: string; page?: number }) =>
      get<{ data: AdminUser[]; pagination: Pagination }>('/api/v1/admin/users', {
        role: params?.role,
        status: params?.status,
        page: params?.page ?? 1,
      }),

    updateAdminUserStatus: (id: string, status: string) =>
      patch<AdminUser>(`/api/v1/admin/users/${id}`, { status }),

    getAdminOrders: (page?: number) =>
      get<{ data: AdminOrder[]; pagination: Pagination }>('/api/v1/admin/orders', { page: page ?? 1 }),

    getAdminLeads: (params?: { type?: string; status?: string; page?: number }) =>
      get<{ data: LeadRequest[]; pagination: Pagination }>('/api/v1/admin/leads', {
        type: params?.type,
        status: params?.status,
        page: params?.page ?? 1,
      }),

    updateLeadStatus: (id: string, status: string) =>
      patch<LeadRequest>(`/api/v1/admin/leads/${id}`, { status }),

    checkout: (orderId: string, guestEmail?: string) =>
      post<CheckoutResult>(`/api/v1/orders/${orderId}/checkout`, { guest_email: guestEmail }),

    getOrder: (orderId: string, guestEmail?: string) =>
      get<Order>(`/api/v1/orders/${orderId}`, { guest_email: guestEmail }),

    getMyOrders: () =>
      get<ListResponse<Order[]>>('/api/v1/orders/my'),

    downloadUrl: (photoId: string, orderId?: string, guestEmail?: string) =>
      `${base}${downloadPath(photoId, orderId, guestEmail)}`,

    downloadPhoto,
  }
}
