"use strict";

var http = require('http'),
    https = require('https');

var Response = function Response(message, body) {
    Object.defineProperties(this, {
        status: {value: message.statusCode},
        statusText: {value: message.statusMessage},
        responseText: {value: body}
    });
    this.headers = message.headers;
};

Response.prototype.getHeader = function getHeader(name) {
    name = String(name).toLowerCase();
    if (this.headers[name] != null) {
        return this.headers[name];
    } else {
        return null;
    }
};


var toQueryString = function toQueryString(parameters) {
    var key, query = [];

    if (parameters == null) {
        return null;
    } else if (typeof parameters === 'string') {
        parameters = parameters.trim();
        if (parameters !== '') {
            return parameters;
        } else {
            return null;
        }
    } else /* if (typeof parameters === 'object') */ {
        for (key in parameters) {
            if (typeof parameters[key] === 'undefined') {
                continue;
            } else if (parameters[key] === null) {
                query.push(encodeURIComponent(key) + '=');
            } else {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]));
            }
        }
    }

    if (query.length > 0) {
        return query.join('&');
    } else {
        return null;
    }
};


/* makeRequest for Node.js */
var makeRequest = function makeRequest(url, options) {

    if (options.requestHeaders == null || typeof options.requestHeaders !== 'object') {
        options.requestHeaders = {
            Accept: 'application/json'
        };
    }

    // Headers
    if (options.postBody != null) {
        options.requestHeaders['Content-Type'] = 'application/json';
        options.requestHeaders['Content-Length'] = Buffer.byteLength(options.postBody);
    }

    // parameters
    var querystring = toQueryString(options.parameters);
    if (querystring != null) {
        if (url.search.length > 0) {
            url.search += '&' + querystring;
        }  else {
            url.search += '?' + querystring;
        }
    }

    return new Promise(function (resolve, reject) {
        var handler = url.protocol === "http:" ? http : https;
        var request = handler.request({
            method: options.method,
            hostname: url.hostname,
            protocol: url.protocol,
            port: url.port,
            path: url.pathname + url.search,
            headers: options.requestHeaders
        }, function (response) {
            response.setEncoding('utf8');
            var buf = '';
            response.on('data', function (chunck) { buf += chunck; });
            response.on('end', function () {
                resolve(new Response(response, buf));
            });
        });

        request.on('error', (e) => {
            if (e != null && "message" in e) {
                reject(new NGSI.ConnectionError(e.message));
            } else {
                reject(new NGSI.ConnectionError(String(e)));
            }
        });

        if (options.postBody != null) {
            request.write(options.postBody);
        }
        request.end();
    });
};

/* NGSI */
var NGSI = require('./NGSI');
var old_Connection = NGSI.Connection;
NGSI.Connection = function Connection(url, options) {
    if (options == null) {
        options = {}
    }

    if (!('requestFunction' in options)) {
        options.requestFunction = makeRequest;
    }

    old_Connection.call(this, url, options);
};
NGSI.Connection.prototype = old_Connection.prototype;
NGSI.Connection.V2 = old_Connection.V2;

/* exports */
for (var key in NGSI) {
    exports[key] = NGSI[key];
}
