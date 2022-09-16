import { ApplyOptions, Listener, type ListenerOptions } from '../lib'
import { Fandom } from 'mw.js'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'join',
	type: 'client'
	} )
export class CustomListener extends Listener {
	public async run( socket: Socket, rooms: string[] ): Promise<void> {
		if ( !Array.isArray( rooms ) ) return
		rooms = rooms.filter( room => typeof room === 'string' )

		const validRooms = rooms.filter( room => {
			try {
				Fandom.interwiki2api( room )
				return true
			} catch {
				return false
			}
		} )
		for ( const room of validRooms ) {
			await socket.leave( room )
		}
	}
}
