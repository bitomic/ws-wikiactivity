// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClassDecorator<TFunction extends ( ...args: any[] ) => void>( fn: TFunction ): ClassDecorator {
	return fn
}
