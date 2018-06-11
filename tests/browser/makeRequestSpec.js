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

/* global NGSI */

(function () {

    "use strict";

    describe("default makeRequest for browsers", function () {

        var makeRequest;

        beforeAll(function () {
            makeRequest = new NGSI.Connection("http://orion.example.com/").makeRequest;

            spyOn(window, "XMLHttpRequest").and.callFake(function XMLHttpRequest() {
                this.abort = jasmine.createSpy('abort');
                this.addEventListener = jasmine.createSpy('addEventListener');
                this.open = jasmine.createSpy('open');
                this.send = jasmine.createSpy('send');
                this.setRequestHeader = jasmine.createSpy('setRequestHeader');

                this.upload = {
                    addEventListener: jasmine.createSpy('addEventListener')
                };
            });
        });

        describe("makeRequest(url, options)", function () {

            it("should work with URL instances", function () {
                var original = new URL("http://server:1234/path?q=1");

                var request = makeRequest(original);
                expect(request.url).toEqual(original);
            });

            it("should ignore null headers", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    requestHeaders: {
                        empty: null
                    }
                });
                expect(request.transport.setRequestHeader).not.toHaveBeenCalledWith("empty", jasmine.anything());
            });

            it("should ignore undefined headers", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    requestHeaders: {
                        empty: undefined
                    }
                });
                expect(request.transport.setRequestHeader).not.toHaveBeenCalledWith("empty", jasmine.anything());
            });

            it("should ignore the contentType option if there is not body", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    contentType: "application/json"
                });
                expect(request.transport.setRequestHeader).not.toHaveBeenCalledWith("Content-Type", "application/json");
            });

            it("should convert the contentType option into a header", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    contentType: "application/json",
                    postBody: ""
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json");
            });

            it("should convert the contentType and the encoding options into a header", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    contentType: "application/json",
                    encoding: "ISO-8859-1",
                    postBody: ""
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=ISO-8859-1");
            });

            it("should serialize the parameters option inside the request body", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
            });

            it("should add parameters to the url if the request body is not empty", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    postBody: "{}",
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.url).toEqual(new URL("http://server:1234/path?e=1&b=c"));
                expect(request.transport.send).toHaveBeenCalledWith("{}");
            });

            it("should append parameters to the ones provided directly in the URL", function () {
                var url = new URL("http://server:1234/path?e=1");

                var request = makeRequest(url, {
                    method: "GET",
                    parameters: {
                        b: "c"
                    }
                });
                expect(request.url).toEqual(new URL("http://server:1234/path?e=1&b=c"));
                expect(request.transport.send).toHaveBeenCalledWith(null);
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
                expect(request.url).toEqual(new URL("http://server:1234/path?b=c"));
                expect(request.transport.send).toHaveBeenCalledWith("{}");
            });

            it("should ignore undefined parameters", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    postBody: "{}",
                    parameters: {
                        e: undefined
                    }
                });
                expect(request.url).toEqual(new URL("http://server:1234/path"));
                expect(request.transport.send).toHaveBeenCalledWith("{}");
            });

            it("should ignore empty parameters objects", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    postBody: "{}",
                    parameters: {}
                });
                expect(request.url).toEqual(new URL("http://server:1234/path"));
                expect(request.transport.send).toHaveBeenCalledWith("{}");
            });

            it("should take into account the contentType option when using the parameters option", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    contentType: "application/custom",
                    parameters: {
                        e: 1,
                        b: "c"
                    }
                });
                expect(request.transport.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/custom; charset=UTF-8");
                expect(request.transport.send).toHaveBeenCalledWith("e=1&b=c");
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

            it("should support the withCredentials option", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    supportsAccessControl: true,
                    withCredentials: true
                });
                expect(request.transport.withCredentials).toBeTruthy();
            });

            it("should ignore the withCredentials option if the supportsAccessControl option is not used", function () {
                var url = new URL("http://server:1234/path");

                var request = makeRequest(url, {
                    withCredentials: true
                });
                expect(request.transport.withCredentials).toBeFalsy();
            });

            it("should allow to abort requests", function () {
                var url = new URL("http://server:1234/path?q=1");

                var request = makeRequest(url);

                expect(request.abort()).toBe(request);
                expect(request.transport.abort).toHaveBeenCalled();

                request.transport.addEventListener.calls.argsFor(0)[1]({
                    stopPropagation: jasmine.createSpy("stopPropagation"),
                    preventDefault: jasmine.createSpy("preventDefault")
                });
            });

            it("should provide a getHeader method on responses", function (done) {
                var listener = function (response) {
                    var headervalue = "value";
                    request.transport.getResponseHeader = jasmine.createSpy("getResponseHeader").and.returnValue(headervalue);

                    expect(response.getHeader("Location")).toBe(headervalue);

                    expect(response.transport.getResponseHeader).toHaveBeenCalledWith("Location");
                    done();
                };

                var request = makeRequest(new URL("http://server:1234/path?q=1"));
                request.then(listener);

                endRequest(request, 200, "OK");
            });

            it("should support the responseType option", function () {
                var url = new URL("http://server:1234/path");
                var listener = function (response) {
                    expect("responseText" in response).toBeFalsy();
                    expect("responseXML" in response).toBeFalsy();
                };

                var request = makeRequest(url, {
                    responseType: "json",
                    onSuccess: listener
                });

                expect(request.transport.responseType).toBe("json");
                endRequest(request, 200, "OK");
            });


        });

    });

    var endRequest = function endRequest(request, status, statusText, extra) {
        var key;

        request.transport.readyState = 4;
        request.transport.status = status;
        request.transport.statusText = statusText;
        if (extra != null) {
            for (key in extra) {
                request.transport[key] = extra[key];
            }
        }
        findListener(request.transport.addEventListener, status !== 0 ? 'load' : 'error')();
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

})();
