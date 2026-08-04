import type {
  AdminOrder,
  AdminSettings,
  AdminStats,
  AdminUser,
  Athlete,
  AuthResponse,
  CheckoutResult,
  ClientSearchSession,
  LeadRequest,
  ListResponse,
  Order,
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

  async function del<T>(path: string) {
    return $fetch<T>(`${base}${path}`, { method: 'DELETE', headers: headers() })
  }

  async function patch<T>(path: string, body?: unknown) {
    return $fetch<T>(`${base}${path}`, { method: 'PATCH', body, headers: headers() })
  }

  return {
    getTournaments: (search?: string) =>
      get<ListResponse<Tournament[]>>('/api/v1/tournaments', { search, limit: 20 }),

    getPlatformHome: () => get<PlatformHome>('/api/v1/platform/home'),

    getTournament: (slug: string) =>
      get<Tournament>(`/api/v1/tournaments/${slug}`),

    searchAthletes: (slug: string, q: string, params?: { gender?: string; belt?: string; age_group?: string; weight_class?: string }) =>
      get<ListResponse<Athlete[]>>(`/api/v1/tournaments/${slug}/athletes`, { q, limit: 20, ...params }),

    searchByFace: async (slug: string, file: File) => {
      const form = new FormData()
      form.append('selfie', file)
      return $fetch<PhotoListResult>(`${base}/api/v1/tournaments/${slug}/search/face`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    getPhotos: (slug: string, params?: { athlete_id?: string; gender?: string; belt?: string; age_group?: string; weight_class?: string; page?: number; limit?: number }) =>
      get<PhotoListResult>(`/api/v1/tournaments/${slug}/photos`, {
        athlete_id: params?.athlete_id,
        gender: params?.gender,
        belt: params?.belt,
        age_group: params?.age_group,
        weight_class: params?.weight_class,
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
      }),

    getPhotographerPhotos: (tournamentId: string, params?: { tagged?: string; page?: number; limit?: number }) =>
      get<PhotoListResult>(`/api/v1/photographer/tournaments/${tournamentId}/photos`, {
        tagged: params?.tagged,
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
      }),

    getPhoto: (id: string) =>
      get<Photo>(`/api/v1/photos/${id}`),

    register: (data: { email: string; password: string; name?: string; role?: string }) =>
      post<AuthResponse>('/api/v1/auth/register', data),

    login: (data: { email: string; password: string }) =>
      post<AuthResponse>('/api/v1/auth/login', data),

    verifyEmail: (token: string) =>
      post<{ status: string }>('/api/v1/auth/verify-email', { token }),

    resendVerification: () =>
      post<{ status: string }>('/api/v1/auth/resend-verification'),

    me: () => get<User>('/api/v1/auth/me'),

    getMyTournaments: () =>
      get<ListResponse<Tournament[]>>('/api/v1/photographer/tournaments'),

    createTournament: (data: Record<string, unknown>) =>
      post<Tournament>('/api/v1/photographer/tournaments', data),

    uploadTournamentCover: async (tournamentId: string, file: File) => {
      const form = new FormData()
      form.append('cover', file)
      return $fetch<Tournament>(`${base}/api/v1/photographer/tournaments/${tournamentId}/cover`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

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

    updateProfile: (data: { name?: string; belt?: string; locale?: string }) =>
      patch<User>('/api/v1/profile', data),

    trackAthlete: (athleteId: string) =>
      post<{ status: string }>('/api/v1/profile/track/athlete', { athlete_id: athleteId }),

    getAdminStats: () => get<AdminStats>('/api/v1/admin/stats'),

    getAdminSettings: () => get<AdminSettings>('/api/v1/admin/settings'),

    updateAdminSettings: (data: { default_price_single: number; default_price_bundle: number }) =>
      put<AdminSettings>('/api/v1/admin/settings', data),

    uploadAdminHero: async (file: File) => {
      const form = new FormData()
      form.append('hero', file)
      return $fetch<AdminSettings>(`${base}/api/v1/admin/settings/hero`, {
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
      return $fetch<Tournament>(`${base}/api/v1/admin/tournaments/${tournamentId}/cover`, {
        method: 'POST',
        body: form,
        headers: headers(),
      })
    },

    getAdminUsers: (page?: number) =>
      get<{ data: AdminUser[]; pagination: Pagination }>('/api/v1/admin/users', { page: page ?? 1 }),

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

    downloadUrl: (photoId: string, orderId?: string, guestEmail?: string) => {
      const params = new URLSearchParams()
      if (orderId) params.set('order_id', orderId)
      if (guestEmail) params.set('guest_email', guestEmail)
      const qs = params.toString()
      return `${base}/api/v1/photos/${photoId}/download${qs ? `?${qs}` : ''}`
    },
  }
}
