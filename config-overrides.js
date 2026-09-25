/* config-overrides.js */
module.exports = function override(config, env) {
    // New webpack configuration
    config.devServer = {
        ...config.devServer,
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }

            // Add your custom middleware here if needed
            return middlewares;
        }
    };

    // Excalidraw (the classroom board) is an ES module package that imports files without
    // extensions, e.g. "roughjs/bin/rough"; let webpack resolve those.
    config.module.rules.unshift({ test: /\.m?js$/, resolve: { fullySpecified: false } });
    // Its source maps point at files that aren't published; don't try to load them.
    config.module.rules.forEach((rule) => {
        if (rule.loader && rule.loader.includes('source-map-loader')) {
            rule.exclude = [/node_modules[\\/]@excalidraw/];
        }
    });

    return config;
}
