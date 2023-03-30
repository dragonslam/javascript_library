/** common.event.handler.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Event = Base.Event;

    class EventHandler extends Event.EventBase {
        constructor(target, process, agrs) {
            super();            
            this._target    = target;
            this._command   = typeof process == 'string' ? process : '';
            this._process   = Base.isFunction(process) ? process : undefined;
            this._agrs      = agrs||[];
            this._eventType = this._event ? Event.EventType[this._event?.type.toUpperCase()]||'' : '';
        }
        doWork() {
            const This = this;
            return Base.Core.pf(function(resolve) {
                if (This._command) {
                    This._target[This._command]?.apply(This._target, This._agrs);
                } else {
                    This._process?.(This._agrs);
                }
                resolve(true);
            });           
        }
    }

    /**
     * Event handler extends
     */
    Base.extends(Base.Event.EventHandler, {
        create : function(target, process, agrs=[]) {
            return new EventHandler(target, process, agrs);
        }
    });

}) (window, __DOMAIN_NAME||'');