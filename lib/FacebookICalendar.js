var icalendar = require('icalendar');

/**
 * FacebookICalendar creates an iCalendar object from Facebook events
 * @constructor
 */
var FacebookICalendar = function () {

    this.calendar = new icalendar.iCalendar();
};

FacebookICalendar.prototype = {

    parse: function (facebookEvents) {
        if (facebookEvents && facebookEvents.length) {

            facebookEvents.forEach(function (facebookEvent) {

                if (facebookEvent.start_time && facebookEvent.end_time) {
                    var event = this.calendar.addComponent('VEVENT');

                    event.setSummary(facebookEvent.name);
                    event.setDate(new Date(facebookEvent.start_time),
                            new Date(facebookEvent.end_time || facebookEvent.start_time));
                }
            }.bind(this));
        }
    },

    toString: function () {
        return this.calendar.toString();
    }
};

module.exports = FacebookICalendar;