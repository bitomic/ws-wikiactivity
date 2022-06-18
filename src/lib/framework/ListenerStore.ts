import { io } from '../io'
import { Listener } from './Listener'
import type { Socket } from 'socket.io'
import { Store } from '@sapphire/pieces'

export class ListenerStore extends Store<Listener> {
	public constructor() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
		super( Listener as any, { name: 'listeners' } )
	}

	public override set( key: string, value: Listener ): this {
		io.on( value.options.event, ( socket: Socket ) => value.run( io, socket ) )
		return super.set( key, value )
	}
}
