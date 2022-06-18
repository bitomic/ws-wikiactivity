import { Queue, QueueEvents, QueueScheduler } from 'bullmq'
import { redis } from '../lib'

export interface IWikiActivityData {
	lastCheck: number
}

export const QUEUE_NAME = 'wikiactivity'

export const queue = new Queue<IWikiActivityData, void, string>( QUEUE_NAME, {
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

export const scheduler = new QueueScheduler( QUEUE_NAME, { connection: redis } )

export const events = new QueueEvents( QUEUE_NAME, { connection: redis } )
