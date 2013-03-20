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
var connections_by_callback = {};

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

    console.log('created connection with id: ' + connection.id);
    return connection;
};

var createCallback = function createCallback(connection) {
    var local_id, id;

    local_id = (new Date()).toLocaleTimeString();
    while (local_id in connection.callbacks) {
        local_id += "'";
    }

    id = connection.id + ':' + local_id;
    callback_info = connection.callbacks[id] = {
        id: id,
        local_id: local_id
    };
    connections_by_callback[id] = connection;

    console.log('created callback with id: ' + id);
    return callback_info;
};

var removeCallback = function removeCallback(id) {
    connection = connections_by_callback[id];

    delete connection.callbacks[id];
    delete connections_by_callback[id];
    console.log('deleted callback with id: ' + id);
};

var removeConnection = function removeConnection(id) {
    delete connections[id];
    console.log('closed connection with id: ' + id);
};

exports.create_eventsource = function create_eventsource(req, res) {
    var connection = createConnection();
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', req.header('Origin'));
    res.location('/eventsource/' + connection.id);
    res.send(201);
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
            url: 'http://localhost:3000/eventsource/' + connection.id
        }).toString('utf8') + '\n\n');

    // If the client disconnects, let's not leak any resources
    // res.on('close', function() {
    //     removeConnection(connection.id);
    // });
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
            url: 'http://localhost:3000/callbacks/' + callback_info.id
        }));
    });
};

exports.process_callback = function process_callback(req, res) {
    console.log('Processing callback ' + req.params.id);
    var connection = connections_by_callback[req.params.id];

    if (connection == null) {
        res.send(404);
        return;
    }

    buf = '';
    req.on('data', function (chunck) { buf += chunck; });
    req.on('end', function () {
        var eventsource = connection.response;

        var data = JSON.stringify({callback_id: req.params.id, payload: buf}).toString('utf8');
        eventsource.write('event: notification\n');
        eventsource.write('data: ' + data + '\n\n');
        console.log('Processed response: ' + data);

        res.send(204);
    });
};

exports.delete_callback = function delete_callback(req, res) {
};
