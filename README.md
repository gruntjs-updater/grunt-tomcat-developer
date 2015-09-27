# grunt-tomcat

> Grunt plugin that configures and controls a local tomcat instance to
> ease the development of java web applications.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tomcat --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tomcat');
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

#### docBase
Type: `String`
Default value: `'build/classes'`

This defines the directory that is is used as docBase of the tomcat context.

#### catalinaBase
Type: `String`
Default value: `'.tomcat'`

This defines the directory that is used as the CATALINA_BASE directory.

#### javaOpts
Type: `String`
Default value: `''`

This defines the options passed to tomcat when starting up.

### Usage Examples

To use the tomcat task, you must supply an additional argument that will be
passed to the tomcat control script, typically `start` and `stop`.

To start the tomcat instance:

```
grunt tomcat:start
```

To stop the tomcat instance

```
grunt tomcat:stop
```

#### Alternative locations

```
// Simple config to run tomcat with a docBase of `src/main/webapp` and
//  a classpath of `build/classes`
grunt.initConfig({
  tomcat: {
    docBase: 'src/main/webapp'
    classpath: [
      'build/classes'
    ]
  },
});
```

#### JARs in classpath

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    docBase: 'src/main/webapp'
    classpath: [
      'build/classes',
      'lib/*.jar'
    ]
  },
});
```

#### JARs from maven in classpath

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    docBase: 'src/main/webapp'
    classpath: [
      'build/classes',
      'lib/*.jar',
      '~/.m2/repository/org/apache/commons/commons-lang3/3.4/commons-lang3-3.4.jar'
    ]
  },
});
```

#### Larger Heap

```
// Additional jar files added to classpath
grunt.initConfig({
  tomcat: {
    docBase: 'src/main/webapp',
    javaOpts: '-Xmx1024m'
    classpath: [
      'build/classes',
      'lib/*.jar'
    ]
  },
});
```

## Release History

* 2015-09-27   v0.1.0   Initial release
