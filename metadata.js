var $       = require('cheerio')
var request = require('request')
var md5     = require('MD5')
var items 	= [ ];

/*
 * get the correct sanitized value from html 'tag'
 */
function getPropValue(tag) {
	var value = '';
  if ($(tag).attr('content')) {
    value = $(tag).attr('content');
  } else if($(tag).attr('itemprop') == 'image' && $(tag).attr('src')) {
    value = $(tag).attr('src');
  } else if($(tag).attr('itemprop') == 'availability' && $(tag).attr('href')) {
    value = $(tag).attr('href').split('/')[3]
  } else {
    value = $(tag).text().replace(/[\n\t\r]+/g,'').replace(/ +(?= )/g,'');
  };
  return value.trim();
}

/*
 * returns index matching the id
 */
function arraySearch(arr,val) {
  for (var i=0; i<arr.length; i++)
    if (arr[i].id == val) {
      return i;
    }
}

/*
 * Process given html to find values related to hreview-aggregate
 */
function gethReviewValue( element ) {
	var hReview = { };
	if ( !element ) return hReview;
	if ( $( '.count', element )) hReview.count = $( '.count', element ).text( ).trim( );
	if ( $( '.fn', element )) hReview.item = $( '.fn', element ).text( ).trim( );
	if ( $( '.average', element )) hReview.average = $( '.average', element ).text( ).trim( );
	return hReview;
}


/*
 * process given item with given type
 */
function processTag(type, item) {
  switch(type) {
  case 'itemtype':
    // console.log(i+" TYPE => "+md5($(item).html())+" => "+$(item).attr('itemtype'));
    items.push({'id': md5($(item).html()), 'name': $(item).attr('itemtype'), 'properties': {} });
    break;
  case 'itemprop':
    // console.log(i+" PROP => "+md5($(item).parents("[itemtype]").html())+" => "+$(item).attr('itemprop')+" from "+$(item).parents("[itemtype]").attr("itemtype"));
    var property    = $(item).attr('itemprop');
    var value       = getPropValue(item);
    var item_index  = arraySearch(items, md5($(item).parents("[itemtype]").html()));
    items[item_index].properties[property] = value;
    break;
  case 'hreview':
    var properties = gethReviewValue( $( item ));
    items.push({'id': md5($(item).html()), 'name': 'hreview-aggregate', 'properties': properties });
    break;
  default:
  }

}

/*
 * parse HTML content and return a JSON
 */
function parse(err, resp, html) {
  items = [];

  if (err) return console.error(err)
  var parsedHTML = $.load(html)

  parsedHTML('[itemtype], [itemprop], .hreview-aggregate').map(function(i, item) {

    if ( $(item).attr("itemtype") && $(item).attr("itemprop") ) {
      processTag('itemtype', item);
      processTag('itemprop', item);
    } else if ( $(item).attr("itemtype") ) {
      processTag('itemtype', item);
    } else if ( $(item).attr("itemprop") ) {
      processTag('itemprop', item);
    } else if ( $(item).hasClass("hreview-aggregate") ) {
      processTag('hreview', item);
    }

  })

  return JSON.stringify(items);

}

/*
 * get HTML from url and parse it
 */
function parseUrl(url, callback) {
  var options = {
    uri: url,
    method: "GET",
    followRedirect: true
  }
  request(options, function(err, res, body) {
    if (err) {
    } else {
      callback(err, parse(err, res, body));
      body = null;
    }
  });
}

exports.parse     = parse;
exports.parseUrl  = parseUrl;
