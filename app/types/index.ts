export interface User {
  id: string
  email: string
  name?: string
  role: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface Order {
  id: string
  total: number
  currency: string
  status: string
  guest_email?: string
  paid_at?: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  item_type: string
  photo_id?: string
  athlete_id?: string
  price: number
}

export interface UploadBatch {
  id: string
  total_files: number
  processed_files: number
  failed_files: number
  status: string
}

export interface Tournament {
  id: string
  name: string
  slug: string
  date?: string
  location?: string
  organizer?: string
  cover_image?: string
  price_single: number
  price_bundle: number
  currency: string
  status: string
  photo_count: number
}

export interface Athlete {
  id: string
  tournament_id: string
  name: string
  category?: string
  gender?: string
  photo_count: number
}

export interface Photo {
  id: string
  tournament_id: string
  athlete_id?: string
  original_filename?: string
  status: string
  width?: number
  height?: number
  price: number
  preview_url?: string
  thumbnail_url?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface ListResponse<T> {
  data: T
  pagination?: Pagination
}

export interface PhotoListResult {
  data: Photo[]
  pagination: Pagination
}

export interface CheckoutResult {
  url: string
  dev_mode?: boolean
}
