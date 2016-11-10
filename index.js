var feedMe = require('feedme');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');

var sendErrorResponse = (res, message) => {
  res.statusCode = 400;
  jsonResponse(res, {
    'status': 'error',
    'message': message,
  });
};

var jsonResponse = (res, data) => res.end(JSON.stringify(data));

var handleRequest = (req, res) => {
  var query = url.parse(req.url, true).query;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (query.feed) {
    var feedURL;
    
    try {
      feedURL = url.parse(query.feed);
    } catch(e) {
      sendErrorResponse(res, 'Invalid url');
      return;
    }
    
    if (feedURL) {
      var parser = new feedMe(true);
      var client;
      
      if (feedURL.protocol === 'https:') {
        client = https;
      } else if (feedURL.protocol === 'http:') {
        client = http;
      } else {
        sendErrorResponse(res, 'Invalid url');
        return;
      }

      client
        .get(feedURL.href, feedRes => feedRes.pipe(parser))
        .on('error', err => sendErrorResponse(res, err.message));

      parser.on('end', () => {
        jsonResponse(res, parser.done());
      });
      parser.on('error', err => sendErrorResponse(res, err.message));
    }
  } else {
    sendErrorResponse(res, '`feed` parameter is required');
  }
};

var server = http.createServer(handleRequest);

server.listen(8765);
