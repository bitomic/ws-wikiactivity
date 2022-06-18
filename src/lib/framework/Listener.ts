import { Piece, type PieceOptions } from '@sapphire/pieces'
import type { Server, Socket } from 'socket.io'

export abstract class Listener extends Piece<ListenerOptions> {
	public abstract run( socket: Socket ): void | Promise<void>
}

export interface ListenerOptions extends PieceOptions {
	event: string
}
