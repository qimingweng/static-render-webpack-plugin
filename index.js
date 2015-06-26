var Q = require('q');
var evaluate = require('eval');
var path = require('path');

/**
 * This module waits for webpack to finish compiling, then it looks at a specified entry file (usually bundle.js)
 * It expects the entry file to export a function, which has three arguments
 * 
 * module.exports = function(path, props, callback) {}
 *
 * This plugin is constructed with an array of paths
 * Each of these paths is first created, and then the compiled entry file is called upon
 * to generate the html that is desired at the index.html file of each of those paths,
 * the path is passed int othe function as the first parameter
 *
 * props is an object that is passed into the function, and defined in the 
 * constructor of the render plugin
 *
 * callback, a function to be called with the return html string
 */

function StaticRenderWebpackPlugin(bundlePath, outputRule, props) {
  this.bundlePath = bundlePath;

  /**
   * Output paths is an array of strings or objects
   * Strings are paths
   * Objects are {path: PathString, output: PathString}
   */
  this.outputRules = outputRule;

  // Initial props is an object passed into the render function
  this.props = props;
}

StaticRenderWebpackPlugin.prototype.apply = function(compiler) {
  var self = this;

  compiler.plugin('emit', function(compiler, done) {
    try {
      var sourceAsset = compiler.assets[self.bundlePath];

      if (!sourceAsset) {
        throw new Error('Source file not found: "' + self.bundlePath + '"');
      }

      var source = sourceAsset.source(); // The string content of the bundle

      // The source file is expected to return a module function by default
      // This function takes two parameters, a local and a callback

      // Using evaluate to retrieve the exported function from the source file
      var render = evaluate(
        /* source: */ source, 
        /* filename: */ self.bundlePath, 
        /* scope: */ undefined, 
        /* noGlobals: */ true);

      var renderPromises = self.outputRules.map(function(outputRule) {
        var renderPath = getInputPath(outputRule);
        var outputFilePath = getOutputPath(outputRule);

        return Q.Promise(function(resolve) {
          render(renderPath, self.props, function(htmlString) {
            resolve(htmlString);
          });
        }).then(function(result) {
          // Save the new file created
          compiler.assets[outputFilePath] = createAssetFromContents(result);
        }).fail(function(error) {
          // Catch errors here and print them in webpack's error handler, without stopping webpack-dev-server
          compiler.errors.push(error);
        });
      });

      Q.all(renderPromises).then(function() {
        done();
      });
    } catch (err) {
      // Catch errors here and print them in webpack's error handler, without stopping webpack-dev-server
      compiler.errors.push(err);
      done();
    }
  });
}

var getInputPath = function(outputRule) {
  if (typeof outputRule == 'string') return outputRule;
  if (typeof outputRule == 'object') return outputRule.path;
}

var getOutputPath = function(outputRule) {
  if (typeof outputRule == 'string') return path.join(outputRule, '/index.html');
  if (typeof outputRule == 'object') return outputRule.output;
}

var createAssetFromContents = function(contents) {
  return {
    source: function() {
      return contents;
    },
    size: function() {
      return contents.length;
    }
  }
}

module.exports = StaticRenderWebpackPlugin;

/**
 * This plugin was inspired by the static-site-generator-webpack-plugin by Mark Dalgleish
 * License (MIT) https://github.com/markdalgleish/static-site-generator-webpack-plugin
 */