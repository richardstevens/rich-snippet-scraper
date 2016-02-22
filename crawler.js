import prettyjson from 'prettyjson';
import microdata from './metadata';

const Crawler = ( pages ) => {
	const url = process.argv[2] || 'http://www.parkbcp.co.uk/gatwick/airport-parking.html';
	pages = Array.isArray( pages ) ? pages : [ url ];
	let i = 0;
	pages.forEach( page => {
		setTimeout( ( ) => {
			curlPage( page );
		}, i );
		i += 3000; // Lets wait 3 seconds per request - yes i did accidentally DDos them
	} );
};

const curlPage = ( url ) => {
	microdata.parseUrl( url, ( err, result ) => {
		if ( !err && result ) {
			result = JSON.parse( result );
			if ( !result.length ) result = { '-': 'No rich snippets' };
			console.log( '\nURL: ' + url );
			console.log( prettyjson.render( result ));
			console.log( '' );
		}
	} );
};

export default Crawler;
