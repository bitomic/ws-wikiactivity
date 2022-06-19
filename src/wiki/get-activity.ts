import type { DiscussionsItem } from './get-discussions-activity'
import type { FandomWiki } from 'mw.js'
import { getDiscussionsActivity } from './get-discussions-activity'
import { getRecentChanges } from './get-recent-changes'
import type { RecentChangesItem } from './get-recent-changes'

export const getActivity = async ( wiki: Required<FandomWiki>, from: number, to: number ): Promise<Array<DiscussionsItem | RecentChangesItem>> => {
	const data: Array<DiscussionsItem | RecentChangesItem> = []
	data.push( ...await getDiscussionsActivity( wiki, from / 1000, to / 1000 ) )
	data.push( ...await getRecentChanges( wiki, from, to ) )
	data.sort( ( a, b ) => ( 'timestamp' in a ? a.timestamp : a.created ) - ( 'timestamp' in b ? b.timestamp : b.created ) )
	return data
}
