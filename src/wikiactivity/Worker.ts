import { io, pino, redis } from '../lib'
import { type Job, Worker } from 'bullmq'
import { queue, QUEUE_NAME } from './Queue'
import { Fandom } from 'mw.js'
import { getActivity } from '@bitomic/wikiactivity-api'
import { sleep } from '@bitomic/utilities'

let LAST_CHECK = new Date( Date.now() - 1000 * 60 * 5 )

// eslint-disable-next-line @typescript-eslint/no-misused-promises
new Worker(
	QUEUE_NAME,
	async ( job: Job<null, void, string> ) => {
		if ( job.name !== 'fetch' ) return
		try {
			const now = new Date()
			const lastCheck = LAST_CHECK
			LAST_CHECK = now

			pino.info( `Running from ${ lastCheck.toISOString() } to ${ now.toISOString() }` )
			const rooms = [ ...io.sockets.adapter.rooms.keys() ].filter( i => i !== '#default' )
			if ( rooms.length > 0 ) {
				let events = 0
				const updatedRooms = []
				const fandom = new Fandom()
				for ( const room of rooms ) {
					try {
						const wiki = await fandom.getWiki( room ).load()
						const activity = await getActivity( wiki, lastCheck, now )
						for ( const item of activity ) {
							io.to( room ).emit( 'activity', { ...item, wiki: room } )
							await sleep( 200 )
						}
						events += activity.length
						if ( activity.length > 0 ) {
							updatedRooms.push( room )
							pino.info( `Emitted ${ activity.length } events for ${ room }` )
						}
					} catch ( e ) {
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						pino.error( `An error had occurred: ${ e }.`, { room } )
					}
				}
				if ( events > 0 ) {
					pino.info( `Emitted ${ events } total events.` )
					io.to( updatedRooms ).emit( 'activity-end' )
				}
			}
		} catch ( e ) {
			pino.error( 'An unexpected error had occurred.' )
			pino.error( e )
		}

		void queue.add( 'fetch', null, { delay: 1000 * 20, jobId: 'fetch' } )
	},
	{ connection: redis }
)
