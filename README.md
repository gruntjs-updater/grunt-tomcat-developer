# grunt-tomcat-developer

> Grunt plugin that configures and controls a local tomcat instance to
> ease the development of java web applications.

The grunt-tomcat-developer plugin provides the ability to start, stop and
restart a locally installed tomcat server for development use. It supports
Tomcat 8 in its default setup, but can be configured for tomcat 7 or 6 with
the compatibility option.

The task constructs a new catalina base directory by copying configuration files
from a locally installed tomcat instance defined by the CATALINA_HOME environment
variable which must be defined for the task to work.

The task configures a tomcat virtual webapp by automatically
generating a context configuration that pulls in classpath entries without the
need to copy any files. The classpath its self can be explicitly declared
in the grunt configuration, or you can use the plugin `grunt-maven-classpath`
to generate the classpath automatically from a maven project.

The task also support live reload of java classes through JRebel which
requires a JRebel license.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tomcat-developer --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tomcat-developer');
```

## The "tomcat" task

### Overview

In your project's Gruntfile, add a section named `tomcat` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  tomcat: {
    options: {
      // Task-specific options go here.
    }
  },
});
```

### Options

#### options.docBase
Type: `String`
Default value: `'build/webapp`

This defines the directory that is is used as docBase of the tomcat context.

#### options.catalinaBase
Type: `String`
Default value: `'.tomcat'`

This defines the directory that is used as the CATALINA_BASE directory.

#### options.javaOpts
Type: `String`
Default value: `''`

This defines the options passed to tomcat when starting up.

#### options.classpath
Type: `Array`
Default value: `[]`

This defines the classpath entries that the tomcat instance is configured with.

#### options.compatibility
Type: `String`
Default value: `8`

This defines the compatibility mode of the plugin and can be set to
'8', '7' or '6' to define the version of tomcat in use.

### Usage Examples

To use the tomcat task, you must supply an additional argument that will be
passed to the tomcat control script, typically `start`, `stop` and `restart`.

To start the tomcat instance:

```
grunt tomcat:start
```

To stop the tomcat instance

```
grunt tomcat:stop
```

To restart the tomcat instance

```
grunt tomcat:restart
```

#### Alternative locations

```
// Simple config to run tomcat with a docBase of `src/main/webapp` and
//  a classpath of `build/classes`
grunt.initConfig({
  tomcat: {
    options: {
      docBase: 'src/main/webapp'
      classpath: [
        'build/classes'
      ]
    }
  },
});
```

#### JARs in classpath

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    options: {
      docBase: 'src/main/webapp'
      classpath: [
        'build/classes',
        'lib/*.jar'
      ]
    }
  },
});
```

#### JARs from maven in classpath

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    options: {
      docBase: 'src/main/webapp'
      classpath: [
        'build/classes',
        'lib/*.jar',
        '~/.m2/repository/org/apache/commons/commons-lang3/3.4/commons-lang3-3.4.jar'
      ]
    }
  },
});
```

#### Larger Heap

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    options: {
      docBase: 'src/main/webapp',
      javaOpts: '-Xmx1024m'
      classpath: [
        'build/classes',
        'lib/*.jar'
      ]
    }
  },
});
```

#### Live reload

The plugin supports livereload of java classes and resources with [JRebel](http://zeroturnaround.com/software/jrebel/), this requires a license,
30 day trials are available and full details are found on the JRebel website.

To use JRebel support:

1. Run tomcat via the plugin at least once so that the catalina base directory is created.
2. Download JRebel standalone and unzip into the catalina base directory created by this plugin, you should get a directory named `jrebel` containing a `jrebel.jar` file.
3. Descend into `jrebel/bin` and activate JRebel by running `jrebel-activation.jar`
4. You are good to go. Launch tomcat, modify java source code and classes will be instantly and automatically reloaded.

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    options: {
      docBase: 'src/main/webapp',
      jrebel: true,
      classpath: [
        'build/classes',
        'lib/*.jar'
      ]
    }
  },
});
```

#### Maven classpath

This task is designed to work along with the grunt plugin [grunt-maven-classpath](https://github.com/3urdoch/grunt-maven-classpath) which
makes it possible to setup the tomcat instance to use the a Maven project classpath.

The grun-maven-classpath plugin determines the classpath of a maven project
and saves it to a json file, which can then be loaded and referenced as the
classpath by `grunt-tomcat-developer`.

```
tomcat: {
  options: {
    docBase: 'target/webapp',
    classpath: grunt.file.readJSON('classpath-tomcat.json'))
  }
},

maven_classpath: {
  tomcat: {
    options: {
      ...
    }
  }
},
```

Then run the `grunt-maven-classpath:tomcat` task, followed by `tomcat:start`
and tomcat will be configured with the maven classpath.

To add additional items to the classpath you may concatenate the generated classpath
with some custom additions like below.

```
tomcat: {
  options: {
    docBase: 'target/webapp',
    jrebel: true,
    classpath: [
      'target/classes/'
    ].concat(grunt.file.readJSON('classpath-tomcat.json')),
  }
},
```

And with `grunt-maven-classpath` its possible to override some maven
dependencies so that the latest in development code for a library can be loaded
rather from a packaged JAR stored in the maven local repository.

```
tomcat: {
  options: {
    docBase: 'target/webapp',
    jrebel: true,
    classpath: [
      'target/classes/'
    ].concat(grunt.file.readJSON('classpath-tomcat.json')),
  }
},

maven_classpath: {
  tomcat: {
    options: {
      overrides: [
        artifactId: 'my-library',
        overridePath: '/Users/bob/git/my-library/target/classes/'
      ]
    }
  }
},
```

## Release History
* 2015-09-29   v0.3.0   Use tomcat virtual webapp features to build classpath
* 2015-09-29   v0.2.1   Fixed repo urls
* 2015-09-29   v0.2.0   JRebel support, restart command
* 2015-09-27   v0.1.0   Initial release
