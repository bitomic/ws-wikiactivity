import { Queue, QueueEvents, QueueScheduler } from 'bullmq'
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
		removeOnComplete: {
			age: 60 * 60 * 24 * 15, // 15 days
			count: 30
		}
	}
} )

export const scheduler = new QueueScheduler( QUEUE_NAME, { connection: redis } )

export const events = new QueueEvents( QUEUE_NAME, { connection: redis } )
