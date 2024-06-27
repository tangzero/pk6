var webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
var path = require("path");
const GlobEntries = require("webpack-glob-entries");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  mode: "production",
  entry: GlobEntries("./src/*-test.js"), // Generates multiple entry for each test
  output: {
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "esbuild-loader",
      },
    ],
  },
  stats: {
    colors: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new NodePolyfillPlugin({
      additionalAliases: ["process"],
      excludeAliases: ["crypto"],
    }),
  ],
  externals: /^(k6|https?\:\/\/)(\/.*)?/,
};
