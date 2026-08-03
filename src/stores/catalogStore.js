import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { INITIAL_PRODUCTS, CATEGORIES } from '../data/mockProducts.js'

export const useCatalogStore = defineStore('catalog', () => {
  const LOCAL_STORAGE_KEY = 'viora_products_inventory_v4'
  const LOCAL_STORAGE_CATS_KEY = 'viora_categories_list_v1'

  const defaultCategories = [
    { name: 'Bridal & Wedding Lehengas', description: 'Heavy zardozi, velvet, and bridal couture lehengas' },
    { name: 'Designer Sarees', description: 'Handwoven Kanjeevaram, Banarasi, and tissue silk sarees' },
    { name: 'Anarkalis & Shararas', description: 'Floor-length Anarkali suit sets and festive shararas' },
    { name: 'Indo-Western Gowns', description: 'Reception gowns, drape sarees, and cocktail wear' },
    { name: 'Bridal Jewelry & Accessories', description: 'Nizam Kundan sets, pearl chokers, and raw silk potlis' },
    { name: 'Footwear', description: 'Zari embroidered velvet mojris and handcrafted juttis' }
  ]

  const products = ref(loadProducts())
  const customCategories = ref(loadCategories())
  const searchQuery = ref('')
  const selectedCategory = ref('All Products')
  const selectedStockFilter = ref('all') // 'all', 'in-stock', 'low-stock'
  const maxPrice = ref(80000)
  const sortBy = ref('featured') // 'featured', 'price-asc', 'price-desc', 'rating', 'stock-low'

  function loadProducts() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load products from localStorage, falling back to initial data.', e)
    }
    return [...INITIAL_PRODUCTS]
  }

  function loadCategories() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load categories, using defaults.', e)
    }
    return [...defaultCategories]
  }

  // Sync state to localStorage
  watch(
    products,
    (newVal) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newVal))
      } catch (e) {
        console.error('Failed to persist products to localStorage', e)
      }
    },
    { deep: true }
  )

  watch(
    customCategories,
    (newCats) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(newCats))
      } catch (e) {
        console.error('Failed to persist categories to localStorage', e)
      }
    },
    { deep: true }
  )

  const categoriesList = computed(() => {
    const setNames = new Set(customCategories.value.map(c => c.name))
    // Also include any product categories that might be custom
    products.value.forEach(p => {
      if (p.category) setNames.add(p.category)
    })
    return ['All Products', ...Array.from(setNames)]
  })

  const filteredProducts = computed(() => {
    return products.value
      .filter(product => {
        // Search query filter
        if (searchQuery.value.trim()) {
          const q = searchQuery.value.toLowerCase()
          const matchTitle = product.name.toLowerCase().includes(q)
          const matchDesc = product.description?.toLowerCase().includes(q) || false
          const matchCategory = product.category?.toLowerCase().includes(q) || false
          const matchSku = product.sku?.toLowerCase().includes(q) || false
          if (!matchTitle && !matchDesc && !matchCategory && !matchSku) {
            return false
          }
        }

        // Category filter
        if (selectedCategory.value !== 'All Products' && product.category !== selectedCategory.value) {
          return false
        }

        // Stock availability filter
        if (selectedStockFilter.value === 'in-stock' && product.stock <= 0) {
          return false
        }
        if (selectedStockFilter.value === 'low-stock' && (product.stock <= 0 || product.stock > 5)) {
          return false
        }

        // Max price filter
        if (product.price > maxPrice.value) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy.value === 'price-asc') return a.price - b.price
        if (sortBy.value === 'price-desc') return b.price - a.price
        if (sortBy.value === 'rating') return (b.rating || 0) - (a.rating || 0)
        if (sortBy.value === 'stock-low') return a.stock - b.stock
        // default: featured first then highest rated
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1
        return 0
      })
  })

  const lowStockProducts = computed(() => {
    return products.value.filter(p => p.stock > 0 && p.stock <= 5)
  })

  const outOfStockProducts = computed(() => {
    return products.value.filter(p => p.stock <= 0)
  })

  const totalCatalogValue = computed(() => {
    return products.value.reduce((sum, p) => sum + (p.price * (p.stock > 0 ? p.stock : 0)), 0)
  })

  const totalProductsCount = computed(() => products.value.length)

  // Actions for Product Management
  function addProduct(productData) {
    const id = 'prod-' + Date.now().toString(36)
    const sku = productData.sku || `VHYD-${productData.category?.substring(0, 3).toUpperCase() || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`
    
    const newProd = {
      id,
      sku,
      name: productData.name,
      category: productData.category || 'Bridal & Wedding Lehengas',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      costPrice: productData.costPrice ? Number(productData.costPrice) : 0,
      stock: Number(productData.stock) || 0,
      rating: productData.rating || 5.0,
      reviewsCount: productData.reviewsCount || 1,
      isFeatured: !!productData.isFeatured,
      badge: productData.badge || (productData.stock <= 5 ? 'Low Stock' : 'Boutique Exclusive'),
      description: productData.description || '',
      image: productData.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      colors: productData.colors || ['Default'],
      tags: productData.tags || [productData.category]
    }

    products.value.unshift(newProd)
    return newProd
  }

  function updateProduct(id, updatedFields) {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        ...updatedFields,
        price: Number(updatedFields.price ?? products.value[index].price),
        stock: Number(updatedFields.stock ?? products.value[index].stock)
      }
    }
  }

  function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
  }

  function updateStock(id, newStock) {
    const prod = products.value.find(p => p.id === id)
    if (prod) {
      prod.stock = Math.max(0, Number(newStock) || 0)
    }
  }

  function decrementStockBatch(items) {
    items.forEach(item => {
      const prod = products.value.find(p => p.id === item.product.id)
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity)
      }
    })
  }

  // Category Management Actions
  function addCategory(categoryObj) {
    if (!categoryObj.name.trim()) return
    const exists = customCategories.value.some(c => c.name.toLowerCase() === categoryObj.name.trim().toLowerCase())
    if (exists) return false

    customCategories.value.push({
      name: categoryObj.name.trim(),
      description: categoryObj.description?.trim() || ''
    })
    return true
  }

  function updateCategory(oldName, updatedObj) {
    const newName = updatedObj.name.trim()
    const index = customCategories.value.findIndex(c => c.name === oldName)
    
    if (index !== -1) {
      customCategories.value[index] = {
        name: newName,
        description: updatedObj.description?.trim() || ''
      }
    }

    // Cascade update all products under oldName to newName
    if (oldName !== newName) {
      products.value.forEach(p => {
        if (p.category === oldName) {
          p.category = newName
        }
      })
    }
  }

  function deleteCategory(categoryName) {
    customCategories.value = customCategories.value.filter(c => c.name !== categoryName)
    // Re-assign products under deleted category to default 'Bridal & Wedding Lehengas'
    const fallbackCategory = customCategories.value[0]?.name || 'General'
    products.value.forEach(p => {
      if (p.category === categoryName) {
        p.category = fallbackCategory
      }
    })
  }

  function resetToDefaultCatalog() {
    products.value = [...INITIAL_PRODUCTS]
    customCategories.value = [...defaultCategories]
  }

  return {
    products,
    customCategories,
    searchQuery,
    selectedCategory,
    selectedStockFilter,
    maxPrice,
    sortBy,
    categoriesList,
    filteredProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCatalogValue,
    totalProductsCount,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    decrementStockBatch,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaultCatalog
  }
})
