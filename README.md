# Static Render Webpack Plugin

[![npm](https://img.shields.io/npm/v/static-render-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/static-render-webpack-plugin)

## Usage

In your webpack config file...

```javascript
var StaticSiteGeneratorPlugin = require('static-render-webpack-plugin');

var routes = [
  '/',
  '/about',
  '/projects', // regular routes
  { // routes as an object
    path: '/not-found',
    output: '/404.html'
  }
];

module.exports = {
  entry: ...,
  output: {
    filename: 'bundle.js',
    path: ...,
    // This is really important, the plugin expects the bundle output to export a function
    libraryTarget: 'umd'
  },
  ...
  plugins: [
    new StaticSiteGeneratorPlugin('bundle.js', routes)
  ]
};
```

This setup will generate

```
/index.html
/about/index.html
/projects/index.html
/404.html
```

This module takes the output of webpack's compilation process and expects it to export a function with 3 arguments

```javascript
module.exports = function(path, props, callback) {
  // Callback with the desired HTML string
  callback(...)
}
```

### Advanced

`StaticSiteGeneratorPlugin` is a constructor that takes up to 4 arguments.

```javascript
new StaticSiteGeneratorPlugin(source, routes, props, watchFiles)
```

#### source

`String`

The route to the javascript file

#### routes

`Array<String|RouteObject>`

An array of either string routes, ex. `/`, `/about`, `/deep/route`. Or route objects, which follow this syntax:

```
{
  path: String // ex, '/', '/about'
  output: String // ex, '/404.html', '/deep/custom.file'
}
```

#### props

`Any?`

This property is passed to your javascript bundle as the 2nd parameter in the exported function. It can be anything.

#### watchFiles

`Array<String>?`

This is optional. You can define an array of paths to files that you want the compiler to add to its dependencies. This way, when running webpack in watch mode, or webpack-dev-server, the files which are not in the javascript dependency tree will also be watched and can cause recompilation.

I use this to generate blog posts from .md files.

## Isomorphic Javascript

If you use React and React-Router, then your entry.js file might look something like this:

```javascript
import React from 'react';
import Router from 'react-router';
import routes from './path/to/routes';

module.exports = function(path, props, callback) {
  Router.run(routes, path, (Root) => {
    const html = React.renderToString(<Root/>);
    callback('<!doctype html>' + html);
  });
}

if (typeof document != 'undefined') {
  /**
   * Running in a web environment, re-render the entire tree onto the document, 
   * react will be able to tell that what you are trying to render is exactly the same and 
   * adjust itself accordingly
   */
  Router.run(routes, Router.HistoryLocation, (Root) => {
    React.render(<Root/>, document);
  });
}
```
