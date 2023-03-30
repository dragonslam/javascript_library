/** common.base.event.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Event = Base.Event;
    
    Event.EventLength   = 3;
    Event.EventHeapSize = 997;    

    /**
     * Event token generate.
     * Param : eventNumber, command, commandKey, other...
     * @param  {...any} args 
     * @returns 
     */
    Event.getEventToken = function(...args) {
        let tokens = Array.from(args);
        if (typeof tokens[0] == 'number') {
            tokens[0] = tokens[0].toString(36).digits(Event.EventLength);
        }
        return (Base['isDebug'] ? tokens.join('/') : $w.btoa(tokens.join('/'))); // base64 encode.
    };

    /**
     * Parse Event token.
     * @param {*} token 
     * @returns 
     */
    Event.parseEventToken = function(eventToken) {
        let tokens = (Base['isDebug'] ? (eventToken||'') : $w.atob(eventToken||'')).split('/');
        return {
            num : tokens[0],
            cmd : tokens[1],
            key : tokens[2],
            args: tokens,
        };
    };

    class EventBase {
        constructor(e) {
            this._event = e||event||undefined;
        }
    }

    /**
     * Event module extends
     */
    Base.extends(Base.Event, {
        EventBase
    });

}) (window, __DOMAIN_NAME||'');