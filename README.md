# Static Render Webpack Plugin

[https://www.npmjs.com/package/static-render-webpack-plugin](See on NPM)

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
