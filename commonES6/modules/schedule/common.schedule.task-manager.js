/** common.schedule.task-manager.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base    = $w[root];
    const Timer   = Base.Timer;
    const Schedule= Base.Schedule;
   
    class TaskManager {
        constructor(parent) {
            this._parent= parent;
            this._tasks = Base.Utils.hashTable(Schedule.ScheduleHeapSize);
            this._timer = undefined;
            this._interval  = 1000*60;
            this._isStarted = false;
            this._isMonitor = false;
        }
        isMonitoring() {
            return this._isMonitor;
        }
        setMonitoring(isMonitor, interval) {            
            this._isMonitor= isMonitor;
            this._interval = interval||this._interval;
            return this;
        }
        startMonitoring() {
            const This = this;
            if (This._isMonitor && This._isStarted) {
                Base.logging(this, `runMonitoring()`);
                This._timer = Timer.create(This._interval, function() {
                    This.runMonitoring()
                }).start();
            }
            return this;
        }
        stopMonitoring() {
            if(!this._timer) {
                this._timer.stop();
            }
            return this;
        }
        runMonitoring() {
            const This = this;
            Base.logging(This, `Monitoring Start.`);
            This._tasks.forEach((id, task) => {
                task.printStatus(function(msg) {
                    Base.logging(This, `Task-${id} >< ${msg}`);
                });
            });
            Base.logging(This, `Monitoring End.`);
        }
        getTask(taskId){
            return this._tasks.getItem(taskId);
        }
        runTask(taskId) {
            let task = this.getTask(taskId);
            if (task && this._isStarted) {
                task.start();
            }
            return this;
        }
        addTask(...args) {
            if(!args || args.length == 0) {
                throw new Error('Invalid Argument');
            }
            if (args.length == 1) {
                let task = args[0];
                if(!task || !(task instanceof Schedule.TaskProcesser.clazz)) {
                    throw new Error('Invalid Task');
                }
                Base.logging(this, `addTask(${task.getId()})`);
                this._tasks.setItem(task.getId(), task);
                if (this._isStarted) {
                    task.start();
                }
            } 
            else {
                if (typeof args[0] == 'string') {
                    this.addTaskAsCronstring.apply(this, args);
                } 
                else if (typeof args[0] == 'object') {
                    this.addTaskAsSchdule.apply(this, args);
                }
                else {
                    throw new Error('Invalid Argument');
                }
            }
            return this;
        }
        addTaskAsCronstring(name, cronstring, action, args) {
            if (!name || !cronstring || !Base.isFunction(action)) {
                throw new Error('Invalid Argument');
            }
            const schedule = Schedule.Scheduler.create(this._parent, cronstring);
            const processer= Schedule.TaskProcesser.create(this._parent, name, schedule, action, args);
            return this.addTask(processer);            
        }
        addTaskAsSchdule(name, schedule, action, args) {
            if (!name || !schedule || !Base.isFunction(action)) {
                throw new Error('Invalid Argument');
            }
            const processer= Schedule.TaskProcesser.create(this._parent, name, schedule, action, args);
            return this.addTask(processer);
        }
        removeTask(task) {
            if (typeof task == 'string') {
                task = this.getTask(task);
            }
            task.stop();
            this._tasks.removeItem(task.getId());
            return this;
        }
        start() {
            Base.logging(this, 'start()');
            this._isStarted = true;
            this._tasks.forEach((id, task) => {
                if(!task.isStarted()) {
                    task.start();
                }
            });
            if (this._isMonitor) {
                this.startMonitoring();
            }
            return this;
        }
        stop() {
            Base.logging(this, 'stop()');
            this._isStarted = false;
            this._tasks.forEach((id, task) => {
                if (task.isStarted()) {
                    task.stop();
                }
            });
            if (this._isMonitor) {
                this.stopMonitoring();
            }
            return this;
        }
        enumerate(callback) {
            this._tasks.forEach((id, task) => callback(id, task));
        }
    }

    Base.extends(Base.Schedule.TaskManager, {
        clazz  : TaskManager,
        create : function(clazz) {
            return Base.Core.module(clazz, new TaskManager(clazz), Base.getName(TaskManager));
        },
        TEST : function(clazz) {
            clazz = clazz||Base;
            Base.logging(clazz, `TaskManager Test start.`);

            let manager = Base.Schedule.TaskManager.create(clazz);
            let testCronPattern = [
                '0,30 * * * *',         // pass~
                '30 3 1-10,20-30 * *',  // pass~
                '0 5 * * 1,4',          // pass~
                '*/30 * * * *',         // pass~
                '*/5  2/3   *   *   *', // pass~
                '3,13,23,33,43,53 0-2,6-23 * * *',      // pass~
                '1,6,11,16,21,26,31,36,41,46,51,56 * * * *',// pass~
                '0,10,20,30,40,50 5-20 * * *',          // pass~
                '0 1,7,13,19 * * *',                    // pass~
                '1,2,3,4,5    1/5   5   *   */2',       // pass~
                '1,2,3,4,5    2/3   1-2,4-7   *   *',   // pass~
                '20/5    2/3   1-2,4-7   *   *',        // pass~                
            ];
            testCronPattern.forEach(function(cron, idx) {
                Base.logging(clazz, `START:[${idx}](${cron})`);
                
                manager.addTask(`Test[${String(idx).padLeft(3)}]`, cron, function() {
                    console.log('>> TaskManager Test Processer : ', arguments);
                }, [idx, cron]);

                Base.logging(clazz, `RESULT:[${idx}](${cron})`);
            });
            manager.setMonitoring(true).start();

            Base.Timer.sleep(1000*60*60*3).then(function() {
                manager.stop();
            });

            Base.logging(clazz, `TaskManager Test End.`);
        }
    });

}) (window, __DOMAIN_NAME||'');