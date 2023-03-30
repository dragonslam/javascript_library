/** common.schedule.scheduler.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base      = $w[root];
    const Schedule  = Base.Schedule;
    const CronParser= Base.Schedule.CronParser;
   
    class Scheduler{
        constructor(parent, cronstring, hasSeconds = false) {
            if (!parent || !cronstring) {
                throw new Error('Invalid Argument');
            }
            this._parent    = parent;
            this._cronstring= cronstring;
            this._cronItems = [];
            this._items     = undefined;
            this._schdules  = undefined;
            this._date      = undefined;
            this._next      = undefined;
            this.parseString(hasSeconds);
            this.setCurrentDate(new Date());
            Base.tracking(`${parent.classPath}.Scheduler.init(${cronstring})`, this);
        }
        parseString(hasSeconds) {
            let items= CronParser.parseToArray(this._cronstring);
            if(!items|| !Array.isArray(items)) {
                throw new Error('Invalid Argument');
            }

            let cron = CronParser.parse(this._cronstring, hasSeconds);
            if(!cron || !Array.isArray(cron.schedules)) {
                throw new Error('Invalid Argument');
            }
            const This = this;
            This._items     = items;
            This._schdules  = cron.schedules[cron.schedules.length - 1];

            Object.keys(This._schdules).forEach((type) => {
                let cronType = Schedule.CronContainer.Types[type];
                let cronItem = This._items[cronType.idx];
                let schedule = This._schdules[type];
                let container= Schedule.CronContainer.create(this._parent, type).init(schedule, (this._cronstring == cronItem ? '*' : cronItem));
                This._cronItems[type] = container;
            });
            return this;
        }
        setCurrentDate(date) {
            if (!date || !date instanceof Date) {
                throw new Error('Invalid Argument');
            }
            this._date = date;
            return this;
        }
        next(date) {
            if (date && date instanceof Date) {
                this.setCurrentDate(date);
            }
            const This = this;
            const Next = {
                s : This._date.getSeconds(),
                m : This._date.getMinutes(),
                h : This._date.getHours(),
                d : This._date.getDay(),
                D : This._date.getDate(),
                M : This._date.getMonth()+1,
                Y : This._date.getFullYear(),
            };
            let isNext = true;
            let isOver = false;
            Object.keys(Next).forEach((type) => {
                if (isNext&& This._cronItems[type]) {
                    isNext = This._cronItems[type]?.next(Next, isOver);
                    if (isNext) {
                        if (type == 'd') {  // week
                            let date = This._cronItems[type].currentValue(); 
                            Next['Y'] = date.getFullYear();
                            Next['M'] = date.getMonth()+1;
                            Next['D'] = date.getDate();
                            Next['d'] = date.getDay();
                        } else {
                            Next[type]= This._cronItems[type].currentValue();
                        }
                        isOver = This._cronItems[type].isOver();
                    }
                } else {
                    if (isOver) {
                        switch(type) {
                            case 'm' : Next['m']++; break;
                            case 'h' : Next['h']++; break;
                            case 'd' : Next['D']++; break;
                            case 'D' : Next['D']++; break;
                            case 'M' : Next['M']++; break;
                            case 'Y' : Next['Y']++; break;
                        }
                        isOver = false;
                    }
                }
                //Base.tracking(`${This.classPath}.Scheduler.next(${type}) => [${isNext},${isOver}]`, Next);
            });
            if (isNext) {
                This._next = new Date(Next.Y, Next.M-1, Next.D, Next.h||0, Next.m||0, Next.s||0);
            } else {
                This._next = undefined;
            }
            return isNext;
        }
        getNextDate() {
            return this._next;
        }
        getNextTime() {
            if (this._next && this._next instanceof Date) {
                return this._next.getTime() - this._date.getTime();
            } else {
                return undefined;
            }
        }
    }

    Base.extends(Base.Schedule.Scheduler, {
        clazz  : Scheduler,
        create : function(clazz, cronstring) {
            return Base.Core.module(clazz, new Scheduler(clazz, cronstring), Base.getName(Scheduler));
        },
        TEST : function(clazz) {
            clazz = clazz||Base;
            Base.logging(clazz, `Scheduler Test start.`);
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
                let scheduler = Base.Schedule.Scheduler.create(clazz, cron);
                let isNext = scheduler.next(new Date());
                if (isNext) {
                    let nextDate = scheduler.getNextDate();
                    let nextTime = scheduler.getNextTime();
                    Base.logging(clazz, `RESULT:[${idx}](${cron}):${isNext}: ${nextDate.format('F')} => ${nextTime}`);
                } else {
                    Base.logging(clazz, `RESULT:[${idx}](${cron}):${isNext}`);
                }
            });

            Base.logging(clazz, `Scheduler Test End.`);
        }
    });

}) (window, __DOMAIN_NAME||'');