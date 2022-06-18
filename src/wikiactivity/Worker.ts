import { type IWikiActivityData, queue, QUEUE_NAME } from './Queue'
import { type Job, Worker } from 'bullmq'
import { pino, redis } from '../lib'

const DELAY_SECONDS = 20

new Worker(
	QUEUE_NAME,
	async ( job: Job<IWikiActivityData, void, string> ) => {
		if ( job.name !== 'fetch' ) return

		const now = Date.now()
		const { lastCheck } = job.data

		pino.info( job.data )
		pino.info( lastCheck )

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
