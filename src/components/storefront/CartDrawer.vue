<script setup>
import { ref } from 'vue'
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MessageSquare, 
  ShoppingBag, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  FileText,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-vue-next'
import { useCartStore } from '../../stores/cartStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const emit = defineEmits(['notify'])
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const formErrors = ref({})
const isProcessingPayment = ref(false)

function validateForm() {
  formErrors.value = {}

  if (!cartStore.customerForm.customerName.trim()) {
    formErrors.value.customerName = 'Please enter your full name'
  }
  if (!cartStore.customerForm.deliveryAddress.trim()) {
    formErrors.value.deliveryAddress = 'Please enter your delivery address'
  }

  return Object.keys(formErrors.value).length === 0
}

function validateAndCheckout() {
  if (!validateForm()) {
    emit('notify', 'Please fill out required customer fields before placing order.', 'error')
    return
  }

  const whatsappUrl = cartStore.checkoutViaWhatsApp()
  if (whatsappUrl) {
    emit('notify', 'Order placed! Redirecting to WhatsApp...', 'success')
    window.open(whatsappUrl, '_blank')
  }
}

function handleRazorpayCheckout() {
  if (!validateForm()) {
    emit('notify', 'Please enter your name and delivery address before paying.', 'error')
    return
  }

  isProcessingPayment.value = true
  cartStore.processRazorpayPayment({
    onSuccess: ({ orderId, paymentId }) => {
      isProcessingPayment.value = false
      emit('notify', `🎉 Payment successful! Ref #${orderId} (Payment ID: ${paymentId})`, 'success')
    },
    onError: (errMsg) => {
      isProcessingPayment.value = false
      if (errMsg !== 'Payment modal closed.') {
        emit('notify', errMsg, 'error')
      }
    }
  })
}
</script>

<template>
  <div v-if="cartStore.isCartOpen" class="modal-overlay" @click.self="cartStore.toggleCart(false)">
    <div class="cart-drawer glass-panel animate-slide-right">
      <!-- Drawer Header -->
      <div class="drawer-header">
        <div class="header-title-box">
          <ShoppingBag :size="20" class="header-icon" />
          <h3>Shopping Cart</h3>
          <span class="items-count-badge">{{ cartStore.cartTotalItems }} Items</span>
        </div>
        <button class="close-drawer-btn" @click="cartStore.toggleCart(false)">
          <X :size="20" />
        </button>
      </div>

      <!-- Drawer Content -->
      <div v-if="cartStore.cartItems.length > 0" class="drawer-body">
        <!-- Cart Items List -->
        <div class="cart-items-section">
          <div 
            v-for="(item, index) in cartStore.cartItems" 
            :key="`${item.product.id}-${item.selectedColor}`"
            class="cart-item-row"
          >
            <img :src="item.product.image" :alt="item.product.name" class="item-thumbnail" />

            <div class="item-details">
              <span class="item-name">{{ item.product.name }}</span>
              <span class="item-variant">Color: {{ item.selectedColor }}</span>
              <span class="item-price">{{ settingsStore.formatPrice(item.product.price) }}</span>
            </div>

            <!-- Quantity & Delete -->
            <div class="item-actions">
              <div class="mini-qty-controls">
                <button 
                  class="mini-qty-btn"
                  @click="cartStore.updateQuantity(index, item.quantity - 1)"
                >
                  <Minus :size="12" />
                </button>
                <span class="mini-qty">{{ item.quantity }}</span>
                <button 
                  class="mini-qty-btn"
                  :disabled="item.quantity >= item.product.stock"
                  @click="cartStore.updateQuantity(index, item.quantity + 1)"
                >
                  <Plus :size="12" />
                </button>
              </div>

              <button 
                class="delete-item-btn" 
                @click="cartStore.removeFromCart(index)"
                title="Remove item"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <div class="clear-cart-row">
            <button class="text-btn" @click="cartStore.clearCart">
              Clear all items
            </button>
          </div>
        </div>

        <!-- Customer Checkout Form -->
        <div class="checkout-form-section">
          <h4 class="form-title">
            <User :size="16" /> Delivery & Customer Details
          </h4>

          <div class="form-group">
            <label class="input-label">Full Name *</label>
            <div class="input-with-icon">
              <User :size="16" class="input-icon" />
              <input 
                type="text" 
                v-model="cartStore.customerForm.customerName" 
                placeholder="e.g. Jane Doe"
                class="input-field pl-icon"
                :class="{ 'input-error': formErrors.customerName }"
              />
            </div>
            <span v-if="formErrors.customerName" class="error-msg">{{ formErrors.customerName }}</span>
          </div>

          <div class="form-group">
            <label class="input-label">Phone / WhatsApp Number</label>
            <div class="input-with-icon">
              <Phone :size="16" class="input-icon" />
              <input 
                type="tel" 
                v-model="cartStore.customerForm.customerPhone" 
                placeholder="e.g. +1 234 567 8900"
                class="input-field pl-icon"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="input-label">Delivery Address *</label>
            <div class="input-with-icon">
              <MapPin :size="16" class="input-icon" />
              <input 
                type="text" 
                v-model="cartStore.customerForm.deliveryAddress" 
                placeholder="Street address, City, Zip"
                class="input-field pl-icon"
                :class="{ 'input-error': formErrors.deliveryAddress }"
              />
            </div>
            <span v-if="formErrors.deliveryAddress" class="error-msg">{{ formErrors.deliveryAddress }}</span>
          </div>

          <div class="form-group">
            <label class="input-label">Payment Method</label>
            <div class="input-with-icon">
              <CreditCard :size="16" class="input-icon" />
              <select v-model="cartStore.customerForm.paymentMethod" class="input-field pl-icon">
                <option value="Razorpay Online (UPI/Cards)" v-if="settingsStore.settings.enableRazorpay">⚡ Razorpay Online (UPI / Card / NetBanking)</option>
                <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                <option value="UPI / Instant Bank Transfer">UPI / Direct Bank Transfer</option>
                <option value="Card on Delivery">Card / POS on Delivery</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="input-label">Order Notes / Instructions</label>
            <div class="input-with-icon">
              <FileText :size="16" class="input-icon" />
              <input 
                type="text" 
                v-model="cartStore.customerForm.notes" 
                placeholder="Special delivery instructions..."
                class="input-field pl-icon"
              />
            </div>
          </div>
        </div>

        <!-- Order Summary & Checkout Actions -->
        <div class="order-summary-section">
          <div class="summary-line">
            <span>Subtotal</span>
            <span>{{ settingsStore.formatPrice(cartStore.cartSubtotal) }}</span>
          </div>

          <div class="summary-line">
            <span>Shipping Fee</span>
            <span v-if="cartStore.shippingFee === 0" class="free-shipping-text">FREE</span>
            <span v-else>{{ settingsStore.formatPrice(cartStore.shippingFee) }}</span>
          </div>

          <div class="summary-line">
            <span>Tax ({{ (settingsStore.settings.taxRate * 100).toFixed(0) }}%)</span>
            <span>{{ settingsStore.formatPrice(cartStore.taxAmount) }}</span>
          </div>

          <div class="summary-line grand-total-line">
            <span>Total Payable</span>
            <span class="total-price">{{ settingsStore.formatPrice(cartStore.grandTotal) }}</span>
          </div>

          <div class="checkout-actions-grid mt-3">
            <button 
              v-if="settingsStore.settings.enableRazorpay" 
              class="btn btn-primary checkout-btn razorpay-btn" 
              @click="handleRazorpayCheckout"
              :disabled="isProcessingPayment"
            >
              <Zap :size="18" /> Pay Online via Razorpay
            </button>

            <button class="btn btn-whatsapp checkout-btn" @click="validateAndCheckout">
              <MessageSquare :size="18" /> Order via WhatsApp / COD
            </button>
          </div>
          
          <p class="whatsapp-hint mt-2">
            <ShieldCheck :size="13" /> 256-bit encrypted Razorpay SSL payments & WhatsApp concierge checkout.
          </p>
        </div>
      </div>

      <!-- Empty Cart View -->
      <div v-else class="empty-cart-body">
        <div class="empty-cart-icon">
          <ShoppingBag :size="48" />
        </div>
        <h4>Your Cart is Empty</h4>
        <p>Explore our catalog and add items to place your WhatsApp order.</p>
        <button class="btn btn-primary mt-3" @click="cartStore.toggleCart(false)">
          Browse Products
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-color);
  z-index: 150;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.animate-slide-right {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--accent-primary);
}

.header-title-box h3 {
  font-size: 1.2rem;
  font-weight: 800;
}

.items-count-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--accent-primary-glow);
  color: var(--accent-primary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.close-drawer-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-items-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cart-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.item-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.item-variant {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.item-price {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--accent-primary);
  margin-top: 2px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-qty-controls {
  display: flex;
  align-items: center;
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.mini-qty-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mini-qty-btn:disabled {
  opacity: 0.3;
}

.mini-qty {
  font-size: 0.8rem;
  font-weight: 700;
  width: 20px;
  text-align: center;
}

.delete-item-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.delete-item-btn:hover {
  color: var(--accent-danger);
}

.clear-cart-row {
  text-align: right;
}

.text-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: underline;
}

.checkout-form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.form-title {
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.pl-icon {
  padding-left: 38px;
}

.input-error {
  border-color: var(--accent-danger) !important;
}

.error-msg {
  font-size: 0.75rem;
  color: var(--accent-danger);
  margin-top: 4px;
}

.order-summary-section {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.free-shipping-text {
  color: var(--accent-success);
  font-weight: 700;
}

.grand-total-line {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  margin-top: 4px;
}

.total-price {
  color: var(--accent-primary);
  font-size: 1.25rem;
}

.checkout-btn {
  width: 100%;
  padding: 12px 14px;
  font-size: 0.95rem;
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkout-actions-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.razorpay-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
}

.razorpay-btn:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
}

.mt-2 {
  margin-top: 8px;
}

.whatsapp-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.empty-cart-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
}

.empty-cart-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-cart-body h4 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-cart-body p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  max-width: 280px;
}

.mt-3 {
  margin-top: 16px;
}
</style>
