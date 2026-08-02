import type {
  Athlete,
  AuthResponse,
  CheckoutResult,
  ListResponse,
  Order,
  Photo,
  PhotoListResult,
  Tournament,
  UploadBatch,
  User,
} from '~/types'

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const base = import.meta.server ? config.apiBase : config.public.apiBase

  function headers(): Record<string, string> {
    const h: Record<string, string> = {}
    if (auth.accessToken) {
      h.Authorization = `Bearer ${auth.accessToken}`
    }
    return h
  }

  async function get<T>(path: string, query?: Record<string, string | number | undefined>) {
    return $fetch<T>(`${base}${path}`, { query, headers: headers() })
  }

  async function post<T>(path: string, body?: unknown) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, headers: headers() })
  }

  async function put<T>(path: string, body?: unknown) {
    return $fetch<T>(`${base}${path}`, { method: 'PUT', body, headers: headers() })
  }

  return {
    getTournaments: (search?: string) =>
      get<ListResponse<Tournament[]>>('/api/v1/tournaments', { search, limit: 20 }),

    getTournament: (slug: string) =>
      get<Tournament>(`/api/v1/tournaments/${slug}`),

    searchAthletes: (slug: string, q: string, gender?: string) =>
      get<ListResponse<Athlete[]>>(`/api/v1/tournaments/${slug}/athletes`, { q, gender, limit: 20 }),

    getPhotos: (slug: string, params?: { athlete_id?: string; gender?: string; page?: number; limit?: number }) =>
      get<PhotoListResult>(`/api/v1/tournaments/${slug}/photos`, {
        athlete_id: params?.athlete_id,
        gender: params?.gender,
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
      }),

    getPhoto: (id: string) =>
      get<Photo>(`/api/v1/photos/${id}`),

    register: (data: { email: string; password: string; name?: string; role?: string }) =>
      post<AuthResponse>('/api/v1/auth/register', data),

    login: (data: { email: string; password: string }) =>
      post<AuthResponse>('/api/v1/auth/login', data),

    me: () => get<User>('/api/v1/auth/me'),

    getMyTournaments: () =>
      get<ListResponse<Tournament[]>>('/api/v1/photographer/tournaments'),

    createTournament: (data: Record<string, unknown>) =>
      post<Tournament>('/api/v1/photographer/tournaments', data),

    publishTournament: (id: string) =>
      post<{ status: string }>(`/api/v1/photographer/tournaments/${id}/publish`),

    getUploadStatus: (id: string) =>
      get<UploadBatch>(`/api/v1/photographer/tournaments/${id}/upload-status`),

    uploadPhotos: async (tournamentId: string, files: File[]) => {
      const form = new FormData()
      for (const file of files) {
        form.append('photos', file)
      }
      return $fetch<UploadBatch>(`${base}/api/v1/photographer/tournaments/${tournamentId}/photos`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    qrUrl: (tournamentId: string) =>
      `${base}/api/v1/photographer/tournaments/${tournamentId}/qr`,

    createOrder: (data: { tournament_id: string; guest_email?: string; items: Array<{ type: string; photo_id?: string; athlete_id?: string }> }) =>
      post<Order>('/api/v1/orders', data),

    checkout: (orderId: string, guestEmail?: string) =>
      post<CheckoutResult>(`/api/v1/orders/${orderId}/checkout`, { guest_email: guestEmail }),

    getOrder: (orderId: string, guestEmail?: string) =>
      get<Order>(`/api/v1/orders/${orderId}`, { guest_email: guestEmail }),

    getMyOrders: () =>
      get<ListResponse<Order[]>>('/api/v1/orders/my'),

    downloadUrl: (photoId: string, orderId?: string, guestEmail?: string) => {
      const params = new URLSearchParams()
      if (orderId) params.set('order_id', orderId)
      if (guestEmail) params.set('guest_email', guestEmail)
      const qs = params.toString()
      return `${base}/api/v1/photos/${photoId}/download${qs ? `?${qs}` : ''}`
    },
  }
}
