/*
 *   Copyright 2014-2017 CoNWeT Lab., Universidad Politecnica de Madrid
 *   Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                push: false
            }
        },

        copy: {
            main: {
                files: [
                    {src: 'NGSI.js', dest: 'dist/'}
                ]
            }
        },

        eslint: {
            library: {
                src: 'NGSI.js'
            },
            nodebridge: {
                options: {
                    configFile: ".eslintrc-node",
                },
                src: 'ngsi-node.js'
            },
            specs: {
                options: {
                    configFile: ".eslintrc-jasmine",
                },
                src: ['tests/**/*Spec.js']
            }
        },

        jsdoc: {
            library: {
                src: ['NGSI.js', 'README.md'],
                options: {
                    destination: 'dist/docs/library',
                    configure: '.jsdocrc'
                }
            }
        },

        karma: {
            options: {
                files: [
                    {pattern: 'responses/*', included: false, served: true},
                    'tests/helpers/*.js',
                    'NGSI.js',
                    'tests/browser/*Spec.js',
                    'tests/common/*Spec.js'
                ],
                frameworks: ['jasmine'],
                reporters: ["progress", "coverage"],
                browsers: ["ChromeHeadless", "FirefoxHeadless"],
                singleRun: true
            },
            librarydebug: {
                options: {
                    browsers: ["Chrome"],
                    singleRun: false
                }
            },
            library: {
                options: {
                    coverageReporter: {
                        type: 'html',
                        dir: 'build/coverage/library'
                    },
                    preprocessors: {
                        "NGSI.js": ['coverage'],
                    }
                }
            },
            libraryci: {
                options: {
                    junitReporter: {
                        "outputDir": 'build/test-reports/library'
                    },
                    reporters: ["junit", "coverage", "progress"],
                    coverageReporter: {
                        reporters: [
                            {type: 'cobertura', dir: 'build/coverage/library', subdir: 'xml'},
                            {type: 'lcov', dir: 'build/coverage/library', subdir: 'lcov'},
                        ]
                    },
                    preprocessors: {
                        "NGSI.js": ['coverage'],
                    }
                }
            }
        },

        terser: {
            library: {
                options: {
                    sourceMap: true
                },
                files: {
                    'dist/NGSI.min.js': ['dist/NGSI.js']
                }
            }
        }
    });

    grunt.loadNpmTasks("gruntify-eslint");
    grunt.loadNpmTasks("grunt-bump");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-terser");
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('test', [
        'eslint',
        'karma:library',
    ]);

    grunt.registerTask('default', [
        'test',
        'copy',
        'terser',
        'jsdoc'
    ]);

    grunt.registerTask('debug', [
        'karma:librarydebug',
    ]);

    grunt.registerTask('ci', [
        'eslint',
        'karma:libraryci',
        'copy',
        'terser',
        'jsdoc'
    ]);

};
