export interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  originalPrice?: number | null
  costPrice?: number
  stock: number
  rating?: number
  reviewsCount?: number
  isFeatured?: boolean
  badge?: string | null
  description?: string
  image?: string
  colors?: string[]
  tags?: string[]
}

export interface Category {
  name: string
  description?: string
}

export interface TokenItem {
  id: string
  name: string
  tokenValue: string
  tokenType: 'api' | 'auth' | 'integration' | string
  isActive: boolean
  metadata?: Record<string, any> | null
  createdAt?: string
  updatedAt?: string
}

export interface StoreSettings {
  storeName: string
  tagline: string
  whatsappNumber: string
  currency: string
  deliveryFee: number
  freeShippingThreshold: number
  taxRate: number
  adminPassword: string
  enableLowStockAlerts: boolean
  lowStockThreshold: number
  businessAddress: string
  welcomeMessage: string
  razorpayKeyId: string
  enableRazorpay: boolean
  enableWhatsApp?: boolean
  enableWhatsAppOtp?: boolean
  enableCOD?: boolean
  enableUPI?: boolean
  // Hero Banner Settings
  heroPillText?: string
  heroTitleMain?: string
  heroTitleHighlight?: string
  heroSubtitle?: string
  heroButtonText?: string
  heroCard1Title?: string
  heroCard1Price?: number
  heroCard1Badge?: string
  heroCard1Image?: string
  heroCard2Title?: string
  heroCard2Price?: number
  heroCard2Badge?: string
  heroCard2Image?: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedColor?: string
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  address: string
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  totalAmount: number
  paymentMethod: 'whatsapp' | 'razorpay' | string
  paymentStatus: 'pending' | 'paid' | 'failed' | string
  orderStatus: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string
  createdAt: string
}

export interface OrderRecord {
  orderId: string
  timestamp: string
  customerName: string
  customerPhone: string
  address: string
  paymentMethod: string
  paymentId?: string
  items: CartItem[]
  totalAmount: number
  status: string
}

export interface LookbookEnsemble {
  id: string
  title: string
  subtitle: string
  image: string
  productIds: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  provider: 'google' | 'whatsapp'
  googleId?: string
  otp?: string
  otpExpires?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerAuthState {
  customer: Customer | null
  isAuthenticated: boolean
}

export interface TursoApiResponse {
  success: boolean
  error?: string
  status?: string
  serverTime?: string
  message?: string
  tokens?: TokenItem[]
  token?: TokenItem
  products?: Product[]
  product?: Product
  categories?: Category[]
  category?: Category
  settings?: StoreSettings
  orders?: OrderRecord[]
  order?: OrderRecord
  ensembles?: LookbookEnsemble[]
  ensemble?: LookbookEnsemble
  customer?: Customer
  customers?: Customer[]
  otpSent?: boolean
  verified?: boolean
}
