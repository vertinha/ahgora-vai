var webpack = require('webpack'),
    path = require('path'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    WriteFilePlugin = require('write-file-webpack-plugin');

var defaultEnv = 'development';

var options = {
  mode: process.env.NODE_ENV || defaultEnv,
  entry: {
    index: path.join(__dirname, 'src', 'index.js'),
    background: path.join(__dirname, 'src', 'background.js')
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js'
  },
  resolve: {
    alias: {
      jquery: 'jquery/src/jquery',
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    // clean the build folder
    new CleanWebpackPlugin(['build']),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin({
      'NODE_ENV': defaultEnv,
    }),
    new CopyWebpackPlugin([{
      from: 'icons/',
    }]),
    new CopyWebpackPlugin([{
      from: 'manifest.json',
      transform: function (content, path) {
        var manifest = JSON.parse(content.toString());

        // Replace some fields with values from package.json
        manifest['version'] = process.env.npm_package_version;
        manifest['description'] = process.env.npm_package_description;

        return Buffer.from(JSON.stringify(manifest, null, 2));
      }
    }]),
    new WriteFilePlugin()
  ]
};

if (process.env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
