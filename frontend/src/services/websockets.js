/**
 * WebSocket service for real‑time location updates
 */
class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
  }

  connect(url = null) {
    const wsUrl = url || `ws://${window.location.hostname}:5000/ws/locations`
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this._emit('open', null)
    }

    this.socket.onmessage = (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        data = event.data
      }
      this._emit('message', data)
    }

    this.socket.onclose = () => {
      console.log('WebSocket disconnected')
      this._emit('close', null)
      this._reconnect()
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this._emit('error', error)
    }
  }

  _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached')
      return
    }
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, this.reconnectDelay)
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.socket.send(message)
    } else {
      console.warn('WebSocket not open')
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index !== -1) callbacks.splice(index, 1)
  }

  _emit(event, data) {
    if (!this.listeners.has(event)) return
    this.listeners.get(event).forEach(cb => cb(data))
  }
}

export default new WebSocketService()