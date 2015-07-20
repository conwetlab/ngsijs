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

/*global ajaxMockFactory, mockedeventsources, EventSource, beforeEach, expect, it, NGSI, waitsFor*/

(function () {

    "use strict";

    var connection, response, response_data, response_error_data, response_details, failure, ajaxMockup, notification_data;

    var waitsForResponse = function waitsForResponse(next, done) {
        setTimeout(function() {
            if (response) {
                next();
            } else {
                done.fail("No response from NGSI");
            }
            done();
        }, 0);
    };

    var connection_error_on_query_test = function connection_error_on_query_test(description, code) {
        it("connection errors while making query requests (" + description + ")", function (done) {
            connection.query(
                [
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


            waitsForResponse(function () {
                expect(failure instanceof NGSI.ConnectionError).toBeTruthy();
            }, done);
        });
    };

    var bad_ngsi_proxy_response_test = function bad_ngsi_proxy_response_test(description, response_status, error_class) {
        it("ngsi-proxy errors when making subscribe context requests (" + description + ")", function (done) {
            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {status: response_status});

            connection.createSubscription(
                [
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

            waitsForResponse(function () {
                expect(failure instanceof NGSI.ProxyConnectionError).toBeTruthy();
                expect(failure.cause instanceof error_class).toBeTruthy();
            }, done);
        });
    };

    describe("NGSI Library handles", function () {

        ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            var options = {
                requestFunction: ajaxMockup
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
            response = false;
            response_data = null;
            response_error_data = null;
            response_details = null;
            notification_data = null;
            failure = false;
        });

        it("basic register context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                status: 200,
                responseText: request.responseText
            }
                                   );

            connection.createRegistration(
                [
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
            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("register context requests passing attributes", function (done) {
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
                    entityIdElement = result.singleNodeValue;
                    if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'Technician') {
                        return false;
                    }

                    result = doc.evaluate('contextRegistrationList/contextRegistration/contextRegistrationAttributeList/contextRegistrationAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    if (result.snapshotLength !== 3) { return false; }

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
            });

            connection.createRegistration(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("basic update context registration requests", function (done) {


            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.updateRegistration(
                167,
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("basic cancel registration requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.cancelRegistration(
                167,
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT0H',
                    registrationId: '167'
                });
            }, done);
        });

        it("discover context availability requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/discoverContextAvailability1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/discoverContextAvailability", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var doc, result, entityIdElement, idResult;

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
                    if (result.snapshotLength !== 0) { return false; }

                    return true;
                }
            });

            connection.discoverAvailability(
                [
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([
                    {entities: [{type: 'Technician', id: 'entity1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
                    {entities: [{type: 'Van', id: 'van1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
                ]);
            }, done);
        });

        it("basic query requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data) {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech1' || data.entities[0].isPattern !== 'false') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Technician' || data.entities[1].id !== 'tech2' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    return true;
                }
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'email',
                                'type': 'string',
                                'contextValue': 'jacinto.salas@mycompany.com'
                            },
                            {
                                'name': 'function',
                                'type': 'string',
                                'contextValue': 'MV Keeper'
                            },
                            {
                                'name': 'mobile_phone',
                                'type': 'string',
                                'contextValue': '0034123456789'
                            },
                            {
                                'name': 'name',
                                'type': 'string',
                                'contextValue': 'Jacinto Salas Torres'
                            },
                            {
                                'name': 'twitter',
                                'type': 'string',
                                'contextValue': 'jsalas'
                            },
                            {
                                'name': 'van',
                                'type': 'string',
                                'contextValue': 'van1'
                            },
                            {
                                'name': 'working_area',
                                'type': 'integer',
                                'contextValue': '28050'
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
            }, done);
        });

        it("basic query requests returnig structured attributes", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            }
                                   );

            connection.query(
                [
                    {type: 'Technician', id: 'tech1'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        "entity": {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        "attributes": [
                            {
                                "name": 'structuredattr',
                                "type": 'structure',
                                "contextValue": [
                                    "22",
                                    {
                                        "x": ["x1", "x2"],
                                        "y": "3"
                                    },
                                    ["z1", "z2"]
                                ]
                            }
                        ]
                    }
                    ]);
            }, done);
        });

        it("basic query requests using the pagination options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true') {
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
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'email',
                                'type': 'string',
                                'contextValue': 'jacinto.salas@mycompany.com'
                            },
                            {
                                'name': 'function',
                                'type': 'string',
                                'contextValue': 'MV Keeper'
                            },
                            {
                                'name': 'mobile_phone',
                                'type': 'string',
                                'contextValue': '0034123456789'
                            },
                            {
                                'name': 'name',
                                'type': 'string',
                                'contextValue': 'Jacinto Salas Torres'
                            },
                            {
                                'name': 'twitter',
                                'type': 'string',
                                'contextValue': 'jsalas'
                            },
                            {
                                'name': 'van',
                                'type': 'string',
                                'contextValue': 'van1'
                            },
                            {
                                'name': 'working_area',
                                'type': 'integer',
                                'contextValue': '28050'
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
            }, done);
        });

        it("basic query requests using the details options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query3.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (options.parameters.details !== 'on') {
                        throw new NGSI.InvalidResponseError('');
                    }

                    return true;
                }
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_details).toEqual({
                    "count": 47855
                });
                expect(response_data.length).toEqual(4);
            }, done);
        });

        it("invalid offset when issuing query requests using the details options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
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
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure.details).toEqual({
                    "text": "Number of matching entities: 5. Offset is 1000",
                    "matches": 5,
                    "offset": 1000
                });
                expect(response_details).toEqual(null);
                expect(response_data).toEqual(null);
            }, done);
        });

        it("basic query requests using restrictions (polygon)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'Point' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.polygon.vertices.length === 4 && !('inverted' in restriction.value.polygon);

                }

            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'B',
                            'type': 'Point'
                        },
                        'attributes': [
                            {
                                'name': 'position',
                                'type': 'coords',
                                'contextValue': '5, 5'
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
                                 'contextValue': '7, 4'
                             }
                         ]
                     }
                    ]);
            }, done);
        });

        it("basic query requests using restrictions (inverted polygon)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'Point' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.polygon.vertices.length === 3 && restriction.value.polygon.inverted === 'true';
                }
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'B',
                            'type': 'Point'
                        },
                        'attributes': [
                            {
                                'name': 'position',
                                'type': 'coords',
                                'contextValue': '5, 5'
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
                                 'contextValue': '7, 4'
                             }
                         ]
                     }
                    ]);
            }, done);
        });

        it("basic query requests using restrictions (circle)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'City' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.circle.centerLatitude === "40.418889" && restriction.value.circle.centerLongitude === "-3.691944" && restriction.value.circle.radius === "14000" && !('inverted' in restriction.value.circle);
                }

            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);

        });

        it("basic query requests using restrictions (inverted circle)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'City' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.circle.centerLatitude === "40.418889" && restriction.value.circle.centerLongitude === "-3.691944" && restriction.value.circle.radius === "14000" && restriction.value.circle.inverted === "true";
                }

            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);
        });

        it("empty responses for query requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);
        });

        it("basic query requests using the flat option", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
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

            waitsForResponse(function () {
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
            }, done);
        });

        it("basic query requests returnig structured attributes and using the flat option", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
                    {type: 'Technician', id: 'tech1'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    tech1: {
                        'id': 'tech1',
                        'type': 'Technician',
                        'structuredattr': [
                            "22",
                            {
                                "x": ["x1", "x2"],
                                "y": "3"
                            },
                            ["z1", "z2"]
                        ]
                    }
                });
            }, done);
        });

        connection_error_on_query_test('Connection Error', 0);

        var bad_query_response_test = function bad_query_response_test(content) {
            it("bad error codes for query requests (error " + content.status + ")", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                    status: content.status,
                    responseText: content.responseText
                });

                connection.query(
                    [
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

                waitsForResponse(function () {
                    expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
                }, done);
            });
        };

        bad_query_response_test({status: 201, responseText: 'Created'});
        bad_query_response_test({status: 204, responseText: 'No Content'});
        bad_query_response_test({status: 402, responseText: 'Payment Required'});
        bad_query_response_test({status: 503, responseText: 'Service Unavailable'});

        var bad_query_response_content_test = function bad_query_response_content_test(description, content) {
            it("bad response content for query requests (" + description + ")", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                    status: 200,
                    responseText: content
                });

                connection.query(
                    [
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

                waitsForResponse(function () {
                    expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
                }, done);
            });
        };
        bad_query_response_content_test('unrelated xml', '<root><element/></root>');
        bad_query_response_content_test('totally invalid content', 'invalid content');
        bad_query_response_content_test('partial response', '<?xml version="1.0" encoding="UTF-8"?><queryContextResponse><contextResponseList>');

        it("basic update context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'UPDATE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'entity1' || entity.type !== 'Technician' || entity.attributes.length !== 3) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'mobile_phone' || entity.attributes[0].type !== 'string' || entity.attributes[0].value !== '0034223456789') {
                        return false;
                    }

                    // Attribute 2
                    if (entity.attributes[1].name !== 'attr2' || 'type' in entity.attributes[1] || entity.attributes[1].value !== 'value') {
                        return false;
                    }

                    // Attribute 3
                    if (entity.attributes[2].name !== 'attr3' || 'type' in entity.attributes[2] || entity.attributes[2].value !== '5') {
                        return false;
                    }

                    return true;
                }
            });

            connection.updateAttributes(
                [
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


            waitsForResponse(function () {
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
                                'type': 'string'
                            },
                            {
                                'name': 'attr2',
                                'type': ''
                            },
                            {
                                'name': 'attr3',
                                'type': ''
                            }
                        ]
                    }
                ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic update context requests with structured attributes", function (done) {
                // TODO
                var request = new XMLHttpRequest();
                request.open('GET', 'responses/update9.json', false);
                request.send();
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data, entity, attribute;

                            data = JSON.parse(options.postBody);
                            if (!('contextElements' in data) || data.updateAction !== 'UPDATE') {
                                return false;
                            }
                            if (data.contextElements.length !== 1) {
                                return false;
                            }

                            entity = data.contextElements[0];
                            if (entity.id !== 'entity1' || entity.type !== 'Technician' || entity.attributes.length !== 1) {
                                return false;
                            }

                            attribute = entity.attributes[0];
                            if (attribute.name !== 'structuredattr' || attribute.type !== 'structure' || !Array.isArray(attribute.value)) {
                                return false;
                            }

                            return attribute.value[0] === "22" && Array.isArray(attribute.value[1].x);
                        }
                    });

            connection.updateAttributes(
                [
                        {
                            'entity': {type: 'Technician', id: 'entity1'},
                            'attributes': [
                                {
                                    name: 'structuredattr',
                                    type: 'structure',
                                    contextValue: [
                                        "22",
                                        {
                                            "x": ["x1", "x2"],
                                            "y": "3"
                                        },
                                        ["z1", "z2"]
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'structuredattr',
                                'type': 'structure'
                            }
                        ]
                    }
                    ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("errors when making basic update context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update7.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || !('updateAction' in data)) {
                        return false;
                    }
                    if (data.contextElements.length !== 2) {
                        return false;
                    }

                    // Enitiy 1
                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.isPattern !== 'false' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || entity.attributes[0].value !== '40.418889, -3.691944') {
                        return false;
                    }

                    // Enitiy 2
                    entity = data.contextElements[1];
                    if (entity.id !== 'A' || entity.type !== 'Point' || entity.isPattern !== 'false' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'mobile_phone' || entity.attributes[0].type !== 'string' || entity.attributes[0].value !== '0034223456789') {
                        return false;
                    }

                    return true;
                }
            });

            connection.updateAttributes(
                [
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        entity: {id: 'Madrid', type: 'City'},
                        attributes: [
                            {name: 'position', type: 'coords'}
                        ]
                    }
                    ]);
                expect(response_error_data).toEqual(
                    [{
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
            }, done);
        });

        it("basic update context requests using the flat option", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || !('updateAction' in data)) {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'entity1' || entity.type !== 'Technician' || entity.attributes.length !== 3) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'mobile_phone' || entity.attributes[0].type !== 'string' || entity.attributes[0].value !== '0034223456789') {
                        return false;
                    }

                    // Attribute 2
                    if (entity.attributes[1].name !== 'attr2' || 'type' in entity.attributes[1] || entity.attributes[1].value !== 'value') {
                        return false;
                    }

                    // Attribute 3
                    if (entity.attributes[2].name !== 'attr3' || 'type' in entity.attributes[2] || entity.attributes[2].value !== '5') {
                        return false;
                    }

                    return true;
                }
            });

            connection.updateAttributes(
                [
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': [
                            {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
                            {name: 'attr2', contextValue: 'value'},
                            {name: 'attr3', contextValue: 5}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'mobile_phone': '',
                        'attr2': '',
                        'attr3': ''
                    }
                });
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic add context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'APPEND') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'entity1' || entity.type !== 'Technician' || entity.attributes.length !== 1) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'new_attribute' || entity.attributes[0].type !== 'string' || entity.attributes[0].value !== 'value') {
                        return false;
                    }

                    return true;
                }

            });

            connection.addAttributes(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
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
            }, done);
        });

        it("basic add context requests adding metadata", function (done) {
                // TODO
            var request = new XMLHttpRequest();
                request.open('GET', 'responses/update3.json', false);
                request.send();
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data, entity, metadata;

                            data = JSON.parse(options.postBody);
                            if (!('contextElements' in data) || data.updateAction !== 'APPEND') {
                                return false;
                            }
                            if (data.contextElements.length !== 1) {
                                return false;
                            }

                            entity = data.contextElements[0];
                            if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                                return false;
                            }

                            // Attribute 1
                            if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || entity.attributes[0].value !== '40.418889, -3.691944') {
                                return false;
                            }

                            metadata = entity.attributes[0].metadatas;
                            return Array.isArray(metadata) && metadata[0].name === 'location' && metadata[0].type === 'string' && metadata[0].value === 'WGS84';
                        }
                    });

            connection.addAttributes(
                [
                        {
                            entity: {type: 'City', id: 'Madrid'},
                            attributes: [
                                {
                                    name: 'position',
                                    type: 'coords',
                                    contextValue: '40.418889, -3.691944',
                                    metadata: [
                                        {name: 'location', type: 'string', value: 'WGS84'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        entity: {
                            id: 'Madrid',
                            type: 'City'
                        },
                        attributes: [
                            {
                                name: 'position',
                                type: 'coords',
                                metadata: [
                                    {name: 'location', type: 'string', value: 'WGS84'}
                                ]
                            }
                        ]
                    }
                ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic add context requests with structured attributes", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update9.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity, attribute;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'APPEND') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'entity1' || entity.type !== 'Technician' || entity.attributes.length !== 1) {
                        return false;
                    }

                    attribute = entity.attributes[0];
                    if (attribute.name !== 'structuredattr' || attribute.type !== 'structure' || !Array.isArray(attribute.value)) {
                        return false;
                    }

                    return attribute.value[0] === "22" && Array.isArray(attribute.value[1].x);
                }
            });

            connection.addAttributes(
                [{
                    'entity': {type: 'Technician', id: 'entity1'},
                    'attributes': [
                        {
                            name: 'structuredattr',
                            type: 'structure',
                            contextValue: [
                                "22",
                                {
                                    "x": ["x1", "x2"],
                                    "y": "3"
                                },
                                ["z1", "z2"]
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'structuredattr',
                                'type': 'structure'
                            }
                        ]
                    }
                    ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic add context requests using the flat option", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.addAttributes(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                });
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic delete context attributes requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {'name': 'position', 'type': 'coords'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
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
            }, done);
        });

        it("errors when making basic delete context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }
            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
                expect(response_error_data).toEqual(
                    [{
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
            }, done);
        });

        it("errors when making basic delete context requests using the flat option", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 2) {
                        return false;
                    }

                    // Entity 1
                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    // Entity 2
                    entity = data.contextElements[1];
                    if (entity.id !== 'Madriz' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
                        ]
                    },
                    {
                        'entity': {type: 'City', id: 'Madriz'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    Madrid: {
                        id: 'Madrid',
                        type: 'City',
                        position: ''
                    }
                });
                expect(response_error_data).toEqual(
                    [{
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
            }, done);
        });

        it("basic delete context entities requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update8.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || 'attributes' in entity) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'Madrid',
                            'type': 'City'
                        },
                        'attributes': []
                    }
                    ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic subscribe context requests", function (done) {
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

            });

            connection.createSubscription(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(0);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        it("basic update context subscription requests", function (done) {
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
            });

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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT20H'
                });
            }, done);
        });

        it("basic cancel context subscription requests", function (done) {
                // TODO
            var request = new XMLHttpRequest();
                request.open('GET', 'responses/unsubscribeContext1.xml', false);
                request.send();
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/unsubscribeContext", {
                        status: 200,
                        responseText: request.responseText
                    });

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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1'
                });
            }, done);
        });

        it("basic get available types requests", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes", {
                status: 200,
                responseText: request.responseText
            });

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

            waitsForResponse(function () {
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
            }, done);
        });

        it("basic get type info requests", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes/Agrarium", {
                status: 200,
                responseText: request.responseText
            });

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

            waitsForResponse(function () {
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
            }, done);
        });

    });

    describe("NGSI Library (using proxies) handles", function () {

        ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            var options = {
                requestFunction: ajaxMockup,
                ngsi_proxy_url: 'http://ngsiproxy.example.com'
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
            response = false;
            response_data = null;
            response_error_data = null;
            response_details = null;
            notification_data = null;
            failure = false;
            window.mockedeventsources = [];
        });

        connection_error_on_query_test('Connection Error via proxy', 502);
        connection_error_on_query_test('Connection timeout via proxy', 504);

        it("basic subscribe context requests using the ngsi proxy", function (done) {
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
            });

            connection.createSubscription(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(1);
                expect(mockedeventsources[0].url).toEqual('http://ngsiproxy.example.com/eventsource/1');
                expect(mockedeventsources[0].events.init.length).toEqual(0);
                expect(mockedeventsources[0].events.close.length).toEqual(1);
                expect(mockedeventsources[0].events.notification.length).toEqual(1);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        bad_ngsi_proxy_response_test("Connection Error", 0, NGSI.ConnectionError);
        bad_ngsi_proxy_response_test("404", 404, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("200", 200, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("Missing Location Header", 201, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("Connection Error via proxy", 502, NGSI.ConnectionError);
        bad_ngsi_proxy_response_test("Connection timeout via proxy", 504, NGSI.ConnectionError);

    });
})();
