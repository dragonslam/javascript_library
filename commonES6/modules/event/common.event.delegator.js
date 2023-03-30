/** common.event.delegator.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Event = Base.Event;

    class EventDelegator {
        constructor(parent) {
            this._parent  = parent;
            this._options = undefined;
            this._events  = Base.Utils.hashTable(Event.EventHeapSize);
            if (Base['isDebug']) {
                Event.EventHeap = this._events;
            }
        }
        init(options = {}) {
            this._options= Base.extends({caller:this._parent}, options);
            this._options['onInitialize']?.(this);
        }
        getParent() {
            return this._parent;
        }
        getEvents() {
            return this._events;
        }
        addEvent(command, key, process, args = []) {
            const token = Event.getEventToken(this._events.count, command, key);
            this._events.setItem(token, Event.EventHandler.create(this._parent, process, (args[0] ? args : [key])));
            this._options['onAfterAddEvent']?.(token);
            return token;
        }
        addTargetEvent(target, command, key, args = []) {
            if (Base.isFunction(this._options['onBeforAddEvent'])) {
                args = this._options['onBeforAddEvent'](target, command, key, args);
            }
            const token = Event.getEventToken(this._events.count, command, key);
            this._events.setItem(token, Event.EventHandler.create(target, command, (args[0] ? args : [key])));
            this._options['onAfterAddEvent']?.(token);
            return token;
        }
        removeAll() {
            this._events.reset();
            return this;
        }
        remove(token) {
            this._events.removeItem(token);
            return this;
        }
        runEvent(token, callbacks = {}) {
            const process   = this._events.getItem(token);            
            const callback  = Base.extends({}, this._options, callbacks);
            const result    = {
                token     : token, 
                isSuccess : false
            };
            return Base.Core.pf(function(resolve, reject) {
                if (process) {
                    if (Base.isFunction(callback['onBeforRunEvent'])) {
                        callback['onBeforRunEvent'].apply(callback['caller'], process._agrs);
                    }
                    // RUN~!!
                    process.doWork().then(function(isSuccess) {
                        result.isSuccess = isSuccess;
                        resolve(result);
                    }).catch(function() {
                        reject(result);
                    }).finally(function() {
                        if (Base.isFunction(callback['onAfterRunEvent'])) {
                            callback['onAfterRunEvent'].apply(callback['caller'], result);
                        }
                    });
                } else {
                    reject(result);
                }
            });
        }
    }

    /**
     * Event delegator extends
     */
    Base.extends(Base.Event.EventDelegator, {
        create : function(parent) {
            return new EventDelegator(parent);
        }
    });

}) (window, __DOMAIN_NAME||'');