var feedMe = require('feedme');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');

var sendErrorResponse = (res, message) => {
  res.writeHead(500);
  jsonResponse(res, {
    'status': 'error',
    'message': message,
  });
};

var jsonResponse = (res, data) => res.end(JSON.stringify(data));

var handleRequest = (req, res) => {
  var query = url.parse(req.url, true).query;
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Request-Method': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET',
    'Access-Control-Allow-Headers': '*',
  });
  
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
        res.writeHead(200);
        jsonResponse(res, parser.done());
      });
      parser.on('error', err => sendErrorResponse(res, err.message));
    }
  } else {
    sendErrorResponse(res, '`feed` parameter is required');
  }
};

var server = http.createServer(handleRequest);

server.listen(3000);