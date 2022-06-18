import type { FandomWiki } from 'mw.js'

export const getDiscussionsUrl = ( wiki: Required<FandomWiki>, threadId: string, replyId?: string ): string => {
	let url = `${ wiki.server }${ wiki.scriptpath }/f/p/${ threadId }`
	if ( replyId ) {
		url = `${ url }/r/${ replyId }`
	}
	return url
}
