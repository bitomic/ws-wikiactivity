import { ApplyOptions, io, Listener, type ListenerOptions, pino } from '../lib'
import { Fandom } from 'mw.js'
import { parseInterwiki } from '../wiki'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'join',
	type: 'client'
} )
export class CustomListener extends Listener {
	public async run( socket: Socket, rooms: string[] ): Promise<void> {
		rooms = rooms.filter( room => typeof room === 'string' )

		const validRooms = rooms.filter( room => parseInterwiki( room ) )
		const missingRooms = validRooms.reduce( ( list, room ) => {
			if ( !io.sockets.adapter.rooms.has( room ) ) list.add( room )
			return list
		}, new Set<string>() )
		const invalidRooms = new Set<string>()

		for ( const room of missingRooms ) {
			const exists = await Fandom.getWiki( room ).exists()
				.catch( () => false )
			if ( !exists ) {
				pino.warn( `Tried to create a room for an unreachable wiki: ${ room }` )
				socket.emit( 'unreachable-wiki', room )
				invalidRooms.add( room )
			}
		}

		if ( missingRooms.size > invalidRooms.size ) {
			const newRooms = [ ...missingRooms ].filter( room => !invalidRooms.has( room ) )
			pino.info( `The following rooms will be created: ${ newRooms.join( ', ' ) }` )
		}

		const joinableRooms = validRooms.filter( room => !invalidRooms.has( room ) )
		await socket.join( joinableRooms )
	}
}
