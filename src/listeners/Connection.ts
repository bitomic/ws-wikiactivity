import { ApplyOptions, Listener, type ListenerOptions, listeners, logger } from '../lib'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'connection',
	type: 'server'
} )
export class CustomListener extends Listener {
	public async run( socket: Socket ): Promise<void> {
		socket.emit( 'connection' )
		logger.info( `Connection: ${ socket.id }` )

		socket.on( 'message', async ( event: string, ...args: unknown[] ) => {
			const clientListeners = listeners.filter( listener => listener.options.event === event )
			for ( const listener of clientListeners.values() ) {
				await listener.run( socket, ...args )
			}
		} )

		await socket.join( '#default' )
		await socket.leave( socket.id )
	}
}
