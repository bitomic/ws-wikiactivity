import type { Piece, PieceOptions } from '@sapphire/pieces'
import { createClassDecorator } from './createClassDecorator'
import { createProxy } from './createProxy'
import type { Ctor } from '@sapphire/utilities'

export function ApplyOptions<T extends PieceOptions>( optionsOrFn: T ): ClassDecorator {
	return createClassDecorator( ( target: Ctor<ConstructorParameters<typeof Piece>, Piece> ) =>
		createProxy( target, {
			construct: ( ctor, [ context, baseOptions = {} ]: [Piece.Context, Piece.Options] ) =>
				new ctor( context, {
					...baseOptions,
					...optionsOrFn
				} )
		} )
	)
}

export interface ApplyOptionsCallbackParameters {
	context: Piece.Context;
}
