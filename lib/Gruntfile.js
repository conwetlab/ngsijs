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

        copy: {
            main: {
                files: [
                    {src: 'NGSI.js', dest: 'dist/'}
                ]
            }
        },

        coveralls: {
            library: {
                src: 'build/coverage/library/lcov/lcov.info',
            }
        },

        eslint: {
            library: {
                src: 'NGSI.js'
            },
            specs: {
                options: {
                    configFile: ".eslintrc-jasmine",
                },
                src: ['tests/*Spec.js']
            }
        },

        jsdoc: {
            library: {
                src: ['NGSI.js', '../README.md'],
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
                singleRun: true,
                customLaunchers: {
                    ChromeNoSandbox: {
                        base: "Chrome",
                        flags: ['--no-sandbox']
                    }
                }
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
                        'tests/*Spec.js'
                    ],
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
                    reporters: ['junit', 'coverage'],
                    browsers: ['ChromeNoSandbox', 'Firefox'],
                    coverageReporter: {
                        reporters: [
                            {type: 'cobertura', dir: 'build/coverage/library', subdir: 'xml'},
                            {type: 'lcov', dir: 'build/coverage/library', subdir: 'lcov'},
                        ]
                    },
                    files: [
                        {pattern: 'responses/*', included: false, served: true},
                        'helpers/*.js',
                        'NGSI.js',
                        'tests/*Spec.js'
                    ],
                    preprocessors: {
                        "NGSI.js": ['coverage'],
                    }
                }
            }
        },

        uglify: {
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
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-coveralls");
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('default', [
        'eslint',
        'karma:library',
        'copy',
        'uglify',
        'jsdoc'
    ]);

    grunt.registerTask('ci', [
        'eslint',
        'karma:libraryci',
        'coveralls:library',
        'copy',
        'uglify',
        'jsdoc'
    ]);

};
