import { type FandomWiki } from 'mw.js'

export interface RecentChangesItem {
	oldRevid: number
	redirect?: boolean
	revid: number
	sizediff: number
	summary: string
	timestamp: number
	title: string
	type: string
	user: string
}

export const getRecentChanges = async ( wiki: Required<FandomWiki>, from: number, to: number ): Promise<RecentChangesItem[]> => {
	const recentchanges: RecentChangesItem[] = []

	const activity = wiki.iterQueryList( {
		list: 'recentchanges',
		// @ts-expect-error - blame the typings
		rcdir: 'newer',
		rcend: to,
		rclimit: 'max',
		rcprop: [
			'comment', 'ids', 'redirect', 'sizes', 'timestamp', 'title', 'user'
		],
		rcshow: '!bot',
		rcstart: from,
		rctype: [
			'categorize', 'edit', 'new'
		]
	} )
	for await ( const item of activity ) {
		const data: RecentChangesItem = {
			oldRevid: item.old_revid,
			revid: item.revid,
			sizediff: item.newlen - item.oldlen,
			summary: item.comment,
			timestamp: new Date( item.timestamp ).getTime(),
			title: item.title,
			type: item.type,
			user: item.user
		}
		recentchanges.push( data )
	}

	return recentchanges
}
