import { Fandom, type FandomWiki } from 'mw.js'
import { getDiscussionsUrl } from './get-discussions-url'
import { getUrl } from './get-url'
import { pino } from '../lib'
import { request } from 'undici'

interface DiscussionsArticleNamesResponse {
	articleNames?: {
		[ key: string ]: {
			title: string
		}
	}
}

export interface DiscussionsResponse {
	_embedded: {
		'doc:posts': Array<{
			createdBy: {
				avatarUrl: string | null
				name: string | null
				badgePermission: string
			}
			creationDate: {
				epochSecond: number
			}
			creatorIp: string
			forumId: string
			forumName: string | null
			id: string
			isReply: boolean
			jsonModel: string
			modificationDate: unknown | null
			rawContent: string
			threadId: string
			title: string | null
			_embedded: {
				thread: Array<{
					containerType: string
				}>
			}
		}>
	}
}

export const getDiscussionsActivity = async ( wiki: Required<FandomWiki>, from: number, to: number ): Promise<DiscussionsItem[]> => {
	const path = Fandom.interwiki2path( wiki.interwiki )
	const url = `${ path }/wikia.php?controller=DiscussionPost&method=getPosts&sortDirection=descending&sortKey=creation_date&limit=100&includeCounters=false`
	const { body, statusCode } = await request( url )
	if ( statusCode !== 200  ) return []

	const response = await body.json() as DiscussionsResponse
	const posts = response._embedded[ 'doc:posts' ].filter( post => {
		const created = post.creationDate.epochSecond
		return created > from && created < to
	} )

	const pagesByIds = await loadDiscussionsPagesByIds( posts, path )

	return posts.map( post => formatDiscussionsItem( post, pagesByIds, wiki ) )
}

interface DiscussionsJsonModel {
	content: Array<{
		content?: Array<{
			text?: string
		}>
	}>
}

export interface DiscussionsItem {
	author: {
		avatar: string | null
		badge: string | null
		name: string | null
	}
	content: string | null
	created: number
	id: string
	isReply: boolean
	pageTitle?: string | null
	threadId: string
	title: string | null
	wallOwner?: string | null
	url?: string | null
}

const formatDiscussionsItem = ( post: DiscussionsResponse[ '_embedded' ][ 'doc:posts' ][ number ], pages: Record<string, string>, wiki: Required<FandomWiki> ): DiscussionsItem => {
	const data: DiscussionsItem = {
		author: {
			avatar: post.createdBy.avatarUrl,
			badge: post.createdBy.badgePermission,
			name: post.createdBy.name ?? post.creatorIp
		},
		content: post.rawContent,
		created: post.creationDate.epochSecond * 1000,
		id: post.id,
		isReply: post.isReply,
		threadId: post.threadId,
		title: post.title
	}

	if ( post._embedded.thread[ 0 ]?.containerType === 'ARTICLE_COMMENT' ) {
		if ( data.content?.length === 0 ) {
			try {
				const jsonModel = JSON.parse( post.jsonModel ) as DiscussionsJsonModel
				const text = jsonModel.content.find( i => i.content )?.content?.find( i => i.text )?.text
				if ( text && text.length > 0 ) {
					data.content = text
				}
			} catch {
				pino.warn( 'Failed to parse a comment in an article' )
			}

			data.pageTitle = pages[ post.forumId ] ?? null
			if ( data.pageTitle ) {
				data.url = `${ getUrl( wiki, data.pageTitle ) }?commentId=${ data.threadId }`
				if ( data.isReply ) data.url += `#${ data.id }`

			}
		}
	} else if ( post.forumName?.endsWith( 'Message Wall' ) ) {
		data.wallOwner = post.forumName.substring( 0, post.forumName.length - ' Message Wall'.length )
		if ( data.wallOwner ) {
			data.url = getUrl( wiki, `Message Wall:${ data.wallOwner }?threadId=${ data.threadId }` )
			if ( data.isReply ) data.url += `#${ data.id }`
		}
	} else {
		data.url = getDiscussionsUrl( wiki, data.threadId, data.id )
	}

	cleanObject( data )
	return data
}

const cleanObject = ( obj: DiscussionsItem | DiscussionsItem[ 'author' ] ): void => {
	for ( const prop in obj ) {
		// @ts-expect-error - dumb ts
		const value = obj[ prop ] // eslint-disable-line @typescript-eslint/no-unsafe-assignment
		// @ts-expect-error - dumb ts
		if ( typeof value === 'string' && value === '' ) obj[ prop ] = null
		else if ( typeof value === 'object' ) cleanObject( value )  // eslint-disable-line @typescript-eslint/no-unsafe-argument
	}
}

export const loadDiscussionsPagesByIds = async ( posts: DiscussionsResponse[ '_embedded' ][ 'doc:posts' ], path: string ): Promise<Record<string, string>> => {
	const pageids = new Set<string>()
	for ( const post of posts ) {
		if ( post._embedded.thread[ 0 ]?.containerType && post._embedded.thread[ 0 ].containerType === 'ARTICLE_COMMENT' ) {
			pageids.add( post.forumId )
		}
	}

	const ids = [ ...pageids ].join( ',' )
	const url = `${ path }/wikia.php?controller=FeedsAndPosts&method=getArticleNamesAndUsernames&stablePageIds=${ ids }&format=json`
	const { body } = await request( url )
	const response = await body.json() as DiscussionsArticleNamesResponse

	if ( !response.articleNames ) return {}
	return Object.entries( response.articleNames ).reduce( ( collection, [ key, value ] ) => {
		collection[ key ] = value.title
		return collection
	}, {} as Record<string, string> )
}
