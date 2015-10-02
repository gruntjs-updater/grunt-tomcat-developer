# grunt-tomcat-developer

> Grunt plugin that configures and controls a local tomcat instance to
> ease the development of java web applications.

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

#### docBase
Type: `String`
Default value: `'build/webapp`

This defines the directory that is is used as docBase of the tomcat context.

#### catalinaBase
Type: `String`
Default value: `'.tomcat'`

This defines the directory that is used as the CATALINA_BASE directory.

#### javaOpts
Type: `String`
Default value: `''`

This defines the options passed to tomcat when starting up.

#### classpath
Type: `Array`
Default value: `[]`

This defines the classpath entries that the tomcat instance is configured with.

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
    docBase: 'src/main/webapp',
    jrebel: true,
    classpath: [
      'build/classes',
      'lib/*.jar'
    ]
  },
});
```

## Release History
* 2015-09-29   v0.3.0   Use tomcat virtual webapp features to build classpath
* 2015-09-29   v0.2.1   Fixed repo urls
* 2015-09-29   v0.2.0   JRebel support, restart command
* 2015-09-27   v0.1.0   Initial release
