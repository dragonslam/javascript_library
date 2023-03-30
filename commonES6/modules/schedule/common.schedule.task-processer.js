/** common.schedule.task.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base    = $w[root];
    const Timer   = Base.Timer;
    const Schedule= Base.Schedule;
    const Task    = Base.Schedule.TaskProcesser;
    
    Task.MAX_TIMEOUT = 1000*60*60; // 1 hour~
   
    class TaskProcesser {
        constructor(caller, name, schedule, action, args) {
            if (!caller || !name || !schedule || !Base.isFunction(action)) {
                throw new Error('Invalid Argument');
            }
            if (!schedule instanceof Schedule.Scheduler.clazz) {
                throw new Error('Invalid Scheduler');
            }
            this._id        = Schedule.getScheduleUUID();
            this._isRunning = false;
            this._isStarted = false;
            this._caller    = caller;
            this._name      = name;
            this._scheduler = schedule;
            this._action    = action;
            this._args      = args||undefined;
            this._count     = 0;
            this._last      = undefined;
        }
        toString() {
            return `[${this._name}], count:[${this._count}], last:[${(new Date(this._last)).format('S')}]`;
        }
        printStatus(loagger) {
            let status = this.toString();
            if (Base.isFunction(loagger)) {
                loagger(status);
            } else {
                Base.logging(this, `status(${this._id})=>${status}`);
            }
        }
        getId() {
            return this._id;
        }
        getScheduler() {
            return this._scheduler;
        }
        isRunning() {
            return this._isRunning;
        }
        isStarted() {
            return this._isStarted;
        }
        start() {
            Base.logging(this, `start(${this._id})`);
            this._isStarted = true;
            this.continuouslyRun(true);
        }
        stop() {
            Base.logging(this, `stop(${this._id})`);
            this._isStarted = false;
        }
        continuouslyRun(isSkip = false) {
            const This = this;
            if (!This._isStarted) return;
            if (!isSkip) {
                This.runOnce();
            }

            // Schedule next time of running
            This._scheduler.setCurrentDate((new Date()));
            if (This._scheduler.next()) {
                let delay = This._scheduler.getNextTime();
                if (delay > Task.MAX_TIMEOUT) {
                    Base.logging(This, `continuouslyRun(${This._id}, ${This._name}) => Max Timeout over:${delay}`);
                    Timer.sleep(Task.MAX_TIMEOUT).then(()=>{ This.continuouslyRun(true) });
                } else {
                    Base.logging(This, `continuouslyRun(${This._id}, ${This._name}) => delay:${delay}`);
                    Timer.sleep(delay).then(()=>{ This.continuouslyRun(false) });
                }
            }
        }
        runOnce() {
            this._isRunning = true;
            Base.logging(this, `runOnce(${this._id})`);
            if (this._action) {
                if (this._args && Array.isArray(this._args)) {
                    this._action.apply(this._caller, this._args);
                } else {
                    this._action.call(this._caller, this._args);
                }
                this._count++;
                this._last = Date.now();
            }
            this._isRunning = false;
        }
    }

    Base.extends(Base.Schedule.TaskProcesser, {
        clazz  : TaskProcesser,
        create : function(clazz, name, schedule, action, args) {
            return Base.Core.module(clazz, new TaskProcesser(clazz, name, schedule, action, args), Base.getName(TaskProcesser));
        },
    });

}) (window, __DOMAIN_NAME||'');