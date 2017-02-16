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

    describe("Connecton.v2", function () {

        var connection;
        var ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            var options = {
                requestFunction: ajaxMockup
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
        });

        describe('deleteEntity(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.deleteEntity();
                }).toThrowError(TypeError);
            });

            it("deletes entities only passing the id", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    },
                    method: "DELETE",
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    status: 204
                });

                connection.v2.deleteEntity("Spain-Road-A62").then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("deletes typed entities", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Road");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    },
                    method: "DELETE",
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    status: 204
                });

                connection.v2.deleteEntity({id: "Spain-Road-A62", type: "Road"}).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    method: "DELETE",
                    status: 200
                });

                connection.v2.deleteEntity("Spain-Road-A62").then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });

            });

        });

        describe('deleteEntityAttribute(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.deleteEntityAttribute();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(function () {
                    connection.v2.deleteEntityAttribute({
                        attribute: "temperature"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the attribute option", function () {
                expect(function () {
                    connection.v2.deleteEntityAttribute({
                        id: "Bcn_Welt"
                    });
                }).toThrowError(TypeError);
            });

            it("deletes attributes from entities", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    },
                    method: "DELETE",
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    status: 204
                });

                connection.v2.deleteEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("deletes attributes from typed entities", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    },
                    method: "DELETE",
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    status: 204
                });

                connection.v2.deleteEntityAttribute({
                    id: "Bcn_Welt",
                    type: "Room",
                    attribute: "temperature"
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    method: "DELETE",
                    status: 200
                });

                connection.v2.deleteEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function (result) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });

            });

        });

        describe('deleteSubscription(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.deleteSubscription();
                }).toThrowError(TypeError);
            });

            it("basic request", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/57f7787a5f817988e4eb3dda", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: "DELETE",
                    status: 204
                });

                connection.v2.deleteSubscription("57f7787a5f817988e4eb3dda").then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request (custom correlator)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/57f7787a5f817988e4eb3dda", {
                    checkRequestContent: function (url, options) {
                        expect(options.requestHeaders).toEqual(jasmine.objectContaining({
                            'FIWARE-Correlator': 'customcorrelator'
                        }));

                        return true;
                    },
                    headers: {
                        'Fiware-correlator': 'customcorrelator',
                    },
                    method: "DELETE",
                    status: 204
                });

                connection.v2.deleteSubscription({
                    id: "57f7787a5f817988e4eb3dda",
                    correlator: "customcorrelator"
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'customcorrelator'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/57f7787a5f817988e4eb3dda", {
                    method: "DELETE",
                    status: 200
                });

                connection.v2.deleteSubscription("57f7787a5f817988e4eb3dda").then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });

            });

        });

        describe('createEntity(entity[, options]', function () {

            var entity = {
                "id": "a",
                "type": "b",
                "attr": {
                    "value": "value"
                }
            };

            var entity_values = {
                "id": "a",
                "type": "b",
                "attr": "value"
            };

            it("basic request", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Location': '/v2/entities/a?type=b'
                    },
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual(entity);
                        expect(options.parameters.options).toEqual(undefined);

                        return true;
                    }
                });

                connection.v2.createEntity(entity).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken',
                        entity: entity,
                        location: "/v2/entities/a?type=b"
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request (using the keyValues option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Location': '/v2/entities/a?type=b'
                    },
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual(entity_values);
                        expect(options.parameters.options).toEqual("keyValues");

                        return true;
                    }
                });

                connection.v2.createEntity(entity_values, {keyValues: true}).then(function (value) {
                    expect(value).toEqual({
                        correlator: 'correlatortoken',
                        entity: entity_values,
                        location: "/v2/entities/a?type=b"
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    method: "POST",
                    status: 204
                });

                connection.v2.createEntity(entity).then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('createSubscription(subscription[, options])', function () {

            var subscription = {
                "description": "One subscription to rule them all",
                "subject": {
                    "entities": [
                        {
                            "idPattern": ".*",
                            "type": "Room"
                        }
                    ],
                    "condition": {
                        "attrs": [
                            "temperature"
                        ],
                        "expression": {
                            "q": "temperature>40"
                        }
                    }
                },
                "notification": {
                    "http": {
                        "url": "http://localhost:1234"
                    },
                    "attrs": [
                        "temperature",
                        "humidity"
                    ]
                },
                "expires": "2016-04-05T14:00:00.00Z",
                "throttling": 5
            };

            describe("throws a TypeError when passing invalid data on the subscription parameter", function () {
                var test = function (label, value) {
                    it(label, function () {
                        expect(function () {
                            connection.v2.createSubscription(value);
                        }).toThrowError(TypeError);
                    });
                };

                test("number", 5);
                test("array", []);
                test("empty object", {});
                test("subscription containing an id", {
                    id: "abcde98765"
                });
                test("invalid callback", {
                    notification: {
                        callback: "a"
                    }
                });

            });

            it("basic request", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Location': '/v2/subscriptions/abcde98765'
                    },
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual(subscription);
                        expect(options.parameters).toEqual(undefined);

                        return true;
                    }
                });

                connection.v2.createSubscription(subscription).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken',
                        subscription: subscription,
                        location: "/v2/subscriptions/abcde98765"
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request providing a custom correlator", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Fiware-correlator': 'customcorrelator',
                        'Location': '/v2/subscriptions/abcde98765'
                    },
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual(subscription);
                        expect(options.parameters).toEqual(undefined);

                        return true;
                    }
                });

                connection.v2.createSubscription(subscription, {correlator: "customcorrelator"}).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'customcorrelator',
                        subscription: subscription,
                        location: "/v2/subscriptions/abcde98765"
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows creating subscriptions using ngsi-proxy callbacks", function (done) {
                var listener = jasmine.createSpy("listener");
                var subscription = {
                    "description": "One subscription to rule them all",
                    "subject": {
                        "entities": [
                            {
                                "idPattern": ".*",
                                "type": "Room"
                            }
                        ],
                        "condition": {
                            "attrs": [
                                "temperature"
                            ],
                            "expression": {
                                "q": "temperature>40"
                            }
                        }
                    },
                    "notification": {
                        "callback": listener,
                        "attrs": [
                            "temperature",
                            "humidity"
                        ]
                    },
                    "expires": "2016-04-05T14:00:00.00Z",
                    "throttling": 5
                };
                var notification_data = [
                    {
                        "id": "Room1",
                        "type": "Room",
                        "temperature": {
                            "value": 23,
                            "type": "Number",
                            "metadata": {}
                        },
                        "humidity": {
                            "value": 70,
                            "type": "percentage",
                            "metadata": {}
                        }
                    },
                    {
                        "id": "Room2",
                        "type": "Room",
                        "temperature": {
                            "value": 24,
                            "type": "Number",
                            "metadata": {}
                        }
                    }
                ];

                // Mock ngsi proxy responses
                connection.ngsi_proxy = {
                    requestCallback: jasmine.createSpy("requestCallback").and.callFake(function () {
                        return Promise.resolve({
                            callback_id: "1",
                            url: "http://ngsiproxy.example.com/callback/1"
                        });
                    }),
                    associateSubscriptionId: jasmine.createSpy("associateSubscriptionId"),
                    closeCallback: jasmine.createSpy("closeCallback")
                };

                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Location': '/v2/subscriptions/abcde98765'
                    },
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual(subscription);
                        expect(options.parameters).toEqual(undefined);

                        return true;
                    }
                });

                connection.v2.createSubscription(subscription).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken',
                        subscription: subscription,
                        location: "/v2/subscriptions/abcde98765"
                    });

                    expect(connection.ngsi_proxy.requestCallback)
                        .toHaveBeenCalledWith(jasmine.any(Function));
                    expect(connection.ngsi_proxy.associateSubscriptionId)
                        .toHaveBeenCalledWith("1", "abcde98765");
                    connection.ngsi_proxy.requestCallback.calls.argsFor(0)[0](
                        JSON.stringify({
                            "subscriptionId": "abcde98765",
                            "data": notification_data
                        }),
                        {
                            "ngsiv2-attrsformat": "normalized"
                        }
                    );
                    expect(listener).toHaveBeenCalledWith({
                        attrsformat: "normalized",
                        data: notification_data,
                        subscriptionId: "abcde98765"
                    });

                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles connection errors", function (done) {
                connection.v2.createSubscription(subscription).then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.ConnectionError));
                    done();
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    method: "POST",
                    status: 204
                });

                connection.v2.createSubscription(subscription).then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("close ngsi-proxy callbacks on error", function (done) {
                var listener = jasmine.createSpy("listener");
                var subscription = {
                    "description": "One subscription to rule them all",
                    "subject": {
                        "entities": [
                            {
                                "idPattern": ".*",
                                "type": "Room"
                            }
                        ],
                        "condition": {
                            "attrs": [
                                "temperature"
                            ],
                            "expression": {
                                "q": "temperature>40"
                            }
                        }
                    },
                    "notification": {
                        "callback": listener,
                        "attrs": [
                            "temperature",
                            "humidity"
                        ]
                    },
                    "expires": "2016-04-05T14:00:00.00Z",
                    "throttling": 5
                };

                // Mock ngsi proxy responses
                connection.ngsi_proxy = {
                    requestCallback: jasmine.createSpy("requestCallback").and.callFake(function () {
                        return Promise.resolve({
                            callback_id: "1",
                            url: "http://ngsiproxy.example.com/callback/1"
                        });
                    }),
                    associateSubscriptionId: jasmine.createSpy("associateSubscriptionId"),
                    closeCallback: jasmine.createSpy("closeCallback")
                };

                connection.v2.createSubscription(subscription).then(function (result) {
                    fail("Success callback called");
                }, function (e) {
                    expect(connection.ngsi_proxy.closeCallback).toHaveBeenCalledWith("1");
                    done();
                });
            });

        });

        describe('getEntity(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getEntity();
                }).toThrowError(TypeError);
            });

            it("basic get request", function (done) {
                var entity_data = {
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "name": {"value": "A-62"},
                    "alternateName": {"value": "E-80"},
                    "description": {"value": "Autovía de Castilla"},
                    "roadClass": {"value": "motorway"},
                    "length": {"value": 355},
                    "refRoadSegment": {
                        "value": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ]
                    },
                    "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntity("Spain-Road-A62").then(function (result) {
                    expect(result).toEqual({
                        entity: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("retrieves typed entities", function (done) {
                var entity_data = {
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "name": {"value": "A-62"},
                    "alternateName": {"value": "E-80"},
                    "description": {"value": "Autovía de Castilla"},
                    "roadClass": {"value": "motorway"},
                    "length": {"value": 355},
                    "refRoadSegment": {
                        "value": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ]
                    },
                    "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Road");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntity({id: "Spain-Road-A62", type: "Road"}).then(function (result) {
                    expect(result).toEqual({
                        entity: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic get request using the keyValues option", function (done) {
                var entity_data = {
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "name": "A-62",
                    "alternateName": "E-80",
                    "description": "Autovía de Castilla",
                    "roadClass": "motorway",
                    "length": 355,
                    "refRoadSegment": [
                        "Spain-RoadSegment-A62-0-355-forwards",
                        "Spain-RoadSegment-A62-0-355-backwards"
                    ],
                    "responsible": "Ministerio de Fomento - Gobierno de España"
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("keyValues");
                        return true;
                    }
                });

                connection.v2.getEntity({id: "Spain-Road-A62", keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        entity: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getEntity("Spain-Road-A62").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getEntity("Spain-Road-A62").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('getEntityAttribute(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getEntityAttribute();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(function () {
                    connection.v2.getEntityAttribute({
                        attribute: "temperature"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the attribute option", function () {
                expect(function () {
                    connection.v2.getEntityAttribute({
                        id: "Bcn_Welt"
                    });
                }).toThrowError(TypeError);
            });

            it("basic get request", function (done) {
                var attribute_data = {
                    "value": 21.7,
                    "type": "Number",
                    "metadata": {}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(attribute_data),
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function (result) {
                    expect(result).toEqual({
                        attribute: attribute_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("retrieves typed entities", function (done) {
                var attribute_data = {
                    "value": 21.7,
                    "type": "Number",
                    "metadata": {}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(attribute_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttribute({
                    id: "Bcn_Welt",
                    type: "Room",
                    attribute: "temperature"
                }).then(function (result) {
                    expect(result).toEqual({
                        attribute: attribute_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('getEntityAttributes(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getEntityAttributes();
                }).toThrowError(TypeError);
            });

            it("allows basic usage only passing the id", function (done) {
                var entity_data = {
                    "name": {"value": "A-62"},
                    "alternateName": {"value": "E-80"},
                    "description": {"value": "Autovía de Castilla"},
                    "roadClass": {"value": "motorway"},
                    "length": {"value": 355},
                    "refRoadSegment": {
                        "value": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ]
                    },
                    "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttributes("Spain-Road-A62").then(function (result) {
                    expect(result).toEqual({
                        attributes: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("retrieves typed entities", function (done) {
                var entity_data = {
                    "name": {"value": "A-62"},
                    "alternateName": {"value": "E-80"},
                    "description": {"value": "Autovía de Castilla"},
                    "roadClass": {"value": "motorway"},
                    "length": {"value": 355},
                    "refRoadSegment": {
                        "value": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ]
                    },
                    "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Road");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttributes({id: "Spain-Road-A62", type: "Road"}).then(function (result) {
                    expect(result).toEqual({
                        attributes: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic get request using the keyValues option", function (done) {
                var entity_data = {
                    "name": "A-62",
                    "alternateName": "E-80",
                    "description": "Autovía de Castilla",
                    "roadClass": "motorway",
                    "length": 355,
                    "refRoadSegment": [
                        "Spain-RoadSegment-A62-0-355-forwards",
                        "Spain-RoadSegment-A62-0-355-backwards"
                    ],
                    "responsible": "Ministerio de Fomento - Gobierno de España"
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(entity_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("keyValues");
                        return true;
                    }
                });

                connection.v2.getEntityAttributes({id: "Spain-Road-A62", keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        attributes: entity_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getEntityAttributes("Spain-Road-A62").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getEntityAttributes("Spain-Road-A62").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('getEntityAttributeValue(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getEntityAttributeValue();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(function () {
                    connection.v2.getEntityAttributeValue({
                        attribute: "temperature"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the attribute option", function () {
                expect(function () {
                    connection.v2.getEntityAttributeValue({
                        id: "Bcn_Welt"
                    });
                }).toThrowError(TypeError);
            });

            it("basic usage", function (done) {
                var attribute_data = [
                    "Spain-RoadSegment-A62-0-355-forwards",
                    "Spain-RoadSegment-A62-0-355-backwards"
                ];
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs/refRoadSegment/value", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(attribute_data),
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttributeValue({
                    id: "Spain-Road-A62",
                    attribute: "refRoadSegment"
                }).then(function (result) {
                    expect(result).toEqual({
                        value: attribute_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("retrieves typed entities", function (done) {
                var attribute_data = [
                    "Spain-RoadSegment-A62-0-355-forwards",
                    "Spain-RoadSegment-A62-0-355-backwards"
                ];
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs/refRoadSegment/value", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(attribute_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Road");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.getEntityAttributeValue({
                    id: "Spain-Road-A62",
                    type: "Road",
                    attribute: "refRoadSegment"
                }).then(function (result) {
                    expect(result).toEqual({
                        value: attribute_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature/value", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getEntityAttributeValue({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature/value", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getEntityAttributeValue({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('getSubscription(options)', function () {

            var subscription_data = {
                "id": "abcdef",
                "description": "One subscription to rule them all",
                "subject": {
                    "entities": [
                        {
                            "idPattern": ".*",
                            "type": "Room"
                        }
                    ],
                    "condition": {
                        "attrs": [
                            "temperature "
                        ],
                        "expression": {
                            "q": "temperature>40"
                        }
                    }
                },
                "notification": {
                    "http": {
                        "url": "http://localhost:1234"
                    },
                    "attrs": ["temperature", "humidity"],
                    "timesSent": 12,
                    "lastNotification": "2015-10-05T16:00:00.00Z"
                },
                "expires": "2016-04-05T14:00:00.00Z",
                "status": "active",
                "throttling": 5
            };

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getSubscription();
                }).toThrowError(TypeError);
            });

            it("basic usage", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(subscription_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters == null).toBeTruthy();
                        return true;
                    }
                });

                connection.v2.getSubscription("abcdef").then(function (result) {
                    expect(result).toEqual({
                        subscription: subscription_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request using the service option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(subscription_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters == null).toBeTruthy();
                        expect(options.requestHeaders).toEqual(jasmine.objectContaining({
                            'FIWARE-Service': 'mytenant'
                        }));
                        return true;
                    }
                });

                connection.v2.getSubscription({id: "abcdef", service: "mytenant"}).then(function (result) {
                    expect(result).toEqual({
                        subscription: subscription_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getSubscription("abcdef").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getSubscription("abcdef").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('getType(options)', function () {

            var type_data = {
                "attrs": {
                    "pressure": {
                        "types": [
                            "Number"
                        ]
                    },
                    "humidity": {
                        "types": [
                            "percentage"
                        ]
                    },
                    "temperature": {
                        "types": [
                            "urn:phenomenum:temperature"
                        ]
                    }
                },
                "count": 7
            };

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.getType();
                }).toThrowError(TypeError);
            });

            it("basic usage", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types/Room", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(type_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters == null).toBeTruthy();
                        return true;
                    }
                });

                connection.v2.getType("Room").then(function (result) {
                    expect(result).toEqual({
                        type: type_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request using the service option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types/Room", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(type_data),
                    checkRequestContent: function (url, options) {
                        expect(options.parameters == null).toBeTruthy();
                        expect(options.requestHeaders).toEqual(jasmine.objectContaining({
                            'FIWARE-Service': 'mytenant'
                        }));
                        return true;
                    }
                });

                connection.v2.getType({id: "Room", service: "mytenant"}).then(function (result) {
                    expect(result).toEqual({
                        type: type_data,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types/Room", {
                    method: "GET",
                    status: 201
                });

                connection.v2.getType("Room").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types/Room", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.getType("Room").then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('appendEntityAttributes(changes[, options])', function () {

            it("throws a TypeError exception when not passing the changes parameter", function () {
                expect(function () {
                    connection.v2.appendEntityAttributes();
                }).toThrowError(TypeError);
            });

            it("allows basic usage only passing the id", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'POST',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.appendEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows to update typed entities", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'POST',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "temperature": {
                                "value": 21.7
                            }
                        });
                        return true;
                    }
                });

                connection.v2.appendEntityAttributes({
                    "id": "Bcn-Welt",
                    "type": "Room",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows append attributes using the keyValues option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'POST',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("keyValues");
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "temperature": 21.7
                        });
                        return true;
                    }
                });

                connection.v2.appendEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": 21.7
                }, {
                    keyValues: true
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows strictly append attributes using the strict option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'POST',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("append,keyValues");
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "temperature": 21.7
                        });
                        return true;
                    }
                });

                connection.v2.appendEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": 21.7
                }, {
                    strict: true,
                    keyValues: true
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    method: "POST",
                    status: 201
                });

                connection.v2.appendEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('replaceEntityAttributeValue(options)', function () {

            it("throws a TypeError exception when not passing the options parameter", function () {
                expect(function () {
                    connection.v2.replaceEntityAttributeValue();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(function () {
                    connection.v2.replaceEntityAttributeValue({
                        attribute: "temperature",
                        value: 21
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the attribute option", function () {
                expect(function () {
                    connection.v2.replaceEntityAttributeValue({
                        id: "Bcn_Welt",
                        value: 21
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the value option", function () {
                expect(function () {
                    connection.v2.replaceEntityAttributeValue({
                        id: "Bcn_Welt",
                        attribute: "temperature"
                    });
                }).toThrowError(TypeError);
            });

            it("basic usage", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature/value", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PUT',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.replaceEntityAttributeValue({
                    id: "Bcn_Welt",
                    attribute: "temperature",
                    value: 21
                }).then(function (result) {
                    expect(result).toEqual({
                        value: 21,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("updates typed entitie attributes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature/value", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PUT',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.replaceEntityAttributeValue({
                    id: "Bcn_Welt",
                    type: "Room",
                    attribute: "temperature",
                    value: 21
                }).then(function (result) {
                    expect(result).toEqual({
                        value: 21,
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature/value", {
                    method: "GET",
                    status: 201
                });

                connection.v2.replaceEntityAttributeValue({
                    id: "Bcn_Welt",
                    attribute: "temperature",
                    value: 21
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('updateEntityAttributes(changes[, options])', function () {

            it("throws a TypeError exception when not passing the changes parameter", function () {
                expect(function () {
                    connection.v2.updateEntityAttributes();
                }).toThrowError(TypeError);
            });

            it("allows basic usage only passing the id", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PATCH',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.updateEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows to update typed entities", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PATCH',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "temperature": {
                                "value": 21.7
                            }
                        });
                        return true;
                    }
                });

                connection.v2.updateEntityAttributes({
                    "id": "Bcn-Welt",
                    "type": "Room",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows update attributes using the keyValues option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PATCH',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("keyValues");
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "temperature": 21.7
                        });
                        return true;
                    }
                });

                connection.v2.updateEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": 21.7
                }, {
                    keyValues: true
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn-Welt/attrs", {
                    method: "PATCH",
                    status: 201
                });

                connection.v2.updateEntityAttributes({
                    "id": "Bcn-Welt",
                    "temperature": {
                        "value": 21.7
                    }
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('updateSubscription(changes[, options])', function () {

            it("throws a TypeError exception when not passing the changes parameter", function () {
                expect(function () {
                    connection.v2.updateSubscription();
                }).toThrowError(TypeError);
            });

            it("allows basic usage", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PATCH',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "expires": "2016-04-05T14:00:00.00Z"
                        });
                        expect(options.parameters == null).toBeTruthy();
                        return true;
                    }
                });

                connection.v2.updateSubscription({
                    "id": "abcdef",
                    "expires": "2016-04-05T14:00:00.00Z"
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows using the servicepath option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PATCH',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        var data = JSON.parse(options.postBody);
                        expect(data).toEqual({
                            "expires": "2016-04-05T14:00:00.00Z"
                        });
                        expect(options.parameters == null).toBeTruthy();
                        expect(options.requestHeaders).toEqual(jasmine.objectContaining({
                            'FIWARE-ServicePath': '/Spain/Madrid'
                        }));
                        return true;
                    }
                });

                connection.v2.updateSubscription({
                    "id": "abcdef",
                    "expires": "2016-04-05T14:00:00.00Z"
                }, {
                    "servicepath": "/Spain/Madrid"
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions/abcdef", {
                    method: "PATCH",
                    status: 201
                });

                connection.v2.updateSubscription({
                    "id": "abcdef",
                    "expires": "2016-04-05T14:00:00.00Z"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('listEntities([options])', function () {

            it("throws a TypeError exception when using the id and idPattern options at the same time", function () {
                expect(function () {
                    connection.v2.listEntities({
                        id: "myentity",
                        idPattern: "my.*"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when using the type and typePattern options at the same time", function () {
                expect(function () {
                    connection.v2.listEntities({
                        type: "mytype",
                        typePattern: "mytype.*"
                    });
                }).toThrowError(TypeError);
            });

            it("basic request with empty results", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).not.toBeDefined();
                        return true;
                    },
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listEntities().then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken',
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request with empty results (using the keyValues option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("keyValues");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listEntities({keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("second page with custom limit configuration (using the keyValues option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Fiware-Total-Count': '15'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("count,keyValues");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[{"id": "entity5"}, {"id": "entity6"}, {"id": "entity7"}, {"id": "entity8"}, {"id": "entity9"}]'
                });

                connection.v2.listEntities({
                    count: true,
                    keyValues: true,
                    limit: 5,
                    offset: 10
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        count: 15,
                        offset: 10,
                        limit: 5,
                        results: [
                            {"id": "entity5"},
                            {"id": "entity6"},
                            {"id": "entity7"},
                            {"id": "entity8"},
                            {"id": "entity9"}
                        ]
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request with empty results (using the values option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("values");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listEntities({values: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request with empty results (using the unique option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("unique");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listEntities({unique: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request using the count option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Fiware-Total-Count': '0'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("count");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listEntities({count: true}).then(function (value) {
                    expect(value).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        count: 0,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    method: "GET",
                    status: 204
                });

                connection.v2.listEntities().then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities", {
                    method: "PUT",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.listEntities().then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('listSubscriptions([options])', function () {

            it("basic request", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listSubscriptions().then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request using the count option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Fiware-Total-Count': '0'
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listSubscriptions({count: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        count: 0,
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/subscriptions", {
                    method: "GET",
                    status: 204
                });

                connection.v2.listSubscriptions().then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('listTypes([options])', function () {

            it("basic request with empty results", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).not.toBeDefined();
                        return true;
                    },
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listTypes().then(function (result) {
                    expect(result).toEqual({
                        correlator: 'correlatortoken',
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("second page with custom limit configuration", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Fiware-Total-Count': '15'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("count");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[{"type": "type5", "attrs": {}}, {"type": "type6", "attrs": {}}, {"type": "type7", "attrs": {}}, {"type": "type8", "attrs": {}}, {"type": "type9", "attrs": {}}]'
                });

                connection.v2.listTypes({
                    count: true,
                    limit: 5,
                    offset: 10
                }).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        count: 15,
                        offset: 10,
                        limit: 5,
                        results: [
                            {"type": "type5", "attrs": {}},
                            {"type": "type6", "attrs": {}},
                            {"type": "type7", "attrs": {}},
                            {"type": "type8", "attrs": {}},
                            {"type": "type9", "attrs": {}}
                        ]
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request using the count option", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                        'Fiware-Total-Count': '0'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("count");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listTypes({count: true}).then(function (value) {
                    expect(value).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        count: 0,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic request with empty results (using the values option)", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.options).toBe("values");
                        return true;
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.v2.listTypes({values: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        limit: 20,
                        offset: 0,
                        results: []
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("unexpected error code", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    method: "GET",
                    status: 204
                });

                connection.v2.listTypes().then(function (value) {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/types", {
                    method: "PUT",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.listTypes().then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('replaceEntityAttribute(changes[, options])', function () {

            it("throws a TypeError exception when not passing the changes parameter", function () {
                expect(function () {
                    connection.v2.replaceEntityAttribute();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(function () {
                    connection.v2.replaceEntityAttribute({
                        attribute: "temperature",
                        value: 25,
                        metadata: {
                            "unitCode": {
                                "value": "CEL"
                            }
                        }
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the attribute option", function () {
                expect(function () {
                    connection.v2.replaceEntityAttribute({
                        id: "Bcn_Welt",
                        value: 25,
                        metadata: {
                            "unitCode": {
                                "value": "CEL"
                            }
                        }
                    });
                }).toThrowError(TypeError);
            });

            it("basic usage", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PUT',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect("type" in options.parameters).toBeFalsy();
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.replaceEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature",
                    value: 25,
                    metadata: {
                        "unitCode": {
                            "value": "CEL"
                        }
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        attribute: {
                            value: 25,
                            metadata: {
                                "unitCode": {
                                    "value": "CEL"
                                }
                            }
                        },
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("allows passing the type option inside the changes parameter", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken',
                    },
                    method: 'PUT',
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters.type).toBe("Room");
                        expect("options" in options.parameters).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.replaceEntityAttribute({
                    id: "Bcn_Welt",
                    type: "Room",
                    attribute: "temperature",
                    value: 25,
                    metadata: {
                        "unitCode": {
                            "value": "CEL"
                        }
                    }
                }).then(function (result) {
                    expect(result).toEqual({
                        attribute: {
                            value: 25,
                            metadata: {
                                "unitCode": {
                                    "value": "CEL"
                                }
                            }
                        },
                        correlator: 'correlatortoken'
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    method: "PUT",
                    status: 201
                });

                connection.v2.replaceEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Bcn_Welt/attrs/temperature", {
                    method: "PUT",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.v2.replaceEntityAttribute({
                    id: "Bcn_Welt",
                    attribute: "temperature"
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

        describe('replaceEntityAttributes(entity[, options])', function () {

            it("basic replace request", function (done) {
                var entity_data = {
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "name": {"value": "A-62"},
                    "alternateName": {"value": "E-80"},
                    "description": {"value": "Autovía de Castilla"},
                    "roadClass": {"value": "motorway"},
                    "length": {"value": 355},
                    "refRoadSegment": {
                        "value": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ]
                    },
                    "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    method: "PUT",
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect("options" in options.parameters).toBeFalsy();
                        var data = JSON.parse(options.postBody);
                        expect("id" in data).toBeFalsy();
                        expect("type" in data).toBeFalsy();
                        return true;
                    }
                });

                connection.v2.replaceEntityAttributes(entity_data).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        entity: entity_data
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("basic replace request using the keyValues option", function (done) {
                var entity_data = {
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "name": "A-62",
                    "alternateName": "E-80",
                    "description": "Autovía de Castilla",
                    "roadClass": "motorway",
                    "length": 355,
                    "refRoadSegment": [
                        "Spain-RoadSegment-A62-0-355-forwards",
                        "Spain-RoadSegment-A62-0-355-backwards"
                    ],
                    "responsible": "Ministerio de Fomento - Gobierno de España"
                };
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    headers: {
                        'Fiware-correlator': 'correlatortoken'
                    },
                    method: "PUT",
                    status: 204,
                    checkRequestContent: function (url, options) {
                        expect(options.parameters).toEqual(jasmine.objectContaining({
                            options: "keyValues"
                        }));
                        return true;
                    }
                });

                connection.v2.replaceEntityAttributes(entity_data, {keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        correlator: "correlatortoken",
                        entity: entity_data
                    });
                    done();
                }, function (e) {
                    fail("Failure callback called");
                });
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v2/entities/Spain-Road-A62/attrs", {
                    method: "PUT",
                    status: 200
                });

                connection.v2.replaceEntityAttributes({
                    "id": "Spain-Road-A62",
                    "type": "Road",
                    "attributes": {
                        "name": "A-62",
                        "alternateName": "E-80",
                        "description": "Autovía de Castilla",
                        "roadClass": "motorway",
                        "length": 355,
                        "refRoadSegment": [
                            "Spain-RoadSegment-A62-0-355-forwards",
                            "Spain-RoadSegment-A62-0-355-backwards"
                        ],
                        "responsible": "Ministerio de Fomento - Gobierno de España"
                    }
                }).then(function () {
                    fail("Success callback called");
                }, function (e) {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    done();
                });
            });

        });

    });

})();
