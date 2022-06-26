import { ApplyOptions, Listener, type ListenerOptions, pino } from '../lib'
import { queue } from '../wikiactivity'

@ApplyOptions<ListenerOptions>( {
	event: 'reset',
	type: 'client'
} )
export class CustomListener extends Listener {
	public async run(): Promise<void> {
		const jobs = await queue.getJobs()
		if ( jobs.length > 0 ) {
			pino.warn( 'Tried to restart jobs, but there is already a scheduled job.' )
			return
		}

		await queue.obliterate( { force: true } )
		await queue.add( 'fetch', { lastCheck: Date.now() - 1000 * 60 * 5 } )
	}
}
