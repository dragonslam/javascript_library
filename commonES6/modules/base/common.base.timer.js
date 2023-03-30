/** common.base.timer.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base	= $w[root];
    const Timer = Base.Timer;
    
    /** Maximum timeout value.  2147483647 */
    Timer.MIN_TIMEOUT = 0;
    Timer.MAX_TIMEOUT = 1000*60*60*6; // Max 6 hour
    Timer.MIN_INTERVAL= 10;
    Timer.MAX_INTERVAL= 1000*60*60*1; // Max 1 hour
    Timer.INVALID_TIMER_ID  = -1;
    Timer.DEFAULT_TIMER_OBJ = $w;

    class Ticker {
        constructor(timerObj, interval, listener, isDeffer = true) {
            this._timerObj  = timerObj || Timer.DEFAULT_TIMER_OBJ;
            this._interval  = interval || 1;
            this._count     = 0;
            this._last      = undefined;
            this._isDeffer  = isDeffer;
            this._isRunning = false;
            this._isStarted = false;
            this._ticker    = undefined;
            this._listener  = listener;
            if (this._interval > Timer.MAX_INTERVAL) this._interval = Timer.MAX_INTERVAL;
            if (this._interval < Timer.MIN_INTERVAL) this._interval = Timer.MIN_INTERVAL;
        }
        toString() {
            return `Interval:${this._interval}ms, count:[${this._count}], last:[${(new Date(this._last)).format('F')}]`;
        }
        /** Gets the interval of the ticker. */
        getInterval() {
            return this._interval;
        }
        /** Sets the interval of the ticker. */
        setInterval(interval) {
            this._interval = interval;
            if (this._ticker && this._isStarted) {
                // Stop and then start the ticker to reset the interval.
                this.stop();
                this.start();
            } else if (this._ticker) {
                this.stop();
            }
            return this;
        }
        isRunning() {
            return this._isRunning;
        }
        isStarted() {
            return this._isStarted;
        }
        /** Starts the ticker. */
        start(listener) {
            const This = this;
            This._listener = listener||This._listener||undefined;
            if (!This._listener || !Base.isFunction(This._listener)) {
                throw new Error('listener is not a function.');
            }
            This._isStarted = true;
            if(!This._ticker) {
                Base.logging(this, `start() => ${this.toString()}`);
                This._ticker= This._timerObj.setInterval(function() {
                    This.continuouslyRun();
                }, This._interval);
            }
            return This;
        }
        stop() {
            this._isStarted = false;
            this._isRunning = false;
            Base.logging(this, `stop() => ${this.toString()}`);
            if (this._ticker) {
                this._timerObj.clearInterval(this._ticker);
                this._count = 0;
                this._last  = undefined;
                this._ticker= undefined;                
            }
            return this;
        }
        continuouslyRun() {
            if(!this._isStarted) {
                this.stop(); return;
            }
            if (this._isRunning) return;            

            this._isRunning = true;
            if (this._isDeffer && this._count == 0) {
                // continu~
            } else {
                if (this._listener && Base.isFunction(this._listener)) {
                    this._listener();
                }
            }
            this._count++;            
            this._last = Date.now();
            this._isRunning = false;
        }
    }

    class Sleeper {
        constructor(delay, timerObj) {
            if (delay > Timer.MAX_TIMEOUT) delay = Timer.MAX_TIMEOUT;
            if (delay < Timer.MIN_TIMEOUT) delay = Timer.MIN_TIMEOUT;

            this._delay     = delay || 1;
            this._timerObj  = timerObj || Timer.DEFAULT_TIMER_OBJ;
            this._timerId   = Timer.INVALID_TIMER_ID;
        }
        once(listener) {
            if (listener && Base.isFunction(listener)) {
                this._timerId =this._timerObj.setTimeout(listener, this._delay);
            }
        }
        kill() {
            if (Timer.INVALID_TIMER_ID != this._timerId) {
                this._timerObj.clearTimeout(this._timerId);
            }
        }
    }

    Timer.create= function(interval, listener, isDeffer = true) {
        return new Ticker(Timer.DEFAULT_TIMER_OBJ, interval, listener, isDeffer);
    };
    Timer.sleep = async function(delay = 1, options = {}) {
        return Base.Core.pf(function(resolve, reject) {
            let sleeper = new Sleeper(delay);
            try {
                sleeper.once(function() {
                    if (options && options['caller']) {
                        resolve.apply(options['caller'], options['args']);
                    } else {
                        resolve(options);
                    }
                    sleeper.kill();
                });
            } catch(e) {
                sleeper.kill();
                reject();
            }
        });
    };

}) (window, __DOMAIN_NAME||'');