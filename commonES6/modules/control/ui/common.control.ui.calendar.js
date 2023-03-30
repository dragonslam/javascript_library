/** common.control.ui.calendar.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils  = Base.Utils;
    const Control= Base.Control;
    
    const CalendarDefaultAttributes = {
        calendarMode : {name:'calendar-mode'    , value:''},
        calendarType : {name:'calendar-type'    , value:''},
        minDate      : {name:'calendar-min'     , value:''},
        maxDate      : {name:'calendar-max'     , value:''},
        format       : {name:'calendar-format'  , value:'yyyy.MM.dd'},
        dateRange    : {name:'calendar-dateRange'        , value:''},
        defaultDate  : {name:'calendar-defaultDate'      , value:''},
        weekFixDay   : {name:'calendar-weekFixDay'       , value:''},
        checkStartDate:{name:'calendar-checkStartDateMsg', value:''},
        checkEndDate : {name:'calendar-checkEndDateMsg'  , value:''},
        checkDateRange:{name:'calendar-checkDateRangeMsg', value:''},
        maskUse      : {name:'calendar-maskUse'          , value:'Y'},
        maskLazy     : {name:'calendar-maskLazy'         , value:'N'},
    };
    const CalendarControlOptions = {
        'pc' : {
            attributes : Base.extends(Base.Utils.clone(CalendarDefaultAttributes), {
                format : {name:'calendar-format'  , value:'yyyy.MM.dd'}
            }),
            single  : {
                numberOfMonths : 1,
                template:`${Base.config['template_path']}/calendar.html`,
                wapper  :`${Base.config['template_path']}/calendar_single.html`,
                target  : '.type-calendar',
            },
            multi   : {
                numberOfMonths : 2,
                template:`${Base.config['template_path']}/calendar.html`,
                wapper  :`${Base.config['template_path']}/calendar_multi.html`,
                target  : '.type-calendar',
            },
        },
        'mo' : {
            attributes : Base.extends(Base.Utils.clone(CalendarDefaultAttributes), {
                format : {name:'calendar-format'  , value:'yy.MM.dd'}
            }),
            single  : {
                numberOfMonths : 1,
                template:`${Base.config['template_path']}/calendar.html`,
                wapper  :`${Base.config['template_path']}/calendar_single.html`,
                target  : '.type-calendar',
            },
            multi   : {
                numberOfMonths : 2,
                template:`${Base.config['template_path']}/calendar.html`,
                wapper  :`${Base.config['template_path']}/calendar_multi.html`,
                target  : '.type-calendar',
            },
        },
    };

    class CalendarControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
			super(parent);
            this._container= undefined;
            this._elements = {};
        }
        init(container) {
            if (!container) {
                throw new Error('CalendarControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
            this._container = container;
            return this;
        }
        getUniqueName() {
            return (this._parent ? (this._parent['classUUID']||this._parent['classPath']).replaceAll('.','_') : '') 
                + '-' + (++this._controlNum).toString(36);
        }
        async create(context, options = {}){
            if (!context|| !context['type']) {
                throw new Error('CalendarControl을 생성하는데 필요한 type이 없습니다.');
            }
            if (!context|| !context['caller']) {
                throw new Error('CalendarControl를 호출하는 객체가 없습니다.');
            }
            if (!options || !options['format']) {
                throw new Error('CalendarControl을 생성하는데 필요한 format 옵션이 없습니다.');
            }
            const This = this;
            Base.tracking(`${This.classPath}.createCalendarUI()`, This, context, options);
            const calendarId    = This.getUniqueName();
            const calendarType  = context.type;
            return Base.Core.pf(function(resolve, reject) {
                // import calendar template.
                This.getRemoteTemplates(calendarType.wapper, calendarType.template).then(function(template) {
                    let calendarPanelCount = calendarType.numberOfMonths;
                    // create calendar container.
                    const calendarContainer = Control.Ui.createElementFromHTML(template[0]);
                    if (calendarType.numberOfMonths == 1) {
                        calendarContainer.find('[calendar-role="endday-checkbox-area"]')?.remove();
                        options.isUseEndday = false;
                        options.isUseRange  = (!!options.isUseRange);
                    } 
                    else if (calendarType.numberOfMonths == 2) {
                        if (options['calendarType'] === 'single') {
                            calendarPanelCount = 1;
                            options.isUseEndday= false;
                            options.isUseRange = true;
                            calendarContainer.find('[calendar-role="endday-checkbox-area"]')?.remove();
                        } else {
                            options.isUseEndday= false;
                            options.isUseRange = true;
                            if (options?.maxDate && options.maxDate instanceof Date 
                             && options.maxDate.compare(Control.Calendar.configuration.max_end_day) >= 0) {
                                calendarContainer.find('[calendar-role="endday-checkbox-area"]')?.show();
                            } else {
                                calendarContainer.find('[calendar-role="endday-checkbox-area"]')?.remove();
                            }
                        }
                    }
                    if (options['isUseToday'] === false) {
                        calendarContainer.find('[calendar-role="today-checkbox-area"]')?.remove();
                    }
                    if (options['calendarMode'] == 'week') {
                        if (options['weekFixDay']) {
                            if (typeof options['weekFixDay'] == 'string') {
                                options['weekFixDay'] = String(options['weekFixDay']).split(',');
                            }
                        } else {
                            options['weekFixDay'] = [1,0];
                        }
                    }
                    for (let i = 0; i < calendarPanelCount; i++) {
                        // create calendar container.
                        let calendarTemplate = Control.Ui.createElementFromHTML(template[1]);
                        if (options['calendarType'] === 'single') {
                            calendarTemplate.attr('calendar-type', options['calendarType']);
                        }
                        calendarTemplate.attr('calendar-flag',(calendarPanelCount == 1 && !!options.isUseRange ? (options.flag||'1') : (i+1)));
                        calendarTemplate.attr('calendar-mode', options['calendarMode']||'');
                        if (options['calendarMode'] == 'week') {
                            calendarTemplate.attr('calendar-weekFixDay', options['weekFixDay'][i]);
                        }
                        calendarContainer.find('[calendar-role="calendar-box"]').append(calendarTemplate);
                    }
                    calendarContainer.data('layerId', calendarId);

                    // Calendar child context.
                    const calendarContext = This._elements[calendarId] = {
                        caller   : This,
                        container: calendarContainer,
                        control  : Control.Calendar.createCalendar(This),
                        context  : Base.extends(context, {
                            calendarId : calendarId
                        }), 
                        options  : Base.extends({isUseToday:false}, options),
                        destroy  : function() {
                            This.removeCalendar(calendarId);
                        },
                        layerHandler: {
                            id      : calendarId,
                            open    : (context['isMobile'] === true ? layerOpen       : (context['isTargetOpen'] === true ? layerPositOpen : layerOpen )),
                            close   : (context['isMobile'] === true ? layerPositClose : (context['isTargetOpen'] === true ? layerPositClose: layerClose)),
                            options : {
                                depth       : This._controlNum,
                                scrlLock    : false,
                                dimedClick  : false, 
                                target      : context['caller']?.closest(calendarType.target) ? calendarType.target : context['caller'].tagName ,
                                currentClick: context['caller'], 
                            },
                        }
                    };

                    // Reset Checkbox checked after rendering in calendar control.
                    if (options.isUseToday === true || options.isUseRange === true) {
                        let now = (new Date()).format('d');
                        let max = Control.Calendar.configuration?.max_end_day?.format('d');
                        let day = calendarContext.container.find('[calendar-role="today-checkbox"]');
                        let end = calendarContext.container.find('[calendar-role="endday-checkbox"]');
                        let _fn = function(rst) {
                            if (!rst) return;
                            let isToday = (rst[0].format('d')==now), 
                                isEndday= false;
                            if (rst.length == 2) {
                                isToday = (rst[1].format('d')==now && isToday), 
                                isEndday= (rst[1].format('d')==max);
                            }
                            if (end) end.checked= isEndday;
                            if (day) day.checked= isToday && !isEndday;
                        };
                        calendarContext.options.onSelect = _fn;
                        calendarContext.options.onRender = _fn;
                    }

                    Base.tracking(`${This.classPath}.create()`, calendarContext);

                    // Calendar coltrol init.
                    calendarContext.control.init(calendarContext).then(function(context) {
                        // append layer element.
                        This.getContainer().append(context.container);

                        if (context.context.isTargetOpen === true) {
                            if (Base('body').hasClass('scrl-lock')) {
                                Base('body').removeClass('scrl-lock');
                                context.context.isScrollLock = true;
                            }
                        }

                        // calendar layer show.
                        const _handler  = context.layerHandler;
                        _handler.onClose= function(e) {
                            This.remove(calendarId);
                            if (context.context.isTargetOpen === true && context.context.isScrollLock === true) {
                                Base.Timer.sleep(10).then(()=> {
                                    Base('body').addClass('scrl-lock');
                                });                                
                            }
                        };
                        _handler.open.call($w, _handler.id, _handler.options, function(){

                            if (context.container.find('[calendar-role="today-checkbox"]')) {
                                context.container.find('[calendar-role="today-checkbox"]').checked = false;
                                context.container.find('[calendar-role="today-checkbox"]').bind('click', function() {
                                    this.checked = context.control?.setToday(this.checked);
                                });
                            }
                            if (context.container.find('[calendar-role="endday-checkbox"]')) {
                                context.container.find('[calendar-role="endday-checkbox"]').checked = !!options['isUseEndday'];
                                context.container.find('[calendar-role="endday-checkbox"]').bind('click', function() {
                                    this.checked = context.control?.setUseEndday(this.checked);
                                });
                            }
                            context.container.find('[calendar-role="close-button-area"]')?.bind('click', function(e) {
                                e.stopPropagation();
                                _handler.onClose(e);
                            });
                            context.container.find('[calendar-role="confirm-button-area"]')?.bind('click', function(e) {
                                e.stopPropagation();
                                context.control?.confirm().then(function(result) {
                                    if (result !== false) _handler.onClose(e);
                                });
                            });
                            if (Base.isFunction(resolve)) resolve(context);
                        }, _handler.onClose);
                    });

                }).catch(function(error) {
                    if (error.alerted !== true) {
                        Base.tracking(`${This.classPath}.createCalendarUI()`, "", error);
                    };
                    if (Base.isFunction(reject)) reject(This._elements[calendarId]);
                });
            });
        }
        remove(calendarId) {
            Base.tracking(`${this.classPath}.remove(${calendarId})`, this);
            const This = this;
            if (This._elements[calendarId]) {
                const _handler  = This._elements[calendarId]['layerHandler'];
                _handler.close.call($w, calendarId, {}, function() {
                    This._elements[calendarId].container.remove();
                    This._elements[calendarId].component = undefined;
                    This._elements[calendarId] = undefined;
                    delete This._elements[calendarId];
                    This.getContainer().find(`[data-dimed-id="${calendarId}"]`)?.remove();
                    This.getContainer().find(`[data-layer-id="${calendarId}"]`)?.remove();
                });
            }
        }
    }
    // //////////////////////////////////////////////////////////////////////////////// CalendarControlBase End.
    
    class CalendarMaskControl extends Control.Ui.UiControlBase {
        constructor(container, attributes, options) {
            if (!container || !container?.find('input[type="text"]')) {
                throw new Error('CalendarMaskControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
            super();
            this._container = container;
            this._attributes= attributes;
            this._options   = options;
            this._iMask     = undefined;
            this._input     = this.find('input[type="text"]');
        }
        async create(options = {}){
            const This = this;
            const That = This._input;
            const Attr = This._attributes;
            This._options = Base.extends({}, This._options, options);
            return Base.Core.pf(function(resolve) {
                if (That.readOnly !== true && That.disabled !== true) {                    
                    // Base.tracking('CalendarMaskControl.create()', That, Attr);
                    let calendarFormat = Attr.format.value;
                    if ($w['IMask'] && Attr.maskUse.value != 'N') {
                        // Input Mask use.
                        Attr.maskOptions = {
                            mask    : Date,
                            pattern : calendarFormat+(calendarFormat.indexOf('mm') > 0 ? '0':''),
                            min     : (new Date()).addYear(Control.Calendar.configuration.min_year),
                            max     : (new Date()).addYear(Control.Calendar.configuration.max_year),
                            lazy    : (Attr.maskLazy.value === 'Y' ? true : false),
                            autofix : true,
                            eager   : true,
                            format  : (d)=>d.format('d'),
                            parse   : (s)=>s.toDate(),
                            blocks  : {
                                MM  : {mask:IMask.MaskedRange, placeholderChar:'_', from: 1, to: 12, maxLength: 2},
                                dd  : {mask:IMask.MaskedRange, placeholderChar:'_', from: 1, to: 31, maxLength: 2},
                                HH  : {mask:IMask.MaskedRange, placeholderChar:'_', from: 0, to: 23, maxLength: 2},
                                mm  : {mask:IMask.MaskedRange, placeholderChar:'_', from: 0, to: 59, maxLength: 2},
                            }
                        };
                        Attr.minDate.value && (Attr.maskOptions.min = Attr.minDate.value.toDate());
                        Attr.maxDate.value && (Attr.maskOptions.max = Attr.maxDate.value.toDate());
                        Attr.maskOptions.blocks.yyyy= {mask:IMask.MaskedRange, placeholderChar:'_', maxLength: 4
                            , from  : Attr.maskOptions.min.getFullYear()
                            , to    : Attr.maskOptions.max.getFullYear()
                        };
                        Attr.maskOptions.blocks.yy  = {mask:IMask.MaskedRange, placeholderChar:'_', maxLength: 2
                            , from  : Attr.maskOptions.min.format('yy').parseInt()
                            , to    : Attr.maskOptions.max.format('yy').parseInt()
                        };
                        // Input Mask apply.
                        Attr.maskControl= This._iMask = IMask(That, Attr.maskOptions);
                        // Value formatting.
                        if (That.val() && That.val().toDate() != null) {
                            Base.Timer.sleep(3).then(function() {
                                This.updateValue(That.val().toDate().format(calendarFormat));
                            });
                        }
                        Attr.maskControl.on('accept', (e)=>{
                            if (!e || !(e instanceof InputEvent)) return;
                            // Base.tracking('CalendarMaskControl.onAccept()', e);
                            let o = Base(e).parent();
                            if (o) {
                                o.data('oColor', o.style.borderColor);
                                o.style.borderColor = '#595959';
                                Base.Timer.sleep(30).then(()=> o.style.borderColor=o.data('oColor') );
                            }
                        });
                        Attr.maskControl.on('reject', (e)=>{
                            if (!e || !(e instanceof InputEvent)) return;
                            // Base.tracking('CalendarMaskControl.onReject()', e);
                            let o = Base(e).parent();
                            if (o) {
                                o.style.borderColor = '#ff0000';
                                //Base.Timer.sleep(300).then(()=> o.style.borderColor='' );
                            }
                        });
                        Attr.maskControl.on('complete', (e)=>{
                            if (!e || !(e instanceof InputEvent)) return;
                            // Base.tracking('CalendarMaskControl.onComplete()', e);
                            let o = Base(e).parent();
                            if (o) {
                                o.style.borderColor = '#0000ff';
                                Base.Timer.sleep(500).then(()=> o.style.borderColor='' );
                            }
                        });
                        That.bind('focus', function(e) {
                            if (That.val() && That.val().toDate() != null) {
                                That.data('orignal', That.val());
                            }
                        });
                    } else {
                        Attr.maskControl= undefined;
                        That.bind('focus', function(e) {
                            if (That.val()) {
                                That.data('orignal', That.val().getNumber());
                                That.val(That.val().getNumber());
                            }
                        });
                        That.bind('keyup', function(e) {
                            if (That.val()) That.val(That.val().getNumber());
                        });
                    }

                    That.bind('blur', function(e) {
                        let Self=Base(this);
                        if (Self.val() && Self.val().trim().getNumber().length >= (Attr.format.value.indexOf('HH')>6?10:8) && Self.val().toDate() != null) {
                            let selfVal = Self.val().toDate();
                            let current = Self.parent(This._options.calendarSelector);
                            let wappers = current.parent().find(This._options.calendarSelector);
                            let results = [selfVal];
                            if (Attr.minDate.value) Attr.minDate.date = String(Attr.minDate.value).toDate();
                            if (Attr.maxDate.value) {
                                Attr.maxDate.date = String(Attr.maxDate.value).toDate();
                                if (Attr.format.value.toLowerCase().indexOf('hh') > 0) {
                                    Attr.maxDate.date = Attr.maxDate.date.addHours(23).addMinutes(59).addSeconds(59);
                                }
                            }
                            let isValid = true;
                            let validMsg= '';
                            // Min, Max 값 확인.
                            if (isValid && Attr.minDate.date && Attr.minDate.date.getTime() > selfVal.getTime()) {
                                isValid = false;
                                validMsg= `등록 가능한 최소 일자보다 작습니다.\n\n- ${Attr.minDate.date.format(calendarFormat)} 이후 일자로 등록해 주세요.`; 
                            }
                            if (isValid && Attr.maxDate.date && Attr.maxDate.date.getTime() < selfVal.getTime()) {
                                isValid = false;
                                validMsg= `등록 가능한 최대 일자보다 큼니다.\n\n- ${Attr.maxDate.date.format(calendarFormat)} 이전 일자로 등록해 주세요.`; 
                            }
                            // 기간 범위 적용시 검증.
                            if (wappers && wappers instanceof NodeList) {
                                let stdVal = Base(wappers[0]).find('input[type="text"]')?.val()?.toDate();
                                let endVal = Base(wappers[1]).find('input[type="text"]')?.val()?.toDate();
                                if (stdVal && endVal && stdVal != null && endVal != null) {
                                    if (isValid && stdVal.getTime() > endVal.getTime()) {
                                        isValid = false;
                                        validMsg= '종료일은 시작일 보다 이후 일자를 등록해 주세요.';
                                    }
                                    if (Attr.dateRange.value) {
                                        if (isValid && stdVal.calculator(Attr.dateRange.value) < endVal.getTime()) {
                                            isValid = false;
                                            validMsg= `선택 가능한 기간 범위를 초과했습니다.\n\n- 선택 가능기간 : ${Attr.dateRange.value} `;
                                        }
                                    }
                                }
                                if (isValid) {
                                    results = [stdVal, endVal];
                                }
                            }
                            // 값 반영.
                            if (isValid) {
                                This.updateValue(selfVal.format(Attr.format.value));
                                if (Self.parent()) {
                                    Base.Core.loop(6, 120, function(cnt, isLast = false) {                                        
                                        Self.parent().style.borderColor= isLast ? '' : (cnt%2 == 0 ? '#0000ff' : '#2266ff');
                                    });
                                }
                                // Another value target.
                                if (Self.attr('target-name') && current.find(`[name="${Self.attr('target-name')}"]`)) {
                                    let format = Self.attr('target-format')||calendarFormat;
                                    current.find(`[name="${Self.attr('target-name')}"]`)?.val(selfVal.format(format));
                                }
                            } else {
                                This.updateValue(Self.val().trim().replaceAll('_', '').substring(0, Self.val().length-1));
                                if (Self.parent()) Self.parent().style.borderColor = '#ff0000';
                                if (Self.data('isReject') != 'Y') alert(validMsg);
                                Self.data('isReject', 'Y');
                                Self.focus();
                            }
                            if (Base.isFunction(This._options['callback'])) {
                                This._options['callback'](results);
                            }
                        } else {
                            if (Self.parent()) Self.parent().style.borderColor = '#ff0000';
                            if (Self.data('orignal') && Self.val()) This.updateValue(Self.data('orignal'));
                            if (Self.data('isReject') != 'Y') alert('날짜 형식이 올바르지 않습니다.');                            
                            if (Self.parent()) Base.Timer.sleep(300).then(()=> Self.parent().style.borderColor='' );
                            Self.data('isReject', 'Y');
                            //Self.focus();
                        }
                        Base.Timer.sleep(800).then(()=> Self.data('isReject', 'N') );
                        if (Base.isFunction(resolve)) resolve();
                    }); 
                }                
            });
        }
        updateValue(val = '') {
            if (this._input && typeof val == 'string') this._input.value = val;
            if (this._iMask) this._iMask.updateValue();
        }
    }
    // //////////////////////////////////////////////////////////////////////////////// CalendarMaskControl End.

    class CalendarMonthControl extends Control.Ui.UiControlBase {
        constructor(container, attributes, options) {
            if (!container || !container.hasClass('type-calendar') || !container.attr('calendar-format')) {
                throw new Error('CalendarMonthControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
            super();
            this._container = container.parent();
            this._attributes= attributes;
            this._options   = options;
            this._selector  = options['monthSelector']||'';
            this._callback  = undefined;
            if (this._selector && this.find(this._selector)) {
                this._isEnabled = true;
                this._elements  = {
                    start   : {
                        input : this.find(`${this._options.calendarSelector}[calendar-flag="1"] input[type="text"]`),
                        year  : this.find(`.parts-sel-period__start${this._options.monthSelector} select[calendar-role="year"]`),
                        month : this.find(`.parts-sel-period__start${this._options.monthSelector} select[calendar-role="month"]`),
                    },
                    end     : {
                        input : this.find(`${this._options.calendarSelector}[calendar-flag="2"] input[type="text"]`),
                        year  : this.find(`.parts-sel-period__end${this._options.monthSelector} select[calendar-role="year"]`),
                        month : this.find(`.parts-sel-period__end${this._options.monthSelector} select[calendar-role="month"]`),
                    }
                };
                if (this._elements.start.input.attr('target-name') && this._elements.start.input.attr('target-format')) {
                    this._elements.start.target = this.find(`[name="${this._elements.start.input.attr('target-name')}"]`);
                    this._elements.start.format = this._elements.start.input.attr('target-format');
                }
                if (this._elements.end.input.attr('target-name') && this._elements.end.input.attr('target-format')) {
                    this._elements.end.target = this.find(`[name="${this._elements.end.input.attr('target-name')}"]`);
                    this._elements.end.format = this._elements.end.input.attr('target-format');
                }
                this._format = this._attributes.format.value;
                this._now    = (new Date());
                this._dates  = {
                    start: (new Date(this._now.getFullYear(),this._now.getMonth(),this._now.getDate(), 0, 0, 0)),
                    end  : (new Date(this._now.getFullYear(),this._now.getMonth(),this._now.getDate(),23,59,59)),
                    min  : (this._attributes.minDate?.value?.toDate() || this._now.addYear(Control.Calendar.configuration.min_year)),
                    max  : (this._attributes.maxDate?.value?.toDate() || this._now.addYear(Control.Calendar.configuration.max_year)),
                    big  : function(){ return this.start.getTime() > this.end.getTime() ? this.start : this.end },
                    small: function(){ return this.start.getTime() > this.end.getTime() ? this.end : this.start },
                }; 
            } else {
                this._isEnabled = false;
            }
        }
        async create(){
            const This = this;
            const Attr = This._attributes;
            const Elem = This._elements;
            return Base.Core.pf(function(resolve, reject) {
                if (This._isEnabled) {
                    Base.tracking('CalendarMonthControl.create()', This, Attr);
                    This.setYearOptions('start');
                    This.setYearOptions('end');
                    Utils.Ui.createComboOptions(0, 11, 1, 2, 1).build(Elem.start.month);
                    Utils.Ui.createComboOptions(0, 11, 1, 2, 1).build(Elem.end.month);

                    // Event bind.
                    Elem.start.year.bind('change', (e)=>This.changeValue(e));
                    Elem.start.month.bind('change', (e)=>This.changeValue(e));
                    Elem.end.year.bind('change', (e)=>This.changeValue(e));
                    Elem.end.month.bind('change', (e)=>This.changeValue(e));

                    // Value set..
                    Elem.start.month.val(This._dates.start.getMonth());
                    Elem.end.month.val(This._dates.end.getMonth());
                }
                if (Base.isFunction(resolve)) This._callback = resolve;
            })
        }
        setYearOptions(flag) {
            let elem= this._elements[flag];
            let date= this._dates[flag];
            let minY= date.getFullYear()-5;
            let maxY= date.getFullYear()+5;
            if (this._dates.min.getFullYear() > minY) minY = this._dates.min.getFullYear();
            if (this._dates.max.getFullYear() < maxY) maxY = this._dates.max.getFullYear();
            Utils.Ui.createComboOptions(maxY, minY, -1).build(elem.year);
            elem.year.val(date.getFullYear());
        }
        changeValue(e) {
            Base.tracking('CalendarMonthControl.changeValue()', this, e);
            e?.preventDefault();
            const This = this;
            const Elem = This._elements;
            const sDate= (new Date(+Elem.start.year.val(), +Elem.start.month.val()+1, 1));
            const eDate= (new Date(+Elem.end.year.val(), +Elem.end.month.val()+1, 1, 23, 59, 59)).addDay(-1);

            Elem.start.input?.val(sDate.format(This._format));            
            Elem.end.input?.val(sDate.format(This._format));
            if (Elem.start.target) Elem.start.target.val(sDate.format(Elem.start.format||This._format));
            if (Elem.start.end) Elem.start.end.val(sDate.format(Elem.end.format||This._format));

            if (Base.isFunction(This._callback)) This._callback([sDate, eDate]);
            This.updateValue([sDate, eDate]);
        }
        updateValue(dates) {
            const This = this;
            const Elem = This._elements;
            if (This._isEnabled && Array.isArray(dates) && dates.length == 2) {
                Base.tracking('CalendarMonthControl.updateValue()', This, dates);
                This._dates.start = dates[0];
                This._dates.end = dates[1];
                This.setYearOptions('start');
                This.setYearOptions('end');
                Elem.start.month.val(This._dates.start.getMonth());
                Elem.end.month.val(This._dates.end.getMonth());
            }
        }
    }
    // //////////////////////////////////////////////////////////////////////////////// CalendarMonthControl End.


    const ctrl = Base.Control.Ui.CalendarControl;
    Base.extends(Base.Control.Ui.CalendarControl, {
        CalendarOptions: CalendarControlOptions,
        init : function(parent, options = {}) {
            if (!parent || !parent['rootClassPath']) {
                throw new Error('CalendarControl을 초기화 할 수 없습니다.');
            }
            const This = this;
            This.CalendarOptions.Parent = parent;
            This.CalendarOptions[parent.rootClassPath] = Base.extends(options, this.CalendarOptions[parent.rootClassPath]);
            This.CalendarOptions.getType = function() {
                return This.CalendarOptions[This.CalendarOptions.Parent.rootClassPath];
            };
            return This;
        },
        initUI : function(container, options = {}, callback = undefined) {
            if (!container) {
                throw new Error('CalendarControl을 사용하는 주체가 없습니다.');
            }
            const This = this;
            const That = Base(container);
            const calendarOptions= This.CalendarOptions.getType();

            // Find Calendar UI.
            if (calendarOptions['calendarSelector']) {
                let elements = That.findAll(calendarOptions.calendarSelector);
                if (elements && elements.length) {
                    elements.forEach((el) => This.calendarBinder(el));
                    if (Base.isFunction(callback)) {
                        CalendarControlOptions.callback = callback;
                    }
                }
            }
        },
        calendarBinder : function(container, options = {}) {
            if (!container) {
                throw new Error('container가 없습니다.');
            }
            const calendarOptions= this.CalendarOptions.getType();

            const This = this;
            const That = Base(container);
            const opts = Base.extends({format:'yyyyMMdd'}, options);
            if((That.attr('calendar-enabled')||'') == 'enabled') {
                return;
            }
            const Attr = Base.Utils.clone(calendarOptions.attributes);
            Object.entries(Attr).forEach(([n,o])=>{ o.value=That.attr(o.name)||opts[n]||'' });

            const calendarFormat = Attr.format.value||Control.Calendar.configuration.format;
            const calendarWapper = That.parent();
            const rangeContainer = calendarOptions.rangeContainer&& That.parent(calendarOptions.rangeContainer);
            if (!calendarWapper.attr('calendar-container')) {
                let oCalendar = calendarWapper.find(calendarOptions.calendarSelector);
                if (oCalendar && oCalendar instanceof NodeList) {
                    Attr.calendarType.value = (calendarOptions['isMobile']===true?'single':(Attr.calendarType.value||'multi'));
                    calendarWapper.attr('calendar-container', Attr.calendarType.value); // multi
                    oCalendar.forEach((elm, idx) => {                 
                        let obj = Base(elm);
                            obj.attr('calendar-flag', idx+1);
                        Object.entries(Attr).forEach(([_,o])=>{
                            !obj.attr(o.name) && o.value && obj.attr(o.name, o.value);
                        }); 
                    });
                } else {
                    calendarWapper.attr('calendar-container', 'single');
                    Object.entries(Attr).forEach(([_,o])=>{
                        !oCalendar.attr(o.name) && o.value && oCalendar.attr(o.name, o.value);
                    });
                }
            }

            const calendarHandler = {};
            // 년,월 Select Control 설정
            calendarHandler.monthComboBox = new CalendarMonthControl(That, Attr, calendarOptions);
            calendarHandler.monthComboBox.create().then((dates)=> {
                calendarHandler.rangeButton?.updateValue(dates);
                calendarHandler.calendarMask?.updateValue(dates);
            });

            // 달력 직접 입력 Mask 설정
            calendarHandler.calendarMask = new CalendarMaskControl(That, Attr, calendarOptions);
            calendarHandler.calendarMask.create({'callback':(dates)=> {
                calendarHandler.rangeButton?.updateValue(dates);
                calendarHandler.monthComboBox?.updateValue(dates);
            }});

            // 기간 범위 선택 버튼 설정.
            if (rangeContainer && rangeContainer != null && rangeContainer.find(calendarOptions.rangeButton)) {
                let calendarConfirmCallback = opts['callback']||undefined;
                let oRangeButton = rangeContainer.find(calendarOptions.rangeButton);
                calendarHandler.rangeButton = This.rangeButtonBinder(rangeContainer, oRangeButton, function(dates) {
                    calendarHandler.monthComboBox?.updateValue(dates);
                    calendarHandler.calendarMask?.updateValue(dates);
                });
                opts['callback']= function(result) {
                    if (calendarHandler.rangeButton) calendarHandler.rangeButton?.updateValue(result);
                    if (calendarConfirmCallback) calendarConfirmCallback(result);
                };
            }
            if (Attr.calendarMode.value !== 'custom') {
                // Calendar Open event bind.
                That.find(calendarOptions.calendarButton)?.bind('click', function(e) {
                    let Self = this; Self.disabled = true;
                    This.createCalendar(e.target, opts).then(function() {
                        Base.Timer.sleep(500).then(()=>{ Self.disabled = false; });
                    });
                });
            }
            if (That.find('input[type="text"]') && That.find('input[type="text"]').attr('target-name')) {
                let currentValue= That.find('input[type="text"]').val();
                let otherFormat = That.find('input[type="text"]').attr('target-format')||calendarFormat;
                let otherObject = That.find(`[name="${That.find('input[type="text"]').attr('target-name')}"]`);
                if (otherObject && otherFormat && currentValue && currentValue.toDate() != null && !otherObject.val()) {
                    otherObject.val(currentValue.toDate().format(otherFormat));
                }
            }
            That.attr('calendar-enabled', 'enabled');
        },
        rangeButtonBinder : function(container, rangeButton, onUpdateCallback) {
            if (!container || !rangeButton) {
                throw new Error('container가 없습니다.');
            }
            const This = this;
            const calendarOptions= This.CalendarOptions.getType();
            const buttonType = rangeButton.attr('code-button-type')||'calendarRange';
            const targetStdNm= rangeButton.attr('target-start')||'';
            const targetEndNm= rangeButton.attr('target-end')||'';
            if (targetStdNm && container.find(`[name="${targetStdNm}"]`)
             && targetEndNm && container.find(`[name="${targetEndNm}"]`)
             ) {
                container.find('.select-btns__item')?.bind('click', function(e) {
                    let That = Base(this);
                    let Self = That.parent(calendarOptions.rangeButton);
                    let Cont = That.parent(calendarOptions.rangeContainer);
                    let dateSelect= That.data('value');
                    let oTargetStd= Cont.find(`[name="${Self.attr('target-start')}"]`);
                    let oTargetEnd= Cont.find(`[name="${Self.attr('target-end')}"]`);
                    let oCalendar = Cont.find(calendarOptions.calendarSelector);
                    let oSelector = Cont.find(calendarOptions.monthSelector);
                    let dateFormat= (oCalendar && oCalendar['length'] ? oCalendar[0] : oCalendar).attr('calendar-format')||'yyyyMMdd';
                    // Base.tracking(`${This.classPath}.rangeButtonBinder()`, Self, That, oTargetStd, oTargetEnd);
                    if (dateSelect && oTargetStd && oTargetEnd) {
                        let fix  = dateSelect.split(',')[0];
                        let now  = (new Date());
                        let dates= {
                            std  : (new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)),
                            end  : (new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)),
                            big  : function(){ return this.std.getTime() > this.end.getTime() ? this.std : this.end },
                            small: function(){ return this.std.getTime() > this.end.getTime() ? this.end : this.std },
                        };
                        if (buttonType == 'calendarMode' && oSelector && fix.length == 1 && 'M,D,W'.split(',').includes(fix)) {
                            // 일,주,월 통계형 딜력 선택 버튼.
                            let range =dateSelect.split(',')[1];
                            if (range) oCalendar.attr('calendar-dateRange', range);
                            oSelector?.hide();
                            if (fix == 'D') {
                                oCalendar?.show()?.attr('calendar-mode', 'day');
                                if (That.data('sdt') && That.data('edt')) {
                                    dates.std = That.data('sdt').toDate();
                                    dates.end = That.data('edt').toDate();
                                } else {
                                    dates.std = dates.std.addDay(-1);
                                    dates.end = dates.end.addDay(-7);
                                }
                            }
                            else if (fix == 'W') {
                                oCalendar?.show()?.attr('calendar-mode', 'week');
                                if (That.data('sdt') && That.data('edt')) {
                                    dates.std = That.data('sdt').toDate();
                                    dates.end = That.data('edt').toDate();
                                } else {
                                    dates.std = dates.std.addDay(-dates.std.getDay()-6);
                                    dates.end = dates.std.addDay(+6);
                                }
                            } 
                            else if (fix == 'M') {
                                /** 년,월 SelectBox */
                                oCalendar?.hide()?.attr('calendar-mode', 'month');
                                oSelector?.show();
                            }
                        } else {
                            // 시작일, 종료일 기간 설정.
                            let range = dateSelect.toLowerCase();
                            if (range == 'max') {
                                dates.end = '2999-12-31 23:59:59'.toDate();
                            } else {
                                if (range.indexOf('week') > -1) {
                                    if (range.substring(0, 1) === '-') {
                                        dates.std = dates.std.addDay(-6);
                                    } else {
                                        dates.end = dates.end.addDay(6);
                                    }
                                } else {
                                    if (range.substring(0, 1) === '-') {
                                        dates.std = dateSelect.toDate();
                                    } else {
                                        dates.end = dateSelect.toDate();
                                    }
                                }
                                dates.end = dates.end.addHours(23).addMinutes(59).addSeconds(59);
                            }
                        }
                        oTargetStd.val(dates.small().format(dateFormat));
                        oTargetEnd.val(dates.big().format(dateFormat));
                        if (oTargetStd.attr('target-name') && oTargetStd.attr('target-format')) {
                            Cont.find(`[name="${oTargetStd.attr('target-name')}"]`)?.val(dates.small().format(oTargetStd.attr('target-format')||dateFormat));
                        }
                        if (oTargetEnd.attr('target-name') && oTargetEnd.attr('target-format')) {
                            Cont.find(`[name="${oTargetEnd.attr('target-name')}"]`)?.val(dates.big().format(oTargetEnd.attr('target-format')||dateFormat));
                        }
                        if (Base.isFunction(onUpdateCallback)) onUpdateCallback([dates.small(), dates.big()]);
                    }
                });
                return {
                    updateValue : function(dates) {
                        if (rangeButton.find('button.active') && dates && dates.length == 2) {
                            rangeButton.find('button.active').data('sdt', dates[0]);
                            rangeButton.find('button.active').data('edt', dates[1]||'');
                            if (rangeButton.attr('code-button-type') != 'calendarMode') {
                                rangeButton.find('button.active').removeClass('active');
                                rangeButton.find('input[type="hidden"]').val('');
                            }
                        }
                    }
                };              
            }
        },
		createCalendar : function(caller, options) {
            if (!this.CalendarOptions || !this.CalendarOptions['Parent'] || !this.CalendarOptions['Parent'] instanceof Control.ControlBase) {
                throw new Error('CalendarControl을 사용하는 주체가 없습니다.');
            }
            const That = Base(caller);
            const Parent = this.CalendarOptions.Parent;
            const calendarWapper = That.closest('[calendar-container]');
            if (!calendarWapper || !calendarWapper.find('.type-calendar')) {
                throw new Error('CalendarControl을 적용하기 위한 대상 객체가 없습니다.');
            }
            const calendarContainer = Base(caller.closest('.type-calendar'));
            // single or multi
            const calendarType   = this.CalendarOptions.getType();
            const calendarContext= {
                caller  : That, 
                wapper  : calendarWapper,
                type    : calendarType[calendarWapper.attr('calendar-container')]||(calendarType['isMobile']?'single':'multi'),
                isMobile:(calendarType['isMobile'] === true),
                isTargetOpen: true,
            };
            const calendarOptions= Base.extends(Base.Utils.clone(Control.Calendar.options), options, {
                flag        : calendarContainer.attr('calendar-flag')||'1',
                target      :[calendarContainer.find('input[type="text"]')],
                calendarMode: calendarContainer.attr('calendar-mode')||'day', // day, week
                format      : calendarContainer.attr('calendar-format')||calendarWapper.attr('calendar-format')||options['format'],
                defaultDate : calendarContainer.attr('calendar-defaultDate')||options['defaultDate'],
                dateRange   : calendarContainer.attr('calendar-dateRange')||options['dateRange'],
                weekFixDay  : calendarContainer.attr('calendar-weekFixDay')||options['weekFixDay'],
            });
            // Calendar Mode Setting.
            if (calendarOptions.calendarMode != 'day') {
                calendarOptions.isUseToday = false;
            }
            // Multi Month Calendar Setting.
            if (calendarWapper.findAll('.type-calendar[calendar-flag]').length > 1) {
                Base.extends(calendarOptions, {
                    target  : [
                        calendarWapper.find('.type-calendar[calendar-flag="1"]')?.find('input[type="text"]'),
                        calendarWapper.find('.type-calendar[calendar-flag="2"]')?.find('input[type="text"]')
                    ],
                    calendarType: calendarContainer.attr('calendar-type')||options['calendarType']||(calendarType['isMobile']?'single':'multi'),
                    isUseRange  : true,
                });
            }
            // Check of value target and Another value target.
            if (calendarOptions.target && Array.isArray(calendarOptions.target)) {
                calendarOptions.target.forEach((obj, idx)=> {
                    if (!obj || !(obj instanceof HTMLElement)) {
                        throw new Error('Calendar 선택 값을 적용하기 위한 대상이 정상적인 HTML Element가 아닙니다.');        
                    }
                    if (obj.attr('target-name') && calendarWapper.find(`[name="${obj.attr('target-name')}"]`)) {
                        let name = obj.attr('name')||'obj_'+String(idx);
                        if (name !=obj.attr('name')) {
                            obj.attr('name', name);
                        }
                        /** If you want to apply the selected value of the calendar to another target */
                        calendarOptions.valueTarget[name] = {
                            targetName  : obj.attr('target-name'),
                            targetFormat: obj.attr('target-format')||calendarOptions.format,
                            targetObject: calendarWapper.find(`[name="${obj.attr('target-name')}"]`)
                        }
                    }
                });
            } else {
                throw new Error('Calendar 선택 값을 적용하기 위한 대상이 없습니다.');
            }
            // Calendar min,max date setting.
            if (calendarContainer.attr('calendar-min') && calendarContainer.attr('calendar-min').toDate() != null) {
                calendarOptions.minDate = calendarContainer.attr('calendar-min').toDate();
            }
            if (calendarContainer.attr('calendar-max') && calendarContainer.attr('calendar-max').toDate() != null) {
                calendarOptions.maxDate = calendarContainer.attr('calendar-max').toDate();
            }            
            // Calendar message setting.
            if (calendarContainer.attr('calendar-checkStartDateMsg')) { // 시작일 선택시
                calendarOptions.message['checkStartDate'] = calendarContainer.attr('calendar-checkStartDateMsg');
            }
            if (calendarContainer.attr('calendar-checkEndDateMsg')) {   // 종료일 선택시
                calendarOptions.message['checkEndDate'] = calendarContainer.attr('calendar-checkEndDateMsg');
            }
            if (calendarContainer.attr('calendar-checkDateRangeMsg')) { // 선택가능 범위 초과시
                calendarOptions.message['checkDateRange'] = calendarContainer.attr('calendar-checkDateRangeMsg');
            }
            return Base.Core.module(Parent, new CalendarControlBase(Parent), ctrl.className)
                .init(Parent.getContainer())
                .create(calendarContext, calendarOptions)
                .then(function(context) {
                    if (Base.isFunction(CalendarControlOptions.callback)) CalendarControlOptions.callback(context.container);
                });
		},
        create : function(caller, options) {
            return this.openCalendar(caller, options);
        },
        openCalendar : function(caller, options) {
            if (!this.CalendarOptions || !this.CalendarOptions['Parent'] || !this.CalendarOptions['Parent'] instanceof Control.ControlBase) {
                throw new Error('CalendarControl을 사용하는 주체가 없습니다.');
            }
            if (!caller || !caller instanceof Element) {
                throw new Error('CalendarControl을 사용하는 주체가 없습니다.');
            }
            const Parent = this.CalendarOptions.Parent;
            const calendarOptions= Base.extends(Base.Utils.clone(Control.Calendar.options), options);
            if (calendarOptions['dateRange']) {
                calendarOptions.isUseRange  = true;
                calendarOptions.isUseEndday = false;
            }
            if (calendarOptions['calendarMode'] !== 'day') {
                calendarOptions.isUseToday = false;
            }
            if (calendarOptions['minDate'] && String(calendarOptions['minDate']).toDate() != null) {
                calendarOptions.minDate = String(calendarOptions['minDate']).toDate();
            }
            if (calendarOptions['maxDate'] && String(calendarOptions['maxDate']).toDate() != null) {
                calendarOptions.maxDate = String(calendarOptions['maxDate']).toDate();
            }
            if(!CalendarControlOptions[Parent.rootClassPath][calendarOptions['calendarType']]) {
                throw new Error('사용할수 없는 Calendar Type 입니다.');
            }
            const calendarType   = this.CalendarOptions.getType()[calendarOptions['calendarType']];
            const calendarContext= {
                caller  : caller, 
                wapper  : Parent.getContainer(),
                type    : calendarType,
                isTargetOpen:(caller ? true : false)
            };

            return Base.Core.module(Parent, new CalendarControlBase(Parent), ctrl.className)
                .init(calendarContext.wapper)
                .create(calendarContext, calendarOptions)
                .then(function(context) {
                    if (Base.isFunction(CalendarControlOptions.callback)) CalendarControlOptions.callback(context.container);
                });
        },
	});

}) (window, __DOMAIN_NAME||'');