import path from "path";
import banner from "vite-plugin-banner";
import packageJson from "./package.json";

const topBanner = `/*!
* ${packageJson.name} v${packageJson.version}
* Copyright 2023-${new Date().getUTCFullYear()} darainfo;
* Licensed ${packageJson.license}
*/`;

const moduleName = "daracl.form";

export const MODULE_NAME = moduleName;

/** 공통 asset 설정 */
export const createAssetFileNames = (isProd) => {
  return (assetInfo) => {
    if (assetInfo.name.endsWith(".css")) {
      return isProd ? `${MODULE_NAME}.min.[ext]` : `${MODULE_NAME}.[ext]`;
    }
    return "assets/[name].[ext]";
  };
};

export const commonConfig = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@t": path.resolve(__dirname, "src/types"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },

  plugins: [banner(topBanner)],

  define: {
    APP_VERSION: JSON.stringify(packageJson.version),
  },
  server: {
    host: "0.0.0.0",
    port: 5501,
    open: "/uitest/index.html",
    watch: {
      ignored: ["!**/src/**"],
    },
  },
};
