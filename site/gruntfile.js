module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: pkg,
    bgShell: {
      _defaults: {
        bg: true
      },
      startClient: {
        cmd: 'xdg-open http://localhost:2777'
      }
    },
    watch: {
      site: {
        files: ['src/app.js', 'src/**/*.*', 'dist/index.html'],
        tasks: ['preprocess:livereload', 'less:bundle', 'autoprefixer:dist', 'browserify:instantFile', 'express:dev'],
        options: {
          livereload: 2775
        }
      }
    },
    copy: {
      libs: {
        files: [
          // For some reason the version of this file that comes from npm doesn't work. I've put
          // my modified version directly into dist/libs...it works :) You want something better? Do it.
          //{src: ['node_modules/webrtc.io-client/lib/webrtc.io.js'], dest: './dist/libs/webrtc.io.js'}
        ]
      }
    },
    browserify: {
      instantFile: {
        files: {
          'dist/instantFile.js': ['src/frontend/app.js']
        }
      }
    },
    preprocess: {
      options: {
        context: {
          DEBUG: false
        }     
      },
      index: {
        src: 'src/frontend/index.html',
        dest: 'dist/index.html'
      },
      livereload: {
        src: 'src/frontend/index.html',
        dest: 'dist/index.html',
        options: {
          context: {
            DEBUG: true
          }
        }
      }
    },
    express: {
      dev: {
        options: {
          script: 'src/app.js'
        }
      }
    },
    less: {
      bundle: {
        files: {
          'temp/style.css': ['src/frontend/**/*.less']
        }
      }
    },
    autoprefixer: {
      dist: {
        files: {
          'dist/style.css': 'temp/style.css'
        }
      }
    }
  });

  grunt.registerTask('default' , '', function(numberClients) {
    numberClients = numberClients || 1;

    for (var i = 0; i < numberClients; ++i) {
      grunt.task.run('bgShell:startClient');
    }
    grunt.task.run('serve');
  });

  grunt.registerTask('serve', 'test', function() {
    grunt.task.run('copy:libs', 'preprocess:index', 'less:bundle', 'autoprefixer:dist', 'browserify:instantFile', 'express:dev', 'watch:site');
  });

  grunt.registerTask('debug', 'test', function() {
    grunt.task.run('copy:libs', 'preprocess:livereload', 'less:bundle', 'autoprefixer:dist', 'browserify:instantFile', 'express:dev', 'watch:site');
  });
};