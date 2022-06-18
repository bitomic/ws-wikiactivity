import { ApplyOptions, Listener, type ListenerOptions, pino } from '../lib'
import type { Socket } from 'socket.io'

@ApplyOptions<ListenerOptions>( {
	event: 'connection'
} )
export class CustomListener extends Listener {
	public run( socket: Socket ): void {
		pino.info( `Connection: ${ socket.id }` )
	}
}
