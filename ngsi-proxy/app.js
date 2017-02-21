/*
 *     Copyright (c) 2013-2017 CoNWeT Lab - Universidad Politécnica de Madrid
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
    app.use(express.logger('default'));
    app.use(app.router);
    app.use(express.compress());
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.options('/eventsource', logic.options_eventsource);
app.get('/eventsources', logic.list_eventsources);
app.post('/eventsource', logic.create_eventsource);
app.get('/eventsource/:id', logic.eventsource);
app.delete('/eventsource/:id', logic.delete_eventsource);
app.options('/callbacks', logic.options_callbacks);
app.post('/callbacks', logic.create_callback);
app.post('/callbacks/:id', logic.process_callback);
app.options('/callbacks/:id', logic.options_callback_entry);
app.delete('/callbacks/:id', logic.delete_callback);

http.createServer(app).listen(app.get('port'), function() {
    console.log("ngsi-proxy server listening on port " + app.get('port'));
});
