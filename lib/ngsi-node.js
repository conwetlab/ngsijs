// NGSI config
var http = require('http');
var node_url = require('url');

/* makeRequest for Node.js */
var makeRequest = function makeRequest(url, options) {
    var parsed_url = node_url.parse(url);

    if (options.requestHeaders == null || typeof options.requestHeaders !== 'object') {
        options.requestHeaders = {};
    }
    options.requestHeaders['Content-Type'] = 'application/json'
    options.requestHeaders['Accept'] = 'application/json'
    options.requestHeaders['Content-Length'] = options.postBody.length;

    var request = http.request({
            method: options.method,
            hostname: parsed_url.hostname,
            port: parsed_url.port,
            path: parsed_url.path,
            headers: options.requestHeaders
        }, function(response) {
            response.setEncoding('utf8');
            buf = '';
            response.on('data', function (chunck) { buf += chunck; });
            response.on('end', function () {
                try {
                    if ((response.statusCode >= 200 && response.statusCode < 300) && (typeof options.onSuccess === 'function')) {
                        options.onSuccess({responseText: buf});
                    } else {
                        options.onFailure({responseText: buf});
                    } 
                } catch (e) {
                }

                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            });
        });

    request.on('error', function (e) {
        console.log('adios');
        console.log(e.message);
        try {
            if (typeof options.onFailure === 'function') {
                options.onFailure({});
            }
        } catch (e) {
        }

        if (typeof options.onComplete === 'function') {
            options.onComplete();
        }
    });

    if (options.postBody != null) {
        request.write(options.postBody);
    }
    debugger;
    request.end();
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

/* exports */
for (var key in NGSI) {
    exports[key] = NGSI[key];
}
