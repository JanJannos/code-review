import path from "path";
import { fileURLToPath } from "url";
import nodeExternals from "webpack-node-externals";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  target: "node",
  mode: "production",
  entry: "./app/index.ts",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "index.js",
    module: true,
  },
  experiments: {
    outputModule: true,
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.webpack.json"),
          },
        },
        exclude: /node_modules|tests/,
      },
    ],
  },
};
