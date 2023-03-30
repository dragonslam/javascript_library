/** common.control.context.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;
    
    class ControlContext {
        constructor(context) {
            if (!context || !context['contextID']) {
                throw new Error('Control의 Context 정보가 없습니다.');
            }
            this.contextID    = context['contextID'];
            this.observer     = undefined;
            this.observerVal  = undefined;
            this.observerVals = undefined;
        }
        addProperty(property, value) {
            if (property && value) this[property] = value;
            return this;
        }
        reset() {
            this.observerVal  = undefined;
            this.observerVals = undefined;
            return this;
        }
    }
    class ControlContextManager {
        constructor(parent) {
            if (!parent instanceof Control.ControlBase) {
                throw new Error('ControlContext을 생성하는데 필요한 상위 Control이 없습니다.');
            }            
            this._isDebug= false;
            this._parent = parent;
            this._key    = 'id';
            this._subKey = '';
            this._applicationMapByKey= {};
            this._applicationContext = {};
        }
        id(obj, clazz) {            
            const parent = clazz || this._parent;
            const prefix = [
                (parent ? parent.classPath : Base.getName(parent)),
                this.keyFilter((obj && obj[this._key] ? (obj[this._key]||'') : '')),
                this.keyFilter((obj && obj[this._subKey] ? (obj[this._subKey]||'') : '')),
            ];
            const ctxUUID= prefix.join('#').replaceAll('.', '/');
            return String(Base.Utils.hashing(ctxUUID, Control.HashNumber)).digits(10);
        }
        add(context = {}, clazz) {
            if(!context || !context['id']) {
                throw new Error('Control 고유 ID를 등록해주세요.');
            }
            if (clazz && !clazz instanceof Control.ControlBase) {
                throw new Error('ControlContext을 생성하는데 필요한 상위 Control이 없습니다.');
            }
            let controlClz= clazz||this._parent;
            let contextID = this.id(context, controlClz);
            this._applicationMapByKey[context[this._key]]= context;
            this._applicationContext[contextID] = new ControlContext(Base.extends({}, context, {contextID : contextID}));
            return this.getContextById(contextID);
        }
        get(obj, clazz) {
            if (typeof obj == 'string') {
                return this.getContextById(this.id({id:obj}, clazz));
            } else {
                return this.getContextById(this.id(obj, clazz));
            }
        }
        getContextById(contextID) {
            return this._applicationContext[contextID] || undefined;
        }
        getContextAsMap(mapId) {
            return this._applicationMapByKey[mapId] || undefined;
        }
        deleteContext(obj, clazz) {
            return this.deleteContextById(this.id(obj, clazz));
        }
        deleteContextById(contextID) {
            const This = this;
            const context = this.getContextById(contextID);
            if (context && context.observer) {
                if (context.observer instanceof Array) {
                    context.observer.forEach(element => {
                        This.disconnectObserver(element?.observer);
                    });
                } else {
                    Object.keys(context.observer).forEach(name => {
                        This.disconnectObserver(context.observer[name]?.observer);
                    });
                }
            }
            this._applicationContext[contextID] = undefined;
            delete this._applicationContext[contextID];
            return this;
        }
        disconnectObserver(observer) {
            if(!observer) return;
            if (observer instanceof Array) {
                observer.forEach(observe => {
                    observe.disconnect?.();
                });
            } else {
                observer.disconnect?.();
            }
        }
        keyFilter(key) {
            return key||'';
        }
    }

    Base.Control.Context.ContextBase = ControlContext;
    Base.Control.Context.ManagerBase = ControlContextManager;

}) (window, __DOMAIN_NAME||'');