import type { FandomWiki } from 'mw.js'

export const getUrl = ( wiki: Required<FandomWiki>, target: string ): string => {
	const base = `${ wiki.server }${ wiki.articlepath }`
	return base.replace( '$1', encodeURI( target ) )
}
