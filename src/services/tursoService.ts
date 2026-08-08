import { createClient, type Client } from '@libsql/client/web'
import type {
  Product,
  Category,
  TokenItem,
  StoreSettings,
  OrderRecord,
  LookbookEnsemble,
  TursoApiResponse,
  Customer
} from '../types'

let clientInstance: Client | null = null

export function isTursoConfigured(): boolean {
  const url = import.meta.env.VITE_TURSO_DATABASE_URL || ''
  const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || ''
  return Boolean(url && authToken)
}

// ——— WATI WhatsApp OTP Delivery ———
async function sendOtpViaWati(phone: string, otp: string): Promise<void> {
  const endpoint = import.meta.env.VITE_WATI_API_ENDPOINT || ''
  const apiKey = import.meta.env.VITE_WATI_API_KEY || ''
  const templateName = import.meta.env.VITE_WATI_TEMPLATE_NAME || 'viola_otp'

  if (!endpoint || !apiKey) {
    throw new Error('WhatsApp messaging is not configured. Please contact the boutique.')
  }

  // Ensure phone has country code (no + prefix, digits only)
  const cleanPhone = phone.replace(/\D/g, '')

  const res = await fetch(`${endpoint}/api/ext/v3/messageTemplates/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_name: templateName,
      broadcast_name: `otp_${Date.now()}`,
      receivers: [
        {
          whatsappNumber: cleanPhone,
          customParams: [{ name: '1', value: otp }]
        }
      ]
    })
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText)
    throw new Error(`Failed to send OTP via WhatsApp: ${errorText}`)
  }
}

function getTursoClient(): Client | null {
  if (clientInstance) return clientInstance

  const url = import.meta.env.VITE_TURSO_DATABASE_URL || ''
  const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || ''

  if (!url || !authToken) return null

  let httpUrl = url
  if (httpUrl.startsWith('libsql://')) {
    httpUrl = httpUrl.replace('libsql://', 'https://')
  }

  try {
    clientInstance = createClient({
      url: httpUrl,
      authToken: authToken
    })
    return clientInstance
  } catch (err) {
    console.error('Failed to create direct Turso DB client:', err)
    return null
  }
}

async function callApi<T = any>(action: string, data: any = null): Promise<TursoApiResponse & T> {
  try {
    const res = await fetch('/api/turso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Serverless API request failed')
    }
    return json
  } catch (err) {
    const directClient = getTursoClient()
    if (directClient) {
      return executeDirectClient(action, data, directClient)
    }
    throw err
  }
}

async function executeDirectClient(action: string, data: any, client: Client): Promise<any> {
  if (action === 'init') {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, token_value TEXT NOT NULL, token_type TEXT DEFAULT 'api',
        is_active INTEGER DEFAULT 1, metadata TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
        price REAL NOT NULL, original_price REAL, cost_price REAL DEFAULT 0, stock INTEGER DEFAULT 0,
        rating REAL DEFAULT 5.0, reviews_count INTEGER DEFAULT 0, is_featured INTEGER DEFAULT 0,
        badge TEXT, description TEXT, image TEXT, colors TEXT, tags TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_phone TEXT, address TEXT,
        payment_method TEXT NOT NULL, payment_id TEXT, items TEXT NOT NULL, total_amount REAL NOT NULL,
        status TEXT NOT NULL, timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ensembles (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT, image TEXT, product_ids TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, avatar TEXT,
        provider TEXT NOT NULL, google_id TEXT, otp TEXT, otp_expires TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
    return { success: true }
  }

  if (action === 'fetch_tokens') {
    const res = await client.execute('SELECT * FROM tokens ORDER BY created_at DESC')
    const tokens: TokenItem[] = res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      tokenValue: String(row.token_value),
      tokenType: String(row.token_type),
      isActive: Boolean(row.is_active),
      metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || '')
    }))
    return { success: true, tokens }
  }

  if (action === 'save_token') {
    const token: TokenItem = data
    const id =
      token.id || 'tok_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    const now = new Date().toISOString()
    await client.execute({
      sql: `
        INSERT INTO tokens (id, name, token_value, token_type, is_active, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name, token_value = excluded.token_value, token_type = excluded.token_type,
          is_active = excluded.is_active, metadata = excluded.metadata, updated_at = excluded.updated_at
      `,
      args: [
        id,
        token.name,
        token.tokenValue,
        token.tokenType || 'api',
        token.isActive ? 1 : 0,
        token.metadata ? JSON.stringify(token.metadata) : null,
        token.createdAt || now,
        now
      ]
    })
    return { success: true, token: { ...token, id, updatedAt: now } }
  }

  if (action === 'delete_token') {
    await client.execute({ sql: 'DELETE FROM tokens WHERE id = ?', args: [data.id] })
    return { success: true }
  }

  if (action === 'toggle_token') {
    const now = new Date().toISOString()
    await client.execute({
      sql: 'UPDATE tokens SET is_active = ?, updated_at = ? WHERE id = ?',
      args: [data.isActive ? 1 : 0, now, data.id]
    })
    return { success: true }
  }

  if (action === 'fetch_products') {
    const res = await client.execute('SELECT * FROM products ORDER BY created_at DESC')
    const products: Product[] = res.rows.map((row) => ({
      id: String(row.id),
      sku: String(row.sku),
      name: String(row.name),
      category: String(row.category),
      price: Number(row.price),
      originalPrice: row.original_price != null ? Number(row.original_price) : null,
      costPrice: Number(row.cost_price || 0),
      stock: Number(row.stock || 0),
      rating: Number(row.rating || 5.0),
      reviewsCount: Number(row.reviews_count || 0),
      isFeatured: Boolean(row.is_featured),
      badge: row.badge ? String(row.badge) : null,
      description: String(row.description || ''),
      image: String(row.image || ''),
      colors: row.colors ? JSON.parse(String(row.colors)) : [],
      tags: row.tags ? JSON.parse(String(row.tags)) : []
    }))
    return { success: true, products }
  }

  if (action === 'save_product') {
    const prod: Product = data
    const now = new Date().toISOString()
    await client.execute({
      sql: `
        INSERT INTO products (
          id, sku, name, category, price, original_price, cost_price, stock,
          rating, reviews_count, is_featured, badge, description, image, colors, tags, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku, name = excluded.name, category = excluded.category, price = excluded.price,
          original_price = excluded.original_price, cost_price = excluded.cost_price, stock = excluded.stock,
          rating = excluded.rating, reviews_count = excluded.reviews_count, is_featured = excluded.is_featured,
          badge = excluded.badge, description = excluded.description, image = excluded.image, colors = excluded.colors,
          tags = excluded.tags, updated_at = excluded.updated_at
      `,
      args: [
        prod.id,
        prod.sku,
        prod.name,
        prod.category,
        Number(prod.price),
        prod.originalPrice != null ? Number(prod.originalPrice) : null,
        Number(prod.costPrice || 0),
        Number(prod.stock || 0),
        Number(prod.rating || 5.0),
        Number(prod.reviewsCount || 0),
        prod.isFeatured ? 1 : 0,
        prod.badge || null,
        prod.description || '',
        prod.image || '',
        JSON.stringify(prod.colors || []),
        JSON.stringify(prod.tags || []),
        now
      ]
    })
    return { success: true, product: prod }
  }

  if (action === 'delete_product') {
    await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [data.id] })
    return { success: true }
  }

  if (action === 'update_stock') {
    const now = new Date().toISOString()
    await client.execute({
      sql: 'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
      args: [Math.max(0, Number(data.stock) || 0), now, data.id]
    })
    return { success: true }
  }

  if (action === 'seed_products') {
    for (const prod of (data.products || []) as Product[]) {
      const now = new Date().toISOString()
      await client.execute({
        sql: `
          INSERT INTO products (id, sku, name, category, price, original_price, cost_price, stock, rating, reviews_count, is_featured, badge, description, image, colors, tags, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `,
        args: [
          prod.id,
          prod.sku,
          prod.name,
          prod.category,
          Number(prod.price),
          prod.originalPrice != null ? Number(prod.originalPrice) : null,
          Number(prod.costPrice || 0),
          Number(prod.stock || 0),
          Number(prod.rating || 5.0),
          Number(prod.reviewsCount || 0),
          prod.isFeatured ? 1 : 0,
          prod.badge || null,
          prod.description || '',
          prod.image || '',
          JSON.stringify(prod.colors || []),
          JSON.stringify(prod.tags || []),
          now
        ]
      })
    }
    return { success: true }
  }

  if (action === 'fetch_categories') {
    const res = await client.execute('SELECT * FROM categories ORDER BY name ASC')
    const categories: Category[] = res.rows.map((row) => ({
      name: String(row.name),
      description: String(row.description || '')
    }))
    return { success: true, categories }
  }

  if (action === 'save_category') {
    await client.execute({
      sql: `INSERT INTO categories (name, description) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET description = excluded.description`,
      args: [data.name.trim(), data.description || '']
    })
    return { success: true, category: data }
  }

  if (action === 'delete_category') {
    await client.execute({ sql: 'DELETE FROM categories WHERE name = ?', args: [data.name] })
    return { success: true }
  }

  if (action === 'fetch_settings') {
    const res = await client.execute("SELECT value FROM settings WHERE key = 'store_settings'")
    if (res.rows.length > 0) {
      const settings: StoreSettings = JSON.parse(String(res.rows[0].value))
      return { success: true, settings }
    }
    return { success: true, settings: null }
  }

  if (action === 'save_settings') {
    const settingsData: StoreSettings = data
    const now = new Date().toISOString()
    await client.execute({
      sql: `
        INSERT INTO settings (key, value, updated_at) VALUES ('store_settings', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
      args: [JSON.stringify(settingsData), now]
    })
    return { success: true, settings: settingsData }
  }

  if (action === 'fetch_orders') {
    const res = await client.execute('SELECT * FROM orders ORDER BY timestamp DESC')
    const orders: OrderRecord[] = res.rows.map((row) => ({
      orderId: String(row.order_id),
      timestamp: String(row.timestamp || ''),
      customerName: String(row.customer_name || ''),
      customerPhone: String(row.customer_phone || ''),
      address: String(row.address || ''),
      paymentMethod: String(row.payment_method || ''),
      paymentId: row.payment_id ? String(row.payment_id) : undefined,
      items: row.items ? JSON.parse(String(row.items)) : [],
      totalAmount: Number(row.total_amount || 0),
      status: String(row.status || '')
    }))
    return { success: true, orders }
  }

  if (action === 'save_order') {
    const order: OrderRecord = data
    const now = new Date().toISOString()
    await client.execute({
      sql: `
        INSERT INTO orders (order_id, customer_name, customer_phone, address, payment_method, payment_id, items, total_amount, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET
          customer_name = excluded.customer_name,
          customer_phone = excluded.customer_phone,
          address = excluded.address,
          payment_method = excluded.payment_method,
          payment_id = excluded.payment_id,
          items = excluded.items,
          total_amount = excluded.total_amount,
          status = excluded.status,
          timestamp = excluded.timestamp
      `,
      args: [
        order.orderId,
        order.customerName,
        order.customerPhone || '',
        order.address || '',
        order.paymentMethod,
        order.paymentId || null,
        JSON.stringify(order.items || []),
        Number(order.totalAmount || 0),
        order.status,
        order.timestamp || now
      ]
    })
    return { success: true, order }
  }

  if (action === 'update_order_status') {
    await client.execute({
      sql: 'UPDATE orders SET status = ? WHERE order_id = ?',
      args: [data.status, data.orderId]
    })
    return { success: true }
  }

  if (action === 'fetch_ensembles') {
    const res = await client.execute('SELECT * FROM ensembles ORDER BY created_at DESC')
    const ensembles: LookbookEnsemble[] = res.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      subtitle: String(row.subtitle || ''),
      image: String(row.image || ''),
      productIds: row.product_ids ? JSON.parse(String(row.product_ids)) : [],
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || '')
    }))
    return { success: true, ensembles }
  }

  if (action === 'save_ensemble') {
    const ens: LookbookEnsemble = data
    const now = new Date().toISOString()
    await client.execute({
      sql: `
        INSERT INTO ensembles (id, title, subtitle, image, product_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title, subtitle = excluded.subtitle, image = excluded.image,
          product_ids = excluded.product_ids, updated_at = excluded.updated_at
      `,
      args: [
        ens.id,
        ens.title,
        ens.subtitle || '',
        ens.image || '',
        JSON.stringify(ens.productIds || []),
        now
      ]
    })
    return { success: true, ensemble: ens }
  }

  if (action === 'delete_ensemble') {
    await client.execute({ sql: 'DELETE FROM ensembles WHERE id = ?', args: [data.id] })
    return { success: true }
  }

  if (action === 'seed_ensembles') {
    for (const ens of (data.ensembles || []) as LookbookEnsemble[]) {
      const now = new Date().toISOString()
      await client.execute({
        sql: `
          INSERT INTO ensembles (id, title, subtitle, image, product_ids, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `,
        args: [
          ens.id,
          ens.title,
          ens.subtitle || '',
          ens.image || '',
          JSON.stringify(ens.productIds || []),
          now
        ]
      })
    }
    return { success: true }
  }

  /* ================= CUSTOMERS ================= */
  if (action === 'fetch_customers') {
    const res = await client.execute('SELECT * FROM customers ORDER BY created_at DESC')
    const customers: Customer[] = res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: row.email ? String(row.email) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      avatar: row.avatar ? String(row.avatar) : undefined,
      provider: String(row.provider) as 'google' | 'whatsapp',
      googleId: row.google_id ? String(row.google_id) : undefined,
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || '')
    }))
    return { success: true, customers }
  }

  if (action === 'login_customer_google') {
    const { googleId, name, email, avatar } = data
    const now = new Date().toISOString()
    let res = await client.execute({
      sql: 'SELECT * FROM customers WHERE google_id = ? LIMIT 1',
      args: [googleId]
    })
    if (res.rows.length === 0 && email) {
      res = await client.execute({
        sql: 'SELECT * FROM customers WHERE email = ? LIMIT 1',
        args: [email]
      })
    }
    let customer: Customer
    if (res.rows.length > 0) {
      const row = res.rows[0]
      await client.execute({
        sql: 'UPDATE customers SET name = ?, email = ?, avatar = ?, google_id = ?, provider = ?, updated_at = ? WHERE id = ?',
        args: [name, email || null, avatar || null, googleId, 'google', now, String(row.id)]
      })
      customer = {
        id: String(row.id),
        name,
        email,
        avatar,
        provider: 'google',
        googleId,
        createdAt: String(row.created_at || ''),
        updatedAt: now
      }
    } else {
      const id = 'cust_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
      await client.execute({
        sql: `INSERT INTO customers (id, name, email, avatar, provider, google_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'google', ?, ?, ?)`,
        args: [id, name, email || null, avatar || null, googleId, now, now]
      })
      customer = {
        id,
        name,
        email,
        avatar,
        provider: 'google',
        googleId,
        createdAt: now,
        updatedAt: now
      }
    }
    return { success: true, customer }
  }

  if (action === 'send_whatsapp_otp') {
    const { phone } = data
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const now = new Date().toISOString()
    const existing = await client.execute({
      sql: 'SELECT * FROM customers WHERE phone = ? LIMIT 1',
      args: [phone]
    })
    if (existing.rows.length > 0) {
      await client.execute({
        sql: 'UPDATE customers SET otp = ?, otp_expires = ?, updated_at = ? WHERE phone = ?',
        args: [otp, expires, now, phone]
      })
    } else {
      const id = 'cust_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
      await client.execute({
        sql: `INSERT INTO customers (id, name, phone, provider, otp, otp_expires, created_at, updated_at) VALUES (?, ?, ?, 'whatsapp', ?, ?, ?, ?)`,
        args: [id, phone, phone, otp, expires, now, now]
      })
    }
    // Send OTP to the customer's WhatsApp via WATI — do NOT return otp to frontend
    await sendOtpViaWati(phone, otp)
    return { success: true, otpSent: true }
  }

  if (action === 'verify_whatsapp_otp') {
    const { phone, otp } = data
    const now = new Date().toISOString()
    const res = await client.execute({
      sql: 'SELECT * FROM customers WHERE phone = ? LIMIT 1',
      args: [phone]
    })
    if (res.rows.length === 0) throw new Error('Phone number not found.')
    const row = res.rows[0]
    if (String(row.otp) !== String(otp)) throw new Error('Invalid OTP. Please check and try again.')
    if (row.otp_expires && new Date(String(row.otp_expires)) < new Date())
      throw new Error('OTP has expired.')
    await client.execute({
      sql: 'UPDATE customers SET otp = NULL, otp_expires = NULL, updated_at = ? WHERE phone = ?',
      args: [now, phone]
    })
    const customer: Customer = {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone || ''),
      provider: 'whatsapp',
      createdAt: String(row.created_at || ''),
      updatedAt: now
    }
    return { success: true, verified: true, customer }
  }

  throw new Error(`Unknown action: ${action}`)
}

export async function initDatabase(): Promise<boolean> {
  try {
    await callApi('init')
    console.log('[Turso] Database initialized via Vercel Serverless API')
    return true
  } catch (err) {
    console.warn(
      '[Turso] Vercel API / DB not available. Operating in local storage fallback mode.',
      err
    )
    return false
  }
}

/* ================= TOKENS ================= */
export async function fetchTokensFromDB(): Promise<TokenItem[] | null> {
  const res = await callApi('fetch_tokens')
  return res.tokens || null
}

export async function saveTokenToDB(token: TokenItem): Promise<TokenItem> {
  const res = await callApi('save_token', token)
  return res.token!
}

export async function deleteTokenFromDB(id: string): Promise<boolean> {
  await callApi('delete_token', { id })
  return true
}

export async function toggleTokenStatusInDB(id: string, isActive: boolean): Promise<boolean> {
  await callApi('toggle_token', { id, isActive })
  return true
}

/* ================= PRODUCTS & INVENTORY ================= */
export async function fetchProductsFromDB(): Promise<Product[] | null> {
  const res = await callApi('fetch_products')
  return res.products || null
}

export async function saveProductToDB(product: Product): Promise<Product> {
  const res = await callApi('save_product', product)
  return res.product!
}

export async function deleteProductFromDB(id: string): Promise<boolean> {
  await callApi('delete_product', { id })
  return true
}

export async function updateStockInDB(id: string, newStock: number): Promise<boolean> {
  await callApi('update_stock', { id, stock: newStock })
  return true
}

export async function seedProductsToDB(productsList: Product[]): Promise<void> {
  await callApi('seed_products', { products: productsList })
}

/* ================= CATEGORIES ================= */
export async function fetchCategoriesFromDB(): Promise<Category[] | null> {
  const res = await callApi('fetch_categories')
  return res.categories || null
}

export async function saveCategoryToDB(category: Category): Promise<Category> {
  const res = await callApi('save_category', category)
  return res.category!
}

export async function deleteCategoryFromDB(name: string): Promise<boolean> {
  await callApi('delete_category', { name })
  return true
}

export async function seedCategoriesToDB(categoriesList: Category[]): Promise<void> {
  for (const cat of categoriesList) {
    await saveCategoryToDB(cat)
  }
}

/* ================= STORE SETTINGS ================= */
export async function fetchSettingsFromDB(): Promise<StoreSettings | null> {
  const res = await callApi('fetch_settings')
  return res.settings || null
}

export async function saveSettingsToDB(settings: StoreSettings): Promise<StoreSettings> {
  const res = await callApi('save_settings', settings)
  return res.settings!
}

/* ================= ORDERS & CART HISTORY ================= */
export async function fetchOrdersFromDB(): Promise<OrderRecord[] | null> {
  const res = await callApi('fetch_orders')
  return res.orders || null
}

export async function saveOrderToDB(order: OrderRecord): Promise<OrderRecord> {
  const res = await callApi('save_order', order)
  return res.order!
}

export async function updateOrderStatusInDB(orderId: string, newStatus: string): Promise<boolean> {
  await callApi('update_order_status', { orderId, status: newStatus })
  return true
}

/* ================= ENSEMBLES ================= */
export async function fetchEnsemblesFromDB(): Promise<LookbookEnsemble[] | null> {
  const res = await callApi('fetch_ensembles')
  return res.ensembles || null
}

export async function saveEnsembleToDB(ensemble: LookbookEnsemble): Promise<LookbookEnsemble> {
  const res = await callApi('save_ensemble', ensemble)
  return res.ensemble!
}

export async function deleteEnsembleFromDB(id: string): Promise<boolean> {
  await callApi('delete_ensemble', { id })
  return true
}

export async function seedEnsemblesToDB(ensemblesList: LookbookEnsemble[]): Promise<void> {
  await callApi('seed_ensembles', { ensembles: ensemblesList })
}

/* ================= CUSTOMERS & AUTH ================= */
export async function fetchCustomersFromDB(): Promise<Customer[] | null> {
  const res = await callApi('fetch_customers')
  return res.customers || null
}

export async function loginCustomerWithGoogle(
  googleId: string,
  name: string,
  email?: string,
  avatar?: string
): Promise<Customer> {
  const res = await callApi('login_customer_google', { googleId, name, email, avatar })
  return res.customer!
}

export async function sendWhatsAppOtp(phone: string): Promise<void> {
  await callApi('send_whatsapp_otp', { phone })
}

export async function verifyWhatsAppOtp(phone: string, otp: string): Promise<Customer> {
  const res = await callApi('verify_whatsapp_otp', { phone, otp })
  return res.customer!
}
