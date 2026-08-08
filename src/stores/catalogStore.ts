import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Product, Category } from '../types'
import { INITIAL_PRODUCTS } from '../data/mockProducts'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  isTursoConfigured,
  initDatabase,
  fetchProductsFromDB,
  saveProductToDB,
  deleteProductFromDB,
  updateStockInDB,
  seedProductsToDB,
  fetchCategoriesFromDB,
  saveCategoryToDB,
  deleteCategoryFromDB,
  seedCategoriesToDB
} from '../services/tursoService'

export const useCatalogStore = defineStore('catalog', () => {
  const LOCAL_STORAGE_KEY = 'viora_products_inventory_v4'
  const LOCAL_STORAGE_CATS_KEY = 'viora_categories_list_v1'

  const defaultCategories: Category[] = [
    {
      name: 'Bridal & Wedding Lehengas',
      description: 'Heavy zardozi, velvet, and bridal couture lehengas'
    },
    {
      name: 'Designer Sarees',
      description: 'Handwoven Kanjeevaram, Banarasi, and tissue silk sarees'
    },
    {
      name: 'Anarkalis & Shararas',
      description: 'Floor-length Anarkali suit sets and festive shararas'
    },
    { name: 'Indo-Western Gowns', description: 'Reception gowns, drape sarees, and cocktail wear' },
    {
      name: 'Bridal Jewelry & Accessories',
      description: 'Nizam Kundan sets, pearl chokers, and raw silk potlis'
    },
    { name: 'Footwear', description: 'Zari embroidered velvet mojris and handcrafted juttis' }
  ]

  const products = ref<Product[]>(loadProductsFromLocalStorage())
  const customCategories = ref<Category[]>(loadCategoriesFromLocalStorage())
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('All Products')
  const selectedStockFilter = ref<'all' | 'in-stock' | 'low-stock'>('all')
  const maxPrice = ref<number>(80000)
  const sortBy = ref<string>('featured')
  const isDbConnected = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  function loadProductsFromLocalStorage(): Product[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
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

  function loadCategoriesFromLocalStorage(): Category[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_CATS_KEY)
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

  async function initCatalog(): Promise<void> {
    if (!isTursoConfigured()) {
      isDbConnected.value = false
      return
    }

    isLoading.value = true
    try {
      await initDatabase()
      let dbProducts = await fetchProductsFromDB()
      let dbCategories = await fetchCategoriesFromDB()

      if (dbProducts !== null) {
        if (dbProducts.length === 0) {
          console.log('[Turso] Database empty. Seeding initial products & categories...')
          await seedProductsToDB(INITIAL_PRODUCTS)
          await seedCategoriesToDB(defaultCategories)
          dbProducts = [...INITIAL_PRODUCTS]
          dbCategories = [...defaultCategories]
        }

        products.value = dbProducts
        if (dbCategories && dbCategories.length > 0) {
          customCategories.value = dbCategories
        }
        isDbConnected.value = true
      }
    } catch (err) {
      console.warn(
        '[Turso] Failed to sync catalog with Turso DB, staying on local storage mode.',
        err
      )
      isDbConnected.value = false
    } finally {
      isLoading.value = false
    }
  }

  initCatalog()

  watch(
    products,
    (newVal) => {
      if (!isDbConnected.value) {
        try {
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newVal))
        } catch (e) {
          console.error('Failed to persist products to localStorage', e)
        }
      }
    },
    { deep: true }
  )

  watch(
    customCategories,
    (newCats) => {
      if (!isDbConnected.value) {
        try {
          safeLocalStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(newCats))
        } catch (e) {
          console.error('Failed to persist categories to localStorage', e)
        }
      }
    },
    { deep: true }
  )

  const categoriesList = computed<string[]>(() => {
    const setNames = new Set<string>(customCategories.value.map((c) => c.name))
    products.value.forEach((p) => {
      if (p.category) setNames.add(p.category)
    })
    return ['All Products', ...Array.from(setNames)]
  })

  const filteredProducts = computed<Product[]>(() => {
    return products.value
      .filter((product) => {
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

        if (
          selectedCategory.value !== 'All Products' &&
          product.category !== selectedCategory.value
        ) {
          return false
        }

        if (selectedStockFilter.value === 'in-stock' && product.stock <= 0) {
          return false
        }
        if (
          selectedStockFilter.value === 'low-stock' &&
          (product.stock <= 0 || product.stock > 5)
        ) {
          return false
        }

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
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1
        return 0
      })
  })

  const lowStockProducts = computed<Product[]>(() => {
    return products.value.filter((p) => p.stock > 0 && p.stock <= 5)
  })

  const outOfStockProducts = computed<Product[]>(() => {
    return products.value.filter((p) => p.stock <= 0)
  })

  const totalCatalogValue = computed<number>(() => {
    return products.value.reduce((sum, p) => sum + p.price * (p.stock > 0 ? p.stock : 0), 0)
  })

  const totalProductsCount = computed<number>(() => products.value.length)

  async function addProduct(productData: Partial<Product>): Promise<Product> {
    const id = 'prod-' + Date.now().toString(36)
    const sku =
      productData.sku ||
      `VHYD-${productData.category?.substring(0, 3).toUpperCase() || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`

    const newProd: Product = {
      id,
      sku,
      name: productData.name || 'Untitled Product',
      category: productData.category || 'Bridal & Wedding Lehengas',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      costPrice: productData.costPrice ? Number(productData.costPrice) : 0,
      stock: Number(productData.stock) || 0,
      rating: productData.rating || 5.0,
      reviewsCount: productData.reviewsCount || 1,
      isFeatured: !!productData.isFeatured,
      badge:
        productData.badge || (Number(productData.stock) <= 5 ? 'Low Stock' : 'Boutique Exclusive'),
      description: productData.description || '',
      image:
        productData.image ||
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      colors: productData.colors || ['Default'],
      tags: productData.tags || [productData.category || 'Boutique']
    }

    products.value.unshift(newProd)

    if (isDbConnected.value) {
      try {
        await saveProductToDB(newProd)
      } catch (e) {
        console.error('Failed to sync new product to Turso DB', e)
      }
    }
    return newProd
  }

  async function updateProduct(id: string, updatedFields: Partial<Product>): Promise<void> {
    const index = products.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      const updatedProd: Product = {
        ...products.value[index],
        ...updatedFields,
        price: Number(updatedFields.price ?? products.value[index].price),
        stock: Number(updatedFields.stock ?? products.value[index].stock)
      }
      products.value[index] = updatedProd

      if (isDbConnected.value) {
        try {
          await saveProductToDB(updatedProd)
        } catch (e) {
          console.error('Failed to sync product updates to Turso DB', e)
        }
      }
    }
  }

  async function deleteProduct(id: string): Promise<void> {
    products.value = products.value.filter((p) => p.id !== id)
    if (isDbConnected.value) {
      try {
        await deleteProductFromDB(id)
      } catch (e) {
        console.error('Failed to delete product from Turso DB', e)
      }
    }
  }

  async function updateStock(id: string, newStock: number | string): Promise<void> {
    const prod = products.value.find((p) => p.id === id)
    if (prod) {
      const validStock = Math.max(0, Number(newStock) || 0)
      prod.stock = validStock
      if (isDbConnected.value) {
        try {
          await updateStockInDB(id, validStock)
        } catch (e) {
          console.error('Failed to update stock in Turso DB', e)
        }
      }
    }
  }

  async function decrementStockBatch(
    items: Array<{ product: Product; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      const prod = products.value.find((p) => p.id === item.product.id)
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity)
        prod.stock = newStock
        if (isDbConnected.value) {
          try {
            await updateStockInDB(prod.id, newStock)
          } catch (e) {
            console.error('Failed to update stock in Turso DB', e)
          }
        }
      }
    }
  }

  async function addCategory(categoryObj: {
    name: string
    description?: string
  }): Promise<boolean> {
    if (!categoryObj.name.trim()) return false
    const exists = customCategories.value.some(
      (c) => c.name.toLowerCase() === categoryObj.name.trim().toLowerCase()
    )
    if (exists) return false

    const newCat: Category = {
      name: categoryObj.name.trim(),
      description: categoryObj.description?.trim() || ''
    }

    customCategories.value.push(newCat)

    if (isDbConnected.value) {
      try {
        await saveCategoryToDB(newCat)
      } catch (e) {
        console.error('Failed to sync category to Turso DB', e)
      }
    }
    return true
  }

  async function updateCategory(
    oldName: string,
    updatedObj: { name: string; description?: string }
  ): Promise<void> {
    const newName = updatedObj.name.trim()
    const index = customCategories.value.findIndex((c) => c.name === oldName)

    if (index !== -1) {
      const catObj: Category = {
        name: newName,
        description: updatedObj.description?.trim() || ''
      }
      customCategories.value[index] = catObj

      if (isDbConnected.value) {
        try {
          if (oldName !== newName) {
            await deleteCategoryFromDB(oldName)
          }
          await saveCategoryToDB(catObj)
        } catch (e) {
          console.error('Failed to sync category update to Turso DB', e)
        }
      }
    }

    if (oldName !== newName) {
      for (const p of products.value) {
        if (p.category === oldName) {
          p.category = newName
          if (isDbConnected.value) {
            try {
              await saveProductToDB(p)
            } catch (e) {
              console.error('Failed to update product category in DB', e)
            }
          }
        }
      }
    }
  }

  async function deleteCategory(categoryName: string): Promise<void> {
    customCategories.value = customCategories.value.filter((c) => c.name !== categoryName)
    if (isDbConnected.value) {
      try {
        await deleteCategoryFromDB(categoryName)
      } catch (e) {
        console.error('Failed to delete category from Turso DB', e)
      }
    }

    const fallbackCategory = customCategories.value[0]?.name || 'General'
    for (const p of products.value) {
      if (p.category === categoryName) {
        p.category = fallbackCategory
        if (isDbConnected.value) {
          try {
            await saveProductToDB(p)
          } catch (e) {
            console.error('Failed to update product category in DB', e)
          }
        }
      }
    }
  }

  function resetToDefaultCatalog(): void {
    products.value = [...INITIAL_PRODUCTS]
    customCategories.value = [...defaultCategories]
    if (isDbConnected.value) {
      seedProductsToDB(INITIAL_PRODUCTS)
      seedCategoriesToDB(defaultCategories)
    }
  }

  return {
    products,
    customCategories,
    searchQuery,
    selectedCategory,
    selectedStockFilter,
    maxPrice,
    sortBy,
    isDbConnected,
    isLoading,
    categoriesList,
    filteredProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCatalogValue,
    totalProductsCount,
    initCatalog,
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
