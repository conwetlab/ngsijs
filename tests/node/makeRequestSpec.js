/*
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

/* eslint-env node */
/* eslint strict: ["error", "never"] */
/* global NGSI */


var http = require('http');
var https = require('https');
var URL = require('url').URL;


describe("default makeRequest for browsers", function () {

    var makeRequest, abort_mock, end_mock, on_mock, write_mock;

    beforeAll(function () {
        makeRequest = new NGSI.Connection("http://orion.example.com/").makeRequest;
    });

    var request_mock = function request(abort_mock, end_mock, on_mock, write_mock, option, oncomplete) {
        return {
            abort: abort_mock,
            on: on_mock,
            write: write_mock,
            end: end_mock
        };
    };

    var endRequest = function endRequest(status, statusText, headers, data) {
        var key;

        var response = {
            setEncoding: jasmine.createSpy('setEncoding'),
            on: jasmine.createSpy('on'),
            statusCode: status,
            statusMessage: statusText,
            headers: headers != null ? headers : {}
        };

        if (status !== 0) {
            http.request.calls.argsFor(0)[1](response);
            setTimeout(() => {
                if (data != null) {
                    findListener(response.on, 'data')(data);
                }
                findListener(response.on, 'end')(data);
            }, 0);
        } else {
            if (statusText) {
                var error = new Error(statusText);
                findListener(on_mock, 'error')(error);
            } else {
                findListener(on_mock, 'error')();
            }
        }
    };

    var findListener = function findListener(spy, name) {
        var result = null;
        spy.calls.allArgs().some(function (args) {
            if (args[0] === name) {
                result = args[1];
                return true;
            }
        });
        return result;
    };

    beforeEach(function () {
        abort_mock = jasmine.createSpy('abort');
        end_mock = jasmine.createSpy('end');
        on_mock = jasmine.createSpy('on');
        write_mock = jasmine.createSpy('write');
        spyOn(http, "request").and.callFake(request_mock.bind(null, abort_mock, end_mock, on_mock, write_mock));
        spyOn(https, "request").and.callFake(request_mock.bind(null, abort_mock, end_mock, on_mock, write_mock));
    });

    describe("makeRequest(url, options)", function () {

        it("should work with URL instances", function () {
            var original = new URL("http://server:1234/path?q=1");

            var request = makeRequest(original);
            expect(request.url).toEqual(original);
        });

        it("should support using https", function () {
            var url = new URL("https://server:1234/path");

            var request = makeRequest(url);

            expect(request.url).toEqual(url);
            expect(https.request.calls.count()).toBe(1);
        });

        it("should ignore null values for the requestHeaders option", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                requestHeaders: null
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                Accept: "application/json, */*"
            });
        });

        it("should ignore null headers", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                requestHeaders: {
                    empty: null
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                Accept: "application/json, */*"
            });
        });

        it("should support setting headers", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                requestHeaders: {
                    MyHeader: "Value"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                Accept: "application/json, */*",
                MyHeader: "Value"
            });
        });

        it("should ignore undefined headers", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                requestHeaders: {
                    empty: undefined
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                Accept: "application/json, */*"
            });
        });

        it("should ignore the contentType option if the client provides a Conten-Type header", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                contentType: "text/plain",
                requestHeaders: {
                    "Content-Type": "application/custom"
                },
                postBody: ""
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                "Accept": "application/json, */*",
                "Content-Type": "application/custom",
                "Content-Length": 0
            });
        });

        it("should convert the contentType option into a header", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                contentType: "text/plain",
                postBody: ""
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                "Accept": "application/json, */*",
                "Content-Type": "text/plain",
                "Content-Length": 0
            });
        });

        it("should convert the contentType and the encoding options into a header", function () {
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                contentType: "text/plain",
                encoding: "ISO-8859-1",
                postBody: ""
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers).toEqual({
                "Accept": "application/json, */*",
                "Content-Type": "text/plain; charset=ISO-8859-1",
                "Content-Length": 0
            });
        });

        /*
        it("should serialize the parameters option inside the request body", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                parameters: {
                    e: 1,
                    b: "c"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers['Content-Type']).toEqual("application/x-www-form-urlencoded; charset=UTF-8");
            expect(write_mock).toHaveBeenCalledWith("e=1&b=c");
        });
        */

        it("should add parameters to the url if the request body is not empty", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                postBody: "{}",
                parameters: {
                    e: 1,
                    b: "c"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers['Content-Type']).toEqual("application/json");
            expect(request.url).toEqual(new URL("http://server:1234/path?e=1&b=c"));
            expect(write_mock).toHaveBeenCalledWith("{}");
        });

        it("should append parameters to the ones provided directly in the URL", function () {
            var url = new URL("http://server:1234/path?e=1");

            var request = makeRequest(url, {
                method: "GET",
                parameters: {
                    b: "c"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            expect(request.url).toEqual(new URL("http://server:1234/path?e=1&b=c"));
            expect(write_mock).not.toHaveBeenCalled();
        });

        it("should ignore null parameters", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                postBody: "{}",
                parameters: {
                    e: null,
                    b: "c"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            expect(request.url).toEqual(new URL("http://server:1234/path?b=c"));
            expect(write_mock).toHaveBeenCalledWith("{}");
        });

        it("should ignore undefined parameters", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                postBody: "{}",
                parameters: {
                    e: undefined
                }
            });
            expect(http.request.calls.count()).toBe(1);
            expect(request.url).toEqual(new URL("http://server:1234/path"));
            expect(write_mock).toHaveBeenCalledWith("{}");
        });

        it("should ignore empty parameters objects", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                postBody: "{}",
                parameters: {}
            });
            expect(http.request.calls.count()).toBe(1);
            expect(request.url).toEqual(new URL("http://server:1234/path"));
            expect(write_mock).toHaveBeenCalledWith("{}");
        });

        /*
        it("should take into account the contentType option when using the parameters option", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                contentType: "application/custom",
                parameters: {
                    e: 1,
                    b: "c"
                }
            });
            expect(http.request.calls.count()).toBe(1);
            let options = http.request.calls.argsFor(0)[0];
            expect(options.headers['Content-Type']).toEqual("application/custom; charset=UTF-8");
            expect(request.url).toEqual(new URL("http://server:1234/path"));
            expect(write_mock).toHaveBeenCalledWith("e=1&b=c");
        });

        it("should take into account the encoding option when using the parameters option", function () {
            var url = new URL("http://server:1234/path");

            var request = makeRequest(url, {
                encoding: "ISO-8859-1",
                parameters: {
                    e: 1,
                    b: "c"
                }
            });
            expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded; charset=ISO-8859-1");
            expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
        });
        */

        it("should ignore the withCredentials option", function () {
            /* Those options cannot be used on NodeJS, but it can be used on browsers so this code should not crash */
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                supportsAccessControl: true,
                withCredentials: true
            });
        });

        it("should ignore the withCredentials option if the supportsAccessControl option is not used", function () {
            /* This option cannot be used on NodeJS, but it can be used on browsers so this code should not crash */
            var url = new URL("http://server:1234/path");

            makeRequest(url, {
                withCredentials: true
            });
        });

        it("should allow to abort requests", function () {
            var url = new URL("http://server:1234/path?q=1");

            var request = makeRequest(url);

            expect(request.abort()).toBe(request);
            expect(abort_mock).toHaveBeenCalled();

            // TODO
            // missing check abort is notified accordingly
        });

        it("should report connection errors", function () {
            var url = new URL("http://server:1234/path?q=1");

            var listener = jasmine.createSpy('listener').and.callFake((error) => {
                expect(error).toEqual(jasmine.any(NGSI.ConnectionError));
                done();
            });
            var request = makeRequest(url);
            request.catch(listener);

            expect(listener).not.toHaveBeenCalled();
            endRequest(0);
        });

        it("should report connection errors", function () {
            var url = new URL("http://server:1234/path?q=1");

            var listener = jasmine.createSpy('listener').and.callFake((error) => {
                expect(error).toEqual(jasmine.any(NGSI.ConnectionError));
                done();
            });
            var request = makeRequest(url);
            request.catch(listener);

            expect(listener).not.toHaveBeenCalled();
            endRequest(0, "Custom error message");
        });

        it("should provide a getHeader method on responses", function (done) {
            var listener = function (response) {
                var headervalue = "value";
                expect(response.getHeader("Location")).toBe(headervalue);
                expect(response.status).toBe(204);
                expect(response.statusText).toBe("OK");
                expect(response.responseText).toBe("");
                done();
            };

            var request = makeRequest(new URL("http://server:1234/path?q=1"));
            request.then(listener);

            endRequest(204, "OK", {"location": "value"});
        });

        it("should return null when calling getHeader for an undefined header", function (done) {
            var listener = function (response) {
                expect(response.getHeader("Location")).toBe(null);
                expect(response.status).toBe(204);
                expect(response.statusText).toBe("OK");
                expect(response.responseText).toBe("");
                done();
            };

            var request = makeRequest(new URL("http://server:1234/path"), {
                method: 'POST'
            });
            request.then(listener);

            endRequest(204, "OK");
        });

        it("should provide response content on the responseText attribute", function (done) {
            var listener = function (response) {
                expect(response.getHeader("Location")).toBe(null);
                expect(response.status).toBe(204);
                expect(response.statusText).toBe("OK");
                expect(response.responseText).toBe("data");

                done();
            };

            var request = makeRequest(new URL("http://server:1234/path"), {
                method: 'POST'
            });
            request.then(listener);

            endRequest(204, "OK", null, "data");
        });

    });

});
