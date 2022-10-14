/* common.es6.base.event.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/10/05
*/
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];

    Base.Events.EventId = function(eventId) {
        this.id = eventId;
    };
    Base.Events.EventId.prototype.toString = function() {
        return this.id;
    };

    const Events= {
    };

    Base.extends(Base.Events, Events);

}) (window, __DOMAIN_NAME||'');