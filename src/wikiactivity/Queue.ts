import { Queue, QueueEvents } from 'bullmq'
import { redis } from '../lib'

export const QUEUE_NAME = 'wikiactivity'

export const queue = new Queue<null, void, string>( QUEUE_NAME, {
	connection: redis,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			delay: 1000,
			type: 'exponential'
		},
		removeOnComplete: true
	}
} )

export const events = new QueueEvents( QUEUE_NAME, { connection: redis } )
