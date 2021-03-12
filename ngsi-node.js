/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
 *
 *     This file is part of ngsijs.
 *
 *     Ngsijs is free software: you can redistribute it and/or modify it under
 *     the terms of the GNU Affero General Public License as published by the
 *     Free Software Foundation, either version 3 of the License, or (at your
 *     option) any later version.
 *
 *     Ngsijs is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsijs. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

"use strict";

var http = require('http'),
    https = require('https');


class Response {

    constructor(message, body) {
        Object.defineProperties(this, {
            status: {value: message.statusCode},
            statusText: {value: message.statusMessage},
            responseText: {value: body},
            headers: {value: message.headers}
        });
    };

    getHeader(name) {
        name = String(name).toLowerCase();
        if (this.headers[name] != null) {
            return this.headers[name];
        } else {
            return null;
        }
    };

}


var merge = function merge(object) {

    /* This is controlled in our code, so it is not needed
    if (object == null || typeof object !== "object") {
        throw new TypeError("object argument must be an object");
    }*/

    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        if (source != null) {
            Object.keys(source).forEach(function (key) {
                if (source[key] != null) {
                    object[key] = source[key];
                }
            });
        }
    });

    return object;
};

var toQueryString = function toQueryString(parameters) {
    // PRE: this function does not support passing parameters as string
    var key, query = [];

    if (parameters != null) {
        for (key in parameters) {
            if (typeof parameters[key] === 'undefined') {
                continue;
            } else if (parameters[key] === null) {
                query.push(encodeURIComponent(key) + '=');
            } else {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]));
            }
        }

        if (query.length > 0) {
            return query.join('&');
        }
    }

    return null;
};


var privates = new WeakMap();


class Request {

    constructor(url, options) {

        if (options == null) {
            options = {};
        }

        var headers = merge({
            'Accept': 'application/json, */*'
        }, options.requestHeaders);


        // Headers
        if (options.postBody != null) {
            if (!('Content-Type' in headers)) {
                if (options.contentType != null) {
                    headers['Content-Type'] = options.contentType;
                } else {
                    headers['Content-Type'] = 'application/json';
                }
                if (options.encoding != null) {
                    headers['Content-Type'] += '; charset=' + options.encoding;
                }
            }

            headers['Content-Length'] = Buffer.byteLength(options.postBody);
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

        var promise_resolve;

        const handler = url.protocol === "http:" ? http : https;
        var request = handler.request({
            method: options.method,
            hostname: url.hostname,
            protocol: url.protocol,
            port: url.port,
            path: url.pathname + url.search,
            headers: headers
        }, function (response) {
            response.setEncoding('utf8');
            var buf = '';
            response.on('data', function (chunck) { buf += chunck; });
            response.on('end', function () {
                promise_resolve(new Response(response, buf));
            });
        });

        let promise = new Promise(function (resolve, reject) {
            promise_resolve = resolve;

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

        this.url = url;
        privates.set(this, {
            request: request,
            promise: promise,
            options: options
        });
    }

    then(onFulfilled, onRejected) {
        let _private = privates.get(this);
        return _private.promise.then(onFulfilled, onRejected);
    }

    catch(onRejected) {
        let _private = privates.get(this);
        return _private.promise.catch(onRejected);
    }

    abort() {
        let _private = privates.get(this);
        _private.request.abort();
        return this;
    }
}

/* makeRequest for Node.js */
var makeRequest = function makeRequest(url, options) {
    return new Request(url, options);
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
NGSI.Connection.LD = old_Connection.LD;

/* exports */
for (var key in NGSI) {
    exports[key] = NGSI[key];
}
