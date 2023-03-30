/** common.control.calendar.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils  = Base.Utils;
    const Control= Base.Control;

    const CalendarConfiguration = {
        min_year    : -5,
        max_year    :  5,
        max_end_day : new Date(2999, 11, 31),
        format	    : 'yyyy.MM.dd',
        data_sign   : 'y,m,d,w,h',
        minutes_stap: 5,
        message     : {
            y : '년',
            m : '개월',
            d : '일',
            w : '주',
            h : '시간',
            checkStartDate	: '시작일시가 종료일시보다 큽니다.', //'시작일은 종료일({0}) 이전 일자를 선택하세요.',
            checkEndDate	: '종료일시가 시작일시보다 작습니다.', //'종료일은 시작일({0}) 이후 일자를 선택하세요.',
            checkDateRange	: '선택 가능한 기간 범위를 초과했습니다.\n\n- 선택 가능기간 : {0} ',
        },
    };
    const CalendarOptions = {
        calendarType: 'single',     // single, multi
        calendarMode: 'day',        // day, week
        isUseToday  : true,
        isUseRange  : false,
        isUseEndday : false,
        flag        : '1',
        target      : [],
        valueTarget : {},
        format      : CalendarConfiguration.format,
        defaultDate : '',
        dateRange   : '',
        weekFixDay  : undefined,
        minDate     : undefined,    // 최소 선택 가능 일자. Date Object Or String date. 
        maxDate     : undefined,    // 최대 선택 가능 일자. Date Object Or String date.
        message     : {}
    };

    class CalendarBase extends Control.ControlBase {
        constructor(parent) {
			super(parent);
        }

        /**
         * Calendar initialize context.
         */
        async init(context = {}) {
            Base.logging(this, 'init()');
            if (!context['caller']) {
                throw new Error('Calendar를 생성하는데 필요한 caller가 없습니다.');
            }
            if (!context['container']) {
                throw new Error('Calendar를 생성하는데 필요한 container가 없습니다.');
            }
            if (!context['options']) {
                throw new Error('Calendar를 생성하는데 필요한 option이 없습니다.');
            }
            const This = this;
            This._context   = context;
            This._caller    = context['caller'];
            This._container = context['container'];
            This._options   = context['options'];
            This._dateFormat= context['options']['format']||CalendarConfiguration.format;
            This._message   = Base.extends({}, CalendarConfiguration.message, This._options['message']||{});
            This._elements  = {
                target  : This._options['target'],
                values  : This._options['valueTarget'],
                panels  : [],
            };
            This._dates = {
                default : undefined,
                stdDate : undefined,
                endDate : undefined,
                stdView : undefined,
                endView : undefined,
                minDate : undefined,
                maxDate : undefined,
            };
            This._times = {
                stdTime : undefined,
                endTime : undefined,
            };
            // default date setting.
            if (This._options['defaultDate'] && typeof This._options['defaultDate'] == 'string') {
                if (This._options['defaultDate'].isNumber()) {
                    This._dates.default = This._options['defaultDate'];
                } else {
                    This._dates.default = (new Date((new Date()).calculator(This._options['defaultDate']))).format(CalendarConfiguration.format);
                }                
            } else {
                This._dates.default = (new Date()).format(CalendarConfiguration.format);
            }
            // input date setting.
            if (This._options['target'] && This._options['target'].length) {
                const getDate = function(o) {
                    return (o&&o.val()?.trim()?.getNumber() ? o.val().trim().getNumber().padRight(6,'0') : This._dates.default).toDate();
                };
                if (This._options['target'].length > 1) {
                    This._dates.stdDate = getDate(This._options['target'][0]);
                    This._dates.endDate = getDate(This._options['target'][1]);
                } else {
                    This._dates.stdDate = getDate(This._options['target'][0]);
                    This._dates.endDate = This.clone(This._dates.stdDate);
                }
            } else {
                This._dates.stdDate = String(This._options['startDate']||This._dates.default).toDate();
                This._dates.endDate = String(This._options['endDate']||This._dates.default).toDate();
            }
            if(!This._dates.stdDate || !This._dates.stdDate instanceof Date) {
                throw new Error('지원하지 않는 일자 정보 입니다.');
            }
            if(!This._dates.endDate || !This._dates.endDate instanceof Date) {
                throw new Error('지원하지 않는 종료 일자 정보 입니다.');
            }
            if (This._dates.stdDate.getTime() > This._dates.endDate.addDay(1).getTime()) {
                This._dates.stdDate =This.clone(This._dates.endDate);
            }
            // input time setting.
            if (This._dateFormat.toLower().indexOf('hh') > 0) {
                This._isUseTime    = true;
                This._times.stdTime= This._dates.stdDate.getTimes();
                This._times.endTime= This._dates.endDate.getTimes();
                if (This._times.stdTime['mi']&&This._times.stdTime['mi']!=59) This._times.stdTime.mi = This.getMinutesValue(This._times.stdTime.mi);
                if (This._times.endTime['mi']&&This._times.endTime['mi']!=59) This._times.endTime.mi = This.getMinutesValue(This._times.endTime.mi);
                if (This._options['target'] && This._options['target'].length == 2 && !This._options['target'][1].val()?.trim()) {
                    This._times.endTime['hh'] = 23;
                    This._times.endTime['mi'] = 59;
                }
            } else {
                This._isUseTime   = false;
            }

            // date clean up.
            This._dates.stdDate = This.clone(This._dates.stdDate);
            This._dates.endDate = This.clone(This._dates.endDate);
            This._dates.stdView = This.clone(This._dates.stdDate);
            This._dates.endView = This.clone(This._dates.endDate);

            // min, max setting.
            This._dates.minYear = This._options['min_year']||CalendarConfiguration.min_year;
            This._dates.maxYear = This._options['max_year']||CalendarConfiguration.max_year;
            This._dates.minDate = This.iif(This._options['minDate'], This._dates.default.toDate().addYear(This._dates.minYear));
            This._dates.maxDate = This.iif(This._options['maxDate'], This._dates.default.toDate().addYear(This._dates.maxYear));
            // min, max valid. 입력값 우선.
            if (This._dates.stdDate.getTime()<This._dates.minDate.getTime())This._dates.minDate=This.clone(This._dates.stdDate);
            if (This._dates.endDate.getTime()>This._dates.maxDate.getTime())This._dates.maxDate=This.clone(This._dates.endDate);
            if (This._isUseTime) This._dates.maxDate = This._dates.maxDate.addHours(23).addMinutes(59);

            return Base.Core.pf(function(resolve, reject) {
                Base.tracking(`${This.classPath}.createCalendarControl()`, This);
                const calendarItem = This.find('[calendar-role="calendar"]');
                Array.from((calendarItem instanceof NodeList ? calendarItem:[calendarItem])).forEach((e)=>This.initCalendar(e));
                This.renderAll().then(()=> {
                    Base.Timer.sleep(20).then(()=>{ 
                        This._options['onRender']?.(This.getSeleteDate());
                        if (Base.isFunction(resolve)) resolve.call(This._caller, context);
                    });
                });
            });
        }
        find(...args) {
            return this.getContainer()?.find(args);
        }
        clone(date) {
            return date.format('yyyyMMdd').toDate();
        }
        getContext() {
            return this._context;
        }
        iif(one, tow) {
            if (one && one instanceof Date) return one;
            if (one) {
                one = String(one).toDate();
                if (one instanceof Date) return one;
            }
            return tow;
        }
        isMinMaxValid = function(date) {
            return (this._dates.minDate.compare(date) <= 0 && this._dates.maxDate.compare(date) >= 0);
        }
        getMinutesValue(val) {
            return val - (val % CalendarConfiguration.minutes_stap);
        }
        getValidDateSign(str) {
            let result = '';
            CalendarConfiguration.data_sign.split(',').forEach((s)=> { 
                if(str.endWith(s)) result = s; 
            });
            return result;
        }
        getMinMaxValidDate = function(date) {
            if (this._dates.minDate.compare(date) > 0) return this.clone(this._dates.minDate);
            if (this._dates.maxDate.compare(date) < 0) return this.clone(this._dates.maxDate);
            return date;
        }
        getSeleteDate() {
            let resultSDT   = this.clone(this._dates.stdDate);
            let resultEDT   = this.clone(this._dates.endDate ? this._dates.endDate : this._dates.stdDate);
            let resultDates = [];
            if (this._options.isUseRange === true) {
                if (this._isUseTime === true) {
                    if (this._elements.panels.length > 1) {
                        let stdTime = this._elements[this._elements.panels[0]].time;
                        let endTime = this._elements[this._elements.panels[1]].time;
                        if (stdTime.hour.val())  resultSDT = resultSDT.addHours(stdTime.hour.val().parseInt(10));
                        if (endTime.hour.val())  resultEDT = resultEDT.addHours(endTime.hour.val().parseInt(10));
                        if (stdTime.minute.val())resultSDT = resultSDT.addMinutes(stdTime.minute.val().parseInt(10));
                        if (endTime.minute.val())resultEDT = resultEDT.addMinutes(endTime.minute.val().parseInt(10));
                    } else {
                        let stdTime = this._elements[this._elements.panels[0]].time;
                        if (this._options['flag'] == '2') {
                            if (stdTime.hour.val())  resultEDT = resultEDT.addHours(stdTime.hour.val().parseInt(10));
                            if (stdTime.minute.val())resultEDT = resultEDT.addMinutes(stdTime.minute.val().parseInt(10));
                            resultSDT = new Date(resultSDT.setHours(this._times.stdTime.hh));
                            resultSDT = new Date(resultSDT.setMinutes(this._times.stdTime.mi));
                        } else {
                            if (stdTime.hour.val())  resultSDT = resultSDT.addHours(stdTime.hour.val().parseInt(10));                        
                            if (stdTime.minute.val())resultSDT = resultSDT.addMinutes(stdTime.minute.val().parseInt(10));
                            resultEDT = new Date(resultEDT.setHours(this._times.endTime.hh));
                            resultEDT = new Date(resultEDT.setMinutes(this._times.endTime.mi));
                        }
                    }
                    if (resultEDT.getSeconds() == 0) {
                        resultEDT=resultEDT.addSeconds(59);    
                    }
                }
                resultDates.push(resultSDT);
                resultDates.push(resultEDT);
            } else {
                if (this._isUseTime === true) {
                    let stdTime = this._elements[this._elements.panels[0]].time;
                    if (stdTime.hour.val())  resultSDT = resultSDT.addHours(stdTime.hour.val().parseInt(10));
                    if (stdTime.minute.val())resultSDT = resultSDT.addMinutes(stdTime.minute.val().parseInt(10));
                }
                resultDates.push(resultSDT);
            }
            return resultDates;
        }
        async confirm() {
            let This = this;
            let results = this.getSeleteDate();
            if (This._options['dateRange']) {
                if (results && results.length == 2) {
                    if (results[0].calculator(This._options['dateRange']) < results[1].getTime()) {
                        return This.alertMsg('checkDateRange', This._options['dateRange']);
                    }
                } else {
                    alert('Error ~ ~ !!'); return false;
                }
            }
            results.forEach(function(oDate, idx) {
                if (This._elements.target && This._elements.target[idx]) {
                    This._elements.target[idx].val(oDate.format(This._dateFormat));
                    if (This._elements.values[This._elements.target[idx].attr('name')]) {      
                        let valueTarget = This._elements.values[This._elements.target[idx].attr('name')];
                        valueTarget.targetObject?.val(oDate.format(valueTarget.targetFormat));
                    }
                }
                results[idx] = oDate.format(This._dateFormat);
            });
            This._options['callback']?.(results);
            return results;
        }
        setToday(isToday) {
            const This= this;
            if (isToday) {
                const now = (new Date()).format('yyyyMMdd').toDate();
                if (This._options.isUseRange === true) {
                    This._dates.stdView = This.clone(now);
                    This._dates.stdDate = This.clone(now);                    
                    This._dates.endView = This.clone(now);
                    This._dates.endDate = This.clone(now);
                    if (This._isUseTime === true) {
                        This._times.stdTime.hh = 0; // now.getHours();
                        This._times.stdTime.mi = 0; // This.getMinutesValue(now.getMinutes());
                        This._times.endTime.hh =23;
                        This._times.endTime.mi =59;
                    }
                } else {
                    This._dates.stdView = This.clone(now);
                    This._dates.stdDate = This.clone(now);
                    if (This._isUseTime === true) {
                        This._times.stdTime.hh = now.getHours();
                        This._times.stdTime.mi = This.getMinutesValue(now.getMinutes());
                    }
                }
                This.renderAll().then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
            } else {
                Base.Timer.sleep(10).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
            }
            return true;
        }
        setUseEndday(isUseEndday) {
            const This = this;
            if (This._options.isUseRange && isUseEndday) {
                This._options.isUseEndday = isUseEndday;
                // if(!This._dates.endDate || This._dates.stdDate.compare(This._dates.endDate) > 0) {
                //     This._dates.endDate = This.clone(This._dates.stdDate);
                // }                
                if (This._dates.maxDate.compare(CalendarConfiguration.max_end_day) >= 0) {
                    This._dates.endView = This.clone(CalendarConfiguration.max_end_day);
                    This._dates.endDate = This.clone(CalendarConfiguration.max_end_day);
                    if (This._isUseTime === true) {
                        This._times.endTime.hh = 23;
                        This._times.endTime.mi = 59;
                    }                    
                    This.renderAll().then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
                    return true;
                }
            } else {
                Base.Timer.sleep(10).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
            }
            return false;
        }
        initCalendar(calendarContainer) {
            const This = this;
            const type = String(calendarContainer.attr('calendar-flag')||'1').parseInt(10);
            const flag = 'flag#'+type;
            This._elements.panels.push(flag);
            This._elements[flag] = {
                type : calendarContainer.attr('calendar-type')||'',
                flag : calendarContainer.attr('calendar-flag')||'1',
                mode : calendarContainer.attr('calendar-mode')||'day',
                week : +(calendarContainer.attr('calendar-weekFixDay')||'1'),
                prev : calendarContainer.find('[calendar-role="previous"]'), // 이전월
                next : calendarContainer.find('[calendar-role="next"]'),     // 다음월
                body : calendarContainer.find('[calendar-role="days"]'),     // 일자영역
                year : {
                    comboArea: calendarContainer.find('[calendar-role="year-combo-area"]'), // 년선택 영역
                    comboCtrl: calendarContainer.find('[calendar-role="year"]'),            // 년선택
                    inputArea: calendarContainer.find('[calendar-role="year-input-area"]'), // 년등록 영역
                    inputText: calendarContainer.find('[calendar-role="year-input"]'),      // 년등록
                },
                month: {
                    comboCtrl: calendarContainer.find('[calendar-role="month"]'),   // 월선택
                },
                time : {
                    area  : calendarContainer.find('[calendar-role="hour-minute-area"]'),// 시간 영역
                    hour  : calendarContainer.find('[calendar-role="hour"]'),            // 시간 선택
                    minute: calendarContainer.find('[calendar-role="minute"]'),          // 분 선택
                },
            };
            const elem = This._elements[flag];
            Utils.Ui.createComboOptions(0, 11, 1, 2, 1).build(elem.month.comboCtrl);

            if (This._isUseTime === true) {
                if (elem.time.area) {
                    elem.time.area?.show();
                    elem.time.area['style']['display'] = 'flex';
                }
                Utils.Ui.createComboOptions(0, 23).build(elem.time.hour);
                Utils.Ui.createComboOptions(0, 59, CalendarConfiguration.minutes_stap).build(elem.time.minute);
            } else {
                elem.time.area?.hide();
            }
            This.bindEvent(flag);
        }
        setComboYearOptions(flag) {
            let elem= this._elements[flag];
            let date= this._dates[(elem.flag==1?'stdView':'endView')];
            let minY= date.getFullYear()+this._dates.minYear;
            let maxY= date.getFullYear()+this._dates.maxYear;
            if (this._dates.minDate.getFullYear() > minY) minY = this._dates.minDate.getFullYear();
            if (this._dates.maxDate.getFullYear() < maxY) maxY = this._dates.maxDate.getFullYear();
            //Base.tracking(`${this.classPath}.setComboYearOptions(${flag}, ${date.format('d')})`, elem);
            Utils.Ui.createComboOptions(maxY, minY, -1).push('input', '입력').build(elem.year.comboCtrl);
        }
        bindEvent(calendarFlag) {
            const This = this;
            const elem = This._elements[calendarFlag];
            const what = elem.flag == '2' ? 'endView' : 'stdView';
            elem.prev?.bind('click', function() {                
                let oDay = This._dates[what];
                if (This.isMinMaxValid( (new Date(oDay.getFullYear(), oDay.getMonth(), 1)).addDay(-1) )) {
                    This._dates[what] = oDay.addMonth(-1);
                    //Base.tracking(`${This.classPath}.prev.click()`, oDay.format(CalendarConfiguration.format));
                    This.render(calendarFlag).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
                } else {
                    elem.prev.hide();
                    Base.Timer.sleep(100).then(()=>{ elem.prev.show() });
                }
            });
            elem.next?.bind('click', function() {
                let oDay = This._dates[what];
                if (This.isMinMaxValid( (new Date(oDay.getFullYear(), oDay.getMonth(), 1)).addMonth(1) )) {
                    This._dates[what] =oDay.addMonth(1);
                    //Base.tracking(`${This.classPath}.next.click()`, oDay.format(CalendarConfiguration.format));
                    This.render(calendarFlag).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
                } else {
                    elem.next.hide();
                    Base.Timer.sleep(100).then(()=>{ elem.next.show() });
                }
            });
            elem.year.comboCtrl?.bind('change', function(e) {
                let oDay = This._dates[what];
                if (this.value == 'input') {
                    elem.year.comboArea?.hide();
                    elem.year.inputArea?.show();
                    elem.year.inputText?.val(oDay.getFullYear());
                } else {
                    let checkDate = new Date(oDay.setFullYear(String(this.value).parseInt(10)));
                    if(!This.isMinMaxValid(checkDate)) {
                        let self = this;
                        let color= self.style.color;                        
                        self.style.color = 'red';
                        Base.Timer.sleep(100).then(()=>{ self.style.color = color; });
                    }
                    This._dates[what] = This.getMinMaxValidDate(checkDate);
                    This.render(calendarFlag).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
                }
            });
            elem.year.inputTextSetter = function(val) {
                let oDay = This._dates[what];
                elem.year.comboArea?.show();
                elem.year.inputArea?.hide();
                elem.year.comboCtrl?.val(val);
                let checkDate = new Date(oDay.setFullYear(String(val).parseInt(10)));
                This._dates[what] = This.getMinMaxValidDate(checkDate);
                This.render(calendarFlag).then(()=>{ This._options['onRender']?.(This.getSeleteDate()) });
            };
            elem.year.inputText?.attr('maxlength', 4);
            elem.year.inputText?.bind('keyup', function(e) {
                this.value = String(this.value).getNumber();
            });
            elem.year.inputText?.bind('keydown', function(e) {                
                (e.keyCode == 13 && this.value != '' && this.value.length == 4) && elem.year.inputTextSetter(this.value);
            });
            elem.year.inputText?.bind('blur', function(e) {
                elem.year.inputTextSetter(this.value);
            });
            elem.month.comboCtrl?.bind('change', function(e) {
                let oDay = This._dates[what];
                if (this.value) {
                    let checkDate = new Date(oDay.setMonth(String(this.value).parseInt(10)));
                    if(!This.isMinMaxValid(checkDate)) {
                        let self = this;
                        let color= self.style.color;
                        self.style.color = 'red';
                        Base.Timer.sleep(100).then(()=>{ self.style.color = color; });
                    }
                    This._dates[what] = This.getMinMaxValidDate(checkDate);
                    This.render(calendarFlag).then(()=> This._options['onRender']?.(This.getSeleteDate()) );
                }
            });

            const fnHandleStart = function(evt) {
                evt?.preventDefault();
                let That = Base(evt);
                if (That.tagName == 'A') That = That.parent();
                if (That.find('a')) {   
                    Base.tracking(`${This.classPath}.fnHandleStart(${evt.type})`, evt, That);
                    if (This._options.isUseRange === true) {
                        let oStartDt = This.clone(This._dates.stdDate);
                        let oEndDt   = This.clone(This._dates.endDate);
                        let oCurrent = That.data('date').toDate();
                        if (Base.isMobile()) {
                            if (This._options['flag'] == '2') {
                                This._dates.endDate=This.clone(oCurrent);
                               (This._dates.endDate.getTime()<This._dates.stdDate.getTime())&&(This._dates.stdDate=This.clone(oCurrent));
                            } else {
                                This._dates.stdDate=This.clone(oCurrent);
                               (This._dates.stdDate.getTime()>This._dates.endDate.getTime())&&(This._dates.endDate=This.clone(oCurrent));
                            }
                        } else {
                            let flag = (elem.type == 'single') ? 'stdDate' : (elem.flag == '2' ? 'endDate' : 'stdDate');
                            if (flag == 'stdDate') {
                                if (oCurrent.getTime() > oEndDt.getTime()) {
                                    return This.alertMsg('checkStartDate', oEndDt); // 시작일은 종료일 이전 일자를 선택하세요.
                                }
                                oStartDt = This.clone(oCurrent);
                            } else {
                                if (oCurrent.getTime() < oStartDt.getTime()) {
                                    return This.alertMsg('checkEndDate', oStartDt);  // 종료일은 시작일 이후 일자를 선택하세요.
                                }
                                oEndDt = This.clone(oCurrent);
                            }
                            // if (This._options['dateRange']) {
                            //     if (oStartDt.calculator(This._options['dateRange']) < oEndDt.getTime()) {
                            //         return This.alertMsg('checkDateRange', This._options['dateRange']); // 선택 가능한 기간 범위를 초과했습니다.
                            //     }
                            // }
                            This._dates[flag] = oCurrent; 
                        }
                        This.renderAll((Base.isMobile()&&(This._options.isUseTouch==true))).then(()=> This._options['onRender']?.(This.getSeleteDate()));
                    } else {
                        elem.body?.find('a.on')?.removeClass('on');
                        That.find('a').addClass('on');
                        This._dates[(elem.flag == '2' ? 'endDate' : 'stdDate')] = That.data('date').toDate();
                    }
                    This._options['onSelect']?.(This.getSeleteDate());
                }
                return false;
            };
            const fnHandleEnd = function(evt) {
                evt?.preventDefault();
                if (elem.type !== 'single') return false;
                if (This._options.isUseRange !== true) return false;
                let That = Base(evt);
                if (That.tagName == 'A')  That= That.parent();
                if (That.find('a')) {
                    //Base.tracking(`${This.classPath}.fnHandleEnd(${evt.type})`, evt, That);
                    if (Base.isMobile() && evt.type == 'touchend') {
                        // 터치 이벤트가 끝난 위치의 element 조회.
                        let oTouchEndElement = Base(document.elementFromPoint(
                            evt.changedTouches[evt.changedTouches.length-1].clientX,
                            evt.changedTouches[evt.changedTouches.length-1].clientY
                        ))?.parent('[data-idx]');
                        if (!oTouchEndElement || oTouchEndElement == null) return false;
                        Base.tracking(`${This.classPath}.fnHandleEnd(${evt.type})`, That, oTouchEndElement);

                        let oStartDt = That.data('date').toDate();
                        let oCurrent = oTouchEndElement.data('date')?.toDate();
                        if (!oCurrent || oCurrent == null) return false;
                        if (oStartDt.format('d') == oCurrent.format('d')) return false;
                        if (oCurrent.getTime() < oStartDt.getTime()) {
                            This._dates.stdDate = oCurrent;
                            This._dates.endDate = oStartDt;
                        } else {
                            This._dates.stdDate = oStartDt;
                            This._dates.endDate = oCurrent;
                        }
                    } else {
                        let oStartDt = This._dates.stdDate;
                        let oCurrent = That.data('date').toDate();
                        if (oCurrent.getTime() < oStartDt.getTime()) {
                            return This.alertMsg('checkEndDate', oStartDt); // 종료일은 시작일 이후 일자를 선택하세요.
                        }
                        // if (This._options['dateRange']) {
                        //     if (oStartDt.calculator(This._options['dateRange']) < oCurrent.getTime()) {
                        //         return This.alertMsg('checkDateRange', This._options['dateRange']); // 선택 가능한 기간 범위를 초과했습니다.
                        //     }
                        // }
                        This._dates.endDate = oCurrent;
                    }
                    This.renderAll(false).then(()=> This._options['onRender']?.(This.getSeleteDate()));
                    This._options['onSelect']?.(This.getSeleteDate());
                }
                return false;
            };

            if (Base.isMobile() && elem.type === 'single') {
                if (This._options.isUseTouch == true) {
                    let isTouchStart= false;
                    let isTouchMove = false;
                    elem.body.bind('touchstart', (e)=> {
                        if (isTouchStart) return false; isTouchStart=true, Base.Timer.sleep(30).then(()=>isTouchStart=false);
                        fnHandleStart(e);
                    });
                    if (This._options.isUseRange === true) {
                        elem.body.bind('touchend', (e)=> fnHandleEnd(e) );
                        elem.body.bind('touchmove' , (e)=> {
                            if (isTouchMove) return false; isTouchMove=true, Base.Timer.sleep(30).then(()=>isTouchMove=false);
                            let sObj = Base(e.target)?.parent('[data-idx]');
                            let eObj = Base(document.elementFromPoint(
                                e.changedTouches[e.changedTouches.length-1].clientX,
                                e.changedTouches[e.changedTouches.length-1].clientY
                            ))?.parent('[data-idx]');
                            if (sObj && eObj) {
                                let sIdx = String(sObj.data('idx')).parseInt(), 
                                    eIdx = String(eObj.data('idx')).parseInt();
                                elem.body.find('a.in')?.removeClass('in');
                                elem.body.find('a.on')?.removeClass('on');
                                for(let i=(sIdx<eIdx?sIdx:eIdx); i < (sIdx>eIdx?sIdx:eIdx); i++) {
                                    if (i!=sIdx) elem.body.find(`td[data-idx="${i}"]`)?.find('a')?.addClass('in');
                                }
                                elem.body.find(`td[data-idx="${sIdx}"]`)?.find('a')?.removeClass('in').addClass('on');
                                elem.body.find(`td[data-idx="${eIdx}"]`)?.find('a')?.removeClass('in').addClass('on');
                            }
                        });
                    }
                } else {
                    elem.body.find('[data-idx]')?.bind('click', fnHandleStart);
                    elem.body.find('[data-idx]')?.bind('contextmenu', ()=>{return false;});
                }
            } else {
                elem.body.find('[data-idx]')?.bind('click', fnHandleStart);
                elem.body.find('[data-idx]')?.bind('contextmenu', fnHandleEnd);
            }

            if (This._isUseTime === true) {
                const whatTime= elem.flag == '2' ? 'endTime':'stdTime';
                elem.time.hour?.bind('change', function(e) {
                    This._times[whatTime].hh = this.value;
                });
                elem.time.minute?.bind('change', function(e) {
                    This._times[whatTime].mi = this.value;
                });
            }
        }
        renderAll(isPreRender = false) {
            const This = this;
            const promiseList = [];
            This._elements.panels.forEach((flag) => {
                promiseList.push(This.render(flag, isPreRender));
            });
            return Promise.all(promiseList);
        }
        render(calendarFlag, isPreRender = false) {
            const This = this;
            const elem = This._elements[calendarFlag];
            return Base.Core.pf(function(resolve) {
                let body = elem.body;
                let len  = body.find('[data-idx]').length;
                let curr = This._dates.stdView;
                let time = This._times.stdTime;
                let date = new Date(This._dates.stdView.getFullYear(), This._dates.stdView.getMonth(), 1);
                if (This._options.isUseRange === true && elem.flag  == '2') {
                    curr = This._dates.endView;
                    time = This._times.endTime;
                    date = new Date(This._dates.endView.getFullYear(), This._dates.endView.getMonth(), 1);
                }
                /*
                Base.tracking(`${This.classPath}.render() -> 
                      cur: ${date.format(CalendarConfiguration.format)}
                    , std: ${This._dates.stdDate.format(CalendarConfiguration.format)}
                    , end: ${This._dates.endDate.format(CalendarConfiguration.format)}
                    , min: ${This._dates.minDate.format(CalendarConfiguration.format)}
                    , max: ${This._dates.maxDate.format(CalendarConfiguration.format)}
                    ` , This, elem); */
                This.setComboYearOptions(calendarFlag);
                body.find('a.on')?.removeClass('on');
                for(let i = 0; i < len; i++) {
                    let That = body.find(`[data-idx="${i}"]`); 
                    if (i >= date.getDay() && date.getMonth() == curr.getMonth()) {
                        That.data('date', date.format(CalendarConfiguration.format));
                        let isActive = This.isMinMaxValid(date);
                        if (isActive&& elem['mode'] == 'week' && !String(elem['week']).isEmpty()) {
                            isActive = (date.getDay() === String(elem['week']).parseInt(10));
                        }
                        if (isActive) {
                            let link = (isPreRender) ? That.find('a') : That.empty().appendHtml(`<a>${date.getDate()}</a>`).find('a');
                            if (This._options.isUseRange === true) {
                                link.removeClass('in');
                                if (This._options.calendarType == 'multi') {
                                    if (This._dates.stdDate.compare(date) == 0 && !link.hasClass('on')) link.removeClass('in'), link.addClass((elem.flag=='1'?'on':'in'));
                                    if (This._dates.endDate.compare(date) == 0 && !link.hasClass('on')) link.removeClass('in'), link.addClass((elem.flag=='2'?'on':'in'));
                                } else {
                                    if (This._dates.stdDate.compare(date) == 0 || This._dates.endDate.compare(date) == 0) link.addClass('on');
                                }
                                if (This._dates.stdDate.compare(date) < 0 && This._dates.endDate.compare(date) > 0) {
                                    if (!link.hasClass('on')) link.addClass('in');
                                }
                            } else {
                                if (This._dates.stdDate.compare(date) == 0) link.addClass('on');
                            }
                        } else {
                            let span = (isPreRender) ? That.find('span') : That.empty().appendHtml(`<span>${date.getDate()}</span>`).find('span');
                            if (This._options.isUseRange === true) {
                                if (This._dates.stdDate.compare(date) < 0 && This._dates.endDate.compare(date) > 0) {
                                    span.addClass('on');
                                }
                                if (This._dates.stdDate.compare(date) == 0 || This._dates.endDate.compare(date) == 0) {
                                    span.addClass('on');
                                }
                            }
                        }
                        date = date.addDay(1);
                    } else {
                        if (!isPreRender) {
                            That.data('date', '');
                            That.empty().text_(' ');
                        }
                    }
                }
                if (!isPreRender) {
                    elem.year.comboCtrl?.val(String(curr.getFullYear()));
                    elem.month.comboCtrl?.val(String(curr.getMonth()));
                    if (This._isUseTime === true) {
                        elem.time.hour?.val(String(time.hh));
                        if (elem.time.hour?.val() == '') {
                            elem.time.hour?.val('0');
                        }
                        elem.time.minute?.val(String(time.mi));
                        if (elem.time.minute?.val() == '') {
                            elem.time.minute?.val('0');
                        }
                    }
                }
                if (Base.isFunction(resolve)) resolve();
            });
        }
        alertMsg(key, val = '') {
            const This= this;
            const Msg = This._message;
            if (key && val && Msg[key]) {
                let msg = '';
                if (val instanceof Date) {
                    msg = val.format('yyyy-MM-dd');
                } else if (typeof val == 'string') {
                    let fix = This.getValidDateSign(val); 
                    if (fix) {
                        msg = val.substring(0, val.length-1).parseInt(10) + (Msg[fix]||fix);
                    }
                }
                alert(String(Msg[key]).format(msg));
            }
            return false;
        }
    }

    const ctrl = Base.Control.Calendar;
    Base.extends(Base.Control.Calendar, {
        options         : CalendarOptions,
        configuration   : CalendarConfiguration,
        createCalendar  : function(clazz) {
            return Base.Core.module(clazz, new CalendarBase(clazz), ctrl.className);
		},
	});

}) (window, __DOMAIN_NAME||'');