/* common.base.dom.js
 - common DOM Element helper.
*/
(function($w, root) {
    'use strict';

    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const $doc = $w.document;
    const Root = root||'';
    const Base = $w[Root];
    const DomHelper = function(...args) {
        if (!args.length) return undefined;
        if (args[0] instanceof Element) {
            return Selecter.extends(args[0]);
        } else if (args[0] instanceof UIEvent && args[0]['target']) {
            return Selecter.extends(args[0]['target']);
        } else if (args[0] instanceof Object) {
            return args[0];
        }
        return Selecter.find.apply(Base, args);
    };

    class Selecter {
        constructor(...args) {
            return Selecter.find.apply(Selecter, args);
        }
        static find(...args) {
            return Selecter.extends($doc.querySelectorAll(args));
        }
        static extends(obj, isAll = false) {
            if(!obj) return undefined;
            if (obj instanceof NodeList) {
                obj.forEach((o)=> Selecter.extends(o));
                if (isAll == false) {
                    if (obj.length == 1) obj = obj[0];
                    else if (obj.length == 0) obj = undefined;
                }
            } else if (obj instanceof Element) {
                obj = Base.extends(obj, ElementHelper);
                obj = Selecter.extendsAsType(obj);
            } else {
                obj = undefined;
            }
            return obj;
        }
        static extendsAsType(obj) {
            const tag = String(obj['tagName']).toUpperCase();
            return (ElementTypeHelper[tag]) ? Base.extends(obj, ElementTypeHelper[tag]) : obj;
        }
    }

    const ElementHelper = {
        parent  : function(tag = '') {
            return Selecter.extends(tag ? this.closest(tag) : this.parentElement);
        },
        find    : function(...arg) {
            if(!arg) return undefined;
            return Selecter.extends(this.querySelectorAll(arg));
        },
        findAll : function(...arg) {
            if(!arg) return [];
            return Selecter.extends(this.querySelectorAll(arg), true)||[];
        },
        attr : function(attr = '', val) {
            if (val !== undefined) {
                if (this[attr] === undefined) {
                    this.setAttribute(attr, val);
                } else {
                    if (typeof this[attr] == 'function') this[attr](val);
                    else this[attr] = val;
                }
                return this;
            } else {
                if (typeof this[attr] == 'function') {
                    return (this[attr]()||'');
                } else {
                    if (this[attr] === undefined) {
                        return (this.getAttribute(attr)||'');
                    } else {
                        return (this[attr]||'');
                    }
                }
            }
        },
        appendText : function(txt = '') {
            return this.attr('innerText', this.innerText + txt);
        },
        appendHtml : function(htm = '') {
            return this.attr('innerHTML', this.innerHTML + htm);
        },
        prependText : function(txt = '') {
            return this.attr('innerText', txt + this.innerText);
        },
        prependHtml : function(htm = '') {
            return this.attr('innerHTML', htm + this.innerHTML);
        },
        text_    : function(txt = undefined) {
            return this.attr('innerText', txt);
        },
        html_    : function(htm = undefined) {
            return this.attr('innerHTML', htm);
        },
        outerHtml_: function() {
            return this.attr('outerHTML');
        },
        empty   : function() {
            if (this.children) {
                for (let i = this.children.length-1; i >= 0 ; i--) {
                    this.children[i].remove();
                }
            }
            this.innerText = '';
            return this;
        },
        val     : function(val = undefined) {
            let inputTag = 'INPUT,SELECT,TEXTAREA';
            return this.attr((inputTag.indexOf(this.tagName) >= 0) ? 'value' : 'innerText', val);
        }, 
        display : function() {
            return (this['style'] ? this['style']['display'] : '');
        },
        show    : function() {
            if (this['style']) {
                this['style']['display'] = '';
                if ($w.getComputedStyle(this).display == '') {
                    this['style']['display'] = 'block';
                }
            }
            return this;
        },
        hide    : function() {
            if (this['style']) this['style']['display'] = 'none';
            return this;
        },
        hasClass: function(className) {
            if (className && this['classList']) return this['classList'].contains(className);
            return false;
        },
        getClass: function() {
            return this['classList'];
        },
        addClass: function(className) {
            this['classList']?.add(className);
            return this;
        },
        removeClass: function(className) {
            this['classList']?.remove(className);
            return this;
        },
        data : function(name, val) {
            const _dataset = this?.dataset;
            if (name && _dataset) {
                if (val && String(val).trim() != '') {
                    return _dataset[name] = String(val).trim();
                } else {
                    return _dataset[name];
                }
            } else {
                return _dataset||'';
            }
        },

        /** Bind is addEventListener : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/addEventListener 
         *  event Type : https://developer.mozilla.org/ko/docs/Web/Events
        */
        bind    : function(type, listener, options = {}, useCapture = false) {
            if (!type || !listener) return this;
            let That = this;
            That.unbind(type, listener)
                .addEventListener(type, listener, 
                    Base.extends({capture:useCapture, once:false, passive:false, signal:undefined}, options), useCapture);
            return That;
        },
        /** Unbind is removeEventListener : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/removeEventListener */
        unbind  : function(type, listener = undefined, options = {}, useCapture = false) {
            if (!type) return this;
            let That = this;
            That.removeEventListener(type, function(e) {
                if (listener) listener.call(That, e);
            }, Base.extends({capture:useCapture}, options), useCapture);
            return That;
        },
        /** Trigger is dispatchEvent : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/dispatchEvent */
        trigger : function(type) {
            if (!type) return this;
            return this[type||'']?.();
        },
        fadein: function() { 
            let oStyle = this.style; oStyle.opacity = 0; 
			function frame() { 
                oStyle.opacity = +oStyle.opacity + .01, 1 > +oStyle.opacity && ($w.requestAnimationFrame && $w.requestAnimationFrame(frame) || $w.setTimeout(frame, 16));
            }; frame();
		}, 
		fadeout: function() { 
			let oStyle = this.style; oStyle.opacity = 1; 
			function frame() {  
                oStyle.opacity = +oStyle.opacity - .01, +oStyle.opacity > 0 && ($w.requestAnimationFrame && $w.requestAnimationFrame(frame) || $w.setTimeout(frame, 16));
            }; frame(); 
		}, 
    };
    
    const ElementTypeHelper = {
        FORM : {            
            serialize : function() {
                return Array.from(new FormData(this), (e) => e.map(encodeURIComponent).join('=')).join('&');
            },
            serializeMap : function() {
                return Object.assign(...Array.from((new FormData(this)).entries(), ([x,y]) => ({[x]:y})));
            },
            /** Selector that separates a list  */
            serializeList: function(listSelector) {
                if (listSelector && typeof listSelector == 'string' 
                && this.querySelectorAll(listSelector).length > 0) {
                    const oForms = this.querySelectorAll(listSelector);
                    const oLists = [];
                    oForms.forEach(function(form){
                        let item = {};
                        form.querySelectorAll('[name]').forEach(function(elm) {
                            item[elm.name] = String(elm.value||'').encode();
                        });
                        oLists.push(item);
                    });
                    return oLists;
                } else {
                    return undefined;
                }
            },
            bindData : function(oData) {
                if(!oData) return;
                if (oData instanceof Object) {
                    Object.keys(oData).forEach((name) => {
                        if (oData.hasOwnProperty(name)) {
                            this.find(`[name="${name}"]`)?.val(oData[name]);
                        }
                    });                    
                }
            },
        },
    };

    if ($w['NodeList']) {
        /** Extends NodeList prototype.. */
        Object.keys(ElementHelper).forEach((key) => {
            NodeList.prototype[key] = function(...args) {
                this.forEach(function(elem) { 
                    if (!elem[key]) Selecter.extends(elem);
                    elem[key].apply(elem, args);
                });
                return this;
            };
        });
        NodeList.prototype.find = function(...arg) {
            if(!arg) return undefined;
            if (this.length > 0) {
                let obj = new Array();
                this.forEach((e) => {
                    e.querySelectorAll(arg)?.forEach(obj.push);
                });
                return Selecter.extends(obj);
            }
            return undefined;
        };
    }
    
    Base.DomHelper = DomHelper;

}) (window, __DOMAIN_NAME||'');