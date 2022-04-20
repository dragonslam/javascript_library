/* common.es6.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/14
    update, 2022/04/18
*/
(function($w, root, configuration = {}) {
    if (!!!$w) return;
    if (!!!$w['console']) {
        $w.logStack	= [];
	    $w.console	= {
            log : (s) => logStack.push('[Log]'+ s),
            dir : (s) => logStack.push('[Dir]'+ s),
            wtf : (s) => logStack.push('[Wtf]'+ s),
        };
    }

    const $win = $w;
    const $doc = $w.document;    
    const Root = (root||'ROOT');
    const Base = $w['$O'] = $w[Root] = ($w[Root]||function() {
        return __dom.apply($w, arguments);
    });

    Base.global= Object.assign({
        js_common_path	: '/js',
        js_path			: '/js',
        image_path		: '/img',
    }, configuration);

    Base.user  = $w['$U'] = ($w['$U']||{uId:'', uNo:Date.now(), uNm:''});
    Base.wtf   = Base.logging = Base.tracking = function(){};

    Base.Browser= function() {
        const n =$w['navigator'],
              a = n['userAgent'].toLowerCase(),
              s = 'MSIE,Beonex,Chimera,Chrome,Firefox,Mozilla,NetPositive,Netscape,Opera,Phoenix,Safari,SkipStone,StarOffice,WebTV';
        let b = '';
        s.split(',').some((v) => {if(a.indexOf(v.toLowerCase()) >= 0){b=v; return true;}} );
        return {            
             navigator: n
            ,agent	  : a
            ,browser  : b
            ,isMsIe   : () => (b === 'MSIE')
            ,isChrome : () => (b === 'Chrome')
            ,isSafari : () => (b === 'Safari')
        };
    };
    Base.Device = function() {
        let n= $w['navigator'],
            p= $w['navigator']['platform' ],
            a= $w['navigator']['userAgent'],
            b= this.Browser();
        return {
             navigator	 : n
            ,platform	 : p
            ,browser     : b
            ,isMobile 	 : () => (/linux armv7/i.test(p) || /ipad/i.test(p) || /iphone/i.test(p))
            ,isAndroid	 : () => (/linux armv7/i.test(p))
            ,isIos		 : () => (/ipad/i.test(p) || /iphone/i.test(p))
            ,isIpad		 : () => (/ipad/i.test(p))
            ,isIphone	 : () => (/iphone/i.test(p))
            ,isGaltab	 : () => (/SHW-M/i.test(a))
            ,isTouchPad	 : () => (/hp-tablet/gi).test(n.appVersion)
            ,isBlackBerry: () => (/BlackBerry/i.test(p))
            ,isTouch	 : () => ('ontouchstart' in $w)
            ,isTablet	 : () => (/SHW-M/i.test(a)||$w.screen.width > 640)
            ,isWide		 : () => ($w.screen.width > $w.screen.height)
            ,isWin		 : () => (/win32/i.test(p) || /windows/i.test(p))
        };
    };

    class Clazz {
        constructor(clazz, source = {}) {
            this.className = clazz;
            this.classPath = clazz;
            this.extends(source);
        }
        extends(source = {}) {
            Object.assign(this, source);
        }
        init() {
            Base.logging(this, 'init()');
            return this;
        }
        getClassPath() {
            if (!this['classPath']) return '';
            let parts = this.classPath.split('.'); 
            if (parts[0]==Root) {
                parts	= parts.slice(1);
            }
            return parts.join('.');
        }
    };
    const _Fix= '__';
    const ClassBuilder = (clazz, source) => new Clazz(clazz, source);

    Base.Core = ClassBuilder('Core', {
        get : function(ns, module = '') {
            if (!ns) return undefined;
            let clazz	= Base,
                parts	= ns.split('.');
            if (parts[0]==Root) {
                parts	= parts.slice(1);
            }
            if (module != '') {
                parts.push(module);
            }
            for (let i = 0; i < parts.length; i++) {
                if (typeof clazz[_Fix+parts[i]] === 'undefined') return undefined;
                clazz=clazz[_Fix+parts[i]];
            }
            return clazz;
        },
        namespace : function(ns) {
            if (!ns) return undefined;
            let clazz	= Base,
                paths	= Root,
                parts	= ns.split('.'),
                isNewbie= false;
            if (parts[0]==Root) {
                parts	= parts.slice(1);
            }
            for (let i = 0; i < parts.length; i++) {
                paths = paths +'.'+ parts[i];
                if (typeof clazz[_Fix+parts[i]] === 'undefined') {
                    isNewbie = true;                    
                    clazz[_Fix+parts[i]] = ClassBuilder('', {
                        className : parts[i],
                        classPath : paths ,
                        classUUID : paths + (Base.user['uNo']?'.'+Base.user['uNo']:'')                        
                    });
                }
                clazz=clazz[_Fix+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        module : function(clazz, source) {
            Base.logging(clazz, 'module()');
            return ClassBuilder('', Object.assign({
                isInit	 	: false,
                isHelper 	: !!Base.global['is_debug'],
                className	: (clazz['className']||Root),
                classPath	: (clazz['classPath']||Root)+'.module',
                classUUID	: (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : '')
            }, source||{}));
        },        
        loader : async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `loader( ${src} )`);

            const xhrLoadingScript = function(src) {
                return new Promise(function(resolve, reject) {
                    let xhr = new XMLHttpRequest();
                        xhr.open('GET', src);
                        xhr.onreadystatechange = function(event) {
                            const { target } = event;
                            if (XMLHttpRequest.DONE === target.readyState) {
                                if (target.status === 0 || (target.status >= 200 && target.status < 400)) { 
                                    eval(target.responseText);
                                    resolve.call(Base, target);      
                                } else { 
                                    reject.call(Base, target);
                                }
                            }
                        };
                        xhr.send();
                });                
            };
            const appendTagScript = function(src) {
                return new Promise(function(resolve, reject) {
                    let s = $doc.createElement('script');
                        s.type= 'text/javascript';
                        s.src = src;
                        s.id  = id;
                        s.onload = function() { resolve.apply(Base, arguments); };
                        s.onerror= function() { reject.call(Base, new Error(`${src} Loadding Error.`)); };
                    $doc.getElementsByTagName('head')[0].appendChild(s);
                });
            };
            const loadScript = function(src) {
                if (Base.Browser().isMsIe() || Base.global['is_debug']) {
                    return appendTagScript(src);
                } else {
                    return xhrLoadingScript(src);
                }     
            };

            let js_path= Base.global['js_path']||'',
                js_src = String('{0}/{1}.js?v={2}').format(js_path, src, (new Date()).format('yyyymmdd') );
            
            return loadScript(js_src);
        },
    });

    if (Base.global['is_debug']) {
        Base.Core.loader('modules/common.es6.base.helper', 'CommonHepler', false)
            .then(
                function() {Base.tracking('CommonHepler Loadding Complate.', arguments, 'Debug enabled.!!')},
                function() {Base.tracking('CommonHepler Loadding Error.', arguments)}
            );
    }

    Base.Util = ClassBuilder('Util');
    Base.Fetch= ClassBuilder('Fetch');

    const __dom = function(...arg) {
        if(!arg) return undefined;
        return __dom.extend($doc.querySelectorAll(arg));
    };
    __dom.extend = function(obj) {
        if(!obj) return undefined;
        if (obj && obj.length > 0) {
            obj.forEach((o) => Object.assign(o, __dom.ElementHelper));
            if(obj.length == 1) obj = obj[0];
        } else obj = undefined;
        return obj;
    };
    __dom.ElementHelper = {
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
            }, Object.assign({capture:useCapture, once:false, passive:true, signal:undefined}, options), useCapture);
            return That;
        },
        /** removeEventListener : https://developer.mozilla.org/ko/docs/Web/API/EventTarget/removeEventListener */
        Unbind  : function(type, listener = undefined, options = {}, useCapture = false) {
            if (!type) return this;
            let That = this;
            That.removeEventListener(type, function(event) {
                if (listener) listener.apply(That, event);
            }, Object.assign({capture:useCapture}, options), useCapture);
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
        Object.keys(__dom.ElementHelper).forEach((key) => {
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
                return __dom.extend(obj);
            }
            return undefined;
        };
    }

}) (window, __DOMAIN_NAME, __DOMAIN_CONF);