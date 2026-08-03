<script setup>
import { ref } from 'vue'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const toasts = ref([])

function addToast(message, type = 'success', duration = 3500) {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

function removeToast(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({
  addToast
})
</script>

<template>
  <div class="toast-container">
    <div 
      v-for="toast in toasts" 
      :key="toast.id"
      class="toast-item glass-panel animate-fade-in"
      :class="`toast-${toast.type}`"
    >
      <component :is="toast.type === 'error' ? AlertCircle : (toast.type === 'info' ? Info : CheckCircle2)" :size="18" />
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" @click="removeToast(toast.id)">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 280px;
  max-width: 380px;
}

.toast-success {
  border-left: 4px solid var(--accent-success);
  color: var(--text-primary);
}

.toast-error {
  border-left: 4px solid var(--accent-danger);
  color: var(--text-primary);
}

.toast-info {
  border-left: 4px solid var(--accent-info);
  color: var(--text-primary);
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
