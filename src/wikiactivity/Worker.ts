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
		pino.info( `Running for the following wikis with last check ${ new Date( lastCheck ).toISOString() }: ${ rooms.join( ', ' ) }` )
		const fandom = new Fandom()
		for ( const room of rooms ) {
			try {
				const wiki = await fandom.getWiki( room ).load()
				const activity = await getActivity( wiki, lastCheck, now )
				for ( const item of activity ) {
					io.to( room ).emit( 'activity', item )
					await sleep( 200 )
				}
				pino.info( `Emitted ${ activity.length } events in room ${ room }.` )
			} catch ( e ) {
				pino.error( `An error had occurred while processing room ${ room }.` )
			}
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
