import http from 'http'
import socketio from 'socket.io'

export const server = http.createServer()

export const io = new socketio.Server( server )
