/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
 *
 *     This file is part of ngsi-proxy.
 *
 *     Ngsi-proxy is free software: you can redistribute it and/or modify it
 *     under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     Ngsi-proxy is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsi-proxy. If not, see <http://www.gnu.org/licenses/>.
 *
 */

var connections = {};
var callbacks = {};

var createConnection = function createConnection() {
    var id;

    id = (new Date()).toLocaleTimeString();
    while (id in connections) {
        id += "'";
    }

    var connection = {
        id: id,
        response: null,
        callbacks: {}
    };
    connections[id] = connection;

    console.log('Created connection with id: ' + connection.id);
    return connection;
};

var createCallback = function createCallback(connection) {
    var local_id, id;

    local_id = (new Date()).toLocaleTimeString();
    while (local_id in connection.callbacks) {
        local_id += "'";
    }

    id = connection.id + ':' + local_id;
    callback_info = connection.callbacks[local_id] = {
        id: id,
        local_id: local_id,
        connection: connection
    };
    callbacks[id] = callback_info;

    console.log('Created callback with id: ' + id);
    return callback_info;
};

var removeCallback = function removeCallback(id) {
    var callback_info = callbacks[id];

    delete callback_info.connection.callbacks[callback_info.local_id];
    delete callbacks[id];
    callback_info.connection = null;

    console.log('Deleted callback with id: ' + id);
};

var removeConnection = function removeConnection(id) {
    delete connections[id];
    console.log('Closed connection with id: ' + id);
};

var URL = require('url');
var build_absolute_url = function build_absolute_url(req, url) {
    var protocol, domain, path;

    protocol = req.protocol;
    domain = req.header('host');
    path = req.url;

    return URL.resolve(protocol + "://" + domain + req.url, url);
};

exports.options_eventsource = function create_eventsource(req, res) {
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.send(204);
};

exports.create_eventsource = function create_eventsource(req, res) {
    var connection = createConnection();

    url = build_absolute_url(req, '/eventsource/' + connection.id);

    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.location(url);
    res.send(201, JSON.stringify({
        connection_id: connection.id,
        url: url
    }));
};

exports.eventsource = function eventsource(req, res) {
    var connection = connections[req.params.id];

    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    req.socket.setTimeout(0);

    if (connection == null) {
        res.send(404);
        return;
    }

    connection.response = res;

    res.header('Content-Type', 'text/event-stream');
    res.write('event: init\n');
    res.write('data: ' + JSON.stringify({
            id: connection.id,
            url: build_absolute_url(req, '/eventsource/' + connection.id)
        }).toString('utf8') + '\n\n');

    // If the client disconnects, let's not leak any resources
    // res.on('close', function() {
    //     removeConnection(connection.id);
    // });
};

exports.options_callbacks = function options_callbacks(req, res) {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.header('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.send(204);
};

exports.create_callback = function create_callback(req, res) {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));

    var buf = '';
    req.setEncoding('utf8');
    req.on('data', function (chunck) { buf += chunck; });
    req.on('end', function () {
        var data, connection, callback_info;

        buf = buf.trim();

        if (buf.length === 0) {
            res.send(400, 'invalid json: empty request body');
            return;
        }

        try {
            data = JSON.parse(buf);
        } catch (e) {
            res.send(400, 'invalid json: ' + e);
            return;
        }

        connection = connections[data.connection_id];

        if (connection == null) {
            res.send(404);
            return;
        }
        callback_info = createCallback(connection);
        res.header('Content-Type', 'application/json');
        res.send(200, JSON.stringify({
            callback_id: callback_info.id,
            url: build_absolute_url(req, '/callbacks/' + callback_info.id)
        }));
    });
};

exports.process_callback = function process_callback(req, res) {

    if (!(req.params.id in callbacks)) {
        res.send(404);
        return;
    }

    console.log('Processing callback ' + req.params.id);
    var connection = callbacks[req.params.id].connection;

    buf = '';
    req.on('data', function (chunck) { buf += chunck; });
    req.on('end', function () {
        var eventsource = connection.response;

        var data = JSON.stringify({callback_id: req.params.id, payload: buf}).toString('utf8');
        eventsource.write('event: notification\n');
        eventsource.write('data: ' + data + '\n\n');

        res.send(204);
    });
};

exports.options_callback_entry = function options_callback_entry(req, res) {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS, POST');
    res.send(204);
};

exports.delete_callback = function delete_callback(req, res) {
    console.log('Deleting callback ' + req.params.id);

    if (!(req.params.id in callbacks)) {
        res.send(404);
        return;
    }

    removeCallback(req.params.id);
    res.send(204);
};
