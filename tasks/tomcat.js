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
    var cp = '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<Context docBase="' + process.cwd() + '/' + options.docBase + '"\n' +
      '   path=""\n' +
      '   reloadable="false"\n' +
      '   allowLinking="true"\n' +
      '   unpackWAR="true">\n' +
      '  <JarScanner scanAllDirectories="true"\n' +
      '    scanAllFiles="true"\n' +
      '    scanClassPath="true"\n' +
      '    scanBootstrapClassPath="true" />\n';

    if( options.classpath ) {
      
      if( options.compatability === '7' || options.compatability === '6' ) {
        
        var absolutePaths = [];
        
        options.classpath.forEach( function( path ) {
          
          if( path.match( /^~\/.*/ ) ) {
            path = path.replace( /^~\//, getUserHome() + '/' );
          }
          else if( !path.match( /^\/.*/ ) ) {
            path = process.cwd() + '/' + path;
          }
          absolutePaths.push( path );
        });
        
        cp += '  <Resources className="org.apache.naming.resources.VirtualDirContext"\n' +
            '      extraResourcePaths="/WEB-INF/classes=' + absolutePaths.join(',') + '" />\n' +
            '  <Loader className="org.apache.catalina.loader.VirtualWebappLoader"\n' +
            '      virtualClasspath="' + absolutePaths.join(';') + '" />\n';
        
      }
      
      else {
      
        cp += '  <Resources className="org.apache.catalina.webresources.StandardRoot">\n';
        
        options.classpath.forEach( function( path ) {
          
          if( path.match( /^~\/.*/ ) ) {
            path = path.replace( /^~\//, getUserHome() + '/' );
          }
          else if( !path.match( /^\/.*/ ) ) {
            path = process.cwd() + '/' + path;
          }
          
          if( path.match( /.*\/$/ ) ) {
            cp += '    <PreResources className="org.apache.catalina.webresources.DirResourceSet"\n';
            cp += '      base="' + path + '"\n';
            cp += '      internalPath="/"\n';
            cp += '      webAppMount="/WEB-INF/classes" />\n';
          }
          else {
            cp += '    <JarResources className="org.apache.catalina.webresources.FileResourceSet"\n';
            cp += '      base="' + path + '"\n';
            cp += '      internalPath="/"\n';
            cp += '      webAppMount="/WEB-INF/lib/' + path.substring(path.lastIndexOf('/')+1) + '" />\n';
          }
          
        });
        
        cp += '  </Resources>\n';
        
      }

    }

    cp += '</Context>\n';
    grunt.file.write( env.CATALINA_BASE + '/conf/Catalina/localhost/ROOT.xml', cp );
  }
  
  // Get the users home directory
  function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
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
    
    // Check CATALINA_HOME is defined
    if( !process.env.CATALINA_HOME ) {
      grunt.log.fail( 'CATALINA_HOME is not defined' );
    }
    
    // Setup jrebel
    var javaOpts = options.javaOpts;
    if( options.jrebel ) {
      var jrebelPath = process.cwd() + '/' + options.catalinaBase + '/jrebel/jrebel.jar';
      if( !grunt.file.exists( jrebelPath ) ) {
        jrebelPath = process.env.CATALINA_HOME + '/jrebel/jrebel.jar';
      }
      javaOpts = ( javaOpts || '' ) + ' -javaagent:' + jrebelPath;
    }
    
    // Setup environment
    var env = merge( process.env, {
      'CATALINA_BASE': process.cwd() + '/' + options.catalinaBase,
      'CATALINA_PID': process.cwd() + '/' + options.catalinaBase + '/pid'
    });
    
    // Special startup tasks
    if( cmd === 'start' || cmd === 'restart' ) {
      env.JAVA_OPTS = javaOpts;
      makeRoot( env, options );
      createContext( env, options );
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
