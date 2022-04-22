/* common.es6.base.dom.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18

    // common DOM Element helper.
 */
 (function($w, root) {
    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const $doc = $w.document;
    const Root = root||'';
    const Base = $w[Root];
    const _Dom = function(...arg) {
        if(!arg.length) return undefined;
        return _dom.apply($w, arg);
    };

    const _dom = function(...arg) {
        return _dom.extends($doc.querySelectorAll(arg));
    };
    _dom.extends = function(obj) {
        if(!obj) return undefined;
        if (obj && obj.length > 0) {
            obj.forEach((o) => Base.extends(o, _dom.ElementHelper));
            if(obj.length == 1) obj = obj[0];
        } else obj = undefined;
        return obj;
    };
    _dom.ElementHelper = {
        Attr : function(attr = '', val) {
            if (val != undefined) {
                if (this[attr]) {
                    if (typeof this[attr] == 'function') this[attr](val);
                    else this[attr] = val;
                }
                return this;
            } else {
                return (typeof this[attr] == 'function') ? (this[attr]()||'') : (this[attr]||'');
            }            
        },        
        AppendText : function(txt = '') {
            return this.Attr('innerText', this.innerText + txt);
        },
        AppendHtml : function(htm = '') {
            return this.Attr('innerHTML', this.innerHTML + htm);
        },
        BeforText : function(txt = '') {
            return this.Attr('innerText', txt + this.innerText);
        },
        BeforHtml : function(htm = '') {
            return this.Attr('innerHTML', htm + this.innerHTML);
        },
        Text    : function(txt = undefined) {
            return this.Attr('innerText', txt);
        },
        Html    : function(htm = undefined) {
            return this.Attr('innerHTML', htm);
        },
        Val     : function(val = undefined) {
            return this.Attr('value', val);
        }, 
        Show    : function() {
            if (this['style']) this['style']['visibility'] = 'visible';
            return this;
        },
        Hide    : function() {
            if (this['style']) this['style']['visibility'] = 'hidden';
            return this;
        },
        Find    : function(...arg) {
            if(!arg) return undefined;
            return __dom.extend(this.querySelectorAll(arg));
        },
        /** addEventListener : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/addEventListener 
         *  event Type : https://developer.mozilla.org/ko/docs/Web/Events
        */
        Bind    : function(type, listener, options = {}, useCapture = false) {
            if (!type || !listener) return this;
            let That = this;
            That.addEventListener(type, function(event) {
                if (listener) listener.apply(That, event);
            }, Base.extends({capture:useCapture, once:false, passive:true, signal:undefined}, options), useCapture);
            return That;
        },
        /** removeEventListener : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/removeEventListener */
        Unbind  : function(type, listener = undefined, options = {}, useCapture = false) {
            if (!type) return this;
            let That = this;
            That.removeEventListener(type, function(event) {
                if (listener) listener.apply(That, event);
            }, Base.extends({capture:useCapture}, options), useCapture);
            return That;
        },
        /** dispatchEvent : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/dispatchEvent */
        Trigger : function(type) {
            if (!type) return this;
            if (this['dispatchEvent']) this.dispatchEvent(type);
            return this;
        },
    };
    
    if ($w['NodeList']) {
        /** Extends NodeList prototype.. */
        Object.keys(_dom.ElementHelper).forEach((key) => {
            NodeList.prototype[key] = function(...args) {
                this.forEach((e) => e[key]?.apply(e, args));
                return this;
            };
        });
        NodeList.prototype.Find = function(...arg) {
            if(!arg) return undefined;
            if (this.length > 0) {
                let obj = new NodeList();
                this.forEach((e) => {
                    e.querySelectorAll(arg)?.forEach(obj.push);
                });
                return _dom.extend(obj);
            }
            return undefined;
        };
    }

    Base['__DomHelper'] = _Dom;

}) (window, __DOMAIN_NAME||'');