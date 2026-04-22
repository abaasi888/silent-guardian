class ChatService {
    constructor() { this.socket = null }
    connect() { this.socket = new WebSocket('ws://localhost:5000/ws/chat') }
    sendMessage(to, message) { this.socket.send(JSON.stringify({ to, message })) }
    onMessage(callback) { this.socket.onmessage = (event) => callback(JSON.parse(event.data)) }
}
export default new ChatService()
