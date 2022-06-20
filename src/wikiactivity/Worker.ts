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
			const fandom = new Fandom()
			for ( const room of rooms ) {
				try {
					const wiki = await fandom.getWiki( room ).load()
					const activity = await getActivity( wiki, lastCheck, now )
					for ( const item of activity ) {
						io.to( room ).emit( 'activity', item )
						await sleep( 200 )
					}
					events += activity.length
				} catch ( e ) {
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					pino.error( `An error had occurred: ${ e }.`, { room } )
				}
			}
			if ( events > 0 ) pino.info( `Emitted ${ events } events.` )
		}

		await queue.add( 'fetch', { lastCheck: now }, { delay: 1000 * DELAY_SECONDS } )
	},
	{ connection: redis }
)

queue.getJobs().then( async jobs => {
	const count = jobs.filter( i => i.name === 'fetch' ).length
	if ( count === 1 ) {
		pino.info( 'A job is already scheduled.' )
		return
	} else if ( count > 1 ) {
		pino.warn( 'There are multiple jobs scheduled. Obliterating...' )
		await queue.obliterate( { force: true } )
	}

	await queue.add( 'fetch', { lastCheck: Date.now() - 1000 * 60 * 5 } )
	pino.info( 'An initial job has been scheduled.' )
} )
	.catch( e => {
		pino.error( 'Couldn\'t set the initial job.', e )
	} )
