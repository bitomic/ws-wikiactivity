export const parseInterwiki = ( interwiki: string ): string | null => {
	const match = interwiki.match( /^([a-z-]{2,5})\.([a-z-]+)$/ ) ?? interwiki.match( /^([a-z-]+)$/ )
	if ( !match ) return null
	const [ , first, second ] = match
	if ( !first ) return null
	return second
		? `https://${ second }.fandom.com/${ first }/api.php`
		: `https://${ first }.fandom.com/api.php`
}
