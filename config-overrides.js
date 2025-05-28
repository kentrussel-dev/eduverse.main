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

    return config;
}
