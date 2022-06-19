import { ApplyOptions, io, Listener, type ListenerOptions } from '../lib'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'rooms',
	type: 'client'
} )
export class CustomListener extends Listener {
	public run( socket: Socket ): void {
		console.log( 'rooms event' )
		const rooms = [ ...io.sockets.adapter.rooms.keys() ]
		socket.emit( 'rooms', rooms )
	}
}
