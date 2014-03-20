var express = require('express');
var fs = require('fs');
var graph = require('fbgraph');
var http = require('http');
var js2xmlparser = require('js2xmlparser');

var FacebookAuth = require('./lib/FacebookAuth');
var FacebookICalendar = require('./lib/FacebookICalendar');
var fbUtil = require('./lib/util');


var app = express();
var configEnv = process.env.NODE_ENV || 'development';
var config = require('./config.json')[ configEnv ];

var appToken = config.oauth.client_id + '|' + config.oauth.client_secret;
var facebookAuth = new FacebookAuth(graph, config.oauth);
var server = http.createServer(app);


////////////// Security config and routes

/**
 * Default access token is (a saved) one from the config or the non generated App Token
 * https://developers.facebook.com/docs/facebook-login/access-tokens/#apptokens
 */
graph.setAccessToken(config.oauth.access_token || appToken);


/**
 * If you need an access token with more privileges, request one with
 * the following somewhat secret route
 * @param [req.params.scope] Optional comma separated request parameter of permission names,
 *                defaults to permission from the config
 *      @see https://developers.facebook.com/docs/reference/dialogs/oauth/
 */
app.get('/request_permissions/' + config.admin_path, function (req, res) {

    var redirectUri = 'http://' + config.oauth.redirect_host + ':' + server.address().port +
            '/request_permissions/' + config.admin_path + '/'

    if (!req.query.code) {

        var authUrl = graph.getOauthUrl({
            'client_id': config.oauth.client_id,
            'redirect_uri': redirectUri,
            'scope': req.query.scope || config.permissions
        });

        if (!req.query.error) {
            res.redirect(authUrl);
        } else {
            res.send('access denied');
        }

    } else {

        graph.authorize({
            'client_id': config.oauth.client_id,
            'redirect_uri': redirectUri,
            'client_secret': config.oauth.client_secret,
            'code': req.query.code
        }, function (err, facebookRes) {

            if (err) {
                res.send('Error during authentication');
            } else {
                res.redirect('/extend_permissions/' + config.admin_path);
            }
        });
    }
});


app.get('/permissions/' + config.admin_path, function (req, res) {

    facebookAuth.getPermissions(function (err, permissions) {

        if (err) {
            res.json({ 'error': err });
        } else {
            res.json(permissions);
        }
    });
});


app.get('/extend_permissions/' + config.admin_path, function (req, res) {

    facebookAuth.extendPermissions(function (permissionErr) {

        if (permissionErr) {
            res.send(permissionErr);
        } else {

            // We can save the current extended access token
            fbUtil.saveExtendedPermission(
                    graph,
                    './config.json',
                    configEnv,
                    function (err) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.redirect('/permissions/' + config.admin_path)
                        }
                    }
            );
        }
    });
});

////////////// Feed routes

/**
 * Convert a Facebook feed to an iCal format
 */
app.get(/(.+)\.ics$/, function (req, res) {

    var ical = new FacebookICalendar();

    res.type('text/calendar');

    if (req.params.length) {

        graph.get(req.params[0], req.query, function (err, facebookRes) {

            if (!err && facebookRes.data) {
                ical.parse(facebookRes.data);
            }
            res.send(ical.toString());
        });

    } else {
        res.send(ical.toString());
    }
});


/**
 * Convert a Facebook feed to an XML format
 */
app.get(/(.+)\/([^\.]+)\.xml$/, function (req, res) {

    res.type('text/xml');

    if (req.params.length) {

        graph.get(req.params.join('/'), req.query, function (err, facebookRes) {

            var edge = req.params.pop();

            if (!err && facebookRes.data) {

                res.send(
                        js2xmlparser(edge, facebookRes.data, {
                            wrapArray: {
                                enabled: true
                            }
                        })
                );
            } else {
                res.send(js2xmlparser(edge, {}));
            }
        });

    } else {
        res.send(js2xmlparser(req.params.pop(), {}));
    }
});

/**
 * Pass through for the Facebook JSON feed format
 */
app.get(/(.+)\/([^\.]+)\.json$/, function (req, res) {

    res.type('application/json');

    if (req.params.length) {

        graph.get(req.params.join('/'), req.query, function (err, facebookRes) {

            var json = {};

            if (!err && facebookRes.data) {

                json[ req.params.pop() ] = facebookRes.data;
            }
            res.send(json);
        });

    } else {
        res.send({});
    }
});


server.listen(config.port || process.env.PORT || 8080, function () {
    console.log('Server is running on ' + server.address().port);
});