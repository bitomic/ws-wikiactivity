import { io, pino, redis } from '../lib'
import { type IWikiActivityData, queue, QUEUE_NAME } from './Queue'
import { type Job, Worker } from 'bullmq'
import { Fandom } from 'mw.js'
import { getActivity } from '../wiki/get-activity'
import { sleep } from '@bitomic/utilities'

const DELAY_SECONDS = 20

new Worker(
	QUEUE_NAME,
	async ( job: Job<IWikiActivityData, void, string> ) => {
		if ( job.name !== 'fetch' ) return

		const now = Date.now()
		const { lastCheck } = job.data

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
					if ( activity.length > 0 ) updatedRooms.push( room )
				} catch ( e ) {
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					pino.error( `An error had occurred: ${ e }.`, { room } )
				}
			}
			if ( events > 0 ) {
				pino.info( `Emitted ${ events } events.` )
				io.to( updatedRooms ).emit( 'activity-end' )
			}
		}

		await queue.add( 'fetch', { lastCheck: now }, { delay: 1000 * DELAY_SECONDS } )
	},
	{ connection: redis }
)
