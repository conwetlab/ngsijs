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

/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    logic = require('./logic'),
    path = require('path');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.enable('case sensitive routing');
    app.use(express.logger('dev'));
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.post('/eventsource', logic.create_eventsource);
app.get('/eventsource/:id', logic.eventsource);
app.post('/callbacks', logic.create_callback);
app.post('/callbacks/:id', logic.process_callback);
app.delete('/callbacks/:id', logic.delete_callback);

http.createServer(app).listen(app.get('port'), function() {
    console.log("ngsi-proxy server listening on port " + app.get('port'));
});
