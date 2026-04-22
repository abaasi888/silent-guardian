import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook for managing WebSocket connections
 * @param {string} url - WebSocket endpoint (e.g., ws://localhost:5000/ws/locations)
 * @param {Object} options - { onMessage, onOpen, onClose, onError, reconnectInterval, maxRetries }
 * @returns {Object} { sendMessage, lastMessage, readyState, connect, disconnect }
 */
const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxRetries = 5,
    autoConnect = true
  } = options

  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const wsRef = useRef(null)
  const retryCountRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        retryCountRef.current = 0
        if (onOpen) onOpen(event)
      }

      ws.onmessage = (event) => {
        let data
        try {
          data = JSON.parse(event.data)
        } catch {
          data = event.data
        }
        setLastMessage(data)
        if (onMessage) onMessage(data)
      }

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        if (onClose) onClose(event)
        // Auto reconnect if not closed intentionally
        if (retryCountRef.current < maxRetries && reconnectInterval) {
          reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (event) => {
        if (onError) onError(event)
      }
    } catch (err) {
      if (onError) onError(err)
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnectInterval, maxRetries])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
    wsRef.current = null
    setReadyState(WebSocket.CLOSED)
  }, [])

  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      wsRef.current.send(message)
    } else {
      console.warn('WebSocket is not open')
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return { sendMessage, lastMessage, readyState, connect, disconnect }
}

export default useWebSocket