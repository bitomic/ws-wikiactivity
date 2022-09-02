import './wikiactivity'
import { env, io, listeners, logger, server } from './lib'

( async () => {
	await listeners.loadAll()

	server.listen( env.PORT, () => logger.info( `Listening to port ${ env.PORT }` ) )

	process.on( 'SIGINT', () => {
		io.close()
		process.exit()
	} )
} )()
	.catch( () => {
		io.close()
	} )
