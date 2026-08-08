import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Product, CartItem, OrderRecord } from '../types'
export type { OrderRecord }
import { useSettingsStore } from './settingsStore'
import { useCatalogStore } from './catalogStore'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  isTursoConfigured,
  initDatabase,
  fetchOrdersFromDB,
  saveOrderToDB,
  updateOrderStatusInDB
} from '../services/tursoService'

export interface CustomerFormData {
  customerName: string
  customerPhone: string
  deliveryAddress: string
  paymentMethod: string
  notes: string
}

export const useCartStore = defineStore('cart', () => {
  const LOCAL_STORAGE_CART = 'viora_cart_items_v1'
  const LOCAL_STORAGE_ORDERS = 'viora_orders_history_v1'

  const cartItems = ref<CartItem[]>(loadCart())
  const isCartOpen = ref<boolean>(false)
  const orders = ref<OrderRecord[]>(loadOrders())

  const customerForm = ref<CustomerFormData>({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentMethod: '',
    notes: ''
  })

  const isDbConnected = ref<boolean>(false)

  function loadCart(): CartItem[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_CART)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  function loadOrders(): OrderRecord[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_ORDERS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  async function initOrders(): Promise<void> {
    if (!isTursoConfigured()) {
      isDbConnected.value = false
      return
    }
    try {
      await initDatabase()
      const dbOrders = await fetchOrdersFromDB()
      if (dbOrders !== null) {
        orders.value = dbOrders
        isDbConnected.value = true
      }
    } catch (err) {
      console.warn('[Turso] Could not fetch orders from DB, using local storage mode.', err)
      isDbConnected.value = false
    }
  }

  initOrders()

  watch(
    cartItems,
    (newCart) => {
      try {
        safeLocalStorage.setItem(LOCAL_STORAGE_CART, JSON.stringify(newCart))
      } catch (e) {
        console.error('Failed to save cart to localStorage', e)
      }
    },
    { deep: true }
  )

  watch(
    orders,
    (newOrders) => {
      try {
        safeLocalStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(newOrders))
      } catch (e) {
        console.error('Failed to save orders to localStorage', e)
      }
    },
    { deep: true }
  )

  const cartTotalItems = computed<number>(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const cartSubtotal = computed<number>(() => {
    return cartItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  })

  const shippingFee = computed<number>(() => {
    const settingsStore = useSettingsStore()
    if (
      cartSubtotal.value >= settingsStore.settings.freeShippingThreshold ||
      cartItems.value.length === 0
    ) {
      return 0
    }
    return settingsStore.settings.deliveryFee
  })

  const taxAmount = computed<number>(() => {
    const settingsStore = useSettingsStore()
    return cartSubtotal.value * settingsStore.settings.taxRate
  })

  const grandTotal = computed<number>(() => {
    return cartSubtotal.value + shippingFee.value + taxAmount.value
  })

  function toggleCart(openState?: boolean): void {
    if (openState !== undefined) {
      isCartOpen.value = openState
    } else {
      isCartOpen.value = !isCartOpen.value
    }
  }

  function addToCart(product: Product, quantity = 1, selectedColor: string | null = null): void {
    const color =
      selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : 'Default')
    const existingIndex = cartItems.value.findIndex(
      (item) => item.product.id === product.id && item.selectedColor === color
    )

    if (existingIndex !== -1) {
      const newQty = cartItems.value[existingIndex].quantity + quantity
      cartItems.value[existingIndex].quantity = Math.min(newQty, product.stock)
    } else {
      cartItems.value.push({
        product,
        quantity: Math.min(quantity, product.stock),
        selectedColor: color
      })
    }
    isCartOpen.value = true
  }

  function updateQuantity(index: number, newQty: number): void {
    if (index >= 0 && index < cartItems.value.length) {
      if (newQty <= 0) {
        removeFromCart(index)
      } else {
        const maxStock = cartItems.value[index].product.stock
        cartItems.value[index].quantity = Math.min(newQty, maxStock)
      }
    }
  }

  function removeFromCart(index: number): void {
    if (index >= 0 && index < cartItems.value.length) {
      cartItems.value.splice(index, 1)
    }
  }

  function clearCart(): void {
    cartItems.value = []
  }

  function checkoutViaWhatsApp(): string | null {
    const settingsStore = useSettingsStore()
    const catalogStore = useCatalogStore()

    if (cartItems.value.length === 0) return null

    const orderId = 'VIO-' + Math.floor(1000 + Math.random() * 9000)
    const currency = settingsStore.settings.currency
    const storeName = settingsStore.settings.storeName
    const isWhatsAppActive = settingsStore.settings.enableWhatsApp !== false

    let message = `🛍️ *NEW ORDER FROM ${storeName.toUpperCase()}*\n`
    message += `🆔 *Order Ref:* #${orderId}\n`
    message += `----------------------------------\n`
    message += `👤 *Customer Info:*\n`
    message += `• *Name:* ${customerForm.value.customerName || 'Valued Customer'}\n`
    if (customerForm.value.customerPhone) {
      message += `• *Phone:* ${customerForm.value.customerPhone}\n`
    }
    message += `• *Address:* ${customerForm.value.deliveryAddress || 'Pick-up / Unspecified'}\n`
    message += `• *Payment:* ${customerForm.value.paymentMethod}\n\n`

    message += `📦 *Order Items:*\n`
    cartItems.value.forEach((item, i) => {
      const itemSubtotal = (item.product.price * item.quantity).toFixed(2)
      message += `${i + 1}. *${item.product.name}* (x${item.quantity})\n`
      message += `   └ Color: ${item.selectedColor} | Price: ${currency}${itemSubtotal}\n`
    })

    message += `----------------------------------\n`
    message += `💵 *Subtotal:* ${currency}${cartSubtotal.value.toFixed(2)}\n`
    message += `🚚 *Shipping:* ${shippingFee.value === 0 ? 'FREE' : currency + shippingFee.value.toFixed(2)}\n`
    message += `🏷️ *Tax:* ${currency}${taxAmount.value.toFixed(2)}\n`
    message += `💰 *TOTAL AMOUNT:* *${currency}${grandTotal.value.toFixed(2)}*\n`

    if (customerForm.value.notes?.trim()) {
      message += `----------------------------------\n`
      message += `📝 *Notes:* ${customerForm.value.notes.trim()}\n`
    }

    message += `----------------------------------\n`
    message += `Please confirm my order. Thank you!`

    const targetPhone = settingsStore.settings.whatsappNumber.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`

    const newOrderRecord: OrderRecord = {
      orderId,
      timestamp: new Date().toISOString(),
      customerName: customerForm.value.customerName || 'Valued Customer',
      customerPhone: customerForm.value.customerPhone || 'N/A',
      address: customerForm.value.deliveryAddress || 'N/A',
      paymentMethod: customerForm.value.paymentMethod,
      items: [...cartItems.value],
      totalAmount: grandTotal.value,
      status: isWhatsAppActive ? 'Pending Contact' : 'Confirmed'
    }

    orders.value.unshift(newOrderRecord)
    if (isTursoConfigured()) {
      saveOrderToDB(newOrderRecord).catch((err) =>
        console.error('Failed to sync new order to Turso DB', err)
      )
    }
    catalogStore.decrementStockBatch(cartItems.value)
    clearCart()
    isCartOpen.value = false

    return isWhatsAppActive ? whatsappUrl : null
  }

  function processRazorpayPayment(callbacks: {
    onSuccess?: (data: any) => void
    onError?: (err: string) => void
  }): void {
    const settingsStore = useSettingsStore()
    const catalogStore = useCatalogStore()

    if (cartItems.value.length === 0) {
      if (callbacks.onError) callbacks.onError('Your cart is empty.')
      return
    }

    if (typeof (window as any).Razorpay !== 'function') {
      if (callbacks.onError)
        callbacks.onError('Razorpay SDK unavailable. Please check your network connection.')
      return
    }

    const orderId = 'VIO-RZP-' + Math.floor(1000 + Math.random() * 9000)
    const amountInPaise = Math.round(grandTotal.value * 100)

    const options = {
      key: settingsStore.settings.razorpayKeyId || 'rzp_test_VioraBoutique2026',
      amount: amountInPaise,
      currency: 'INR',
      name: settingsStore.settings.storeName || 'Viora Boutique',
      description: `Order #${orderId} (${cartTotalItems.value} items)`,
      prefill: {
        name: customerForm.value.customerName || '',
        contact: customerForm.value.customerPhone || ''
      },
      theme: {
        color: '#b45309'
      },
      handler: function (response: any) {
        const paymentId =
          response.razorpay_payment_id || 'pay_' + Math.random().toString(36).substring(2, 10)
        const currency = settingsStore.settings.currency
        const storeName = settingsStore.settings.storeName

        const newOrderRecord: OrderRecord = {
          orderId,
          timestamp: new Date().toISOString(),
          customerName: customerForm.value.customerName || 'Valued Customer',
          customerPhone: customerForm.value.customerPhone || 'N/A',
          address: customerForm.value.deliveryAddress || 'N/A',
          paymentMethod: 'Razorpay Online (UPI/Cards)',
          paymentId: paymentId,
          items: [...cartItems.value],
          totalAmount: grandTotal.value,
          status: 'Paid via Razorpay'
        }

        orders.value.unshift(newOrderRecord)
        if (isTursoConfigured()) {
          saveOrderToDB(newOrderRecord).catch((err) =>
            console.error('Failed to sync new Razorpay order to Turso DB', err)
          )
        }

        let message = `✅ *PAID ONLINE VIA RAZORPAY — ${storeName.toUpperCase()}*\n`
        message += `🆔 *Order Ref:* #${orderId}\n`
        message += `💳 *Razorpay Payment ID:* ${paymentId}\n`
        message += `----------------------------------\n`
        message += `👤 *Customer Info:*\n`
        message += `• *Name:* ${customerForm.value.customerName || 'Valued Customer'}\n`
        if (customerForm.value.customerPhone) {
          message += `• *Phone:* ${customerForm.value.customerPhone}\n`
        }
        message += `• *Address:* ${customerForm.value.deliveryAddress || 'Pick-up / Unspecified'}\n`
        message += `• *Payment:* Razorpay Online (Verified Paid)\n\n`

        message += `📦 *Paid Order Items:*\n`
        cartItems.value.forEach((item, i) => {
          const itemSubtotal = (item.product.price * item.quantity).toFixed(2)
          message += `${i + 1}. *${item.product.name}* (x${item.quantity})\n`
          message += `   └ Color: ${item.selectedColor} | Price: ${currency}${itemSubtotal}\n`
        })

        message += `----------------------------------\n`
        message += `💵 *Subtotal:* ${currency}${cartSubtotal.value.toFixed(2)}\n`
        message += `🚚 *Shipping:* ${shippingFee.value === 0 ? 'FREE' : currency + shippingFee.value.toFixed(2)}\n`
        message += `🏷️ *Tax:* ${currency}${taxAmount.value.toFixed(2)}\n`
        message += `💰 *TOTAL PAID:* *${currency}${grandTotal.value.toFixed(2)}*\n`
        message += `----------------------------------\n`
        message += `Payment verified via Razorpay. Please dispatch my order!`

        const targetPhone = settingsStore.settings.whatsappNumber.replace(/\D/g, '')
        const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`

        catalogStore.decrementStockBatch(cartItems.value)
        clearCart()
        isCartOpen.value = false

        if (callbacks.onSuccess)
          callbacks.onSuccess({ orderId, paymentId, newOrderRecord, whatsappUrl })
      },
      modal: {
        ondismiss: function () {
          if (callbacks.onError) callbacks.onError('Payment modal closed.')
        }
      }
    }

    try {
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        if (callbacks.onError) callbacks.onError(resp.error?.description || 'Payment failed.')
      })
      rzp.open()
    } catch (e) {
      console.error('Failed to launch Razorpay checkout modal', e)
      if (callbacks.onError)
        callbacks.onError('Unable to open Razorpay payment window. Please check your Key ID.')
    }
  }

  function updateOrderStatus(orderId: string, newStatus: string): void {
    const ord = orders.value.find((o) => o.orderId === orderId)
    if (ord) {
      ord.status = newStatus
      if (isTursoConfigured()) {
        updateOrderStatusInDB(orderId, newStatus).catch((err) =>
          console.error('Failed to sync order status update to Turso DB', err)
        )
      }
    }
  }

  return {
    cartItems,
    isCartOpen,
    customerForm,
    orders,
    isDbConnected,
    cartTotalItems,
    cartSubtotal,
    shippingFee,
    taxAmount,
    grandTotal,
    toggleCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkoutViaWhatsApp,
    processRazorpayPayment,
    updateOrderStatus,
    initOrders
  }
})
