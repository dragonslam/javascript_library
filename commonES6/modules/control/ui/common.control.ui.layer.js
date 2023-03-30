/** common.control.ui.layer.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils	= Base.Utils;
    const Control= Base.Control;


    const defaultOption ={
        layerTemplatePath : `${Base.config['template_path']}/layerWapper.html`,
        fullLayerTemplatePath : `${Base.config['template_path']}/fullLayerWapper.html`,
        layerClassName:"",
        contentClassName:"",
        buttonArr: [
            {className:"", text:"취소", type:"close"},
            {className:"", text:"확인", type:"select"}
        ],
        elements    : { 
            wapper  : "[data-selector='layerWapper']",
            header  : "[data-selector='layerHeader']",
            title   : "[data-selector='layerTitle']",
            inner   : "[data-selector='layerInner']",
            button  : "[data-selector='layerButton']",
            buttons : "[data-selector='layerButtons']",
            closeBtn: "[data-selector='layerCloseBtn']",
        },
        layerName: "",
        dimedColorType: "",
        actionUrl: undefined,
        contents: undefined,
        isDimedClick: true,
        isDispLayerClose: true,
        isDispButton: true,
        isScrlLock: true,
        bodyScrlLockTarget: undefined,
        isLoadJS: false,
        isTargetOpen: false,
        layerFnType: undefined,
        target: undefined,
        currentClick: undefined,
        onOpen: undefined,
        onClose: undefined,
        onSelect: undefined,
    };

    class LayerControlBase extends Control.Ui.UiControlBase {
        constructor(parent, option={}) {
            super();
            this._parent = parent;
            this._appl = parent.getParent();
            this._container = undefined;
            this._elements = {};
            this._depth = 0;
            this._count = 0;
            this._defaultOption = option;
        }
        init(container, isMobile = false) {
            if (!container) {
                throw new Error('LayerControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
            this._container = container;
            this._isMobile  = isMobile;
            return this;
        }
        getUniqueName() {
            return (this._parent ? (this._parent['classUUID']||this._parent['classPath']).replaceAll('.','_') : '')
                + '-' + (++this._count).toString(36);
        }
        removeLayer(layerId){
            Base.tracking(`${this.classPath}.removeLayer(${layerId})`, this);
            const This = this;
            if (This._elements[layerId]) {
                const layerHandler  = This._elements[layerId]['layerHandler'];                
                layerHandler.instance.cbFunc = ()=>{
                    This._depth--;
                };
                layerHandler.instance[layerHandler.off]();

                This._elements[layerId].container.remove();
                This._elements[layerId].component = undefined;
                This._elements[layerId] = undefined;
                delete This._elements[layerId];
            }
            if (This['events']) {
                This['events']?.onAfterClose?.call(This);
            }
        }
        createLayer(caller, options = {}){
            Base.tracking(`${this.classPath}.createLayer()`, this, options);
            options = Base.extends({}, this._defaultOption, options);
            options.layerId = this.getUniqueName();

            if(!options['layerFnType']){
                if(this._isMobile){
                    options['layerFnType'] = "full";
                }else if(options['isTargetOpen'] === true){
                    options['layerFnType'] = "posit";
                }else{
                    options['layerFnType'] = "base";
                }
            }else if(!['base','posit','full'].includes(options['layerFnType'])){
                options['layerFnType'] = "base";
            }

            if(!options.templatePath){
                if (options['layerFnType'] == "full") {
                    options.templatePath = options.fullLayerTemplatePath;
                }else{
                    options.templatePath = options.layerTemplatePath;
                }
            }

            if (options['layerFnType'] === "posit" && (!options['currentClick'] || !options['target'])) {
                throw new Error('LayerControl을 선택한 객체 아래에 표시하기 위한 필수 정보가 없습니다. ');
            }
            if (this['events']) {
                this['events']?.onBeforOpen?.call(this);
            }
            if (options['actionUrl']) {
                if (!caller) {
                    throw new Error('LayerControl을 사용하는 주체가 없습니다.');
                }
                return this.createLayerByRemoteContents(caller, options);
            } else {
                return this.createLayerByTextContents(options);
            }
        }

        controlLayerUi(layerEl, options={}){
            const containerInner = layerEl.find(options.elements.inner);
            const rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );
            layerEl.data('layerId', options['layerId']);

            if(options.layerClassName){
                (options.layerClassName.match(rnothtmlwhite)||[]).forEach(classNm=> layerEl.classList.add(classNm));
            }
            if(options.contentClassName){
                (options.contentClassName.match(rnothtmlwhite)||[]).forEach(classNm=> containerInner?.classList.add(classNm));
            }

            if(options.layerName){
                layerEl.find(options.elements.header)?.find(options.elements.title)?.text_(options.layerName);
            }else{
                layerEl.find(options.elements.header)?.remove();
            }

            if(!options.isDispLayerClose){
                layerEl.find(options.elements.closeBtn)?.remove();
            }

            if(!options.isDispButton){
                layerEl.find(options.elements.buttons)?.remove();
            }else{
                const buttonBaseEl = layerEl.querySelector(options.elements.button).cloneNode(true);
                layerEl.find(options.elements.buttons)?.empty();
                options.buttonArr.forEach(button=>{
                    const buttonEl = buttonBaseEl.cloneNode(true);
                    (button.className.match(rnothtmlwhite)||[]).forEach(classNm=> buttonEl.classList.add(classNm));
                    buttonEl.querySelector(".btn-txt").innerText = button.text;
                    buttonEl.dataset.btnType = button.type;
                    layerEl.find(options.elements.buttons)?.append(buttonEl);
                });
            }
            return layerEl;
        }

        async createLayerByRemoteContents(caller, options = {}) {

            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                // import layer template.
                This.getRemoteTemplate(options['templatePath']).then(function(result) {
                    // create layer element.
                    const layerContainer =  This.controlLayerUi(Control.Ui.createElementFromHTML(result), options);

                    // append layer element.
                    This.getContainer().append(layerContainer);

                    // create layer child component.
                    const layerComponent = Base.Control.Component.importComponent(caller).init({
                        container : layerContainer.find(options.elements.inner),
                        actionUrl : options['actionUrl'],
                        isLoadJS  : options['isLoadJS'],
                        id        : options['layerId'],
                        data      : options['data']||{},
                    });
                    // Component initialize context.
                    const layerComponentContext = This._elements[options['layerId']] = {
                        caller   : caller,
                        container: layerContainer,
                        component: layerComponent,
                        instance : undefined,
                        appendType: "prepend",
                        onOpen : options['onOpen'],
                        onClose : options['onClose'],
                        onSelect : options['onSelect'],
                        destroy  : function() {
                            This.removeLayer(options['layerId']);
                        },
                        layerHandler: {
                            instance: Utils.clone(layerPop).init(options['layerId'], {
                                depth:This._depth,
                                scrlLock: options['isScrlLock'],
                                bodyScrlLockTarget: options['bodyScrlLockTarget'],
                                dimedClick: false,
                                dimedColorType: options['dimedColorType'],
                                currentClick: options['currentClick'],
                                target: options['target']
                            }),
                            on : ((layerFnType)=>{
                                switch(layerFnType) {
                                    case 'full': return 'fullOn';
                                    case 'posit': return 'positOn';
                                    default: return 'on';
                                }
                            })(options['layerFnType']),
                            off: ((layerFnType)=>{
                                switch(layerFnType) {
                                    case 'full': return 'fullOff';
                                    case 'posit': return 'positOff';
                                    default: return 'off';
                                }
                            })(options['layerFnType']),
                        }
                    };

                    layerComponent
                        .show(layerComponentContext)
                        .then(function(oComponentContext) {

                            This._appl.initUI(oComponentContext.container);
                            const resultObj = {
                                layerContainer: oComponentContext.container,
                                destroy: oComponentContext.destroy
                            }
                            const _instance = oComponentContext['instance'];
                            layerContainer.find(options.elements.closeBtn)?.bind('click', function(e) {
                                if (Base.isFunction(oComponentContext['onClose'])) {
                                    if (oComponentContext['onClose'](Base.extends({}, resultObj, {event : e}, _instance?.onClose?.call(_instance))) !== false){
                                        oComponentContext.destroy();
                                    }
                                }else{
                                    oComponentContext.destroy();
                                }
                            });
                            layerContainer.find('[data-btn-type="close"]')?.bind('click', function(e) {
                                if (Base.isFunction(oComponentContext['onClose'])) {
                                    if(oComponentContext['onClose'](Base.extends({}, resultObj, {event : e}, _instance?.onClose?.call(_instance))) !== false){
                                        oComponentContext.destroy();
                                    }
                                }else{
                                    oComponentContext.destroy();
                                }
                            });

                            if (Base.isFunction(oComponentContext['onSelect'])) {
                                layerContainer.find('[data-btn-type="select"]')?.bind('click', function(e) {
                                    if(oComponentContext['onSelect'](Base.extends({}, resultObj, {event : e}, _instance?.onSelect?.call(_instance))) !== false){
                                        oComponentContext.destroy();
                                    }
                                });
                            }

                            const layerHandler = oComponentContext['layerHandler'];
                            const layer  = layerHandler.instance;
                            layer.cbFunc = ()=> {
                                This._depth++;
                                if (Base.isFunction(oComponentContext['onOpen'])) {
                                    oComponentContext['onOpen'](Base.extends({}, resultObj, _instance?.onOpen?.call(_instance)));
                                }

                                layer.cbFunc = undefined;
                                if(layer.dimed && options.isDimedClick){
                                    layer.dimed.addEventListener('click', (e) => {
                                        if (Base.isFunction(oComponentContext['onClose'])) {
                                            if(oComponentContext['onClose'](Base.extends({}, resultObj, {event : e}, _instance?.onClose?.call(_instance))) !== false){
                                                oComponentContext.destroy();
                                            }
                                        }else{
                                            oComponentContext.destroy();
                                        }
                                    });
                                }
                                if (Base.isFunction(resolve)) resolve(This._elements[options['layerId']]);
                            };
                            layer[layerHandler.on]();

                        })
                        .catch(function(error) {
                            if (This._isDebug === true) {
                                Base.tracking(`${This.classPath}.Component.Show() => Error : `, error);
                            }
                            if (error.name == 'HttpError' && error.status != 404) {
                                $w.alert(error.errorMessage);
                            }
                            if (Base.isFunction(reject)) reject(This._elements[options['layerId']]);
                        });

                }).catch(function(error) {
                    if (This._isDebug === true) {
                        Base.tracking(`${This.classPath}.createLayer() => Error : `, error);
                    }
                    if (error.alerted !== true) {
                        Base.tracking(`${This.classPath}.createLayer()`, "", error);
                    }
                    if (error.name == 'HttpError' && error.status != 404) {
                        $w.alert(error.errorMessage);
                    }
                    if (Base.isFunction(reject)) reject(This._elements[options['layerId']]);
                });
            });
        }
        async createLayerByTextContents(options = {}) {
            if (!options['contents']) {
                throw new Error('LayerControl을 생성하는데 필요한 Contents 정보가 없습니다.');
            }
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                // import layer template.
                This.getRemoteTemplate(options['templatePath']).then(function(result) {
                    // create layer element.
                    const layerContainer =  This.controlLayerUi(Control.Ui.createElementFromHTML(result), options);

                    // append layer element.
                    This.getContainer().append(layerContainer);

                    // create layer child contents.
                    layerContainer.find(options.elements.inner).prependHtml(options['contents']);

                    // Component initialize context.
                    const oComponentContext = This._elements[options['layerId']] = {
                        caller   : undefined,
                        container: layerContainer,
                        component: undefined,
                        instance : undefined,
                        onOpen : options['onOpen'],
                        onClose : options['onClose'],
                        onSelect : options['onSelect'],
                        destroy  : function() {
                            This.removeLayer(options['layerId']);
                        },
                        layerHandler: {
                            instance: Utils.clone(layerPop).init(options['layerId'], {
                                depth:This._depth,
                                scrlLock: options['isScrlLock'],
                                bodyScrlLockTarget: options['bodyScrlLockTarget'],
                                dimedClick: false,
                                dimedColorType: options['dimedColorType'],
                                currentClick: options['currentClick'],
                                target: options['target']
                            }),
                            on : ((layerFnType)=>{
                                switch(layerFnType) {
                                    case 'full': return 'fullOn';
                                    case 'posit': return 'positOn';
                                    default: return 'on';
                                }
                            })(options['layerFnType']),
                            off: ((layerFnType)=>{
                                switch(layerFnType) {
                                    case 'full': return 'fullOff';
                                    case 'posit': return 'positOff';
                                    default: return 'off';
                                }
                            })(options['layerFnType']),
                        }
                    };
                    This._appl.initUI(oComponentContext.container);
                    const resultObj = {
                        layerContainer: oComponentContext.container,
                        destroy: oComponentContext.destroy
                    }

                    layerContainer.find(options.elements.closeBtn)?.bind('click', function(e) {
                        if (Base.isFunction(oComponentContext['onClose'])) {
                            if(oComponentContext['onClose'](Base.extends({}, resultObj, {event : e})) !== false){
                                oComponentContext.destroy();
                            }
                        }else{
                            oComponentContext.destroy();
                        }
                    });
                    layerContainer.find('[data-btn-type="close"]')?.bind('click', function(e) {
                        if (Base.isFunction(oComponentContext['onClose'])) {
                            if(oComponentContext['onClose'](Base.extends({}, resultObj, {event : e})) !== false){
                                oComponentContext.destroy();
                            }
                        }else{
                            oComponentContext.destroy();
                        }
                    });

                    if (Base.isFunction(oComponentContext['onSelect'])) {
                        layerContainer.find('[data-btn-type="select"]')?.bind('click', function(e) {
                            if(oComponentContext['onSelect'](Base.extends({}, resultObj, {event : e})) !== false){
                                oComponentContext.destroy();
                            }
                        });
                    }

                    const layerHandler  = oComponentContext['layerHandler'];
                    const layer  = layerHandler.instance;
                    layer.cbFunc = ()=> {
                        This._depth++;
                        if (Base.isFunction(oComponentContext['onOpen'])) {
                            oComponentContext['onOpen'](Base.extends({}, resultObj));
                        }
                        layer.cbFunc = undefined;
                        if(layer.dimed && options.isDimedClick){
                            layer.dimed.addEventListener('click', (e) => {
                                if (Base.isFunction(oComponentContext['onClose'])) {
                                    if(oComponentContext['onClose'](Base.extends({}, resultObj, {event : e})) !== false){
                                        oComponentContext.destroy();
                                    }
                                }else{
                                    oComponentContext.destroy();
                                }
                            });
                        }
                        if (Base.isFunction(resolve)) resolve(This._elements[options['layerId']]);
                    };
                    layer[layerHandler.on]();

                }).catch(function(error) {
                    if (error.alerted !== true) {
                        Base.tracking(`${This.classPath}.createLayer()`, "", error);
                    }
                    if (error.name == 'HttpError' && error.status != 404) {
                        $w.alert(error.errorMessage);
                    }
                    if (Base.isFunction(reject)) reject(This._elements[options['layerId']]);
                });
            });
        }

        alert(params, confirmFn){
            const This = this;
            const options= {
                layerClassName: "type-msg",
                isDimedClick: false,
                isDispLayerClose: false,
                layerFnType:'base',
                buttonArr: [
                    {className:"", text:"확인", type:"select"}
                ],
                onSelect: ()=>{typeof confirmFn === 'function' && confirmFn(); }
            };
            if(typeof params === "string"){
                params = params.replace(/(?:\r\n|\r|\n)/g, "<br />");
                options.contents = `<div class="cmn-layer__txt">${params}</div>`;
            }else{
                Base.extends(options, params);
            }
            This.createLayer(null,options);
        }

        confirm(params, cancelFn, confirmFn){
            const This = this;
            const options= {
                layerClassName: "type-msg",
                isDimedClick: false,
                isDispLayerClose: false,
                layerFnType:'base',
                buttonArr: [
                    {className:"c1", text:"취소", type:"close"},
                    {className:"c3", text:"확인", type:"select"}
                ],
                onSelect: ()=>{typeof confirmFn === 'function' && confirmFn(); },
                onClose: ()=>{typeof cancelFn === 'function' && cancelFn(); }
            };
            if(typeof params === "string"){
                params = params.replace(/(?:\r\n|\r|\n)/g, "<br />");
                options.contents = `<div class="cmn-layer__txt">${params}</div>`;
            }else{
                Base.extends(options, params);
            }
            This.createLayer(null,options);
        }

        pAlert(params){
            const This = this;
            return ((params) => {
                return new Promise(resolve => {
                    This.alert(params, resolve);
                });
            })(params);
        }

        pConfirm(params){
            const This = this;
            return ((params) => {
                return new Promise(resolve => {
                    This.confirm(params, ()=>resolve(false), ()=>resolve(true));
                });
            })(params);
        }
    }

    const ctrl = Base.Control.Ui.LayerControl;
    Base.extends(Base.Control.Ui.LayerControl, {
        defaultOption,
        createControl : function(clazz) {
            return Base.Core.module(clazz, new LayerControlBase(clazz, this.defaultOption), ctrl.className);
        },
    });

}) (window, __DOMAIN_NAME||'');