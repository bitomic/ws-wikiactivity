import { ApplyOptions, Listener, type ListenerOptions } from '../lib'
import { parseInterwiki } from '../wiki'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'join',
	type: 'client'
} )
export class CustomListener extends Listener {
	public async run( socket: Socket, rooms: string[] ): Promise<void> {
		if ( !Array.isArray( rooms ) ) return
		rooms = rooms.filter( room => typeof room === 'string' )

		const validRooms = rooms.filter( room => parseInterwiki( room ) )
		for ( const room of validRooms ) {
			await socket.leave( room )
		}
	}
}
