# Facebook Feeds

With the Facebook Feeds service you can grant permission to make specific
Facebook feeds available in XML, ical or Facebook's JSON format.
Use the [Graph API](https://developers.facebook.com/docs/graph-api/reference/)
to find available feeds and needed permissions.

For instance you can create an iCal of your Facebook Group's events.

## Prerequisites
You need a [Facebook App](developers.facebook.com/apps) and account to be
able to get Facebook data, connect a domain for production, keep track of
usage, etc.

# Install

Clone this repository and use [npm](https://github.com/npm/npm) to install
all required modules.

    npm install

## configuration

Copy `config.example.json` to `config.json` and adjust the following settings
for the 'development' and 'production' domains:

    "port" : server port number, // optional, will fall back to process.env.PORT || 8080
    "admin_path" : "shouldbesecret", // a 'secret' path needed in admin server calls
    "permissions" : "", // an optional comma separated list of Facebook permissions,
    "oauth" : {
        "redirect_host" : "localhost",
        "client_id" : "Your Facebook App Client id",
        "client_secret" : "Your Facebook App Client secret"
    }

## run

Run the service with `npm start`

# Administration

The service currently lacks a proper secure admin interface.
Administration is done through specific shielded calls on the server.
These calls all require a suffixed 'secret' admin path that you set
in the config JSON:

    "admin_path": "shouldbesecret"

The following calls are now available:

## Admin API

### request_permissions

If you need extra permission to get to the Facebook Feeds you want, you
can call `request_permissions`. The call takes an optional `scope` parameter
which defaults to the `permissions` from the config.

    http://yourserver:port/request_permissions/shouldbesecret?scope=
    http://yourserver:port/request_permissions/shouldbesecret // scope is taken from config.permissions

A Facebook dialog will show asking you to grant the app the requested permissions.

This is also the first call you have to make if you need or configured extended
permissions, before calling the public API.

To change permissions, just call this API call again.
The `request_permissions` will also make a call to `extend_permissions` on success

### permissions

To see information on the permissions your app has been granted make a call to

    http://yourserver:port/permissions/shouldbesecret

The response will be something like:

    {
      "is_valid": true,
      "scopes": [
        "array",
        "of",
        "granted",
        "permissions"
      ],
      "expires_at": 1400362344000, // timestamp when the permissions expire
      "expires_at_human": "Sat May 17 2014 23:32:24 GMT+0200 (CEST)" // readable timestamp
    }

### extend_permissions

When requesting permissions from Facebook you normally get an access token that is valid for
a couple of hours. The Facebook Feed service will automatically turn this token
into a long lived token through `extend_permissions` which is valid for
[60 days](https://developers.facebook.com/docs/facebook-login/access-tokens/#extending)
and save it in the config as `config.access_token`. You can check it's validity
and expiration date through the `permissions` call.
The expiration date will refresh and extend automatically while using the service, but
if for some reason it almost wears out, you can extend it through

    http://yourserver:port/extend_permissions/shouldbesecret

And if that fails, you can call `request_permissions` again before the public API
calls will work.


# Public API

The Facebook Feed service is intended for list calls which you can find in the
[Graph API](https://developers.facebook.com/docs/graph-api/reference/)

The path of the Graph API call (without a trailing slash) should be suffixed
with a valid format and can then be called on the service. All query
parameters are passed on to the Facebook Graph call.

## Formats

### .json
The normal format of the Facebook data. Facebook data will be wrapped in a property,
whose name is taken from the 'file name' in the call's path. So `/group_id/events.json` will
translate to `{ "events": facebookData }`

### .ical
Will only work for Facebook events and return a valid [iCalendar](http://en.wikipedia.org/wiki/ICalendar)

### .xml
Returns the data in XML. The XML root name is taken from the 'file name' in the
call's path. So `/group_id/events.xml` will translate to `<events><item></item><item></item></events>`