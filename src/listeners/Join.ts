import { ApplyOptions, io, Listener, type ListenerOptions, pino } from '../lib'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'join',
	type: 'client'
} )
export class CustomListener extends Listener {
	public async run( socket: Socket, rooms: string[] ): Promise<void> {
		const existingRooms = io.sockets.adapter.rooms
		await socket.join( rooms )
		pino.info( [ ...existingRooms.keys() ].join( ', ' ) )
	}
}
