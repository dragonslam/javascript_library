/* common.es6.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/14
    update, 2022/04/18
*/
(function($w) {
    if (!!!$w) return;
    if (!!!$w['console']) {
        $w.logStack	= [];
	    $w.console	= {
            log : (s) => logStack.push('[Log]'+ s),
            dir : (s) => logStack.push('[Dir]'+ s),
            wtf : (s) => logStack.push('[Wtf]'+ s),
        };
    }
}) (window);

/**
 * common configuration.
 */
(function($w, root, configuration = {}) {
    if (!!!$w) return;

    const Base = $w['$O'] = $w[root] = ($w[root]||function() {
        return Base['DomHelper'] && Base['DomHelper'].apply($w, arguments);
    });

    Base.global= Object.assign({
        js_common_path	: '/js',
        js_path			: '/js',
        image_path		: '/img',
    }, configuration);

    Base.user  = $w['$U'] = ($w['$U']||{uId:'', uNo:Date.now(), uNm:''});
    Base.wtf   = Base.logging = Base.tracking = function(){};

}) (window, __DOMAIN_NAME||'', __DOMAIN_CONF||{});


/**
 * common fn.
 */
 (function($w, root) {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    Base.getBrowser= function() {
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
    Base.getDevice = function() {
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
    Base.extends = function(...args) {
        return Object.assign.apply($w, args);
    };
    Base.toString = function(arg) {
        return Object.prototype.toString.call(arg);
    };
    Base.isWindow   = function(arg) {
        return arg != null && arg === arg.window;
    };
    Base.isFunction = function(arg) {
        return typeof arg === 'function' && typeof arg.nodeType !== 'number' && typeof arg.item !== 'function';
    };
    Base.isPlainObject = function(arg) {
        if (this.toString(null) === '[object Object]') {
            return arg !== null
				&& arg !== undefined
                && arg.ownerDocument === undefined
				&& this.toString(arg)=== '[object Object]';
        } else {
            return this.toString(arg)=== '[object Object]';
        }
    };
    Base.type = function(value, typeName) {
        const isGet = arguments.length === 1;
        const result= (name) => {return isGet ? name : typeName === name;}

        if (value === null) {
            return result('null');
        }
        if (value && value.nodeType) {
            if (value.nodeType === 1 || value.nodeType === 9) {
                return result('element');
            } else if (value && value.nodeType === 3 && value.nodeName === '#text') {
                return result('textnode');
            }
        }
        if (this.isPlainObject(value)) {
            return result('object');
        }

        const s = this.toString(value),
              t = s.match(/\[object (.*?)\]/)[1].toLowerCase();
        if (t === 'number') {
            if (isNaN(value)) return result('nan');
            if (!isFinite(value)) return result('infinity');
            return result('number');
        }

        return isGet ? t : t === typeName;
    };
}) (window, __DOMAIN_NAME||'');


/**
 * common Core Class 
 * - extend class
 * - extend module 
 * - script import
 */
(function($w, root) {
    if (!!!$w) return;
    if (!!!$w[root]) return;
    if (!!!$w['document']) return;

    const Root = root||'';
    const Base = $w[Root];
    const $doc = $w['document'];
    class Clazz {
        constructor(parent, name, source = {}) {
            this.className = name;
            this.classPath = parent && parent['classPath'] ? parent['classPath']+'.'+name : name;
            Base.extends(this, source);
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
    const ClassBuilder= (parent, name, source) => new Clazz(parent, name, source);

    Base['className'] = Root;
    Base['classPath'] = Root;
    Base.Core = ClassBuilder(Base, 'Core', {
        find : function(ns) {
            if (!ns) return undefined;
            let clazz	= Base,
                parts	= ns.split('.');
            if (parts[0]==Root) {
                parts	= parts.slice(1);
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
                    clazz[_Fix+parts[i]] = ClassBuilder(clazz, parts[i], {
                        classUUID : paths + (Base.user['uNo']?'.'+Base.user['uNo']:'')                        
                    });
                }
                clazz=clazz[_Fix+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        module : function(clazz, source) {
            if (!clazz) return undefined;
            Base.logging(clazz, 'module()');            
            return ClassBuilder(clazz, 'module', Base.extends(source||{}, {
                classUUID : (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : '')
            }));
        },
        page    : function(clazz) {
            return this.module(clazz, Base.Pages);
        }, 
        domEval : function(code, node) {
            let preservedScriptAttributes = {
                    type: true,
                    src: true,
                    nonce: true,
                    noModule: true
                },
			    script = $doc.createElement('script');
                script.text = code;
            if ( node ) {
                for(let attr in preservedScriptAttributes) {
                    let val = node[ attr ] || node.getAttribute && node.getAttribute( attr );
                    if( val ) {
                        script.setAttribute( attr, val );
                    }
                }
            }
            $doc.head.appendChild( script ).parentNode.removeChild( script );
        },
        // Promise Factory
        pf : function(executor) {
            return new Promise(executor);
        },
    });
    Base.Dynamic  = ClassBuilder(Base, 'Dynamic', (function(){
        const _dependency = {
            modules : {
                deffers : 0,
                list: { },
                add : (m) => {
                    let This = _dependency.modules;
                    This.deffers++;
                    This.list[m['name']] = Base.extends(m, {isLoaded:false});
                },
                done : (m) => {
                    let This = _dependency.modules;
                    This.deffers--; 
                    This.list[m['name']].isLoaded = true;
                },
                failed: (m) => {
                    let This = _dependency.modules;
                    This.list[m['name']].isLoaded = false;
                },
                isComplete: ()=> { 
                    return _dependency.modules.deffers==0; 
                }
            },
            scripts : {}
        };
        const loadScript = function(src, id, isAsync) {
            const xhrScriptLoader = function() {
                return Base.Core.pf(function(resolve, reject) {
                    let xhr = new XMLHttpRequest();
                        xhr.open('GET', src);
                        xhr.onreadystatechange = function(event) {
                            const { target } = event;
                            if (XMLHttpRequest.DONE === target.readyState) {
                                if (target.status === 0 || (target.status >= 200 && target.status < 400)) { 
                                    Base.Core.domEval(target.responseText);
                                    resolve.call(Base, target);      
                                } else { 
                                    reject.call(Base, target);
                                }
                            }
                        };
                        xhr.send();
                });                
            };
            const tagScriptLoader = function() {
                return Base.Core.pf(function(resolve, reject) {
                    let s = $doc.createElement('script');
                        s.type= 'text/javascript';
                        s.src = src;
                        s.id  = id;
                        s.onload = function() { resolve.apply(Base, arguments); };
                        s.onerror= function() { reject.call(Base, new Error(`${src} loadding failed.`)); };
                    $doc.getElementsByTagName('head')[0].appendChild(s);
                });
            };

            if (Base.getBrowser().isMsIe() || Base.global['is_debug']) {
                return tagScriptLoader(src, id, isAsync);
            } else {
                return xhrScriptLoader(src, id, isAsync);
            }     
        };        
        const importScript = async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `importScript( ${src} )`);
            if (_dependency?.scripts[id]) {
                return Base.Core.pf(r => r.call(Base));
            }
            else {
                let js_path= Base.global['js_path']||'',
                    js_src = String('{0}/{1}.js?v={2}').format(js_path, src, (new Date()).format('yyyymmdd') );
                _dependency.scripts[id] = js_src;
                return loadScript(js_src, id, isAsync);
            }
        };
        const invokeScript = async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `invokeScript( ${src} )`);
            return Base.Core.pf(function(resolve, reject) {
                let _chkCount = 0;
                const _chkModules = function() {
                    if (_dependency.modules.isComplete()) {                        
                        importScript(src, id, isAsync).then(resolve, reject);
                    } else {
                        _chkCount++;
                        if (_chkCount > 10) {
                            reject.call(Base, new Error(`${src} dependency module loadding failed.`));
                        } else {
                            $w.setTimeout(_chkModules, 10);
                        }
                    }
                };
                $w.setTimeout(_chkModules, 100);
            });
        };

        return {
            import  : async function(src = '', id = '', isAsync = true) {
                if (!!!src) return undefined;
                if (_dependency.modules.isComplete()) {
                    return importScript(src, (id||src), isAsync);
                } else {                    
                    return invokeScript(src, (id||src), isAsync);
                }
            },
            invoke  : async function(src = '', id = '') {
                if (!!!src) return undefined;
                return Base.Core.pf(function(resolve, reject) {
                    const _chkState = function() {
                        if ($doc.readyState === 'complete') {
                            invokeScript(src, id).then(resolve, reject);
                        } else {
                            $w.setTimeout(_chkState, 10);
                        }
                    };
                    $w.setTimeout(_chkState, 100);
                });
            },
            module  : async function(parentObj, moduleName, moduleObj) {
                if (!!!parentObj || !!!moduleName || !!!moduleObj) return;
                if (moduleObj['isExtend'] === true) {
                    if (parentObj[moduleName]) {
                        return Base.Core.pf(r => r.call(Base));
                    }
                    parentObj[moduleName] = ClassBuilder(parentObj, moduleName);
                }
                _dependency.modules.add(moduleObj);
                return Base.Core.pf(function(resolve, reject) {
                        importScript('modules/common.es6.base.'+moduleObj['file'], moduleName, moduleObj['isAsync'])
                            .then(
                                function() {
                                    Base.tracking(moduleObj['name']+' module import complate.', arguments);
                                    _dependency.modules.done(moduleObj);
                                    resolve.apply(Base, arguments);
                                },
                                function() {                                    
                                    Base.tracking(moduleObj['name']+' module import failed.', arguments);
                                    _dependency.modules.failed(moduleObj);
                                    reject.apply(Base, arguments);
                                }
                            );
                });
            },
            modules : function(moduleList) {
                if (moduleList?.length) {
                    if (Base.global['is_debug']) {
                        moduleList.unshift({name:'DebugHepler', file:'helper', isAsync:true, isExtend:false});
                    }
                    for(let i in moduleList) {
                        this.module(Base, moduleList[i]['name'], moduleList[i]);
                    }
                }
            },
        };
    })());

}) (window, __DOMAIN_NAME||'');


/**
 * common DOM Element helper.
 * 
 */
(function($w, root) {
    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const $doc = $w.document;
    const Root = root||'';
    const Base = $w[Root];
    const _Dom = function(...args) {
        if (!args.length) return undefined;
        if (args[0] instanceof Object) return args[0];
        return _dom.apply($w, args);
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
        HasClass: function(className) {
            if (className && this['classList']) return this['classList']['contains'].call(this, className);
            return false;
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
    
    Base.DomHelper = _Dom;

}) (window, __DOMAIN_NAME||'');



/**
 * import base modules
 */
 (function($w, root) {
    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const Root = root||'';
    const Base = $w[Root];

    Base.Dynamic.modules([
        {name:'Utils', file:'utils', isAsync:true, isExtend:true},
        {name:'Fetch', file:'fetch', isAsync:true, isExtend:true},
        {name:'Pages', file:'pages', isAsync:true, isExtend:true},
        {name:'Ui'   , file:'ui'   , isAsync:true, isExtend:true}
    ]);
}) (window, __DOMAIN_NAME||'');