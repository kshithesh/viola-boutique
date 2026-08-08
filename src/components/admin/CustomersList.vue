<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Users,
  Search,
  Loader,
  RefreshCw,
  Globe,
  MessageSquare,
  Calendar,
  Phone,
  Mail
} from '@lucide/vue'
import type { Customer } from '../../types'
import { fetchCustomersFromDB } from '../../services/tursoService'
import { useCartStore } from '../../stores/cartStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const cartStore = useCartStore()

const customers = ref<Customer[]>([])
const isLoading = ref<boolean>(false)
const searchQuery = ref<string>('')

onMounted(() => loadCustomers())

async function loadCustomers() {
  isLoading.value = true
  try {
    const fetched = await fetchCustomersFromDB()
    customers.value = fetched || []
  } catch (err: any) {
    emit('notify', 'Failed to load customers: ' + err.message, 'error')
  } finally {
    isLoading.value = false
  }
}

const filteredCustomers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return customers.value
  return customers.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
  )
})

function getOrderCount(customer: Customer): number {
  return cartStore.orders.filter(
    (o) => o.customerPhone && customer.phone && o.customerPhone.includes(customer.phone)
  ).length
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <div class="customers-list">
    <!-- Header Bar -->
    <div class="cl-header">
      <div class="cl-title-row">
        <div class="cl-title-icon">
          <Users :size="20" />
        </div>
        <div>
          <h3 class="cl-title">Customer Accounts</h3>
          <p class="cl-subtitle">
            {{ customers.length }} registered customer{{ customers.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <div class="cl-actions">
        <!-- Search -->
        <div class="cl-search">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or phone..."
            class="input-field search-input"
          />
        </div>

        <button class="btn btn-secondary btn-sm" :disabled="isLoading" @click="loadCustomers">
          <Loader v-if="isLoading" :size="15" class="spin-icon" />
          <RefreshCw v-else :size="15" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <Loader :size="28" class="spin-icon loading-spinner" />
      <p>Loading customer data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCustomers.length === 0" class="empty-state">
      <div class="empty-icon">
        <Users :size="36" />
      </div>
      <h4>{{ searchQuery ? 'No results found' : 'No customers yet' }}</h4>
      <p>
        {{
          searchQuery
            ? 'Try a different search term.'
            : 'Customers appear here once they sign up via the storefront.'
        }}
      </p>
    </div>

    <!-- Customer Table -->
    <div v-else class="table-wrapper">
      <table class="customers-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Provider</th>
            <th>Orders</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in filteredCustomers" :key="customer.id" class="customer-row">
            <!-- Avatar + Name -->
            <td>
              <div class="customer-cell">
                <div class="customer-avatar">
                  <img
                    v-if="customer.avatar"
                    :src="customer.avatar"
                    :alt="customer.name"
                    class="avatar-img"
                  />
                  <span v-else class="avatar-initials">{{ getInitials(customer.name) }}</span>
                </div>
                <div class="customer-info">
                  <span class="customer-name">{{ customer.name }}</span>
                  <span class="customer-id">{{ customer.id }}</span>
                </div>
              </div>
            </td>

            <!-- Contact -->
            <td>
              <div class="contact-cell">
                <span v-if="customer.email" class="contact-item">
                  <Mail :size="13" /> {{ customer.email }}
                </span>
                <span v-if="customer.phone" class="contact-item">
                  <Phone :size="13" /> +{{ customer.phone }}
                </span>
                <span v-if="!customer.email && !customer.phone" class="no-contact">—</span>
              </div>
            </td>

            <!-- Provider -->
            <td>
              <span
                class="provider-chip"
                :class="customer.provider === 'google' ? 'chip-google' : 'chip-whatsapp'"
              >
                <Globe v-if="customer.provider === 'google'" :size="12" />
                <MessageSquare v-else :size="12" />
                {{ customer.provider === 'google' ? 'Google' : 'WhatsApp' }}
              </span>
            </td>

            <!-- Order count -->
            <td>
              <span class="order-count" :class="{ 'no-orders': getOrderCount(customer) === 0 }">
                {{ getOrderCount(customer) }}
              </span>
            </td>

            <!-- Joined date -->
            <td>
              <span class="join-date">
                <Calendar :size="12" />
                {{ formatDate(customer.createdAt) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.customers-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ——— Header ——— */
.cl-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.cl-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cl-title-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(180, 83, 9, 0.12);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cl-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.cl-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.cl-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cl-search {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  padding-left: 36px;
  min-width: 260px;
}

/* ——— States ——— */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
  gap: 12px;
}

.loading-spinner {
  color: var(--accent-primary);
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 300px;
  margin: 0;
}

/* ——— Table ——— */
.table-wrapper {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.customers-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-color);
}

.customer-row {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.15s;
}

.customer-row:last-child {
  border-bottom: none;
}

.customer-row:hover {
  background: var(--bg-surface-elevated);
}

.customers-table td {
  padding: 14px 16px;
  vertical-align: middle;
}

/* Customer cell */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-gold));
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.customer-id {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-family: monospace;
}

/* Contact */
.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.no-contact {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* Provider chip */
.provider-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.76rem;
  font-weight: 700;
}

.chip-google {
  background: rgba(66, 133, 244, 0.12);
  color: #4285f4;
}

.chip-whatsapp {
  background: rgba(37, 211, 102, 0.12);
  color: var(--accent-whatsapp);
}

/* Order count */
.order-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-primary-glow);
  color: var(--accent-primary);
  font-size: 0.82rem;
  font-weight: 800;
}

.order-count.no-orders {
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
}

/* Join date */
.join-date {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Spin */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

/* Mobile */
@media (max-width: 768px) {
  .cl-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .cl-actions {
    width: 100%;
  }

  .search-input {
    min-width: 0;
    width: 100%;
  }
}
</style>
