<script setup lang="ts">
import { ref, watch } from 'vue'
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
  ShieldCheck,
  Zap,
  AlertCircle,
  LogIn
} from '@lucide/vue'
import { useCartStore } from '../../stores/cartStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// Auto-fill checkout form when user is logged in
watch(
  () => authStore.currentCustomer,
  (customer) => {
    if (customer) {
      if (customer.name && customer.name !== customer.phone) {
        cartStore.customerForm.customerName = customer.name
      }
      if (customer.phone) {
        cartStore.customerForm.customerPhone = '+' + customer.phone
      }
    }
  },
  { immediate: true }
)

const formErrors = ref<Record<string, string>>({})
const isProcessingPayment = ref<boolean>(false)

function validateForm(): boolean {
  formErrors.value = {}

  if (!cartStore.customerForm.customerName.trim()) {
    formErrors.value.customerName = 'Please enter your full name'
  }
  if (!cartStore.customerForm.deliveryAddress.trim()) {
    formErrors.value.deliveryAddress = 'Please enter your delivery address'
  }
  if (!cartStore.customerForm.paymentMethod) {
    formErrors.value.paymentMethod = 'Please select a payment method'
  }

  return Object.keys(formErrors.value).length === 0
}

function validateAndCheckout(): void {
  if (!validateForm()) {
    emit('notify', 'Please fill out required customer fields before placing order.', 'error')
    return
  }

  const whatsappUrl = cartStore.checkoutViaWhatsApp()
  if (whatsappUrl) {
    emit('notify', 'Order placed! Redirecting to WhatsApp...', 'success')
    window.open(whatsappUrl, '_blank')
  } else {
    emit('notify', '🎉 Order placed successfully! Our team will process your order.', 'success')
  }
}

function handleRazorpayCheckout(): void {
  if (!validateForm()) {
    emit('notify', 'Please enter your name and delivery address before paying.', 'error')
    return
  }

  isProcessingPayment.value = true
  cartStore.processRazorpayPayment({
    onSuccess: ({ whatsappUrl, orderId }) => {
      isProcessingPayment.value = false
      if (whatsappUrl) {
        emit('notify', `🎉 Payment successful! Redirecting to WhatsApp with receipt...`, 'success')
        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
        }, 600)
      } else {
        emit('notify', `🎉 Payment successful! Order #${orderId} has been confirmed.`, 'success')
      }
    },
    onError: (errMsg: string) => {
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
                title="Remove item"
                @click="cartStore.removeFromCart(index)"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <div class="clear-cart-row">
            <button class="text-btn" @click="cartStore.clearCart">Clear all items</button>
          </div>
        </div>

        <!-- Customer Checkout Form -->
        <div class="checkout-form-section">
          <!-- Sign-In Prompt (shown when not logged in) -->
          <div v-if="!authStore.isAuthenticated" class="signin-gate">
            <div class="signin-gate-icon">
              <User :size="22" />
            </div>
            <div class="signin-gate-body">
              <p class="signin-gate-title">Sign in to checkout faster</p>
              <p class="signin-gate-sub">Auto-fill your name &amp; phone from your account</p>
            </div>
            <button class="btn btn-primary signin-gate-btn" @click="authStore.openAuthModal()">
              <LogIn :size="16" /> Sign In
            </button>
          </div>

          <!-- Logged-in pill -->
          <div v-else class="signed-in-pill">
            <img
              v-if="authStore.customerAvatar"
              :src="authStore.customerAvatar"
              class="signed-in-avatar"
              :alt="authStore.customerName"
            />
            <User v-else :size="14" class="signed-in-icon" />
            <span class="signed-in-name">{{ authStore.customerName }}</span>
            <span class="signed-in-badge">✓ Signed In</span>
          </div>

          <h4 class="form-title"><User :size="16" /> Delivery &amp; Customer Details</h4>

          <div class="form-group">
            <label class="input-label">Full Name *</label>
            <div class="input-with-icon">
              <User :size="16" class="input-icon" />
              <input
                v-model="cartStore.customerForm.customerName"
                type="text"
                placeholder="e.g. Jane Doe"
                class="input-field pl-icon"
                :class="{ 'input-error': formErrors.customerName }"
              />
            </div>
            <span v-if="formErrors.customerName" class="error-msg">{{
              formErrors.customerName
            }}</span>
          </div>

          <div class="form-group">
            <label class="input-label">Phone Number</label>
            <div class="input-with-icon">
              <Phone :size="16" class="input-icon" />
              <input
                v-model="cartStore.customerForm.customerPhone"
                type="tel"
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
                v-model="cartStore.customerForm.deliveryAddress"
                type="text"
                placeholder="Street address, City, Zip"
                class="input-field pl-icon"
                :class="{ 'input-error': formErrors.deliveryAddress }"
              />
            </div>
            <span v-if="formErrors.deliveryAddress" class="error-msg">{{
              formErrors.deliveryAddress
            }}</span>
          </div>

          <div class="form-group">
            <label class="input-label">Payment Method *</label>
            <div class="input-with-icon">
              <CreditCard :size="16" class="input-icon" />
              <select
                v-model="cartStore.customerForm.paymentMethod"
                class="input-field pl-icon"
                :class="{ 'input-error': formErrors.paymentMethod }"
              >
                <option value="">-- Select Payment Method --</option>
                <option
                  v-if="settingsStore.settings.enableRazorpay"
                  value="Razorpay Online (UPI/Cards)"
                >
                  ⚡ Razorpay Online (UPI / Card / NetBanking)
                </option>
                <option
                  v-if="settingsStore.settings.enableWhatsApp !== false"
                  value="WhatsApp Direct Order"
                >
                  💬 WhatsApp Concierge Order
                </option>
                <option v-if="settingsStore.settings.enableCOD !== false" value="Cash on Delivery">
                  Cash on Delivery (COD)
                </option>
                <option
                  v-if="settingsStore.settings.enableUPI !== false"
                  value="UPI / Instant Bank Transfer"
                >
                  UPI / Direct Bank Transfer
                </option>
                <option v-if="settingsStore.settings.enableCOD !== false" value="Card on Delivery">
                  Card / POS on Delivery
                </option>
              </select>
            </div>
            <span v-if="formErrors.paymentMethod" class="error-msg">{{
              formErrors.paymentMethod
            }}</span>
          </div>

          <div class="form-group">
            <label class="input-label">Order Notes / Instructions</label>
            <div class="input-with-icon">
              <FileText :size="16" class="input-icon" />
              <input
                v-model="cartStore.customerForm.notes"
                type="text"
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
            <!-- Prompt when no payment method is selected -->
            <div v-if="!cartStore.customerForm.paymentMethod" class="select-payment-prompt">
              <AlertCircle :size="16" class="prompt-icon" />
              <span>Please select a payment method above to complete your checkout.</span>
            </div>

            <!-- Razorpay Checkout Button (Only shown when Razorpay Online is selected AND Razorpay is enabled) -->
            <button
              v-else-if="
                cartStore.customerForm.paymentMethod === 'Razorpay Online (UPI/Cards)' &&
                settingsStore.settings.enableRazorpay
              "
              class="btn btn-primary checkout-btn razorpay-btn"
              :disabled="isProcessingPayment"
              @click="handleRazorpayCheckout"
            >
              <Zap :size="18" /> Pay Online via Razorpay ({{
                settingsStore.formatPrice(cartStore.grandTotal)
              }})
            </button>

            <!-- WhatsApp / Direct Order Checkout Button (Shown for WhatsApp/COD/UPI payment selections) -->
            <button
              v-else-if="cartStore.customerForm.paymentMethod"
              class="btn checkout-btn"
              :class="
                settingsStore.settings.enableWhatsApp !== false &&
                cartStore.customerForm.paymentMethod === 'WhatsApp Direct Order'
                  ? 'btn-whatsapp'
                  : 'btn-primary'
              "
              @click="validateAndCheckout"
            >
              <MessageSquare
                v-if="
                  settingsStore.settings.enableWhatsApp !== false &&
                  cartStore.customerForm.paymentMethod === 'WhatsApp Direct Order'
                "
                :size="18"
              />
              <ShoppingBag v-else :size="18" />
              <span>
                {{
                  settingsStore.settings.enableWhatsApp !== false &&
                  cartStore.customerForm.paymentMethod === 'WhatsApp Direct Order'
                    ? 'Order via WhatsApp Concierge'
                    : `Complete Order (${cartStore.customerForm.paymentMethod})`
                }}
              </span>
            </button>
          </div>

          <p class="whatsapp-hint mt-2">
            <ShieldCheck :size="13" /> 256-bit encrypted Razorpay SSL payments & WhatsApp concierge
            checkout.
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
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
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
  -webkit-overflow-scrolling: touch;
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

/* ——— Sign-In Gate ——— */
.signin-gate {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.06), rgba(217, 119, 6, 0.06));
  border: 1px solid rgba(180, 83, 9, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: 4px;
}

.signin-gate-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-primary-glow);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.signin-gate-body {
  flex: 1;
}

.signin-gate-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.signin-gate-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.signin-gate-btn {
  flex-shrink: 0;
  padding: 7px 12px;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ——— Signed-in pill ——— */
.signed-in-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(5, 150, 105, 0.08);
  border: 1px solid rgba(5, 150, 105, 0.2);
  border-radius: var(--radius-full);
  margin-bottom: 4px;
}

.signed-in-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.signed-in-icon {
  color: var(--accent-success);
}

.signed-in-name {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.signed-in-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-success);
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

.select-payment-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(180, 140, 100, 0.1);
  border: 1px dashed var(--border-color-hover);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
}

.prompt-icon {
  color: var(--accent-gold);
  flex-shrink: 0;
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

@media (max-width: 640px) {
  .cart-drawer {
    width: 100%;
    max-width: 100%;
  }
  .drawer-header {
    padding: 14px 16px;
  }
  .drawer-body {
    padding: 14px 16px;
    gap: 16px;
  }
  .cart-item-row {
    padding: 8px 10px;
    gap: 10px;
  }
  .item-thumbnail {
    width: 52px;
    height: 52px;
  }
  .item-name {
    font-size: 0.84rem;
  }
  .mini-qty-btn {
    width: 28px;
    height: 28px;
  }
  .checkout-btn {
    min-height: 46px;
  }
}
</style>
