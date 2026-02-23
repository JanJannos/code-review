import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  target: "node",
  mode: "production",
  entry: "./app/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    module: true,
  },
  experiments: {
    outputModule: true,
  },
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
