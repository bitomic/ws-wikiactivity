export function createProxy<T extends object>( target: T, handler: Omit<ProxyHandler<T>, 'get'> ): T {
	return new Proxy( target, {
		...handler,
		get: ( target, property ) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const value = Reflect.get( target, property )
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return typeof value === 'function' ? ( ...args: readonly unknown[] ) => value.apply( target, args ) : value
		}
	} )
}
