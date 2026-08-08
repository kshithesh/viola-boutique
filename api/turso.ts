import { createClient, type Client } from '@libsql/client'
import type { Product, Category, TokenItem, StoreSettings, OrderRecord, LookbookEnsemble, Customer } from '../src/types'

let clientInstance: Client | null = null

function getClient(): Client | null {
  if (clientInstance) return clientInstance

  const url = process.env.TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || ''

  if (!url || !authToken) {
    return null
  }

  let httpUrl = url
  if (httpUrl.startsWith('libsql://')) {
    httpUrl = httpUrl.replace('libsql://', 'https://')
  }

  clientInstance = createClient({
    url: httpUrl,
    authToken: authToken
  })

  return clientInstance
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const client = getClient()

  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'Turso DB credentials not configured in Vercel Environment Variables.'
    })
  }

  try {
    const { action, data } = req.body || {}

    if (req.method === 'GET' || action === 'status') {
      return res.status(200).json({ success: true, status: 'connected', serverTime: new Date().toISOString() })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    if (action === 'init') {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS tokens (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          token_value TEXT NOT NULL,
          token_type TEXT DEFAULT 'api',
          is_active INTEGER DEFAULT 1,
          metadata TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price REAL NOT NULL,
          original_price REAL,
          cost_price REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          rating REAL DEFAULT 5.0,
          reviews_count INTEGER DEFAULT 0,
          is_featured INTEGER DEFAULT 0,
          badge TEXT,
          description TEXT,
          image TEXT,
          colors TEXT,
          tags TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          name TEXT PRIMARY KEY,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          order_id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          address TEXT,
          payment_method TEXT NOT NULL,
          payment_id TEXT,
          items TEXT NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT NOT NULL,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS ensembles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          subtitle TEXT,
          image TEXT,
          product_ids TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          avatar TEXT,
          provider TEXT NOT NULL,
          google_id TEXT,
          otp TEXT,
          otp_expires TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `)
      return res.status(200).json({ success: true, message: 'Database tables initialized' })
    }

    if (action === 'fetch_tokens') {
      const result = await client.execute('SELECT * FROM tokens ORDER BY created_at DESC')
      const tokens: TokenItem[] = result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        tokenValue: String(row.token_value),
        tokenType: String(row.token_type),
        isActive: Boolean(row.is_active),
        metadata: row.metadata ? JSON.parse(String(row.metadata)) : null,
        createdAt: String(row.created_at || ''),
        updatedAt: String(row.updated_at || '')
      }))
      return res.status(200).json({ success: true, tokens })
    }

    if (action === 'save_token') {
      const token: TokenItem = data
      const id = token.id || 'tok_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
      const now = new Date().toISOString()
      await client.execute({
        sql: `
          INSERT INTO tokens (id, name, token_value, token_type, is_active, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            token_value = excluded.token_value,
            token_type = excluded.token_type,
            is_active = excluded.is_active,
            metadata = excluded.metadata,
            updated_at = excluded.updated_at
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
      return res.status(200).json({ success: true, token: { ...token, id, updatedAt: now } })
    }

    if (action === 'delete_token') {
      await client.execute({ sql: 'DELETE FROM tokens WHERE id = ?', args: [data.id] })
      return res.status(200).json({ success: true })
    }

    if (action === 'toggle_token') {
      const now = new Date().toISOString()
      await client.execute({
        sql: 'UPDATE tokens SET is_active = ?, updated_at = ? WHERE id = ?',
        args: [data.isActive ? 1 : 0, now, data.id]
      })
      return res.status(200).json({ success: true })
    }

    if (action === 'fetch_products') {
      const result = await client.execute('SELECT * FROM products ORDER BY created_at DESC')
      const products: Product[] = result.rows.map(row => ({
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
      return res.status(200).json({ success: true, products })
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
            sku = excluded.sku,
            name = excluded.name,
            category = excluded.category,
            price = excluded.price,
            original_price = excluded.original_price,
            cost_price = excluded.cost_price,
            stock = excluded.stock,
            rating = excluded.rating,
            reviews_count = excluded.reviews_count,
            is_featured = excluded.is_featured,
            badge = excluded.badge,
            description = excluded.description,
            image = excluded.image,
            colors = excluded.colors,
            tags = excluded.tags,
            updated_at = excluded.updated_at
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
      return res.status(200).json({ success: true, product: prod })
    }

    if (action === 'delete_product') {
      await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [data.id] })
      return res.status(200).json({ success: true })
    }

    if (action === 'update_stock') {
      const now = new Date().toISOString()
      await client.execute({
        sql: 'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
        args: [Math.max(0, Number(data.stock) || 0), now, data.id]
      })
      return res.status(200).json({ success: true })
    }

    if (action === 'seed_products') {
      for (const prod of (data.products || []) as Product[]) {
        const now = new Date().toISOString()
        await client.execute({
          sql: `
            INSERT INTO products (
              id, sku, name, category, price, original_price, cost_price, stock,
              rating, reviews_count, is_featured, badge, description, image, colors, tags, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING
          `,
          args: [
            prod.id, prod.sku, prod.name, prod.category, Number(prod.price),
            prod.originalPrice != null ? Number(prod.originalPrice) : null,
            Number(prod.costPrice || 0), Number(prod.stock || 0), Number(prod.rating || 5.0),
            Number(prod.reviewsCount || 0), prod.isFeatured ? 1 : 0, prod.badge || null,
            prod.description || '', prod.image || '', JSON.stringify(prod.colors || []),
            JSON.stringify(prod.tags || []), now
          ]
        })
      }
      return res.status(200).json({ success: true })
    }

    if (action === 'fetch_categories') {
      const result = await client.execute('SELECT * FROM categories ORDER BY name ASC')
      const categories: Category[] = result.rows.map(row => ({
        name: String(row.name),
        description: String(row.description || '')
      }))
      return res.status(200).json({ success: true, categories })
    }

    if (action === 'save_category') {
      const cat: Category = data
      await client.execute({
        sql: `
          INSERT INTO categories (name, description) VALUES (?, ?)
          ON CONFLICT(name) DO UPDATE SET description = excluded.description
        `,
        args: [cat.name.trim(), cat.description || '']
      })
      return res.status(200).json({ success: true, category: cat })
    }

    if (action === 'delete_category') {
      await client.execute({ sql: 'DELETE FROM categories WHERE name = ?', args: [data.name] })
      return res.status(200).json({ success: true })
    }

    if (action === 'fetch_settings') {
      const result = await client.execute("SELECT value FROM settings WHERE key = 'store_settings'")
      if (result.rows.length > 0) {
        const settings: StoreSettings = JSON.parse(String(result.rows[0].value))
        return res.status(200).json({ success: true, settings })
      }
      return res.status(200).json({ success: true, settings: null })
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
      return res.status(200).json({ success: true, settings: settingsData })
    }

    if (action === 'fetch_orders') {
      const result = await client.execute('SELECT * FROM orders ORDER BY timestamp DESC')
      const orders: OrderRecord[] = result.rows.map(row => ({
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
      return res.status(200).json({ success: true, orders })
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
      return res.status(200).json({ success: true, order })
    }

    if (action === 'update_order_status') {
      await client.execute({
        sql: 'UPDATE orders SET status = ? WHERE order_id = ?',
        args: [data.status, data.orderId]
      })
      return res.status(200).json({ success: true })
    }

    if (action === 'fetch_ensembles') {
      const result = await client.execute('SELECT * FROM ensembles ORDER BY created_at DESC')
      const ensembles: LookbookEnsemble[] = result.rows.map(row => ({
        id: String(row.id),
        title: String(row.title),
        subtitle: String(row.subtitle || ''),
        image: String(row.image || ''),
        productIds: row.product_ids ? JSON.parse(String(row.product_ids)) : [],
        createdAt: String(row.created_at || ''),
        updatedAt: String(row.updated_at || '')
      }))
      return res.status(200).json({ success: true, ensembles })
    }

    if (action === 'save_ensemble') {
      const ens: LookbookEnsemble = data
      const now = new Date().toISOString()
      await client.execute({
        sql: `
          INSERT INTO ensembles (id, title, subtitle, image, product_ids, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            subtitle = excluded.subtitle,
            image = excluded.image,
            product_ids = excluded.product_ids,
            updated_at = excluded.updated_at
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
      return res.status(200).json({ success: true, ensemble: ens })
    }

    if (action === 'delete_ensemble') {
      await client.execute({ sql: 'DELETE FROM ensembles WHERE id = ?', args: [data.id] })
      return res.status(200).json({ success: true })
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
      return res.status(200).json({ success: true })
    }

    if (action === 'fetch_customers') {
      const result = await client.execute('SELECT * FROM customers ORDER BY created_at DESC')
      const customers: Customer[] = result.rows.map(row => ({
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
      return res.status(200).json({ success: true, customers })
    }

    if (action === 'login_customer_google') {
      const { googleId, name, email, avatar } = data
      const now = new Date().toISOString()
      // Look up existing customer by googleId or email
      let result = await client.execute({
        sql: 'SELECT * FROM customers WHERE google_id = ? LIMIT 1',
        args: [googleId]
      })
      if (result.rows.length === 0 && email) {
        result = await client.execute({
          sql: 'SELECT * FROM customers WHERE email = ? LIMIT 1',
          args: [email]
        })
      }
      let customer: Customer
      if (result.rows.length > 0) {
        const row = result.rows[0]
        // Update existing customer with latest Google data
        await client.execute({
          sql: 'UPDATE customers SET name = ?, email = ?, avatar = ?, google_id = ?, provider = ?, updated_at = ? WHERE id = ?',
          args: [name, email || null, avatar || null, googleId, 'google', now, String(row.id)]
        })
        customer = {
          id: String(row.id), name, email, avatar, provider: 'google',
          googleId, createdAt: String(row.created_at || ''), updatedAt: now
        }
      } else {
        const id = 'cust_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
        await client.execute({
          sql: `INSERT INTO customers (id, name, email, avatar, provider, google_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'google', ?, ?, ?)`,
          args: [id, name, email || null, avatar || null, googleId, now, now]
        })
        customer = { id, name, email, avatar, provider: 'google', googleId, createdAt: now, updatedAt: now }
      }
      return res.status(200).json({ success: true, customer })
    }

    if (action === 'send_whatsapp_otp') {
      const { phone } = data
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
      const now = new Date().toISOString()
      // Check if customer with this phone already exists
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
          sql: `INSERT INTO customers (id, name, phone, provider, otp, otp_expires, created_at, updated_at)
                VALUES (?, ?, ?, 'whatsapp', ?, ?, ?, ?)`,
          args: [id, phone, phone, otp, expires, now, now]
        })
      }
      return res.status(200).json({ success: true, otpSent: true, otp })
    }

    if (action === 'verify_whatsapp_otp') {
      const { phone, otp } = data
      const now = new Date().toISOString()
      const result = await client.execute({
        sql: 'SELECT * FROM customers WHERE phone = ? LIMIT 1',
        args: [phone]
      })
      if (result.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Phone number not found.' })
      }
      const row = result.rows[0]
      if (String(row.otp) !== String(otp)) {
        return res.status(400).json({ success: false, error: 'Invalid OTP. Please check and try again.' })
      }
      if (row.otp_expires && new Date(String(row.otp_expires)) < new Date()) {
        return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' })
      }
      // Clear OTP after successful verification
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
      return res.status(200).json({ success: true, verified: true, customer })
    }

    if (action === 'update_customer') {
      const { id, name, phone } = data
      const now = new Date().toISOString()
      await client.execute({
        sql: 'UPDATE customers SET name = ?, phone = ?, updated_at = ? WHERE id = ?',
        args: [name, phone || null, now, id]
      })
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ success: false, error: `Unknown action: ${action}` })
  } catch (error: any) {
    console.error('[API Turso Error]:', error)
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
}
