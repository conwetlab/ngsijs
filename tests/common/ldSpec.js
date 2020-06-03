/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

if ((typeof require === 'function') && typeof global != null) {
    // eslint-disable-next-line no-undef
    NGSI = require('../../ngsi-node');
    // eslint-disable-next-line no-undef
    URL = require('whatwg-url').URL;
}

(function () {

    "use strict";

    const LD_JSON_ENTITY = {
        "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        "id": "urn:ngsi-ld:Road:Spain-Road-A62",
        "type": "https://uri.fiware.org/ns/data-models#Road",
        "https://schema.org/alternateName": {
            "type": "Property",
            "value": "E-80"
        },
        "description": {
            "type": "Property",
            "value": "Autovía de Castilla"
        },
        "name": {
            "type": "Property",
            "value": "A-62"
        },
        "https://uri.fiware.org/ns/data-models#length": {
            "type": "Property",
            "value": 355
        },
        "https://uri.fiware.org/ns/data-models#refRoadSegment": {
            "type": "Relationship",
            "object": [
                "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-forwards",
                "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-backwards"
            ]
        },
        "https://uri.fiware.org/ns/data-models#responsible": {
            "type": "Property",
            "value": "Ministerio de Fomento - Gobierno de España"
        },
        "https://uri.fiware.org/ns/data-models#roadClass": {
            "type": "Property",
            "value": "https://uri.fiware.org/ns/data-models#motorway"
        }
    };

    const KEY_VALUES_ENTITY = {
        "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        "id": "urn:ngsi-ld:Road:Spain-Road-A62",
        "type": "https://uri.fiware.org/ns/data-models#Road",
        "https://schema.org/alternateName": "E-80",
        "description": "Autovía de Castilla",
        "name": "A-62",
        "https://uri.fiware.org/ns/data-models#length": 355,
        "https://uri.fiware.org/ns/data-models#refRoadSegment": [
            "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-forwards",
            "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-backwards"
        ],
        "https://uri.fiware.org/ns/data-models#responsible": "Ministerio de Fomento - Gobierno de España",
        "https://uri.fiware.org/ns/data-models#roadClass": "https://uri.fiware.org/ns/data-models#motorway"
    };

    describe("Connecton.ld", () => {

        let connection;
        let ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(() => {
            const options = {
                requestFunction: ajaxMockup
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
        });

        describe('createEntity(entity[, options])', () => {

            const entity = {
                "id": "urn:ngsi-ld:Road:Spain-Road-A62",
                "type": "Road",
                "name": {
                    "type": "Property",
                    "value": "A-62"
                },
                "alternateName": {
                    "type": "Property",
                    "value": "E-80"
                },
                "description": {
                    "type": "Property",
                    "value": "Autovía de Castilla"
                },
                "roadClass": {
                    "type": "Property",
                    "value": "motorway"
                },
                "length": {
                    "type": "Property",
                    "value": 355
                },
                "refRoadSegment": {
                    "type": "Relationship",
                    "object": [
                        "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-forwards",
                        "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-backwards"
                    ]
                },
                "responsible": {
                    "type": "Property",
                    "value": "Ministerio de Fomento - Gobierno de España"
                },
                "@context": [
                    "https://schema.lab.fiware.org/ld/context",
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
                ]
            };

            let entity_values = {
                "id": "a",
                "type": "b",
                "attr": "value"
            };

            it("throws a TypeError exception when not passing the id option", () => {
                expect(() => {
                    connection.ld.createEntity({});
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the type option", () => {
                expect(() => {
                    connection.ld.createEntity({id: "urn:A"});
                }).toThrowError(TypeError);
            });

            it("basic request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Location': '/ngsi-ld/v1/entities/a?type=b'
                    },
                    checkRequestContent: (url, options) => {
                        let data = JSON.parse(options.postBody);
                        expect(data).toEqual(entity);
                    }
                });

                connection.ld.createEntity(entity).then(
                    (result) => {
                        expect(result).toEqual({
                            entity: entity,
                            location: "/ngsi-ld/v1/entities/a?type=b"
                        });
                    },
                    fail
                ).finally(done);
            });

            it("basic request (using the service option)", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 201,
                    headers: {
                        'Location': '/ngsi-ld/v1/entities/a?type=b'
                    },
                    checkRequestContent: (url, options) => {
                        expect(options.requestHeaders).toEqual(jasmine.objectContaining({
                            'FIWARE-Service': 'mytenant'
                        }));
                    }
                });

                connection.ld.createEntity(entity, {service: "mytenant"}).then(
                    (result) => {
                        expect(result).toEqual({
                            entity: entity,
                            location: "/ngsi-ld/v1/entities/a?type=b"
                        });
                    },
                    fail
                ).finally(done);
            });

            it("invalid request", (done) => {
                // Invalid Request error should not be possible when using the library, but code can always have bugs.
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "POST",
                    status: 400,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/InvalidRequest", "title": "Request payload body is not a valid JSON document", "detail": "no detail"}'
                });

                connection.ld.createEntity({id: "car1", type: "Car"}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidRequestError));
                        expect(e.message).toBe("Request payload body is not a valid JSON document");
                        done();
                    }
                ).finally(done);
            });

            it("bad request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "POST",
                    status: 400,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData", "title": "Invalid characters in entity id", "detail": "no detail"}'
                });

                connection.ld.createEntity({id: "21$(", type: "Car"}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.BadRequestError));
                        expect(e.message).toBe("Invalid characters in entity id");
                        done();
                    }
                ).finally(done);
            });

            it("invalid 400", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 400
                });

                connection.ld.createEntity(entity_values).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

            it("manage already exists errors", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 409,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/AlreadyExists", "title": "The referred element already exists", "detail": "no detail"}'
                });

                connection.ld.createEntity(entity).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.AlreadyExistsError));
                    }
                ).finally(done);
            });

            it("unexpected error code", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 204
                });

                connection.ld.createEntity(entity).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

            it("unexpected error code (204)", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "POST",
                    status: 204
                });

                connection.ld.createEntity(entity).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

        });

        describe('deleteEntity(options)', () => {

            it("throws a TypeError exception when not passing the options parameter", () => {
                expect(() => {
                    connection.ld.deleteEntity();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", () => {
                expect(() => {
                    connection.ld.deleteEntity({});
                }).toThrowError(TypeError);
            });

            it("deletes entities only passing the id", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters).toBe(undefined);
                    },
                    method: "DELETE",
                    status: 204
                });

                connection.ld.deleteEntity("urn:ngsi-ld:Road:Spain-Road-A62").then(
                    (result) => {
                        expect(result).toEqual({});
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("deletes entities only passing the id as option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters).toBe(undefined);
                    },
                    method: "DELETE",
                    status: 204
                });

                connection.ld.deleteEntity({id: "urn:ngsi-ld:Road:Spain-Road-A62"}).then(
                    (result) => {
                        expect(result).toEqual({});
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("entity not found", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "DELETE",
                    status: 404,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound", "title": "No context element found", "detail": "no detail"}'
                });

                connection.ld.deleteEntity("urn:ngsi-ld:Road:Spain-Road-A62").then(
                    (value) => {
                        fail("Success callback called");
                    },
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.NotFoundError));
                        expect(e.message).toBe("No context element found");
                    }
                ).finally(done);
            });

            it("bad request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/21%24(", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "DELETE",
                    status: 400,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData", "title": "Invalid characters in entity id", "detail": "no detail"}'
                });

                connection.ld.deleteEntity({id: "21$("}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.BadRequestError));
                        expect(e.message).toBe("Invalid characters in entity id");
                    }
                ).finally(done);
            });

            it("invalid 404", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "DELETE",
                    status: 404
                });

                connection.ld.deleteEntity({id: "urn:ngsi-ld:Road:Spain-Road-A62"}).then(
                    (value) => {
                        fail("Success callback called");
                    },
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

            it("unexpected error code", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "DELETE",
                    status: 200
                });

                connection.ld.deleteEntity("urn:ngsi-ld:Road:Spain-Road-A62").then(
                    (value) => {
                        fail("Success callback called");
                    },
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);

            });

        });

        describe('getEntity(options)', () => {

            it("throws a TypeError exception when not passing the options parameter", () => {
                expect(() => {
                    connection.ld.getEntity();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(() => {
                    connection.ld.getEntity({});
                }).toThrowError(TypeError);
            });

            it("basic get request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(LD_JSON_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect("options" in options.parameters).toBeFalsy();
                    }
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    expect(result).toEqual({
                        entity: LD_JSON_ENTITY,
                        format: "application/ld+json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("basic get request using the keyValues option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(KEY_VALUES_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).toBe("keyValues");
                    }
                });

                connection.ld.getEntity({id: "urn:ngsi-ld:Road:Spain-Road-A62", keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        entity: KEY_VALUES_ENTITY,
                        format: "application/json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("get request using the @context option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(LD_JSON_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect(options.requestHeaders.Link).toBe('<https://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"');
                    }
                });

                connection.ld.getEntity({
                    id: "urn:ngsi-ld:Road:Spain-Road-A62",
                    "@context": "https://json-ld.org/contexts/person.jsonld"
                }).then(function (result) {
                    expect(result).toEqual({
                        entity: LD_JSON_ENTITY,
                        format: "application/ld+json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("handles unexpected error codes", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 201
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("handles responses with invalid payloads", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("entity not found", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "GET",
                    status: 404,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound", "title": "No context element found", "detail": "no detail"}'
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.NotFoundError));
                    expect(e.message).toBe("No context element found");
                    expect(e.details).toBe("no detail");
                }).finally(done);
            });

            it("invalid 404", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 404
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("invalid 409", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "GET",
                    status: 409,
                    responseText: '{"error":"TooManyResults","description":"More than one matching entity. Please refine your query"}'
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

        });

        describe("queryEntities(options)", () => {

            it("throws a TypeError exception when using the id and idPattern options at the same time", () => {
                expect(() => {
                    connection.ld.queryEntities({
                        id: "urn:myentity",
                        idPattern: "my.*"
                    });
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when using the type and typePattern options at the same time", () => {
                expect(() => {
                    connection.ld.queryEntities({
                        type: "myType",
                        typePattern: "my.*"
                    });
                }).toThrowError(TypeError);
            });

            it("should assume idPattern: .* by default", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).not.toBeDefined();
                        expect(options.parameters.idPattern).toBe(".*");
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.queryEntities().then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request (using the type option) with empty results", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).not.toBeDefined();
                        expect(options.parameters.idPattern).not.toBeDefined();
                        expect(options.parameters.type).toBe("Room");
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.queryEntities({type: "Room"}).then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request with empty results (using the keyValues option)", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).toBe("keyValues");
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.queryEntities({keyValues: true}).then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request with empty results (using the sysAttrs option)", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).toBe("sysAttrs");
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.queryEntities({sysAttrs: true}).then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request using the @context option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify([LD_JSON_ENTITY]),
                    checkRequestContent: (url, options) => {
                        expect(options.requestHeaders.Link).toBe('<https://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"');
                    }
                });

                connection.ld.queryEntities({
                    "@context": "https://json-ld.org/contexts/person.jsonld"
                }).then(
                    (result) => {
                        expect(result).toEqual({
                            format: "application/ld+json",
                            limit: 20,
                            offset: 0,
                            results: [LD_JSON_ENTITY]
                        });
                    }, (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("invalid json response", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: 'invalid'
                });

                connection.ld.queryEntities().then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

            it("bad request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "GET",
                    status: 400,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData", "title": "Invalid characters in entity id", "detail": "no detail"}'
                });

                connection.ld.queryEntities({id: "21$("}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.BadRequestError));
                        expect(e.message).toBe("Invalid characters in entity id");
                    }
                ).finally(done);
            });

            it("unexpected error code", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities", {
                    method: "GET",
                    status: 204
                });

                connection.ld.queryEntities({type: "Room"}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

        });

        describe("listSubscriptions(options)", () => {

            it("should limit subscriptions to 20 by default", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).not.toBeDefined();
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.listSubscriptions().then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request with empty results (using the sysAttrs option)", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).toBe("sysAttrs");
                    },
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: '[]'
                });

                connection.ld.listSubscriptions({sysAttrs: true}).then(
                    (result) => {
                        expect(result).toEqual({
                            format: 'application/ld+json',
                            limit: 20,
                            offset: 0,
                            results: []
                        });
                    },
                    (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("basic request using the @context option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify([LD_JSON_ENTITY]),
                    checkRequestContent: (url, options) => {
                        expect(options.requestHeaders.Link).toBe('<https://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"');
                    }
                });

                connection.ld.listSubscriptions({
                    "@context": "https://json-ld.org/contexts/person.jsonld"
                }).then(
                    (result) => {
                        expect(result).toEqual({
                            format: "application/ld+json",
                            limit: 20,
                            offset: 0,
                            results: [LD_JSON_ENTITY]
                        });
                    }, (e) => {
                        fail("Failure callback called");
                    }
                ).finally(done);
            });

            it("invalid json response", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: "GET",
                    status: 200,
                    responseText: 'invalid'
                });

                connection.ld.listSubscriptions().then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

            it("bad request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    method: "GET",
                    status: 400,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData", "title": "Invalid characters in entity id", "detail": "no detail"}'
                });

                connection.ld.listSubscriptions({id: "21$("}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.BadRequestError));
                        expect(e.message).toBe("Invalid characters in entity id");
                    }
                ).finally(done);
            });

            it("unexpected error code", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/subscriptions", {
                    method: "GET",
                    status: 204
                });

                connection.ld.listSubscriptions({type: "Room"}).then(
                    fail,
                    (e) => {
                        expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                    }
                ).finally(done);
            });

        });

    });

})();
