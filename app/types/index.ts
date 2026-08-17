export interface User {
  id: string
  email: string
  name?: string
  role: string
  status?: string
  avatar_url?: string
  belt?: string
  locale?: string
  email_verified?: boolean
  email_verified_at?: string
  photos_public?: boolean
}

export interface ProfileStats {
  found_photos: number
  purchased_photos: number
  tournaments_count: number
}

export interface ProfilePhoto extends Photo {
  purchased: boolean
  is_favorite: boolean
}

export interface ProfilePhotosResult {
  data: ProfilePhoto[]
  pagination: Pagination
  counts: {
    all: number
    purchased: number
    unpurchased: number
    favorites: number
  }
}

export interface ProfileTournament {
  id: string
  name: string
  slug: string
  date?: string
  cover_image?: string
  found_count: number
  purchased_count: number
}

export interface ClientSearchSession {
  id: string
  tournament_id?: string
  tournament_name?: string
  search_type: string
  result_count: number
  created_at: string
}

export interface AuthResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user: User
  pending_approval?: boolean
}

export interface OrderDownloadPhoto {
  photo_id: string
  original_filename?: string
  item_type?: string
}

export interface Order {
  id: string
  total: number
  currency: string
  status: string
  guest_email?: string
  paid_at?: string
  created_at?: string
  items?: OrderItem[]
  download_photos?: OrderDownloadPhoto[]
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
  payouts_ready?: boolean
}

export interface Athlete {
  id: string
  tournament_id: string
  name: string
  category?: string
  gender?: string
  belt?: string
  age_group?: string
  weight_class?: string
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
  match_confidence?: number
  athlete_name?: string
  athlete_category?: string
  athlete_gender?: string
  athlete_belt?: string
  athlete_age_group?: string
  athlete_weight_class?: string
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
  guest_consent_token?: string
}

export interface TournamentStats {
  photo_count: number
  athlete_count: number
  orders_count: number
  revenue: number
  photos_sold: number
  view_count: number
  conversion: number
}

export interface AdminStats {
  users: number
  tournaments: number
  photos: number
  orders: number
  leads_new: number
  leads_total: number
  photographers_pending?: number
}

export interface PlatformHome {
  hero_image_url?: string
  default_price_single: number
  default_price_bundle: number
  face_search_enabled?: boolean
}

export interface AdminSettings extends PlatformHome {}

export interface AdminUser {
  id: string
  email: string
  name?: string
  role: string
  status: string
  email_verified?: boolean
  phone?: string
  city?: string
  display_name?: string
  stripe_status?: string
  created_at: string
}

export interface AdminOrder {
  id: string
  guest_email?: string
  total: number
  status: string
  created_at: string
}

export interface LeadRequest {
  id: string
  type: string
  name: string
  email: string
  phone?: string
  message?: string
  photo_id?: string
  shirt_size?: string
  event_date?: string
  event_location?: string
  status: string
  created_at: string
}

export interface CheckoutResult {
  url: string
  dev_mode?: boolean
}

export interface ConnectCountry {
  code: string
  name: string
}

export interface PayoutStatus {
  status: 'not_started' | 'onboarding' | 'restricted' | 'active' | 'disabled' | 'not_configured'
  country?: string
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements_due?: string[]
  can_receive_payments: boolean
  stripe_configured: boolean
  platform_fee_percent: number
  countries: ConnectCountry[]
}

export interface ConsentSummary {
  has_personal_consent: boolean
  has_consent_for_tournament?: boolean
  has_published_photos: boolean
  last_consent_at?: string
  last_tournament_name?: string
  claimed_athletes: number
  claimed_athlete_ids?: string[]
}

export interface UserNotification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  link?: string
  read_at?: string
  created_at: string
}
