/*!
 *   Copyright 2014-2015 CoNWeT Lab., Universidad Politecnica de Madrid
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */


module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // bower: {
        //     install: {
        //         options: {
        //             layout: function (type, component, source) {
        //                 return type;
        //             },
        //             targetDir: './build/lib/lib'
        //         }
        //     }
        // },

        jscs: {
            library: {
                src: 'NGSI.js',
                options: {
                    config: ".jscsrc"
                }
            },
            grunt: {
                src: 'Gruntfile.js',
                options: {
                    config: ".jscsrc"
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                files: {
                    src: ['NGSI.js']
                }
            },
            grunt: {
                options: {
                    jshintrc: '.jshintrc-node'
                },
                files: {
                    src: ['Gruntfile.js']
                }
            },
            test: {
                options: {
                    jshintrc: '.jshintrc-jasmine'
                },
                files: {
                    src: ['tests.js']
                }
            }
        },

        jasmine: {
            test: {
                src: ['NGSI.js'],
                options: {
                    specs: 'tests.js',
                    helpers: ['helpers/*.js']
                }
            },

            coverage: {
                src: '<%= jasmine.test.src %>',
                options: {
                    summary: true,
                    junit: {
                        path: 'build/junit'
                    },
                    helpers: '<%= jasmine.test.options.helpers %>',
                    specs: '<%= jasmine.test.options.specs %>',
                    vendor: '<%= jasmine.test.options.vendor %>',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'build/coverage/json/coverage.json',
                        report: [
                            {type: 'html', options: {dir: 'build/coverage/html'}},
                            {type: 'cobertura', options: {dir: 'build/coverage/xml'}},
                            {type: 'text-summary'}
                        ]
                    }
                }
            }
        }
    });

    // grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask('default', [
        // 'bower:install',
        'jshint:grunt',
        'jshint',
        'jscs',
        'jasmine:coverage'
    ]);
};
