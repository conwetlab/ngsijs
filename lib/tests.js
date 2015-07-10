/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global ajaxMockFactory, beforeEach, expect, it, NGSI, runs, waitsFor*/

(function () {

    "use strict";

    var proto = {
        'clear': function clear() {
            this.staticURLs = {};
        },
        'addStaticURL': function addStaticURL(url, response) {
            this.staticURLs[url] = response;
        }
    };

    var ajaxMockFactory = {
        'createFunction': function createFunction() {
            var func, instance, key;

            instance = {};

            func = function (url, options) {
                var specific_callback, response_info;

                if (options == null) {
                    options = {};
                }

                if (url in this.staticURLs) {
                    response_info = this.staticURLs[url];
                    switch (typeof response_info.checkRequestContent) {
                    case "string":
                        if (response_info.checkRequestContent !== options.postBody) {
                            response_info = {
                                status: 400,
                                responseText: ""
                            };
                        }
                        break;
                    case "function":
                        try {
                            if (!response_info.checkRequestContent(url, options)) {
                                response_info = {
                                    status: 400,
                                    responseText: ""
                                };
                            }
                        } catch (e) {
                            response_info = {
                                status: 400,
                                responseText: ""
                            };
                        }
                        break;
                    default:
                    }
                }

                if (response_info != null) {

                    specific_callback = 'on' + response_info.status;
                    if (response_info.headers == null) {
                        response_info.headers = {};
                    }
                    response_info.getHeader = function (header_name) {
                        return this.headers[header_name];
                    };

                    if (specific_callback in options) {
                        options[specific_callback]();
                    } else if (typeof options.onSuccess === 'function' && response_info.status >= 200 && response_info.status < 300) {
                        try {
                            options.onSuccess(response_info);
                        } catch (e) {}
                    } else if (typeof options.onFailure === 'function') {
                        try {
                            options.onFailure(response_info);
                        } catch (e) {}
                    }
                } else {
                    if (typeof options.onFailure === 'function') {
                        try {
                            options.onFailure({
                                status: 0
                            });
                        } catch (e) {}
                    }
                }

                if (typeof options.onComplete === 'function') {
                    try {
                        options.onComplete();
                    } catch (e) {}
                }

            };

            func = func.bind(instance);
            for (key in proto) {
                func[key] = proto[key].bind(instance);
            }
            func.clear();

            return func;
        }
    };

    window.ajaxMockFactory = ajaxMockFactory;
})();

describe("NGSI Library handles", function () {

    "use strict";

    var connection, response, response_data, response_error_data, response_details, failure, ajaxMockup, eventsources;

    ajaxMockup = ajaxMockFactory.createFunction();

    window.EventSource = function EventSource(url) {
        Object.defineProperty(this, "url", {value: url});

        eventsources.push(this);
        this.events = {
            init: [],
            close: [],
            notification: []
        };

        setTimeout(function () {
            var i;

            for (i = 0; i < this.events.init.length; i++) {
                try {
                    this.events.init[i]({data: "{\"id\": 1}"});
                } catch (e) {}
            };
        }.bind(this), 0);
    };

    window.EventSource.prototype.addEventListener = function addEventListener(event_name, handler) {
        this.events[event_name].push(handler);
    };

    window.EventSource.prototype.removeEventListener = function removeEventListener(event_name, handler) {
        var index = this.events[event_name].indexOf(handler);
        if (index !== -1) {
            this.events[event_name].splice(index, 1);
        }
    };

    beforeEach(function () {
        var options = {
            requestFunction: ajaxMockup
        };
        if (this.env.currentSpec.description.indexOf('proxy') !== -1) {
            options.ngsi_proxy_url = 'http://ngsiproxy.example.com';
        }
        connection = new NGSI.Connection('http://ngsi.server.com', options);
        ajaxMockup.clear();
        response = false;
        response_data = null;
        response_error_data = null;
        response_details = null;
        failure = false;
        eventsources = [];
    });

    it("basic register context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.createRegistration([
                    {type: 'Technician', id: 'entity1'}
                ],
                [],
                'PT24H',
                'http://app.example.com/',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("register context requests passing attributes", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, attribute, name, type;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'registerContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('count(contextRegistrationList/contextRegistration)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('count(contextRegistrationList/contextRegistration/entityIdList/entityId)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('contextRegistrationList/contextRegistration/entityIdList/entityId', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        var entityIdElement = result.singleNodeValue;
                        if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'Technician') {
                            return false;
                        }

                        result = doc.evaluate('contextRegistrationList/contextRegistration/contextRegistrationAttributeList/contextRegistrationAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 3) { return false };

                        // Attr1
                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        if (!name || name.textContent !== 'attr1' || !type || type.textContent != 'string') {
                            return false;
                        }

                        // Attr2
                        attribute = result.snapshotItem(1);
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        if (!name || name.textContent !== 'attr2' || type) {
                            return false;
                        }

                        // Attr3
                        attribute = result.snapshotItem(2);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        if (!name || name.textContent !== 'attr3' || !type || type.textContent != 'number') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.createRegistration([
                    {type: 'Technician', id: 'entity1'}
                ], [
                    {name: 'attr1', type: 'string'},
                    {name: 'attr2'},
                    {name: 'attr3', type: 'number'}
                ],
                'PT24H',
                'http://app.example.com/',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("basic update context registration requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.updateRegistration(167,
                [
                    {type: 'Technician', id: 'entity1'}
                ],
                [],
                'PT24H',
                'jasmine tests',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("basic cancel registration requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.cancelRegistration(167,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT0H',
                registrationId: '167'
            });
        });
    });

    it("discover context availability requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/discoverContextAvailability1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/discoverContextAvailability", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult, attribute, name, type;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'discoverContextAvailabilityRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'entity1' ||
                            entityIdElement.getAttribute('isPattern') !== 'false') {
                            return false;
                        }

                        // Entity Id 2
                        entityIdElement = result.snapshotItem(1);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Van' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== '.*' ||
                            entityIdElement.getAttribute('isPattern') !== 'true') {
                            return false;
                        }

                        result = doc.evaluate('attributeList/attribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 0) { return false };

                        return true;
                    }
                }
            );

            connection.discoverAvailability([
                    {type: 'Technician', id: 'entity1'},
                    {type: 'Van', id: '.*', isPattern: true},
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                    {entities: [{type: 'Technician', id: 'entity1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
                    {entities: [{type: 'Van', id: 'van1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
            ]);
        });
    });

    it("basic query requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'tech1' ||
                            (entityIdElement.hasAttribute('isPattern') && entityIdElement.getAttribute('isPattern') !== 'false')) {
                            return false;
                        }

                        // Entity Id 2
                        entityIdElement = result.snapshotItem(1);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'tech2' ||
                            (entityIdElement.hasAttribute('isPattern') && entityIdElement.getAttribute('isPattern') !== 'false')) {
                            return false;
                        }
                        return true;
                    }
                }
            );

            connection.query([
                    {type: 'Technician', id: 'tech1'},
                    {type: 'Technician', id: 'tech2'}
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': [
                        {
                            'name': 'email',
                            'type': 'string',
                            'contextValue': 'jacinto.salas@mycompany.com',
                            'metadata': []
                        },
                        {
                            'name': 'function',
                            'type': 'string',
                            'contextValue': 'MV Keeper',
                            'metadata': []
                        },
                        {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034123456789',
                            'metadata': []
                        },
                        {
                            'name': 'name',
                            'type': 'string',
                            'contextValue': 'Jacinto Salas Torres',
                            'metadata': []
                        },
                        {
                            'name': 'twitter',
                            'type': 'string',
                            'contextValue': 'jsalas',
                            'metadata': []
                        },
                        {
                            'name': 'van',
                            'type': 'string',
                            'contextValue': 'van1',
                            'metadata': []
                        },
                        {
                            'name': 'working_area',
                            'type': 'integer',
                            'contextValue': '28050',
                            'metadata': []
                        }
                    ]
                },
                {
                    'entity': {
                        'id': 'tech2',
                        'type': 'Technician'
                    },
                    'attributes' : []
                }
            ]);
        });
    });

    it("basic query requests using the pagination options", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== '.*' ||
                            entityIdElement.getAttribute('isPattern') !== 'true') {
                            return false;
                        }

                        if (options.parameters.limit !== 100) {
                            throw new NGSI.InvalidResponseError('');
                        }

                        if (options.parameters.offset !== 200) {
                            throw new NGSI.InvalidResponseError('');
                        }

                        return true;
                    }
                }
            );

            connection.query([
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    limit: 100,
                    offset: 200,
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': [
                        {
                            'name': 'email',
                            'type': 'string',
                            'contextValue': 'jacinto.salas@mycompany.com',
                            'metadata': []
                        },
                        {
                            'name': 'function',
                            'type': 'string',
                            'contextValue': 'MV Keeper',
                            'metadata': []
                        },
                        {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034123456789',
                            'metadata': []
                        },
                        {
                            'name': 'name',
                            'type': 'string',
                            'contextValue': 'Jacinto Salas Torres',
                            'metadata': []
                        },
                        {
                            'name': 'twitter',
                            'type': 'string',
                            'contextValue': 'jsalas',
                            'metadata': []
                        },
                        {
                            'name': 'van',
                            'type': 'string',
                            'contextValue': 'van1',
                            'metadata': []
                        },
                        {
                            'name': 'working_area',
                            'type': 'integer',
                            'contextValue': '28050',
                            'metadata': []
                        }
                    ]
                },
                {
                    'entity': {
                        'id': 'tech2',
                        'type': 'Technician'
                    },
                    'attributes' : []
                }
            ]);
        });
    });

    it("basic query requests using the details options", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query3.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        if (options.parameters.details !== 'on') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        return true;
                    }
                }
            );

            connection.query([
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    details: true,
                    onSuccess: function (data, details) {
                        response_data = data;
                        response_details = details;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_details).toEqual({
                "count": 47855
            });
            expect(response_data.length).toEqual(20);
        });
    });

    it("invalid offset when issuing query requests using the details options", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        if (options.parameters.limit !== 100) {
                            throw new NGSI.InvalidResponseError('');
                        }

                        if (options.parameters.offset !== 1000) {
                            throw new NGSI.InvalidResponseError('');
                        }

                        if (options.parameters.details !== 'on') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        return true;
                    }
                }
            );

            connection.query([
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    details: true,
                    limit: 100,
                    offset: 1000,
                    onSuccess: function (data, details) {
                        response_data = data;
                        response_details = details;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure.details).toEqual({
                "text": "Number of matching entities: 5. Offset is 1000",
                "matches": 5,
                "offset": 1000
            });
            expect(response_details).toEqual(null);
            expect(response_data).toEqual(null);
        });
    });

    it("basic query requests using restrictions (polygon)", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, scopeElement, scopeTypeElement, invertedElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('restriction/scope/operationScope', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        scopeElement = result.snapshotItem(0);
                        scopeTypeElement = doc.evaluate('scopeType', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (scopeTypeElement == null || scopeTypeElement.textContent !== 'FIWARE_Location') {
                            return false;
                        }

                        result = doc.evaluate('scopeValue/polygon/vertexList/vertex', scopeElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 4) {
                            return false;
                        }

                        invertedElement = doc.evaluate('scopeValue/polygon/inverted', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return invertedElement == null;
                    }

                }
            );

            connection.query([
                    {type: 'Point', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "polygon": {
                                        "vertices": [
                                            { "latitude": "3", "longitude": "3" },
                                            { "latitude": "3", "longitude": "8" },
                                            { "latitude": "11", "longitude": "8" },
                                            { "latitude": "11", "longitude": "3" }
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'B',
                        'type': 'Point'
                    },
                    'attributes': [
                        {
                            'name': 'position',
                            'type': 'coords',
                            'contextValue': '5, 5',
                            'metadata': []
                        }
                    ]
                },
                {
                    'entity': {
                        'id': 'C',
                        'type': 'Point'
                    },
                    'attributes': [
                        {
                            'name': 'position',
                            'type': 'coords',
                            'contextValue': '7, 4',
                            'metadata': []
                        }
                    ]
                }
            ]);
        });

    });

    it("basic query requests using restrictions (inverted polygon)", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, scopeElement, scopeTypeElement, invertedElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('restriction/scope/operationScope', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        scopeElement = result.snapshotItem(0);
                        scopeTypeElement = doc.evaluate('scopeType', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (scopeTypeElement == null || scopeTypeElement.textContent !== 'FIWARE_Location') {
                            return false;
                        }

                        result = doc.evaluate('scopeValue/polygon/vertexList/vertex', scopeElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 3) {
                            return false;
                        }

                        invertedElement = doc.evaluate('scopeValue/polygon/inverted', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return invertedElement.textContent === 'true';
                    }
                }
            );

            connection.query([
                    {type: 'Point', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "polygon": {
                                        "vertices": [
                                            { "latitude": "0", "longitude": "0" },
                                            { "latitude": "0", "longitude": "6" },
                                            { "latitude": "6", "longitude": "0" }
                                        ],
                                        "inverted": true
                                    }

                                }
                            }
                        ]
                    },
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'B',
                        'type': 'Point'
                    },
                    'attributes': [
                        {
                            'name': 'position',
                            'type': 'coords',
                            'contextValue': '5, 5',
                            'metadata': []
                        }
                    ]
                },
                {
                    'entity': {
                        'id': 'C',
                        'type': 'Point'
                    },
                    'attributes': [
                        {
                            'name': 'position',
                            'type': 'coords',
                            'contextValue': '7, 4',
                            'metadata': []
                        }
                    ]
                }
            ]);
        });

    });

    it("basic query requests using restrictions (circle)", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, scopeElement, scopeTypeElement,
                            centerLatitudeElement, centerLongitudeElement,
                            radiusElement, invertedElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('restriction/scope/operationScope', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        scopeElement = result.snapshotItem(0);
                        scopeTypeElement = doc.evaluate('scopeType', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (scopeTypeElement == null || scopeTypeElement.textContent !== 'FIWARE_Location') {
                            return false;
                        }

                        centerLatitudeElement = doc.evaluate('scopeValue/circle/centerLatitude', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (centerLatitudeElement.textContent !== "40.418889") {
                            return false;
                        }

                        centerLongitudeElement = doc.evaluate('scopeValue/circle/centerLongitude', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (centerLongitudeElement.textContent !== "-3.691944") {
                            return false;
                        }

                        radiusElement = doc.evaluate('scopeValue/circle/radius', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (radiusElement.textContent !== "14000") {
                            return false;
                        }

                        invertedElement = doc.evaluate('scopeValue/circle/inverted', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return invertedElement == null;
                    }

                }
            );

            connection.query([
                    {type: 'City', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "circle": {
                                        "centerLatitude": "40.418889",
                                        "centerLongitude": "-3.691944",
                                        "radius": "14000"
                                    }
                                }
                            }
                        ]
                    },
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({});
        });

    });

    it("basic query requests using restrictions (inverted circle)", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, scopeElement, scopeTypeElement,
                            centerLatitudeElement, centerLongitudeElement,
                            radiusElement, invertedElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'queryContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('restriction/scope/operationScope', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        scopeElement = result.snapshotItem(0);
                        scopeTypeElement = doc.evaluate('scopeType', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (scopeTypeElement == null || scopeTypeElement.textContent !== 'FIWARE_Location') {
                            return false;
                        }

                        centerLatitudeElement = doc.evaluate('scopeValue/circle/centerLatitude', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (centerLatitudeElement.textContent !== "40.418889") {
                            return false;
                        }

                        centerLongitudeElement = doc.evaluate('scopeValue/circle/centerLongitude', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (centerLongitudeElement.textContent !== "-3.691944") {
                            return false;
                        }

                        radiusElement = doc.evaluate('scopeValue/circle/radius', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (radiusElement.textContent !== "14000") {
                            return false;
                        }

                        invertedElement = doc.evaluate('scopeValue/circle/inverted', scopeElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        return invertedElement.textContent === 'true';
                    }

                }
            );

            connection.query([
                    {type: 'City', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "circle": {
                                        "centerLatitude": "40.418889",
                                        "centerLongitude": "-3.691944",
                                        "radius": "14000",
                                        "inverted": "true"
                                    }
                                }
                            }
                        ]
                    },
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({});
        });

    });

    it("empty responses for query requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.query([
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({});
        });
    });

    it("basic query requests using the flat option", function () {

        runs(function () {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.query([
                    {type: 'Technician', id: 'entity1'}
                ],
                null,
                {
                    flat: true,
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                tech1: {
                    'id': 'tech1',
                    'type': 'Technician',
                    'email': 'jacinto.salas@mycompany.com',
                    'function': 'MV Keeper',
                    'mobile_phone': '0034123456789',
                    'name': 'Jacinto Salas Torres',
                    'twitter': 'jsalas',
                    'van': 'van1',
                    'working_area': '28050'
                },
                tech2: {
                    'id': 'tech2',
                    'type': 'Technician'
                }
            });
        });
    });

    var connection_error_on_query_test = function connection_error_on_query_test(description, code) {
        it("connection errors while making query requests (" + description + ")", function () {

            runs(function () {
                connection.query([
                        {type: 'Technician', id: 'entity1'}
                    ],
                    null,
                    {
                        onSuccess: function (data) {
                            response_data = data;
                        },
                        onFailure: function (e) {
                            failure = e;
                        },
                        onComplete: function () {
                            response = true;
                        }
                    }
                );
            });

            waitsFor(function () {
                return response;
            }, "Waiting NGSI response", 300);

            runs(function () {
                expect(failure instanceof NGSI.ConnectionError).toBeTruthy();
            });
        });
    };
    connection_error_on_query_test('Connection Error', 0);
    connection_error_on_query_test('Connection Error via proxy', 502);
    connection_error_on_query_test('Connection timeout via proxy', 504);

    var bad_query_response_test = function bad_query_response_test(response) {
        it("bad error codes for query requests (error " + response.status + ")", function () {

            runs(function () {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                        status: response.status,
                        responseText: response.responseText
                    }
                );

                connection.query([
                        {type: 'Technician', id: 'entity1'}
                    ],
                    null,
                    {
                        onSuccess: function (data) {
                            response_data = data;
                        },
                        onFailure: function (e) {
                            failure = e;
                        },
                        onComplete: function () {
                            response = true;
                        }
                    }
                );
            });

            waitsFor(function () {
                return response;
            }, "Waiting NGSI response", 300);

            runs(function () {
                expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
            });
        });
    };
    bad_query_response_test({status: 201, responseText: 'Created'});
    bad_query_response_test({status: 204, responseText: 'No Content'});
    bad_query_response_test({status: 402, responseText: 'Payment Required'});
    bad_query_response_test({status: 503, responseText: 'Service Unavailable'});

    var bad_query_response_content_test = function bad_query_response_content_test(description, content) {
        it("bad response content for query requests (" + description + ")", function () {

            runs(function () {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                        status: 200,
                        responseText: content
                    }
                );

                connection.query([
                        {type: 'Technician', id: 'entity1'}
                    ],
                    null,
                    {
                        onSuccess: function (data) {
                            response_data = data;
                        },
                        onFailure: function (e) {
                            failure = e;
                        },
                        onComplete: function () {
                            response = true;
                        }
                    }
                );
            });

            waitsFor(function () {
                return response;
            }, "Waiting NGSI response", 300);

            runs(function () {
                expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
            });
        });
    };
    bad_query_response_content_test('unrelated xml', '<root><element/></root>');
    bad_query_response_content_test('totally invalid content', 'invalid content');
    bad_query_response_content_test('partial response', '<?xml version="1.0" encoding="UTF-8"?><queryContextResponse><contextResponseList>');

    it("basic update context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('count(contextElementList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/entityId', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        var entityIdElement = result.singleNodeValue;
                        if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'Technician') {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/contextAttributeList/contextAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 3) { return false };

                        // Attribute 1
                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'mobile_phone' || !type || type.textContent != 'string' || !contextValue || contextValue.textContent !== '0034223456789') {
                            return false;
                        }

                        // Attribute 2
                        attribute = result.snapshotItem(1);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'attr2' || type || !contextValue || contextValue.textContent !== 'value') {
                            return false;
                        }

                        // Attribute 3
                        attribute = result.snapshotItem(2);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'attr3' || type || !contextValue || contextValue.textContent !== '5') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.updateAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': [
                            {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
                            {name: 'attr2', contextValue: 'value'},
                            {name: 'attr3', contextValue: 5}
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': [
                        {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'metadata': []
                        }
                    ]
                }
            ]);
            expect(response_error_data).toEqual([]);
        });
    });

    it("errors when making basic update context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update7.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue, contextElements;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('count(contextElementList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        contextElements = doc.evaluate('contextElementList/contextElement', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                        // Entry 1
                        var contextElement = contextElements.snapshotItem(0);
                        var entityIdElement = doc.evaluate('entityId', contextElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        var idElement = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (entityIdElement.getAttribute('type') !== 'City' && entityIdElement.getAttribute('isPattern') === 'false' && idElement.textContent === 'Madrid') {
                            return false;
                        }

                        result = doc.evaluate('contextAttributeList/contextAttribute', contextElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) { return false };

                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'position' || !type || type.textContent != 'coords' || !contextValue || contextValue.textContent !== '40.418889, -3.691944') {
                            return false;
                        }

                        // Entry 2
                        contextElement = contextElements.snapshotItem(1);
                        entityIdElement = doc.evaluate('entityId', contextElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        idElement = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (entityIdElement.getAttribute('type') !== 'Point' && entityIdElement.getAttribute('isPattern') === 'false' && idElement.textContent === 'A') {
                            return false;
                        }

                        result = doc.evaluate('contextAttributeList/contextAttribute', contextElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) { return false };

                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'mobile_phone' || !type || type.textContent != 'string' || !contextValue || contextValue.textContent !== '0034223456789') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.updateAttributes([
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {name: 'position', type: 'coords', contextValue: '40.418889, -3.691944'}
                        ]
                    },
                    {
                        'entity': {type: 'Point', id: 'A'},
                        'attributes': [
                            {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'}
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    entity: {id: 'Madrid', type: 'City'},
                    attributes: [
                        {name: 'position', type: 'coords'}
                    ]
                }
            ]);
            expect(response_error_data).toEqual([
                {
                    entity: {id: 'A', type: 'Point'},
                    attributes: [
                        {name: 'mobile_phone', type: 'string'}
                    ],
                    statusCode: {
                        code: 472,
                        reasonPhrase: 'request parameter is invalid/not allowed',
                        details : 'action: UPDATE - entity: (A, Point) - offending attribute: mobile_phone'
                    }
                }
            ]);
        });
    });

    it("basic update context requests using the flat option", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'UPDATE') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.updateAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034223456789'
                        }
                    }
                ], {
                    flat: true,
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'id': 'tech1',
                    'type': 'Technician',
                    'mobile_phone': ''
                }
            });
            expect(response_error_data).toEqual([]);
        });
    });

    it("basic add context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement, result, attribute, name, type, contextValue;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'APPEND') {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/contextAttributeList/contextAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) { return false };

                        // Attribute 1
                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'new_attribute' || !type || type.textContent != 'string' || !contextValue || contextValue.textContent !== 'value') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.addAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': [
                            {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'}
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    entity: {
                        id: 'tech1',
                        type: 'Technician'
                    },
                    attributes: [
                        {
                            name: 'new_attribute',
                            type: 'string'
                        }
                    ]
                }
            ]);
            expect(response_error_data).toEqual([]);
        });
    });

    it("basic add context requests adding metadata", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update3.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue, metadata, value, updateActionElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'APPEND') {
                            return false;
                        }

                        result = doc.evaluate('count(contextElementList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/entityId', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        var entityIdElement = result.singleNodeValue;
                        if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'City') {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/contextAttributeList/contextAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) { return false };

                        // Attribute 1
                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'position' || !type || type.textContent != 'coords' || !contextValue || contextValue.textContent !== '40.418889, -3.691944') {
                            return false;
                        }

                        result = doc.evaluate('metadata/contextMetadata', attribute, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) { return false };

                        metadata = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(metadata, 'name').textContent;
                        type = NGSI.XML.getChildElementByTagName(metadata, 'type').textContent;
                        value = NGSI.XML.getChildElementByTagName(metadata, 'value').textContent;
                        return name === 'location' && type === 'string' && value === 'WSG84';
                    }
                }
            );

            connection.addAttributes([
                    {
                        entity: {type: 'City', id: 'Madrid'},
                        attributes: [
                            {
                                name: 'position',
                                type: 'coords',
                                contextValue: '40.418889, -3.691944',
                                metadata: [
                                    {name: 'location', type: 'string', value: 'WSG84'}
                                ]
                            }
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    entity: {
                        id: 'Madrid',
                        type: 'City'
                    },
                    attributes: [
                        {
                            name: 'position',
                            type: 'coords',
                            metadata: [
                                {name: 'location', type: 'string', value: 'WSG84'}
                            ]
                        }
                    ]
                }
            ]);
            expect(response_error_data).toEqual([]);
        });
    });

    it("basic add context requests using the flat option", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.addAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': [
                            {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'}
                        ]
                    }
                ], {
                    flat: true,
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'id': 'tech1',
                    'type': 'Technician',
                    'new_attribute': ''
                }
            });
            expect(response_error_data).toEqual([]);
        });
    });

    it("basic delete context attributes requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update4.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'DELETE') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.deleteAttributes([
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': {
                            'name': 'position',
                            'type': 'coords'
                        }
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'Madrid',
                        'type': 'City'
                    },
                    'attributes': [
                        {
                            'name': 'position',
                            'type': 'coords'
                        }
                    ]
                }
            ]);
            expect(response_error_data).toEqual([]);
        });
    });

    it("errors when making basic delete context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update5.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'DELETE') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.deleteAttributes([
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': {
                            'name': 'position',
                            'type': 'coords'
                        }
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([]);
            expect(response_error_data).toEqual([
                {
                    entity: {
                        id: 'Madrid',
                        type: 'City'
                    },
                    attributes: [
                        { name: 'position', type: 'coords' }
                    ],
                    statusCode: {
                        code: 472,
                        reasonPhrase: 'request parameter is invalid/not allowed',
                        details : 'action: DELETE - entity: (Madrid, City) - offending attribute: position'
                    }
                }
            ]);
        });
    });

    it("errors when making basic delete context requests using the flat option", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update6.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'DELETE') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.deleteAttributes([
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': {
                            'name': 'position',
                            'type': 'coords'
                        }
                    },
                    {
                        'entity': {type: 'City', id: 'Madriz'},
                        'attributes': {
                            'name': 'position',
                            'type': 'coords'
                        }
                    }
                ], {
                    flat: true,
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                Madrid: {
                    id: 'Madrid',
                    type: 'City',
                    position: ''
                }
            });
            expect(response_error_data).toEqual([
                {
                    entity: {
                        id: 'Madriz',
                        type: 'City'
                    },
                    statusCode: {
                        code: 404,
                        reasonPhrase: 'No context element found',
                        details : 'Madriz'
                    }
                }
            ]);
        });
    });

    it("basic delete context entities requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update8.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, updateActionElement, result;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        updateActionElement = doc.evaluate('updateAction', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (updateActionElement == null || updateActionElement.textContent !== 'DELETE') {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/contextAttributeList', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        return result.snapshotLength === 0;
                    }

                }
            );

            connection.deleteAttributes([
                    {
                        'entity': {type: 'City', id: 'Madrid'}
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    'entity': {
                        'id': 'Madrid',
                        'type': 'City'
                    },
                    'attributes': []
                }
            ]);
            expect(response_error_data).toEqual([]);
        });
    });

    it("basic subscribe context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/subscribeContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult, conditionElement, condValuesResult, condType;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'subscribeContextRequest') {
                            return false;
                        }

                        result = doc.evaluate('reference', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'http://www.example.com/callback') {
                            return false;
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'tech*' ||
                            entityIdElement.getAttribute('isPattern') !== 'true') {
                            return false;
                        }

                        // Entity Id 2
                        entityIdElement = result.snapshotItem(1);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Van' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'van1' ||
                            entityIdElement.getAttribute('isPattern') !== 'false') {
                            return false;
                        }

                        result = doc.evaluate('count(attributeList/attribute)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 0) {
                            return false;
                        }

                        result = doc.evaluate('subscriptionId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 0) {
                            return false;
                        }

                        result = doc.evaluate('duration', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'PT24H') {
                            return false;
                        }

                        result = doc.evaluate('notifyConditions/notifyCondition', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        // Condition 1
                        conditionElement = result.snapshotItem(0);
                        condValuesResult = doc.evaluate('condValueList/condValue', conditionElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        condType = NGSI.XML.getChildElementByTagName(conditionElement, 'type');
                        if (condType.textContent !== 'ONCHANGE' ||
                            condValuesResult.snapshotLength !== 1 || condValuesResult.snapshotItem(0).textContent !== 'position') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.createSubscription([
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
                {
                    onNotify: 'http://www.example.com/callback',
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(eventsources.length).toEqual(0);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1',
                'duration': 'PT24H'
            });
        });
    });

    it("basic subscribe context requests using the ngsi proxy", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContext1.xml', false);
            request.send();

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                status: 201,
                responseText: '',
                headers: {
                    'Location': 'http://ngsiproxy.example.com/eventsource/1'
                }
            });

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                status: 201,
                responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                checkRequestContent: function (url, options) {
                    var data = JSON.parse(options.postBody);
                    return data.connection_id === 1;
                }
            });

            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/subscribeContext", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult, conditionElement, condValuesResult, condType;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'subscribeContextRequest') {
                            return false;
                        }

                        result = doc.evaluate('reference', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'http://ngsiproxy.example.com/callback/1') {
                            return false;
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'tech*' ||
                            entityIdElement.getAttribute('isPattern') !== 'true') {
                            return false;
                        }

                        // Entity Id 2
                        entityIdElement = result.snapshotItem(1);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Van' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'van1' ||
                            entityIdElement.getAttribute('isPattern') !== 'false') {
                            return false;
                        }

                        result = doc.evaluate('count(attributeList/attribute)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 0) {
                            return false;
                        }

                        result = doc.evaluate('subscriptionId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 0) {
                            return false;
                        }

                        result = doc.evaluate('duration', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'PT24H') {
                            return false;
                        }

                        result = doc.evaluate('notifyConditions/notifyCondition', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1) {
                            return false;
                        }

                        // Condition 1
                        conditionElement = result.snapshotItem(0);
                        condValuesResult = doc.evaluate('condValueList/condValue', conditionElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        condType = NGSI.XML.getChildElementByTagName(conditionElement, 'type');
                        if (condType.textContent !== 'ONCHANGE' ||
                            condValuesResult.snapshotLength !== 1 || condValuesResult.snapshotItem(0).textContent !== 'position') {
                            return false;
                        }

                        return true;
                    }

                }
            );

            connection.createSubscription([
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
                {
                    onNotify: function (data) {
                        notification_data = data;
                    },
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(eventsources.length).toEqual(1);
            expect(eventsources[0].url).toEqual('http://ngsiproxy.example.com/eventsource/1');
            expect(eventsources[0].events.init.length).toEqual(0);
            expect(eventsources[0].events.close.length).toEqual(1);
            expect(eventsources[0].events.notification.length).toEqual(1);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1',
                'duration': 'PT24H'
            });
        });
    });

    var bad_ngsi_proxy_response_test = function bad_ngsi_proxy_response_test(description, response_status, error_class) {
        it("ngsi-proxy errors when making subscribe context requests (" + description + ")", function () {

            runs(function () {

                ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {status: response_status});

                connection.createSubscription([
                        {type: 'Technician', id: 'tech*', isPattern: true},
                        {type: 'Van', id: 'van1'},
                    ],
                    null,
                    'PT24H',
                    null,
                    [{type: 'ONCHANGE', condValues: ['position']}],
                    {
                        onNotify: function (data) {
                            notification_data = data;
                        },
                        onSuccess: function (data) {
                            response_data = data;
                        },
                        onFailure: function (e) {
                            failure = e;
                        },
                        onComplete: function () {
                            response = true;
                        }
                    }
                );
            });

            waitsFor(function () {
                return response;
            }, "Waiting NGSI response", 300);

            runs(function () {
                expect(failure instanceof NGSI.ProxyConnectionError).toBeTruthy();
                expect(failure.cause instanceof error_class).toBeTruthy();
            });
        });
    };
    bad_ngsi_proxy_response_test("Connection Error", 0, NGSI.ConnectionError);
    bad_ngsi_proxy_response_test("Connection Error via proxy", 502, NGSI.ConnectionError);
    bad_ngsi_proxy_response_test("Connection timeout via proxy", 504, NGSI.ConnectionError);
    bad_ngsi_proxy_response_test("404", 404, NGSI.InvalidResponseError);
    bad_ngsi_proxy_response_test("200", 200, NGSI.InvalidResponseError);
    bad_ngsi_proxy_response_test("Missing Location Header", 201, NGSI.InvalidResponseError);

    it("basic update context subscription requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/updateContextSubscription1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContextSubscription", {
                    status: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextSubscriptionRequest') {
                            return false;
                        }

                        result = doc.evaluate('count(reference)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 0) {
                            return false;
                        }

                        result = doc.evaluate('count(entityIdList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 0) {
                            return false;
                        }

                        result = doc.evaluate('count(attributeList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 0) {
                            return false;
                        }

                        result = doc.evaluate('subscriptionId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'sub1') {
                            return false;
                        }

                        result = doc.evaluate('duration', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 1 || result.snapshotItem(0).textContent !== 'PT20H') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.updateSubscription('sub1',
                'PT20H',
                null,
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1',
                'duration': 'PT20H'
            });
        });
    });

    it("basic cancel context subscription requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/unsubscribeContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/unsubscribeContext", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.cancelSubscription('sub1', {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1'
            });
        });
    });

    it("basic get available types requests", function () {

        runs(function () {

            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.getAvailableTypes({
                onSuccess: function (data) {
                    response_data = data;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });
        });

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                {
                    "name" : "",
                    "attributes" : [
                        "position",
                        "status",
                        "value",
                        "city_location"
                    ]
                },
                {
                    "name" : "AMMS",
                    "attributes" : [
                        "Longitud",
                        "Latitud",
                        "ReactivePower",
                        "ActivePower",
                        "TimeInstant"
                    ]
                },
                {
                    "name" : "Agrarium",
                    "attributes" : [
                        "moisture",
                        "ambientLight",
                        "position",
                        "humidity",
                        "temperature"
                    ]
                }
            ]);
        });
    });

    it("basic get type info requests", function () {

        runs(function () {

            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes/Agrarium", {
                    status: 200,
                    responseText: request.responseText
                }
            );

            connection.getTypeInfo("Agrarium", {
                onSuccess: function (data) {
                    response_data = data;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });
        });

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                "name" : "Agrarium",
                "attributes" : [
                    "moisture",
                    "ambientLight",
                    "position",
                    "humidity",
                    "temperature"
                ]
            });
        });
    });

});
