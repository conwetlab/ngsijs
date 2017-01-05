/*
 *   Copyright 2014-2017 CoNWeT Lab., Universidad Politecnica de Madrid
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

        eslint: {
            library: {
                src: 'NGSI.js'
            },
            specs: {
                options: {
                    configFile: ".eslintrc-jasmine",
                },
                src: 'tests.js',
            }
        },

        jsdoc: {
            library: {
                src: 'NGSI.js',
                options: {
                    destination: 'dist/docs/library',
                    configure: '.jsdocrc'
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

    grunt.loadNpmTasks("gruntify-eslint");
    // grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('default', [
        // 'bower:install',
        'eslint',
        'karma'
    ]);
};
