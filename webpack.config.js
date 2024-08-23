import { resolve, dirname } from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import webpack from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
require("dotenv").config({path: `${process.argv[process.argv.indexOf("--mode") + 1] === "production" ? "production" : "development"}.env`});

const config = {
  mode: "development",
  resolve: {
    fallback: { 
      zlib: require.resolve("browserify-zlib"),
      url: require.resolve("url"),
      crypto: require.resolve("crypto-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      assert: require.resolve("assert/"),
      util: require.resolve("util/")
    },
    extensions: [".tsx", ".ts", ".js"]
  },
  stats: "errors-warnings",
  devServer: {
    port: 3000,
    historyApiFallback: true,
    server: "https"
  },
  entry: "./src/client.tsx",
  output: {
    path: resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/"
  },
  devtool: "source-map",
  module: {
    rules: [
      { 
        test: /\.tsx?$/, 
        loader: "ts-loader" 
      },
      {
        test: /\.(js|jsx)$/,
        use: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ],
        exclude: /\.module\.css$/
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: "[name]-[local]"
              }
            }
          }
        ],
        include: /\.module\.css$/
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.(svg|png|jpe?g|gif|jp2|webp)$/,
        loader: 'file-loader',
        options: {
          name: 'images/[name].[ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "public/index.html",
      // favicon: "public/favicon.png"
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env)
    })
  ]
};

export default config;