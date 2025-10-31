import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NavigationStateContext = createContext()

export const useNavigationState = () => {
  const context = useContext(NavigationStateContext)
  if (!context) {
    throw new Error('useNavigationState must be used within NavigationStateProvider')
  }
  return context
}

export const NavigationStateProvider = ({ children }) => {
  const [homeState, setHomeState] = useState(null)

  // Save state to sessionStorage
  const saveHomeState = useCallback((state) => {
    try {
      const stateToSave = {
        scrollPosition: state.scrollPosition || 0,
        selectedCategory: state.selectedCategory || null,
        selectedCategoryIdForFilter: state.selectedCategoryIdForFilter || null,
        selectedCategoryPath: state.selectedCategoryPath || [],
        selectedFilters: state.selectedFilters || ['all'],
        searchQuery: state.searchQuery || '',
        showSearchSection: state.showSearchSection || false,
        
        // For All Products section
        productsCurrentPage: state.productsCurrentPage || 1,
        productsTotalCount: state.productsTotalCount || 0,
        
        // For Category section
        categoryCurrentPage: state.categoryCurrentPage || 1,
        categoryTotalCount: state.categoryTotalCount || 0,
        
        timestamp: Date.now()
      }
      
      sessionStorage.setItem('homeNavigationState', JSON.stringify(stateToSave))
      setHomeState(stateToSave)
    } catch (error) {
      console.error('Error saving navigation state:', error)
    }
  }, [])

  // Load state from sessionStorage
  const loadHomeState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem('homeNavigationState')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        
        // Check if state is less than 1 hour old
        const oneHour = 60 * 60 * 1000
        if (Date.now() - parsed.timestamp < oneHour) {
          setHomeState(parsed)
          return parsed
        } else {
          // Clear old state
          sessionStorage.removeItem('homeNavigationState')
        }
      }
    } catch (error) {
      console.error('Error loading navigation state:', error)
    }
    return null
  }, [])

  // Clear state
  const clearHomeState = useCallback(() => {
    try {
      sessionStorage.removeItem('homeNavigationState')
      setHomeState(null)
    } catch (error) {
      console.error('Error clearing navigation state:', error)
    }
  }, [])

  const value = {
    homeState,
    saveHomeState,
    loadHomeState,
    clearHomeState
  }

  return (
    <NavigationStateContext.Provider value={value}>
      {children}
    </NavigationStateContext.Provider>
  )
}