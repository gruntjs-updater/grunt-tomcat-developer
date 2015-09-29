/*
 * grunt-tomcat-developer
 * https://github.com/propertypal/grunt-tomcat-developer
 *
 * Copyright (c) 2015 Andrew Murdoch
 * Licensed under the MIT license.
 */

'use strict';


var spawn = require('cross-spawn-async');
var merge = require('merge');

module.exports = function(grunt) {
  
  // Make the tomcat base directory
  function makeRoot( env ) {
    
    var base = env.CATALINA_BASE;
    var home = env.CATALINA_HOME;
    
    // Clean existing directory
    if( grunt.file.exists( base + '/webapps') ) {
      grunt.file.delete( base + '/webapps' );
    }
    if( grunt.file.exists( base + '/logs') ) {
      grunt.file.delete( base + '/logs' );
    }
    if( grunt.file.exists( base + '/temp') ) {
      grunt.file.delete( base + '/temp' );
    }
    if( grunt.file.exists( base + '/work') ) {
      grunt.file.delete( base + '/work' );
    }
    
    // Copy tomcat configuration, but don't overwrite existing files
    grunt.file.recurse( home + '/conf', function( abspath, rootdir, subdir, filename ) {
      var targetPath = base + '/conf/' + ( subdir || '' ) + filename;
      if( !grunt.file.exists(targetPath) ) {
        grunt.file.copy( abspath, targetPath );
      }
    });
    
    // Create required directories
    grunt.file.mkdir( base + '/logs' );
    grunt.file.mkdir( base + '/webapps' );
    grunt.file.mkdir( base + '/temp' );
    grunt.file.mkdir( base + '/work' );
    
  }
  
  // Create a context Configuration
  function createContext( env, options ) {
    var content = '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<Context docBase="' + process.cwd() + '/' + options.docBase + '"\n' +
      '   antiResourceLocking="false"\n' +
      '   antiJARLocking="false"\n' +
      '   path=""\n' +
      '   reloadable="false"\n' +
      '   allowLinking="true"\n' +
      '   unpackWAR="true">\n' +
      '</Context>\n';
    grunt.file.write( env.CATALINA_BASE + '/conf/Catalina/localhost/ROOT.xml', content );
  }
  
  // Get the users home directory
  function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }
  
  // Setup classpath
  function setupClasspath( env, opts ) {
    if( opts.classpath ) {
      var classpath = '';
      opts.classpath.forEach( function( path ) {
        if( path.match( /^~\/.*/ ) ) {
          path = path.replace( /^~\//, getUserHome() + '/' );
        }
        else if( !path.match( /^\/.*/ ) ) {
          path = process.cwd() + '/' + path;
        }
        classpath += ( classpath.length > 0 ? ',' : '' ) + path;
      });
      
      var propsFilePath = env.CATALINA_BASE + '/conf/catalina.properties';
      var propsFileContent = grunt.file.read( propsFilePath );
      propsFileContent = propsFileContent.replace( /shared\.loader=.*/g, 'shared.loader=' + classpath );
      grunt.file.write( propsFilePath, propsFileContent );
    }
  }
  
  // Determine which executable to use
  function getExecutable( env ) {
    if( /^win/.test(process.platform) ) {
      return env.CATALINA_HOME + '/bin/catalina.bat';
    }
    return env.CATALINA_HOME + '/bin/catalina.sh';
  }
  
  // Call the tomcat process
  function exec( args, env, callback ) {
    var executable = getExecutable( env );
    var done = grunt.task.current.async();
    var tomcat = spawn( executable, args, {
      stdio: 'pipe',
      env: env
    });
    tomcat.on('close', function() {
      done();
      if( callback ) {
        callback();
      }
    });
  }
  
  // The tomcat task
  grunt.registerTask('tomcat', 'Grunt plugin to serve a webapp using tomcat', function( cmd ) {
  
    var options = this.options({
      javaOpts: '',
      catalinaBase: '.tomcat',
      docBase: 'build/webapp'
    });
    
    // Setup jrebel
    var javaOpts = options.javaOpts;
    if( options.jrebel ) {
      javaOpts = ( javaOpts || '' ) +
        ' -javaagent:' + process.cwd() + '/' + options.catalinaBase +
        '/jrebel/jrebel.jar'
    }
    
    // Setup environment
    var env = merge( process.env, {
      'CATALINA_BASE': process.cwd() + '/' + options.catalinaBase,
      'CATALINA_PID': process.cwd() + '/' + options.catalinaBase + '/pid'
    });
    
    // Special startup tasks
    if( cmd === 'start' ) {
      env.JAVA_OPTS = javaOpts;
      makeRoot( env, options );
      createContext( env, options );
      setupClasspath( env, options );
    }
    
    if( cmd === 'restart' ) {
      grunt.log.writeln( 'Tomcat restarting' );
      exec( ['stop','-force'], env, function() {
        exec( ['start'], env, function() {
            grunt.log.writeln( 'Tomcat restarted' );
        });
      });
    }
    
    else if( cmd === 'start' ) {
      grunt.log.writeln( 'Tomcat starting' );
      exec( ['start'], env, function() {
          grunt.log.writeln( 'Tomcat started' );
      });
    }
    
    else if( cmd === 'stop' ) {
      grunt.log.writeln( 'Tomcat stopping' );
      exec( ['stop'], env, function() {
          grunt.log.writeln( 'Tomcat stoped' );
      });
    }
    
  });

};
