/** common.control.component.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Fetch	= Base.Fetch;
    const Control= Base.Control;
    const Components = {};

    class ComponentImportFactory extends Control.ControlBase {
        constructor(parent) {
            super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('Component를 생성하는데 필요한 container element가 없습니다.');
            }
            if (typeof options['isInstance'] == 'boolean' && options['isInstance'] == true) {
                if (!options['scriptUrl']) {
                    throw new Error('Component를 실행하는데 필요한 script url이 없습니다.');
                }                
            } else {
                if (!options['actionUrl']) {
                    throw new Error('Component를 생성하는데 필요한 action url이 없습니다.');
                }
            }
            this._container = options['container'];
            this._actionUrl = options['actionUrl'];
            this._scriptUrl = options['scriptUrl']||'';
            this._isLoadJS  = !!options['isLoadJS'];
            this._id        = options['id'];
            this._data      = options['data']||{};
            this._template  = '';
            this._isInit    = true;
            return this;
        }
        show(oComponentContext) {
            Base.tracking(`${this.classPath}.show()`, this, oComponentContext);
            if (!oComponentContext) {
                throw new Error('Component instance를 실행하는데 필요한 context 정보가 없습니다.');
            }
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                This.getContainer()?.show();

                Base.Fetch.getWithResponse(This._actionUrl,This._data).then(function(result) {

                    This._template = String(result['data']||'').trimHtml();
                    if(oComponentContext['appendType'] == "append"){
                        This.getContainer().appendHtml(This._template);
                    }else if(oComponentContext['appendType'] == "prepend"){
                        This.getContainer().prependHtml(This._template);
                    }else{
                        This.getContainer().html_(This._template);
                    }

                    if (This._isLoadJS) {
                        // Script import.
                        const templatePath = oComponentContext['scriptUrl']||This._scriptUrl||((r)=>r?r.headers.get('Template-Path'):'')(result['response']);
                        Base.Define.invokeOnControl(This._parent['rootClassPath'], templatePath).then(function(oComponentInstance) {
                            Base.tracking(`${This.classPath}.onLoadModule()`, This._id, oComponentInstance);
                            if (oComponentInstance && Base.isFunction(oComponentInstance['init'])) {
                                oComponentContext.caller = This._parent;
                                oComponentContext.instance = oComponentInstance.init(oComponentContext);
                                if(!oComponentContext.instance || !oComponentContext.instance instanceof ComponentBase) {
                                    throw new Error('Component instance는 ComponentBase를 상속받은 객체로만 구현해야 합니다.');
                                }
                                if (Base.isFunction(resolve)) resolve(oComponentContext);
                            }
                        }).catch(function(error) {
                            if (This._isDebug === true) {
                                Base.tracking(`${This.classPath}.Component.show() => Error : `, error);
                            }
                        });
                    } else {
                        if (Base.isFunction(resolve)) resolve(oComponentContext);
                    }
                }).catch(function(error) {
                    if (This._isDebug === true) {
                        Base.tracking(`${This.classPath}.Component.show() => Error : `, error);
                    }
                    if (error.alerted !== true) {
                        Base.tracking(`${This.classPath}.setTemplate()`, "", error);
                    }
                    if (error.name == 'HttpError' && error.status != 404) {
                        $w.alert(error.errorMessage);
                    }
                    if (Base.isFunction(reject)) reject(oComponentContext);
                });
            });
        }
        hide() {
            Base.logging(this, 'hide()');
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                This.getContainer()?.hide();
                if (Base.isFunction(resolve)) resolve();
            });
        }
        find(...args) {
            return this.getContainer()?.find(args);
        }
        findAll(...args) {
            return this.getContainer()?.findAll(args);
        }
        getElements(id) {
			return (id ? this._elements[id] : this._elements);
		}
        execute(oComponentContext) {
            Base.tracking(`${this.classPath}.execute()`, this, oComponentContext);
            if (!oComponentContext || !oComponentContext['scriptUrl']) {
                throw new Error('Component instance를 실행하는데 필요한 context 정보가 없습니다.');
            }
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                This.getContainer()?.show();
                if (This.getContainer().attr('isExecuteInstance') !== 'true') {
                    // Script import.
                    const templatePath = oComponentContext['scriptUrl']||This._scriptUrl
                    Base.Define.invokeOnControl(This._parent['rootClassPath'], templatePath).then(function(oComponentInstance) {                        
                            Base.tracking(`${This.classPath}.onLoadModule()`, This._id, oComponentInstance);
                            This.getContainer().attr('isExecuteInstance', 'true');
                            if (oComponentInstance && Base.isFunction(oComponentInstance['init'])) {
                                oComponentContext.caller = This._parent;
                                oComponentContext.instance = oComponentInstance.init(oComponentContext);
                                if(!oComponentContext.instance || !oComponentContext.instance instanceof ComponentBase) {
                                    throw new Error('Component instance는 ComponentBase를 상속받은 객체로만 구현해야 합니다.');
                                }
                                if (Base.isFunction(resolve)) resolve(oComponentContext);
                            }
                    }).catch(function(error) {
                        if (This._isDebug === true) {
                            Base.tracking(`${This.classPath}.Component.execute() => Error : `, error);
                        }
                        if (error.name == 'HttpError' && error.status != 404) {
                            $w.alert(error.errorMessage);
                        }
                    });
                } else {
                    if (Base.isFunction(resolve)) resolve(oComponentContext);
                }
            });
        }
    }

    class ComponentBase extends Control.ControlBase {
        constructor(parent) {
            super(parent);
        }

        /**
         * Component initialize context.
         * @param {*} context {caller   : The parent object that calls the component,
         *                     container: Component area HTML Element,
         *                     component: ComponentImportFactory class,
         *                     instance : ComponentBase instance,
         *                     callback : A function that returns the result of a component,
         *                     destroy  : A function that terminates the Component object,
         *                  }
         * @returns 
         */
        init(context = {}) {
            Base.logging(this, 'init()');
            if (!context['caller']) {
                throw new Error('Component를 생성하는데 필요한 caller가 없습니다.');
            }
            if (!context['container']) {
                throw new Error('Component를 생성하는데 필요한 container가 없습니다.');
            }
            const This = this;
            This._context   = context;
            This._caller    = context['caller'];
            This._container = context['container'];
            This._callback  = context['callback']||undefined;
            This._destroy   = context['destroy']||undefined;
            This._elements  = {};
            
            Base.Timer.sleep(3).then(()=> This.onLoadComponent() );
            return This;
        }
        find(...args) {
            return this.getContainer()?.find(args);
        }
        findAll(...args) {
            return this.getContainer()?.findAll(args);
        }
        findJQ(...arg) {
            if (!$w['jQuery']) return undefined;
            return $w.jQuery(this.find.apply(this, arg));
        }
        getCaller() {
            return this._caller;
        }
        getContext() {
            return this._context;
        }
		getElements(id) {
			return (id ? this._elements[id] : this._elements);
		}
		setElements() {
			if (arguments.length == 1) {
				this._elements = arguments[0];
			} else {
				if (typeof arguments[0] == 'string') {
					this._elements[arguments[0]] = arguments[1];
				}
			}
			return this;
		}        
        createGrid(options = {}) {
            Base.tracking(`${this.classPath}.createGrid()`, options);
            if (!$w['jQuery'] || !$w['overpass']) {
                throw new Error('There is no required grid generator.');
            }
            const auth =  Fetch.getHeaderData()?.auth;
            if (options instanceof Array) {
                options.forEach((o)=> o.auth=auth);
            } else {
                options.auth = auth;
            }
            return $w.overpass.grid.create(options);
        }
        createEditor(p) {
            Base.tracking(`${this.classPath}.createEditor()`, p);
            return Base.Core.pf(function(resolve) {
                let chkCount = 0;
                let chkEditor= function() {
                    chkCount++;
                    if (chkCount > 10) {
                        throw new Error('There is no required summernote.');
                    }
                    if(!$w['jQuery']['summernote']) {
                        Base.Timer.sleep(1).then(chkEditor);
                    } else {
                        if(!$w['jQuery']['summernote']['dom']) {
                            Base.Timer.sleep(1).then(chkEditor);
                        } else {
                            let map = [];
                            (Array.isArray(p) === true ? p : [p]).forEach(function (v){
                                let editor = Base.Control.Ui.EditorControl.createControl(v);
                                map[editor.getId()] = editor;
                            });
                            resolve(map);
                        }
                    }
                };
                Base.Timer.sleep(3).then(chkEditor);
            });
        }
        onLoadComponent() {
            Base.tracking(`${this.classPath}.onLoadComponent()`, this);
        }
    }

    const ctrl = Base.Control.Component;
    Base.extends(Base.Control.Component, {
        components      : Components,
        importComponent : function(clazz) {
            return Base.Core.module(clazz, new ComponentImportFactory(clazz), ctrl.className);
        },
        importComponentInstance : function(clazz) {
            return Base.Core.module(clazz, new ComponentImportFactory(clazz), ctrl.className);
        },
        createComponent : function(clazz, prototype = {}) {
            return Base.extends(Base.Core.module(clazz, new ComponentBase(clazz), ctrl.className), prototype);
        },
    });

}) (window, __DOMAIN_NAME||'');