import { useState, useEffect } from 'react'

/**
 * Custom hook for persisting state in localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - default value if key not found
 * @returns {[any, Function]} [storedValue, setValue]
 */
const useLocalStorage = (key, initialValue) => {
  // Get stored value from localStorage or use initialValue
  const readValue = () => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(readValue)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  useEffect(() => {
    setStoredValue(readValue())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [storedValue, setValue]
}

export default useLocalStorage