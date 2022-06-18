import { Piece, type PieceOptions } from '@sapphire/pieces'
import type { Socket } from 'socket.io'

export abstract class Listener extends Piece<ListenerOptions> {
	public abstract run( socket: Socket, ...args: unknown[] ): void | Promise<void>
}

export interface ListenerOptions extends PieceOptions {
	event: string
	type: 'server' | 'client'
}
