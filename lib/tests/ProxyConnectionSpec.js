/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals ajaxMockFactory, NGSI */

(function () {

    "use strict";

    describe("NGSI.ProxyConnection", function () {

        var ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            ajaxMockup.clear();
        });

        describe("new NGSI.ProxyConnection(url, makeRequest)", function () {

            it("normalizes provided urls", function () {
                var proxy = new NGSI.ProxyConnection("http://ngsiproxy.example.com/prefix", ajaxMockup);

                expect(proxy.url).toBe("http://ngsiproxy.example.com/prefix/");
                expect(proxy.connected).toBeFalsy();
                expect(proxy.connecting).toBeFalsy();
            });

        });

        describe("closeCallback(id)", function () {

            var connection;

            beforeEach(function () {
                connection = new NGSI.ProxyConnection("http://ngsiproxy.example.com/", ajaxMockup);

                // Allow callback creation
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                    headers: {
                        'Location': 'http://ngsiproxy.example.com/eventsource/1'
                    },
                    method: "POST",
                    status: 201
                });
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                    method: "POST",
                    responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                    status: 201
                });
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks/1", {
                    method: "DELETE",
                    status: 204
                });
            });

            it("returns a promise", function (done) {
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks/1", {
                    method: "DELETE",
                    status: 204
                });

                var p = connection.closeCallback(1);
                p.then(function () {
                    done();
                });
            });

            it("closes partially managed callbacks", function (done) {
                connection.requestCallback(function () {}).then(function (proxy_callback) {
                    var p = connection.closeCallback(1);
                    p.then(function () {
                        done();
                    });
                });
            });

            it("closes managed callbacks", function (done) {
                connection.requestCallback(function () {}).then(function (proxy_callback) {
                    connection.associateSubscriptionId(1, 1);
                    var p = connection.closeCallback(1);
                    p.then(function () {
                        done();
                    });
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks/1", {
                    method: "DELETE",
                    status: 404
                });

                connection.closeCallback(1).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });
        });

        describe("connect()", function () {

            it("returns a promise", function (done) {
                var proxy = new NGSI.ProxyConnection("http://ngsiproxy.example.com/", ajaxMockup);
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                    headers: {
                        'Location': 'http://ngsiproxy.example.com/eventsource/1'
                    },
                    method: "POST",
                    status: 201
                });

                var p = proxy.connect();

                expect(proxy.connecting).toBeTruthy();
                expect(p).toEqual(jasmine.any(Promise));
                p.then(function () {
                    expect(proxy.connected).toBeTruthy();
                    done();
                });
            });

            it("returns a resolved promise if already connected", function (done) {
                var proxy = new NGSI.ProxyConnection("http://ngsiproxy.example.com/", ajaxMockup);
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                    headers: {
                        'Location': 'http://ngsiproxy.example.com/eventsource/1'
                    },
                    method: "POST",
                    status: 201
                });

                proxy.connect().then(function () {
                    var p = proxy.connect();
                    expect(p).toEqual(jasmine.any(Promise))
                    var initial_connection_id = proxy.connection_id;
                    p.then(function () {
                        expect(proxy.connected).toBeTruthy();
                        expect(proxy.connection_id).toBe(initial_connection_id);
                        done();
                    });
                    expect(proxy.connecting).toBeFalsy();
                });
            });

        });

        describe("requestCallback(listener)", function () {

            var connection;

            beforeEach(function () {
                connection = new NGSI.ProxyConnection("http://ngsiproxy.example.com/", ajaxMockup);

                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                    headers: {
                        'Location': 'http://ngsiproxy.example.com/eventsource/1'
                    },
                    method: "POST",
                    status: 201
                });
            });

            describe("throws an error if listener is not a function", function () {
                var test = function (label, value) {
                    it(label, function () {
                        expect(function () {
                            connection.requestCallback(value);
                        }).toThrowError(TypeError);
                    });
                };

                test("null", null);
                test("number", 5);
                test("string", "hola");
                test("boolean", false);
            });

            it("returns a promise", function (done) {
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                    status: 201,
                    responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data.connection_id).toBe(1);
                    }
                });

                var p = connection.requestCallback(function () {});

                expect(p).toEqual(jasmine.any(Promise));
                p.then(function (proxy_callback) {
                    expect(proxy_callback).toEqual({
                        callback_id: "1",
                        url: "http://ngsiproxy.example.com/callback/1"
                    });
                    done();
                });
            });

            it("reports connection errors", function (done) {
                var p = connection.requestCallback(function () {});

                expect(p).toEqual(jasmine.any(Promise));
                p.then(function () {
                    fail("Success callback called");
                }, function (error) {
                    expect(error).toEqual(jasmine.any(NGSI.ConnectionError));
                    done();
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data.connection_id).toBe(1);
                    },
                    method: "POST",
                    responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                    status: 404
                });

                connection.requestCallback(function () {}).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

    });

})();
