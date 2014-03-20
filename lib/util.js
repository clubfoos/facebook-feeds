var fs = require('fs');


exports.saveExtendedPermission = function (graph, configPath, configEnv, next) {

    fs.readFile(configPath, function (fileReadErr, data) {

        var currentConfig, currentEnvConfig;

        if (fileReadErr) {
            next(fileReadErr);
        } else {

            currentConfig = JSON.parse(data);
            currentEnvConfig = currentConfig[ configEnv ];

            if (!currentEnvConfig.oauth.access_token ||
                    ( currentEnvConfig.oauth.access_token &&
                            currentEnvConfig.oauth.access_token !== graph.getAccessToken() )) {

                currentEnvConfig.oauth.access_token = graph.getAccessToken();

                fs.writeFile('./config.json', JSON.stringify(currentConfig, null, '  '), next);

            } else {
                next();
            }
        }
    });
};