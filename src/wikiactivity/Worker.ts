import { createActivityItem, getActivity } from '@bitomic/wikiactivity-api'
import { io, logger, redis } from '../lib'
import { type Job, Worker } from 'bullmq'
import { queue, QUEUE_NAME } from './Queue'
import { Fandom } from 'mw.js'
import { sleep } from '@bitomic/utilities'

let LAST_CHECK = new Date( Date.now() - 1000 * 60 * 5 )

// eslint-disable-next-line @typescript-eslint/no-misused-promises
new Worker(
	QUEUE_NAME,
	async ( job: Job<null, void, string> ) => {
		if ( job.name !== 'fetch' ) return

		const now = new Date()
		const lastCheck = new Date( LAST_CHECK.getTime() - 1000 * 5 ) // 5 seconds ago
		const lastCheckTime = LAST_CHECK.getTime()

		try {
			const rooms = [ ...io.sockets.adapter.rooms.keys(), 'bitomic' ].filter( i => i !== '#default' )
			if ( rooms.length > 0 ) {
				let events = 0
				const updatedRooms = []
				const fandom = new Fandom()
				for ( const room of rooms ) {
					try {
						const wiki = await fandom.getWiki( room ).load()
						const activity = await getActivity( wiki, lastCheck, now )
							.catch( e => {
								logger.error( `There was an error while trying to fetch ${ room }` )
								logger.error( e )
								return []
							} )
						for ( const item of activity ) {
							const activityItem = createActivityItem( item )
							if ( activityItem.isDiscussions() && activityItem.creationDate.epochSecond <= lastCheckTime / 1000
								|| ( activityItem.isLogEvents() || activityItem.isRecentChanges() ) && new Date( activityItem.timestamp ).getTime() <= lastCheckTime  ) {
								continue
							}
							io.to( room ).emit( 'activity', { ...item, wiki: room } )
							await sleep( 200 )
						}
						events += activity.length
						if ( activity.length > 0 ) {
							updatedRooms.push( room )
							logger.info( `Emitted ${ activity.length } events for ${ room }` )
						}
					} catch ( e ) {
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						logger.error( `An error had occurred: ${ e }.`, { room } )
					}
				}
				if ( events > 0 ) {
					logger.info( `Emitted ${ events } total events.` )
					io.to( updatedRooms ).emit( 'activity-end' )
				}
			}
		} catch ( e ) {
			logger.error( 'An unexpected error had occurred.' )
			logger.error( e )
		}

		void queue.add( 'fetch', null, { delay: 1000 * 20 } )
		LAST_CHECK = now
	},
	{ connection: redis }
)

queue.obliterate( { force: true } )
	.then( () => void queue.add( 'fetch', null ) )
	.then( () => logger.info( 'Registered initial job.' ) )
	.catch( logger.error )
