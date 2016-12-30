/*
 *   Copyright 2014-2016 CoNWeT Lab., Universidad Politecnica de Madrid
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

        karma: {
            options: {
                frameworks: ['jasmine'],
                reporters: ['progress', 'coverage'],
                browsers: ['Chrome', 'Firefox'],
                singleRun: true
            },
            library: {
                options: {
                    coverageReporter: {
                        type: 'html',
                        dir: 'build/coverage/library'
                    },
                    files: [
                        {pattern: 'responses/*', included: false, served: true},
                        'helpers/*.js',
                        'NGSI.js',
                        'tests.js'
                    ],
                    preprocessors: {
                        "NGSI.js": ['coverage'],
                    }
                }
            }
        }

    });

    // grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask('default', [
        // 'bower:install',
        'jshint:grunt',
        'jshint',
        'jscs',
        'karma'
    ]);
};
