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
var Tail = require('tail').Tail;

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
      '    scanClassPath="true"\n' +
      '    scanBootstrapClassPath="true" />\n';

    if( options.classpath ) {
      
      if( options.compatibility === '7' || options.compatibility === '6' ) {
        
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
  function exec( args, env, callback, force ) {
    var executable = getExecutable( env );

    grunt.util.spawn({
      cmd: executable,
      args: args,
      opts: {
        stdio: 'inherit',
        env: env
      }
    }, function(err, result, code) {
      if( err && !force ) {
        grunt.log.error().error('Failed to invoke catalina');
      }
      if( !err || force ) {
        if( callback ) {
          callback( err, result, code );
        }
      }
    });
    
  }
  
  // Tail catalina.out
  function tail( env, options ) {
    
    if( options.tail ) {
      grunt.log.writeln( 'Tailing catalina.out' );
      
      tail = new Tail(process.cwd() + '/' + options.catalinaBase + '/logs/catalina.out');
      tail.on("line", function(data) {
        grunt.log.writeln(data);
      });

      tail.on("error", function(error) {
        grunt.log.writeln('ERROR: ', error);
      });
    }
  }
  
  // The tomcat task
  grunt.registerTask('tomcat', 'Grunt plugin to serve a webapp using tomcat', function( cmd ) {
  
    var options = this.options({
      javaOpts: '',
      catalinaBase: '.tomcat',
      docBase: 'build/webapp',
      tail: false
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
      makeRoot( env, options );
      createContext( env, options );
    }
    
    var done = this.async();
    
    if( cmd === 'restart' ) {
      exec( ['stop','-force'], env, function() {
        env.JAVA_OPTS = javaOpts;
        exec( ['start'], env, function( err ) {
            tail( env, options );
            done( err );
        });
      }, true );
    }
    
    else if( cmd === 'start' ) {
      env.JAVA_OPTS = javaOpts;
      exec( ['start'], env, function( err ) {
        tail( env, options );
        done( err );
      });
    }
    
    else if( cmd === 'stop' ) {
      exec( ['stop'], env, function( err ) {
          done( err );
      });
    }
    
  });

};
