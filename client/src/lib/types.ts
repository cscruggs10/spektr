// Dashboard types
export interface DashboardStats {
  pendingInspections: number;
  completedToday: number;
  todayMatches: number;
  activeDealers: number;
}

// Dealer types
export interface Dealer {
  id: number;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  status: string;
  joined_date: string;
}

// Inspector types
export interface Inspector {
  id: number;
  user_id: number;
  bio?: string;
  rating?: number;
  active: boolean;
  user: User;
}

// User types
export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

// Buy Box types
export interface BuyBoxItem {
  id: number;
  dealer_id: number;
  make: string;
  model: string;
  trim?: string;
  year_min?: number;
  year_max?: number;
  mileage_min?: number;
  mileage_max?: number;
  price_min?: number;
  price_max?: number;
  body_type?: string;
  color?: string;
  status: string;
  created_at: string;
}

// Auction types
export interface Auction {
  id: number;
  name: string;
  description?: string;
  location: string;
  address: string;
  created_at: string;
  updated_at?: string;
  inspector_count?: number;
}

export type DayType = 'auction' | 'inspection';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface AuctionSchedule {
  id: number;
  auction_id: number;
  day_type: DayType;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slots_per_hour: number;
  created_at: string;
}

// Runlist types
export interface Runlist {
  id: number;
  auction_id: number;
  filename: string;
  upload_date: string;
  processed: boolean;
  column_mapping?: any;
  uploaded_by?: number;
}

// Vehicle types
export interface Vehicle {
  id: number;
  runlist_id: number;
  stock_number?: string;
  vin?: string;
  make: string;
  model: string;
  trim?: string;
  year?: number;
  mileage?: number;
  color?: string;
  body_type?: string;
  engine?: string;
  transmission?: string;
  auction_price?: number;
  auction_date?: string;
  lane_number?: number;
  run_number?: number;
  raw_data?: any;
}

// Inspection types
export interface InspectionTemplate {
  id: number;
  dealer_id: number;
  name: string;
  fields: any;
  require_photos: boolean;
  require_videos: boolean;
  created_at: string;
  updated_at: string;
}

export type InspectionStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'canceled';

export interface Inspection {
  id: number;
  vehicle_id: number;
  dealer_id: number;
  inspector_id?: number;
  template_id: number;
  status: InspectionStatus;
  scheduled_date?: string;
  inspection_date?: string; // Added for manually created inspections
  start_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  vehicle: Vehicle;
  dealer: Dealer;
  inspector?: Inspector;
}

export interface InspectionResult {
  id: number;
  inspection_id: number;
  data: any;
  photos?: string[];
  videos?: string[];
  links?: string[];
  created_at: string;
}

// Purchase types
export type PurchaseStatus = 'pending' | 'purchased' | 'not_purchased';

export interface Purchase {
  id: number;
  inspection_id: number;
  dealer_id: number;
  status: PurchaseStatus;
  purchase_date?: string;
  purchase_price?: number;
  arrival_date?: string;
  feedback_provided: boolean;
  feedback_rating?: number;
  feedback_comments?: string;
  created_at: string;
  inspection: Inspection;
}

// Column mapping types
export interface ColumnMapping {
  id: number;
  auction_id: number;
  name: string;
  mapping: any;
  created_at: string;
}

// Activity log types
export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details?: any;
  timestamp: string;
  user: User;
}

// Form types
export interface DealerFormValues {
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  status: string;
}

export interface BuyBoxFormValues {
  dealer_id: number;
  make: string;
  model: string;
  trim?: string;
  year_min?: number;
  year_max?: number;
  mileage_min?: number;
  mileage_max?: number;
  price_min?: number;
  price_max?: number;
  body_type?: string;
  color?: string;
}

export interface UploadRunlistFormValues {
  auctionId: number;
  runlist: File;
}

export interface AuctionScheduleFormValues {
  auction_id: number;
  day_type: DayType;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slots_per_hour: number;
}
