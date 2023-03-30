/** common.control.ui.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    const UiTemplateCache = {};

    class UiControlBase extends Control.ControlBase {
        constructor(parent) {
			super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            return this;
        }
        show() {
            Base.logging(this, 'show()');
            this.getContainer()?.show();
            return this;
        }
        hide() {
            Base.logging(this, 'hide()');
            this.getContainer()?.hide();
            return this;
        }        
        find(...args) {
            return this.getContainer()?.find(args);
        }
        getElements(id) {
			return (id ? this._elements[id] : this._elements);
		}
        addStyle(element, css = '') {
            if (!element||!css) return;
            if (typeof css == 'string') (!element.hasClass(css) && element.addClass(css));
            if (Array.isArray(css)) {
                css.forEach((s)=> this.addStyle(element, s));
            }
        }

        async getRemoteTemplate(templatePath) {
            Base.logging(this, `getRemoteTemplate(${templatePath})`);
            const templateId = this.getHashNumber(templatePath.encode());
            return Base.Core.pf(function(resolve, reject) {
                if (UiTemplateCache[templateId]) {
                    if (Base.isFunction(resolve)) resolve(UiTemplateCache[templateId]);
                } else {
                    Base.Fetch.get(templatePath).then(function(result) {
                        let templateHtml =(typeof result == 'object' ? result['data'] : result)||'';
                        if (templateHtml) {
                            UiTemplateCache[templateId] = templateHtml.trimHtml();
                        }
                        if (Base.isFunction(resolve)) resolve(templateHtml);
                    }).catch(function(err) {
                        if (Base.isFunction(reject)) reject(err);
                    });
               }
            });
        }
        async getRemoteTemplates(...templates) {
            Base.logging(this, 'getRemoteTemplates()');
            const This = this;
            const promiseList = [];
            templates.forEach(function(m) {
                promiseList.push(This.getRemoteTemplate(m));	
            });
            return Promise.all(promiseList);            
        }

        setObservers(context, observers, notify, container) {
            if(!context) return;
            if(!context instanceof Control.Context.ContextBase) {
                throw new Error('Not a valid ControlContext Class.');
            }            
            if (!context.observer) context.observer = [];
            const This = this;
            container = container ? container : context.container;
            Object.keys(observers).forEach((name) => { 
                const observeOptions = Base.extends({options:{}}, observers[name], {
                    container: container,
                    type     : name,
                    notify   : notify||function(entity) {}
                });
                context.observer.push(This.setObserver(context, observeOptions));
            });
        }
        setObserver(context, oOptions = {}) {
            if(!context) return;
            if(!context instanceof Control.Context.ContextBase) {
                throw new Error('Not a valid ControlContext Class.');
            }
            if(!oOptions || !oOptions['isUse']) return;
            if(!oOptions['observe'] || !oOptions['options']) {
                throw new Error('Observer configuration options are missing required data.');
            }
            const This  = this;
            const Cont  = oOptions['container']||'';
            const Target= oOptions['target']||'';
            const observeContext = {
                type    : oOptions['type'],
                duration: oOptions['notifyDuration']||10,
                options : oOptions,
                observer: undefined,
                notiTime: undefined,
            };
            if (Cont && Target && Cont?.find(Target)) {
                Base.logging(This, `setObserver(${oOptions['type']}, ${oOptions['target']})`);
                Array.from(Cont.find(Target) instanceof NodeList ? Cont.find(Target) : [Cont.find(Target)]).forEach((e)=>{
                    if (oOptions['type'] == 'mutation') {
                        const mutationAttrName = {
                            INPUT   : 'mutation-input',
                            SELECT  : 'mutation-select',
                        };
                        let tag = e.tagName.toUpperCase();
                        let attr= mutationAttrName[tag];
                        if (attr && oOptions.options['attributes'] == true) {
                                oOptions.options.attributeFilter=[];
                            if (oOptions.options.attributeFilter.indexOf(attr) < 0) {
                                oOptions.options.attributeFilter.push(attr);
                            }
                            Base(e).attr(attr, e.value).bind('focusout', function() {
                                if (Base(this).attr(attr) != this.value) {
                                    Base(this).attr(attr, this.value);
                                }
                            });
                        }
                    }
                    // Create Observer.
                    const observer = oOptions['observe']?.(e, oOptions.options, function(entity) {
                        if (observeContext.notiTime && (observeContext.notiTime + observeContext.duration) > Date.now()) {
                            return;
                        }
                        observeContext.notiTime = Date.now();
                        if (Base.isFunction(oOptions['notify'])) {
                            Base.logging(This, `observe.oOptions.notify()`);
                            oOptions['notify']?.call(This, entity);
                        }
                        This.setObserving(context, observeContext, entity);
                    });
                    if(!observeContext.observer) observeContext.observer = [];
                    observeContext.observer.push(observer);
                });
            }
            return observeContext;
        }
        setObserving(controlContext, observeContext, entity) {
            if(!controlContext || !controlContext instanceof Control.Context.ContextBase) {
                throw new Error('Not a valid ControlContext Class.');
            }
            const This = this;
            const Type = observeContext.type;
            const isPropagation = observeContext.options['isPropagation']||false;
            if (!controlContext.observerVal) controlContext.observerVal ={};
            if (!controlContext.observerVals)controlContext.observerVals=[];

            // Observer history records.
            controlContext.observerVals.push(entity);

            // MutationObserver revision history records.
            if (Type === 'mutation') {
                Array.from(entity).forEach((e) => {
                    let target = e.target;
                    if(!controlContext.observerVal[Type]) {
                        controlContext.observerVal[Type]= {};
                    }
                    if(!controlContext.observerVal[Type][target.tagName]) {
                        controlContext.observerVal[Type][target.tagName] = [];
                    }
                    controlContext.observerVal[Type][target.tagName].push(e);
                });
            }
            
            // Observe result propagation.
            // Base.tracking(`${This.classPath}.setObserving(${Type})`, controlContext, entity);
            // Current UIControl.
            if (Base.isFunction(This['onObserveNotify'])) {
                This['onObserveNotify'].call(This, entity);
            }
            // Context inner control.
            if (controlContext instanceof Control.Context.ContextBase) {
                let propagationTypes = 'pageControl,panelControl,_parent'.split(',');
                let clazzTree = {type:'clazzTree', depth:0, tree:[]};
                let notifyPass= function(parentClazz, deep = 0) {
                    propagationTypes.forEach((name) => {
                        let clazz = parentClazz[name];
                        if (clazz instanceof Base.Core.Clazz || 
                            clazz instanceof Control.ControlBase
                        ) {
                            let path = clazz.classPath;
                            if (path.endWith('.Page')) path = path.replaceAll('.Page', '');
                            //Base.logging(This, `notifyPass.checkr(${deep}, ${path})`);
                            if (clazzTree.tree.indexOf(path) < 0 && deep < 10) {
                                clazzTree.depth++;
                                clazzTree.tree.push(path);
                                //Base.logging(This, `noztifyPass.caller(${deep}, ${path})`);
                                if (Base.isFunction(clazz['onObserveNotify'])) {
                                    clazz['onObserveNotify'].call(clazz, Type, entity);
                                }
                                // Observe propagation.
                                if (isPropagation) notifyPass(clazz, ++deep);
                            }
                        }
                    });
                };
                notifyPass(controlContext);
            }
        }
    }

    const ctrl = Base.Control.Ui;
    Base.extends(Base.Control.Ui, {
        UiTemplate    : UiTemplateCache,
        UiControlBase : UiControlBase,
		createControl : function(clazz) {
            return Base.Core.module(clazz, new UiControlBase(), ctrl.className);
		},
        createElementFromHTML : function(htmlString) {
            let wapper=document.createElement('div');
                wapper.innerHTML = htmlString.trim();
            return Base(wapper.firstChild);
        }
	});

}) (window, __DOMAIN_NAME||'');