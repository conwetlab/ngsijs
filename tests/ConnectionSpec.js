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

/* globals NGSI */

(function () {

    "use strict";

    describe("NGSI.Connection", function () {

        describe("new NGSI.Connection(url[, options])", function () {

            it("normalizes provided urls", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/prefix");

                expect(connection.url).toEqual(new URL("http://ngsi.example.com:1026/prefix/"));
            });

            it("supports URL instances", function () {
                var url = new URL("http://ngsi.example.com:1026");
                var connection = new NGSI.Connection(url);

                expect(connection.url).toEqual(url);
            });

            it("throws an exception when passing an invalid URL string", function () {
                expect(function () {
                    new NGSI.Connection("invalid url");
                }).toThrowError(TypeError);
            });

            it("throws TypeError exceptions when passing url using unsupported protocol", function () {
                expect(function () {
                    new NGSI.Connection("a://ngsi.example.com:1026");
                }).toThrowError(TypeError);
            });

            it("throws TypeError exceptions when passing url using unsupported protocol (using URL instances)", function () {
                expect(function () {
                    new NGSI.Connection(new URL("ftp://ngsi.example.com:1026"));
                }).toThrowError(TypeError);
            });

            it("supports the headers option", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/prefix", {
                    headers: {
                        'Authorization': 'Bearer token'
                    }
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'Authorization': 'Bearer token'
                });
            });

            it("supports the service option", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/prefix", {
                    service: 'AirQuality'
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'FIWARE-Service': 'AirQuality'
                });
            });

            it("supports the servicepath option", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/", {
                    servicepath: '/Spain/Madrid'
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'FIWARE-ServicePath': '/Spain/Madrid'
                });
            });

            it("supports using the 'headers', 'service' and 'servicepath' options at the same time", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/", {
                    headers: {
                        'Authorization': 'Bearer token'
                    },
                    service: 'AirQuality',
                    servicepath: '/Spain/Madrid'
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'Authorization': 'Bearer token',
                    'FIWARE-Service': 'AirQuality',
                    'FIWARE-ServicePath': '/Spain/Madrid'
                });
            });

            it("gives preference to the service when the FIWARE-Service header is provided using the headers option", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/", {
                    headers: {
                        'Fiware-Service': 'myservice'
                    },
                    service: 'AirQuality'
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'FIWARE-Service': 'AirQuality'
                });
            });

            it("gives preference to the servicepath option when the FIWARE-ServicePath header is provided using the headers option", function () {
                var connection = new NGSI.Connection("http://ngsi.example.com:1026/", {
                    headers: {
                        'Fiware-Servicepath': '/my/path'
                    },
                    servicepath: '/Spain/Madrid'
                });

                // TODO request_headers is not part of the stable API
                expect(connection.headers).toEqual({
                    'FIWARE-ServicePath': '/Spain/Madrid'
                });
            });

        });

    });

})();
