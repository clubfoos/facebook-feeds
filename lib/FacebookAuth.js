/**
 * Facade some of the authorization and permission granting
 * @param {fbgraph} graph Configured instance of the fbgraph node module
 *          https://github.com/criso/fbgraph
 * @param {Object} oauthConfig Hash of oauth options
 *      @param oauthConfig.client_id
 *      @param oauthConfig.client_secret
 * @constructor
 */
var FacebookAuth = function (graph, oauthConfig) {

    this.graph = graph;
    this.oauthConfig = oauthConfig;
};

FacebookAuth.prototype = {

    /**
     * Extends the permissions of the current access token
     */
    extendPermissions: function (next) {

        this.getPermissions(function (err, permissions) {

            if (err) {
                next(err);

            } else if (permissions.expires_at) {

                this.graph.extendAccessToken({
                    'access_token': this.graph.getAccessToken(),
                    'client_id': this.oauthConfig.client_id,
                    'client_secret': this.oauthConfig.client_secret
                }, function (err, facebookRes) {

                    if (err) {
                        next('Error during permission extending');
                    } else {

                        next();
                    }
                });

            } else {
                next();
            }

        }.bind(this));
    },

    getPermissions: function (next) {

        var permissions = {};
        var accessToken = this.graph.getAccessToken();

        if (accessToken) {

            this.graph.get('debug_token', {
                input_token: accessToken,
                access_token: this.oauthConfig.client_id + '|' + this.oauthConfig.client_secret
            }, function (err, facebookRes) {

                if (!err && !( facebookRes && facebookRes.data && !facebookRes.data.is_valid )) {

                    permissions['is_valid'] = facebookRes.data.is_valid;

                    if (facebookRes.data.scopes) {
                        permissions['scopes'] = facebookRes.data.scopes;
                    }
                    if (facebookRes.data.expires_at) {
                        permissions['expires_at'] = facebookRes.data.expires_at * 1000;
                        permissions['expires_at_human'] = ( new Date(permissions['expires_at']) ).toLocaleString();
                    }

                    next(null, permissions);

                } else {
                    next('No valid access token');
                }
            });
        } else {
            next('No valid access token');
        }
    }
};


module.exports = FacebookAuth;