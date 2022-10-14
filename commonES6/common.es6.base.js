/* common.es6.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/14
    update, 2022/04/18
*/
(function($w) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w['console']) {
        $w.logStack	= [];
	    $w.console	= {
            log : (s) => logStack.push('[Log]'+ s),
            dir : (s) => logStack.push('[Dir]'+ s),
            wtf : (s) => logStack.push('[Wtf]'+ s),
            warn: (s) => logStack.push('[War]'+ s),
        };
    }
}) (window);


/**
 * common configuration.
 */
(function($w, root, configuration) {
    'use strict';

    if (!!!$w) return;
    const $d   = $w.document;
    const Base = $w['$O'] = $w[root] = ($w[root]||function() {
        return Base['DomHelper'] && Base['DomHelper'].apply($w, arguments);
    });

    Base.config = Object.assign({
        js_common_path	: '/js',
        js_path			: '/js',
        image_path		: '/img',
    }, configuration||{});

    Base.user  = $w['$U'] = ($w['$U']||{uId:'', uNo:Date.now(), uNm:''});
    Base.wtf   = Base.logging = Base.tracking = function(){};

    if (Base.config['is_debug']) {
        $w.onload = () => $w.console.warn(`window.onload.DocumentState - ${document.readyState}`);
        $w.onpageshow = () => $w.console.warn(`window.onpageshow.DocumentState - ${document.readyState}`);
        $w.onunload = () => $w.console.warn(`window.onunload.DocumentState - ${document.readyState}`);
        $d.onreadystatechange = () => $w.console.warn(`document.readystatechange - ${document.readyState}`);
    }
}) (window, __DOMAIN_NAME||'', __DOMAIN_CONF||{});


/**
 * common fn.
 */
 (function($w, root) {
    'use strict';

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
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;
    if (!!!$w['document']) return;

    const Root = root||'';
    const Base = $w[Root];
    const $doc = $w['document'];
    const _Fix = '__';

    /** base class */
    class Clazz {
        constructor(parent, name, source = {}) {
            this.className  = name;
            this.classPath  = parent && parent['classPath'] ? parent['classPath']+'.'+name : name;
            this.initializer= undefined;
            Base.extends(this, source);
        }
        init(executor) {
            Base.logging(this, 'init()');
            const This = this;            
            if (Base.isFunction(executor)) {
                This.initializer = executor;
            }
            else if (Base.isFunction(This.initializer)) {
                This.initializer.call(This);
            }
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
    /** base class builder */
    const ClassBuilder= (parent, name, source) => new Clazz(parent, name, source);

    Base['className'] = Root;
    Base['classPath'] = Root;
    Base['classHeap'] = {};
    Base.Core = ClassBuilder(Base, 'Core', {
        /** Find and returns an object that exists in the namespace */
        find : function(target, module = '') {
            if (!target) return undefined;
            let clazz	= (typeof target == 'object') ? target : Base;
            if (typeof target == 'string') {
                let parts	= target.split('.');
                if (parts[0]==Root) {
                    parts	= parts.slice(1);
                }
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i] == 'base') return clazz;
                    if (typeof clazz[_Fix+parts[i]] == 'undefined') return undefined;                
                    clazz = clazz[_Fix+parts[i]];
                }
            }
            return module ? clazz[_Fix+module] : clazz;
        },
        /** Returns the file path of an object as a namespace address */
        path : function(ns) {
            if (!ns) return undefined;
            let paths	= '',
                parts	= ns.split('.');
            if (parts[0]==Root) {
                parts	= parts.slice(1);
            }
            for (let i = 0; i < parts.length-1; i++) {
                paths = (i == 0) ? parts[i] : `${paths}/${parts[i]}`;
            }
            return `${paths}/${ns}`;
        },
        /** Extend object by namespace address */
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
                    Base['classHeap'][ns] = clazz[_Fix+parts[i]];
                }
                clazz = clazz[_Fix+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        /** Create and return a private built-in object */
        module : function(clazz, source, type = 'module') {
            if (!clazz) return undefined;
            Base.logging(clazz, 'module()');            
            return ClassBuilder(clazz, type, Base.extends({}, source||{}, {
                className : (clazz['className']||Root),
                classPath : (clazz['classPath']||Root)+'.'+type,
                classUUID : (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : '')
            }));
        },
        /** Inherit the prototype methods from one constructor into another.*/
        inherits  : function(child, parent) {
            /** @constructor */
            function objet() {}
            objet.prototype = parent.prototype;
            child.superClass= parent.prototype;
            child.prototype = new objet();
            /** @override */
            child.prototype.constructor = child;
            /** Calls superclass constructor/method. */
            child.base = function(me, methodName) {
                var args = new Array(arguments.length - 2);
                for (var i = 2; i < arguments.length; i++) {
                  args[i - 2] = arguments[i];
                }
                return parent.prototype[methodName].apply(me, args);
            };
            return child;
        },
        domEval : function(code, node) {
            let preservedScriptAttributes = { type: true, src: true, nonce: true, noModule: true },
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
        /** Promise Factory */
        pf : function(executor) {
            return new Promise(executor);
        },
    });

    /** 
     * AMD(Asynchronous Module Definition) helper. 
     * - dynamic script loadding.
     * */
    Base.Define = ClassBuilder(Base, 'Define', (function(){
        const _version    = (new Date()).format('yyyymmddHHmi');
        const _dependency = {
            modules : {
                deffers : 0,
                exports :{},
                path: function(file = '') {
                    let paths	= 'modules',
                        files   = 'common.es6',
                        parts	= file.split('.');
                    if (parts[0]=='base') {
                        parts	= parts.slice(1);
                    }
                    for (let i = 0; i < parts.length-1; i++) {
                        paths = `${paths}/${parts[i]}`;
                    }
                    return `${paths}/${files}.${file}.js?v=${_version}`
                },
                add : function(m) {
                    this.deffers++;
                    this.exports[m['name']] = Base.extends(m, {
                        isLoaded : false,
                        jsFile   : this.path(m['filePath'])
                    });
                    return this.exports[m['name']];
                },
                done : function(m) {
                    this.deffers--; 
                    this.exports[m['name']].isLoaded = true;
                    return this;
                },
                failed: function(m) {
                    this.exports[m['name']].isLoaded = false;
                    return this;
                },
                isComplete: function() { 
                    return this.deffers==0; 
                }
            },
            path    : (file = '') => `${Base.config['js_path']}/${file}.js?v=${_version}`,
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
                                    if (Base.isFunction(resolve))resolve.call(Base, target);      
                                } else { 
                                    if (Base.isFunction(reject)) reject.call(Base, target);
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
                        s.onload = function() { if (Base.isFunction(resolve))resolve.apply(Base, arguments); };
                        s.onerror= function() { if (Base.isFunction(reject)) reject.call(Base, new Error(`${src} loadding failed.`)); };
                    $doc.getElementsByTagName('head')[0].appendChild(s);
                });
            };

            if (Base.getBrowser().isMsIe() || Base.config['is_debug']) {
                return tagScriptLoader();
            } else {
                return xhrScriptLoader();
            }
        };
        const invokeScript = async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `invokeScript( ${src}, ${id} )`);
            return Base.Core.pf(function(resolve, reject) {
                let _chkCount = 0;
                const _chkModules = function() {
                    if (_dependency.modules.isComplete()) {                        
                        importScript(src, id, isAsync).then(resolve, reject);
                    } else {
                        _chkCount++;
                        if (_chkCount > 10) {
                            if (Base.isFunction(reject)) reject.call(Base, new Error(`${src} dependency module loadding failed.`));
                        } else {
                            $w.setTimeout(_chkModules, 1);
                        }
                    }
                };
                $w.setTimeout(_chkModules, 0);
            });
        };
        const importScript = async function(src = '', id = '', isAsync = true) {
            if (_dependency?.scripts[id]) {
                Base.logging(this, `importScript( ${src}, ${id} ) -> loaded.`);
                return Base.Core.pf(r => r.call(Base));
            }
            else {
                Base.logging(this, `importScript( ${src}, ${id} ) -> loadding.`);
                if (_dependency.modules.isComplete()) {
                    _dependency.scripts[id] = _dependency.path(src);
                    return loadScript(_dependency.scripts[id], id, isAsync);
                } 
                else {
                    return invokeScript(src, (id||src), isAsync);
                }
            }
        };
        const importModule = async function(args) {
            Base.logging(Base, `${args['name']} module import start.`);
            const oModule = _dependency.modules.add(args);
            return Base.Core.pf(function(resolve, reject) {
                const _checkModule = function() {
                    let _complete = true;
                    oModule.require?.forEach(name => {
                        _complete = !(_complete && _dependency.modules.exports[name]?.isLoaded === false);
                    });
                    if (_complete) {
                        _importModule();
                    } else {
                        $w.setTimeout(_checkModule, 10);
                    }
                };
                const _importModule = function() {
                    loadScript(oModule['jsFile'], oModule['name'], oModule['isAsync'])
                        .then(function() {
                            _dependency.modules.done(oModule);
                            Base.tracking(`module import success -> ${oModule['name']}`, arguments);
                            if (Base.isFunction(resolve)) resolve.call(Base, oModule);
                        })
                        .catch(function() {
                            _dependency.modules.failed(oModule);
                            Base.tracking(`module import failed -> ${oModule['name']}`, arguments);
                            if (Base.isFunction(reject)) reject.call(Base, oModule);
                        });
                };
                if (oModule.require?.length > 0) {
                    _checkModule();
                } else {
                    _importModule();
                }
            });
        };

        return {
            /** import script on the fly */
            import  : async function(src = '', id = '', isAsync = true) {
                if (!!!src) return undefined;
                return importScript(src, (id||src), isAsync);
            },
            /** import script after document ready */
            invoke  : async function(ns) {
                if (!ns) return undefined;
                return Base.Core.pf(function(resolve, reject) {
                    const _resolveFn = function(args) {
                        Base.logging(Base, `${ns} > Dynamic script invoke resolve.`);
                        const _chkObj= function() {
                            if (Base.Core.find(ns)) {
                                Base.logging(Base, `${ns} > Dynamic script invoke complete.`);
                                if (Base.isFunction(resolve)) resolve.call(Base, Base.Core.find(ns));
                            } else {
                                $w.setTimeout(_chkObj, 1);
                            }
                        };
                        $w.setTimeout(_chkObj, 0);
                    };
                    const _rejectFn = function() {
                        Base.logging(Base, `${ns} > Dynamic script invoke reject.`);
                        if (Base.isFunction(reject)) reject.call(Base, arguments);
                    };
                    const _chkState = function() {
                        if ($doc.readyState === 'complete') {
                            invokeScript(Base.Core.path(ns), ns).then(_resolveFn, _rejectFn);
                        } else {
                            $w.setTimeout(_chkState, 3);
                        }
                    };
                    $w.setTimeout(_chkState, 0);
                });
            },
            /** import common script module */
            module  : async function(parent, module) {
                if (!!!parent || !!!module) return;
                if (module['isExtend'] === true) {
                    if (parent[module['name']]) {
                        return Base.Core.pf(r => r.call(Base));
                    }
                    parent[module['name']] = ClassBuilder(parent, module['name']);
                }
                return importModule(module);
            },
            /** import common script module lists */
            modules : function(parent, moduleList) {
                if (Base.config['is_debug'] && !Base['isExtendLogging']) {
                    moduleList.unshift({name:'Debug', filePath:'base.debug', isAsync:true, isExtend:false});
                }
                const promiseList = [];
                for(let i in moduleList) {
                    promiseList.push(this.module((parent ? parent : Base), moduleList[i]));
                }
                return Promise.all(promiseList);
            },
        };
    })());

}) (window, __DOMAIN_NAME||'');


/**
 * import base modules
 */
 (function($w, root) {
    'use strict';

    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const Root = root||'';
    const Base = $w[Root];

    // base common module.
    Base.Define.modules(Base, [
        {name:'DomHelper', filePath:'base.dom'     , isAsync:true, isExtend:true},
        {name:'Utils'    , filePath:'base.utils'   , isAsync:true, isExtend:true},
        {name:'Fetch'    , filePath:'base.fetch'   , isAsync:true, isExtend:true},
        {name:'Control'  , filePath:'base.control' , isAsync:true, isExtend:true},
        {name:'Events'   , filePath:'base.events'  , isAsync:true, isExtend:true, require:['DomHelper', 'Utils', 'Fetch']},
    ]).then(() => {
        // control module.
        Base.Define.modules(Base.Control, [
            {name:'Page' , filePath:'control.page' , isAsync:true, isExtend:true, require:['Control', 'Utils', 'Fetch']},
            {name:'Ui'   , filePath:'control.ui'   , isAsync:true, isExtend:true, require:['Control', 'Utils', 'Fetch', 'DomHelper', 'Event']},
        ]);

        // ui control module.
    });   

}) (window, __DOMAIN_NAME||'');