import { env, io, ListenerStore, pino, server } from './lib'
import path from 'path'

( async () => {
	const store = new ListenerStore().registerPath( path.resolve( __dirname, 'listeners' ) )
	await store.loadAll()

	server.listen( env.PORT, () => pino.info( `Listening to port ${ env.PORT }` ) )

	process.on( 'SIGINT', () => {
		io.close()
		process.exit()
	} )
} )()
	.catch( () => {
		io.close()
	} )
