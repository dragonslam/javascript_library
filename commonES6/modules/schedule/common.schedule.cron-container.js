/** common.schedule.cron-container.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const Paser= Base.Schedule.CronParser;

    /** Private handler class. */
    class CronContainer {
        constructor(type, begin, end) {            
            if (!type || begin==undefined || end==undefined) {
                throw new Error('Invalid Argument');
            };
            this._type      = type
            this._cronstring= '';
            this._schedule  = undefined;
            this._nextHash  = undefined;
            this._prevHash  = undefined;
            this._minBound  = begin;
            this._maxBound  = end;
            this._present   = begin;
            this._currentVal= begin;
            this._isOver    = false;
        }
        init(schedule, cron) {
            if (!schedule) {
                throw new Error('Invalid Argument');
            }
            this._isOver    = false;
            this._cronstring= cron;
            this._schedule  = schedule;
            this._nextHash  = [];
            this._prevHash  = [];

            let i = this._minBound;
            for (let j = 0; j < this.getLength() ; ++j) {
                for (; i <= this._maxBound; ++i) {
                    if(i <= this._schedule[j]) {
                        this._nextHash[i] = this._schedule[j];
                    } else {
                        break;
                    }
                }
            }
            //---------------------------------------------
            i = this._maxBound;
            for (let j = this.getLength() - 1; j > -1; j--) {
                for (; i >= this._minBound; i--) {
                    if(i >= this._schedule[j]) {
                        this._prevHash[i] = this._schedule[j];
                    } else {
                        break;
                    }
                }
            }
            Base.tracking(`${this.classPath}.CronContainer.init()`, this);
            return this;
        }
        isOver() {
            return this._isOver;
        }
        currentValue() {
            return this._currentVal;
        }
        getLength() {
            return this._schedule ? this._schedule.length : 0;
        }
        getFirst() {
            if (this.getLength() > 0){
                return this._schedule[0];
            }
            return this._minBound;
        }
        getLast() {
            if (this.getLength() > 0){
                return this._schedule[this.getLength()-1];
            }
            return this._maxBound;
        }
        next(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            isOver = (this._type == 'm' || this._type == 's') ? true : isOver;
            this._isOver = false;
            this._present= present[this._type];
            if (this._nextHash && this._nextHash != null && this._nextHash.length > 0) {
                let presentVal = (1 * this._present) + (isOver ? 1 : 0);
                if (this._nextHash[presentVal] != undefined) {
                    this._currentVal = this._nextHash[presentVal];
                    return true;
                }
                this._isOver = true;
                this._currentVal = this.getFirst();
                return true;
            }
            return false;
        }
        prev(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            isOver = (this._type == 'm' || this._type == 's') ? true : isOver;
            this._isOver = false;
            this._present= present[this._type];
            if (this._prevHash && this._prevHash != null && this._prevHash.length > 0) {
                let presentVal = (1 * this._present) - (isOver ? 1 : 0);
                if (this._prevHash[presentVal] != undefined) {
                    this._currentVal = this._prevHash[presentVal];
                    return true;
                }
                this._isOver = true;
                this._currentVal = this.getLast();
                return true;
            }
            return false;            
        }
    };

    class TimeCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
    }

    class HourCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
    }

    class DayCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
        next(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver = false;
            this._present= present[this._type];
            let currentY = present['Y'];
            let currentM = present['M']-1;
            let currentD = present['D'];
            if (this._nextHash && this._nextHash != null && this._nextHash.length > 0) {
                currentD = ((1 * currentD) > 0) ? currentD : this.getFirst();
                currentD = (isOver) ? currentD + 1 : currentD;
                if (this._nextHash[currentD] != undefined) {
                    this._present = this._nextHash[currentD];

                    let lastDay = (new Date(currentY, currentM, this._present, 0, 0, 0)).getLastDay();
                    if (lastDay<= this._present) {
                        this._currentVal = this._present;
                        return true;
                    }
                }
                this._isOver = true;
                this._currentVal = this.getFirst();
                return true;
            }
            return false;
        }
        prev(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver = false;
            this._present= present[this._type];
            let currentY = present['Y'];
            let currentM = present['M']-1;
            let currentD = present['D'];
            if (this._prevHash && this._prevHash != null && this._prevHash.length > 0) {
                currentD = ((1 * currentD) > 0) ? currentD : this.getLast();
                currentD = (isOver) ? currentD - 1 : currentD;
                if (this._prevHash[currentD] != undefined) {
                    this._present = this._prevHash[currentD];

                    let lastDay = (new Date(currentY, currentM, this._present, 0, 0, 0)).getLastDay();
                    if (lastDay<= this._present) {
                        this._currentVal = this._present;
                        return true;
                    }
                }
                this._isOver = true;
                this._currentVal = this.getLast();
                return true;
            }
            return false;
        }
        getLast() {
            let lastDay = (new Date(this._currentY, this._currentM, this._present, 0, 0, 0)).getLastDay();
            if (this.getLength() > 0 && this._schedule[this.getLength() - 1] <= lastDay) {
                return this.container[this.getLength() - 1];
            }
            return lastDay;
        }
    }

    class WeekCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
        next(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver = false;
            this._present= present[this._type];
            let currentY = present['Y'];
            let currentM = present['M']-1;
            let currentD = present['D'];
            if (this._nextHash && this._nextHash != null && this._nextHash.length > 0) {
                currentD = ((1 * currentD) > 0) ? currentD : 1;

                let date = new Date(currentY, currentM, currentD, 0, 0, 0);
                if (isOver) {
                    date.setDate(date.getDate() + 1);
                }
                if (this._nextHash[date.getDay()] != undefined) {
                    date.setDate(date.getDate() + (this._nextHash[date.getDay()]-date.getDay()));
                } else {
                    date.setDate(date.getDate() + ( (7 - date.getDay()) + this.getFirst() ));
                }
                this._currentVal = date;
                return true;
            }
            return false;
        }
        prev(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver   = false;
            this._present  = present[this._type];
            let currentY = present['Y'];
            let currentM = present['M']-1;
            let currentD = present['D'];
            if (this._prevHash && this._prevHash != null && this._prevHash.length > 0) {
                currentD = ((1 * currentD) > 0) ? currentD : (new Date(currentY, currentM, 1)).getLastDay();

                let date = new Date(currentY, currentM, currentD, 0, 0, 0);
                if (isOver) {
                    date.setDate(date.getDate() - 1);
                }
                if (this._prevHash[date.getDay()] != undefined) {
                    date.setDate(date.getDate() - (date.getDay()-this._prevHash[date.getDay()]));
                } else {
                    date.setDate(date.getDate() - ( 7 - (this.getFirst() - date.getDay()) ));
                }
                this._currentVal = date;
                return true;
            }
            return false;
        }
    }
    class MonthCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
        next(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver = false;
            this._present= present[this._type];
            let currentM = present['M'];
            if (this._nextHash && this._nextHash != null && this._nextHash.length > 0) {
                this._present = (isOver ? this._present+1 : this._present);
                if (this._nextHash[this._present] != undefined) {
                    this._present = this._nextHash[this._present];

                    if (this._present >= currentM) {
                        this._currentVal = this._present;
                        return true;
                    }
                }
                this._isOver = true;
                this._currentVal = this.getFirst();
                return true;
            }
            return false;
        }
        prev(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._isOver = false;
            this._present= present[this._type];
            let currentM = present['M'];
            if (this._prevHash && this._prevHash != null && this._prevHash.length > 0) {
                this._present = (isOver ? this._present-1 : this._present);
                if (this._prevHash[this._present] != undefined) {
                    this._present = this._prevHash[this._present];

                    if (this._present <= currentM) {
                        this._currentVal = this._present;
                        return true;
                    }
                }
                this._isOver = true;
                this._currentVal = this.getLast();
                return true;
            }
            return false;
        }
    }

    class YearCronContainer extends CronContainer {
        constructor(type, begin, end) {
            super(type, begin, end);
        }
        next(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._present = present[this._type];
            if (this._nextHash && this._nextHash != null && this._nextHash.length > 0) {
                let presentVal = (1 * this._present) + (isOver ? 1 : 0);
                if (this._nextHash[presentVal] != undefined) {
                    this._currentVal = this._nextHash[presentVal];
                    return true;
                }
            }
            return false;
        }
        prev(present, isOver) {
            if (!present || present[this._type] == undefined) return false;
            this._present = present[this._type];
            if (this._nextHash && this._nextHash != null && this._prevHash.length > 0) {
                let presentVal = (1 * this._present) - (isOver ? 1 : 0);
                if (this._prevHash[presentVal] != undefined) {
                    this._currentVal = this._prevHash[presentVal];
                    return true;
                }
            }
            return false;            
        }
    }

    /** Cron Type options */
    const Types = {
        s : {idx:0, begin:0, end:59, container:TimeCronContainer   },
        m : {idx:1, begin:0, end:59, container:TimeCronContainer   },
        h : {idx:2, begin:0, end:23, container:HourCronContainer   },
        D : {idx:3, begin:1, end:31, container:DayCronContainer    },
        d : {idx:5, begin:0, end: 6, container:WeekCronContainer   },
        M : {idx:4, begin:1, end:12, container:MonthCronContainer  },        
        Y : {idx:6, begin:2020,end:2099,container:YearCronContainer},
    };
    const CronContainerBuilder = function(type) {
        let cron = Types[type];
        if (cron && cron['container']) {
            return new cron['container'](type, cron.begin, cron.end);
        } else {
            throw new Error('Invalid Argument');
        }
    };

    /** CronContainer Namespace extends. */
    Base.extends(Base.Schedule.CronContainer, {
        Types,
        create : function(clazz, type) {
            const cron = CronContainerBuilder(type);
            return Base.Core.module(clazz, cron, Base.getName(cron));
        },
    });

}) (window, __DOMAIN_NAME||'');