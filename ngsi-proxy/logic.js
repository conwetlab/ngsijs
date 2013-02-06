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

var notifications = {};

var createNotification = function createNotification(res) {
    var id;

    id = (new Date()).toLocaleTimeString();
    while (id in notifications) {
        id += "'";
    }

    var notification = {
        id: id,
        response: res
    };
    notifications[id] = notification;

    return notification;
};

var removeNotification = function removeNotification(id) {
    delete notifications[id];
};

exports.eventsource = function eventsource(req, res) {
    res.header('Content-Type', 'text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');

    var notification = createNotification(res);
    console.log('created callback listener with id: ' + notification.id);

    res.write('event: init\n');
    res.write('data: ' + JSON.stringify({id: notification.id}).toString('utf8') + '\n\n');

    // If the client disconnects, let's not leak any resources
    res.on('close', function() {
        removeNotification(notification.id);
    });
};

exports.process_callback = function process_callback(req, res) {
    var notification = notifications[req.params.id];

    if (notification == null) {
        res.send(404);
        return;
    }

    var eventsource = notification.response;

    eventsource.write('event: notification\n');
    eventsource.write('data: ' + JSON.stringify({payload: 'hola'}).toString('utf8') + '\n\n');

    res.send(204);
};
