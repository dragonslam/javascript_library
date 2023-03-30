/** common configuration. */
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

    Base.user = $w['$U'] = ($w['$U']||{uId:'', uNo:(new Date()).format('yyyymmdd'), uNm:''});
    Base.group= Base.groupEnd = Base.logging = Base.tracking = Base.wtf = Base.error =()=>{};
    Base.config['is_debug'] && (Base.isDebug = !0);
    if (Base.config['is_debug']) {
        $w.onload = () => $w.console.warn(`window.onload.DocumentState - ${document.readyState}`);
        $w.onpageshow = () => $w.console.warn(`window.onpageshow.DocumentState - ${document.readyState}`);
        $w.onunload = () => $w.console.warn(`window.onunload.DocumentState - ${document.readyState}`);
        $d.onreadystatechange = () => $w.console.warn(`document.readystatechange - ${document.readyState}`);
    }
}) (window, __DOMAIN_NAME||'', __DOMAIN_CONF||{});


/** common fn. */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    Base.getName = function(obj) {
        if (typeof obj === 'undefined') return 'undefined';
        if (obj === null) return 'null';
        let result = Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1];
        if (result == 'Object') {
            return obj.constructor.name || result;
        } else if (result == 'Function') {
            return obj.prototype.constructor.name || result;
        }
        return result;
    };
    Base.getBrowser= function() {
        const n = $w['navigator'],
              a = $w['navigator']['userAgent'].toLowerCase(),
              s = 'MSIE,Chimera,Chrome,Safari,Firefox,Beonex,NetPositive,Netscape,Opera,Phoenix,SkipStone,StarOffice,WebTV,Mozilla';
        let b = '';
        s.split(',').some((v) => {if(a.indexOf(v.toLowerCase()) >= 0){b=v.toLowerCase(); return true;}} );
        return {            
             navigator: n
            ,agent	  : a
            ,browser  : b
            ,isMsIe   :(b == 'msie')
            ,isChrome :(b == 'chrome')
            ,isSafari :(b == 'safari')
        };
    };
    Base.getDevice = function() {
        let n= $w['navigator'],
            p= $w['navigator']['platform' ],
            a= $w['navigator']['userAgent'],
            b= this.getBrowser();
        return {
             navigator	 : n
            ,platform	 : p
            ,browser     : b
            ,isMobile 	 : (a.match(/iPhone|iPod|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null || a.match(/LG|SAMSUNG|Samsung/) != null)
            ,isAndroid	 : (/Android/i.test(a))
            ,isIos		 : (/iPhone|iPad|iPod/i.test(a))
            ,isIpad		 : (/iPad/i.test(a))
            ,isIphone	 : (/iPhone/i.test(a))
            ,isGaltab	 : (/SHW-M/i.test(a))
            ,isTouchPad	 : (/hp-tablet/gi).test(n.appVersion)
            ,isTouch	 : ('ontouchstart' in $w)
            ,isTablet	 : (/SHW-M/i.test(a)||$w.screen.width > 640)
            ,isWide		 : ($w.screen.width > $w.screen.height)
            ,isWin		 : (/win32/i.test(p) || /windows/i.test(p))
        };
    };
    Base.extends = function(...args) {
        return Object.assign.apply($w, args);
    };
    Base.toString = function(arg) {
        return Object.prototype.toString.call(arg);
    };
    Base.isMobile   = function() {
        return (Base.config['js_base_name']==='mo');
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

        return result(t);
    };
}) (window, __DOMAIN_NAME||'');


/**
 * common Core Class 
 * - class builder
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
    const _NMS = Base.config['js_base_name']||'pc';
    const _FIX = '__';

    /** base class */
    class Clazz {
        constructor(parent, name, source = {}) {
            this.isInit     = false;
            this.className  = name;
            this.classPath  = parent && parent['classPath'] ? parent['classPath']+'.'+name : name;
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
        Clazz: Clazz,
        /** Find and returns an object that exists in the namespace */
        find : function(target, module = '') {
            if (!target) return undefined;
            let clazz = (typeof target == 'object') ? target : Base;
            if (typeof target == 'string') {
                let parts	= target.split('.');
                if (parts[0]==Root) {
                    parts	= parts.slice(1);
                }
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i] == 'base') return clazz;
                    if (typeof clazz[_FIX+parts[i]] == 'undefined') return undefined;
                    clazz = clazz[_FIX+parts[i]];
                }
            }
            return module ? clazz[_FIX+module] : clazz;
        },
        /** Returns the file path of an object as a namespace address */
        path : function(ns) {
            if (!ns) return undefined;
            let paths = '',
                parts = ns.split('.');
            if (parts[0]==Root) parts = parts.slice(1);
            if (parts[0]==_NMS) parts = parts.slice(1);
            if (parts[parts.length-1]=='base') parts.pop();
            if (parts.length > 1) {
                for (let i= 0; i < parts.length-1; i++) {
                    paths = (i == 0) ? parts[i] : `${paths}/${parts[i]}`;
                }
                return `${paths}/${parts[parts.length-1]}`;
            }
            else if (parts.length == 1) {
                return `${parts[0]}/${parts[0]}.base`;
            }
            else {
                return ns;
            }
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
                if (typeof clazz[_FIX+parts[i]] === 'undefined') {
                    isNewbie = true;
                    clazz[_FIX+parts[i]] = ClassBuilder(clazz, parts[i], {
                        classUUID : paths +'.'+ (Base.user['uId'] || Base.user['uNo'] || Date.now())
                    });
                    Base['classHeap'][ns] = clazz[_FIX+parts[i]];
                }
                clazz = clazz[_FIX+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        /** Create and return a private built-in object */
        module : function(clazz, source, type = 'module') {
            if (!clazz) return undefined;
            if (Root != clazz.className) Base.logging(clazz, 'module()');
            return Base.extends(source||{}, ClassBuilder(clazz, type, Base.extends({
                className : (type||clazz['className']||Root),
                classPath : (clazz['classPath']||Root)+'.'+type,
                classUUID : (clazz['classPath']||Root)+'.'+type+'.'+(Base.user['uId'] || Base.user['uNo'] || Date.now()),
                rootClassPath : _NMS
            }, (!!Base['isDebug'] ? {_isDebug:true} : {}))));
        },
        destroy : function(ns) {
            Base.logging(Base, `destroy(${ns})`);
            if (!ns) return;
            /** 
             * Namespace의 Class를 메모리에서 삭제하면 다시 JS를 로드하지 않으므로 사용하면 오히려 오류가 발생.
             * - 한번 import되면 JS 모듈은 브라우저에서 cache하여 다시 import하지 않음.
             * - import를 하지 않음으로 인해 JS compile이 발생하지 않아 삭제한 Namespace의 Class는 다시 샐행이 안됨.
            */
            if (Base.Core.find(ns)) {
                let classNs	 = ns.split('.'),
                    parentNs = ns.split('.'),
                    clazzName= parentNs.pop(),
                    parentCz = Base.Core.find(parentNs.join('.'));
                if (classNs[0]==Root) classNs = classNs.slice(1);
                Base.Define.remove(classNs.join('.'));
                Base.classHeap[classNs.join('.')] = undefined;
                parentCz[_FIX+clazzName] = undefined;
                delete Base.classHeap[classNs.join('.')];
                delete parentCz[_FIX+clazzName];
            }
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
            try {
                $doc.head.appendChild( script ).parentNode.removeChild( script );
            } catch(e) {
                throw new Error('Complie error.');
            }
        },
        /** Promise Factory */
        pf : function(executor) {
            return new Promise(executor);
        },
        /** Delay executor */
        sleep : function(delay) {
            let timerId = -1;
            return Base.Core.pf(function(resolve) {
                timerId = $w.setTimeout(function() {
                    resolve();
                    $w.clearTimeout(timerId);
                }, delay);
            });
        },
        /** Delay loop executor */
        loop : function(cnt, delay, resolve) {
            let This = this;
            for (let i = 0; i < cnt; i++) {
                This.sleep(delay*i).then(()=>resolve(i, i==cnt-1));
            }
        },
    });

    /** 
     * AMD(Asynchronous Module Definition) helper. 
     * - dynamic script loadding.
     * */    
    Base.Define = ClassBuilder(Base, 'Define', (function(){
        const JS_VERSION    = Base.config['js_version'] || (new Date()).format('yyyymmddHH');
        const JS_DEPENDENCY = {
            modules : {
                deffers : 0,
                exports :{},
                path: function(file = '') {
                    let paths = '',
                        files = 'common',
                        parts = file.split('.');
                    for (let i= 0; i < parts.length-1; i++) {
                        paths = `${paths}/${parts[i]}`;
                    }
                    return `${Base.config['js_common_path']}${paths}/${files}.${file}.js?cVer=${JS_VERSION}`
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
            path    : (file = '') => `${Base.config['js_path']}/${file}.js`,
            pathVersioning : (src = '') => `${src}?cVer=${JS_VERSION}`,
            scripts : {},
            css : {}
        };
        const loadScript = function(src, id, isAsync) {
            let xhrScriptLoader = function() {
                //Base.logging(this, `xhrScriptLoader( ${src}, ${id} ).`);
                return Base.Core.pf(function(resolve, reject) {
                    let xhr = new XMLHttpRequest();
                        xhr.open('GET', src, isAsync);
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
            let tagScriptLoader = function() {
                //Base.logging(this, `tagScriptLoader( ${src}, ${id} ).`);
                if (Base.getBrowser().isMsIe) {
                    return Base.Core.pf(function(resolve, reject) {
                        let s= $doc.createElement('script');
                            s.type= 'text/javascript';
                            s.src = src;
                            s.id  = id;
                            s.onload = function() { if (Base.isFunction(resolve))resolve.apply(Base, arguments); };
                            s.onerror= function() { if (Base.isFunction(reject)) reject.call(Base, new Error(`${src} loadding failed.`)); };
                        $doc.getElementsByTagName('head')[0].appendChild(s);
                    });
                } else {
                    return import(src);
                }
            };
            if (Base.getBrowser().isMsIe || Base['isDebug']) {
                return tagScriptLoader();
            } else {
                return xhrScriptLoader();
            }
        };
        const invokeScript = async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `invokeScript( ${src}, ${id} )`);
            return Base.Core.pf(function(resolve, reject) {
                let chkCount = 0;
                let chkModules = function() {
                    if (JS_DEPENDENCY.modules.isComplete()) {
                        importScript(src, id, isAsync).then(resolve, reject);
                    } else {
                        chkCount++;
                        if (chkCount > 2000) {
                            if (Base.isFunction(reject)) {
                                reject.call(Base, new Error(`[${src}] dependency module loadding failed.`));
                            }
                        } else {
                            Base.Core.sleep(3).then(chkModules);
                        }
                    }
                };
                Base.Core.sleep(0).then(chkModules);
            });
        };
        const importScript = async function(src = '', id = '', isAsync = true) {
            if (JS_DEPENDENCY?.scripts[id]) {
                Base.logging(this, `importScript( ${src}, ${id} ) => loaded.`);
                return Base.Core.pf(r => r.call(Base));
            }
            else {
                Base.logging(this, `importScript( ${src}, ${id} ) => loadding.`);
                if (JS_DEPENDENCY.modules.isComplete()) {
                    JS_DEPENDENCY.scripts[id] = JS_DEPENDENCY.pathVersioning(src);
                    return loadScript(JS_DEPENDENCY.scripts[id], id, isAsync);
                } 
                else {
                    return invokeScript(src, (id||src), isAsync);
                }
            }
        };
        const importModule = async function(args) {
            return Base.Core.pf(function(resolve, reject) {
                let oModule = JS_DEPENDENCY.modules.add(args);
                let fnCheckModule= function() {
                    let complete = true;
                    oModule.require?.forEach(name => {
                        complete = !(complete && JS_DEPENDENCY.modules.exports[name]?.isLoaded === false);
                    });
                    if (complete) {
                        fnImportModule();
                    } else {
                        Base.Core.sleep(1).then(fnCheckModule);
                    }
                };
                let fnImportModule = function() {
                    loadScript(oModule['jsFile'], oModule['name'], oModule['isAsync'])
                        .then(function() {
                            JS_DEPENDENCY.modules.done(oModule);
                            Base.tracking(`module import success => ${oModule['name']}`, oModule);
                            if (Base.isFunction(resolve)) resolve.call(Base, oModule);
                        })
                        .catch(function() {
                            JS_DEPENDENCY.modules.failed(oModule);
                            Base.tracking(`module import failed => ${oModule['name']}`, oModule);
                            if (Base.isFunction(reject)) reject.call(Base, oModule);
                        });
                };
                if (oModule.require?.length > 0) {
                    fnCheckModule();
                } else {
                    fnImportModule();
                }
            });
        };
        const loadCss = function(src) {
            return Base.Core.pf(function(resolve, reject) {
                let s= $doc.createElement('link');
                    s.rel = 'stylesheet';
                    s.type= 'text/css';
                    s.href= src;
                    s.onload = function() { if (Base.isFunction(resolve)) resolve.apply(Base, arguments); };
                    s.onerror= function() { if (Base.isFunction(reject)) reject.call(Base, new Error(`${src} loadding failed.`)); };
                $doc.getElementsByTagName('head')[0].appendChild(s);
            });
        };
        const importCss = function(src, id) {
            if(!JS_DEPENDENCY?.css[id]) {
                Base.logging(this, `importCss( ${src}, ${id} ) => loaded.`);
                JS_DEPENDENCY.css[id] = JS_DEPENDENCY.pathVersioning(src);
                return loadCss(JS_DEPENDENCY.css[id]);
            }
        };

        return {
            /** import script on the fly */
            import  : async function(src = '', id = '', isAsync = true) {
                if (!!!src) return undefined;
                if (src.indexOf('.css') > -1) {
                    return importCss(src, (id||src));
                } else {
                    return importScript(src, (id||src), isAsync);
                }
            },
            remove  : function(id = '') {
                if (JS_DEPENDENCY?.scripts[id]) delete JS_DEPENDENCY.scripts[id];
            },
            invokeOnControl : async function(parentNs, scriptPath) {
                if (!!!parentNs || !!!scriptPath) return undefined;
                let fnSrciptNs = ((arr)=>{ 
                    let ns = parentNs.replaceAll(`${Root}.`, '').split('.');
                    arr.forEach((s) => {
                        if (s && s != 'forward') {
                            if (s.indexesOf('.action')) s = s.split('.action')[0];
                            if (s.indexesOf('.js')) s = s.split('.js')[0];
                            ns.push(s);
                        }
                    });
                    return ns.join('.');
                })(scriptPath.split('/'));
                return this.invoke(fnSrciptNs);
            },
            /** import script after document ready. */
            invoke  : async function(ns) {
                if (!ns) return undefined;
                return Base.Core.pf(function(resolve, reject) {
                    let fnResolve = function(args) {
                        Base.logging(Base, `${ns} > Dynamic script invoke resolve.`);
                        let fnChkObj = function() {
                            if (Base.Core.find(ns)) {
                                Base.logging(Base, `${ns} > Dynamic script invoke complete.`);
                                if (Base.isFunction(resolve)) resolve.call(Base, Base.Core.find(ns));
                            } else {
                                Base.Core.sleep(1).then(fnChkObj);
                            }
                        };
                        Base.Core.sleep(0).then(fnChkObj);
                    };
                    let fnReject = function() {
                        Base.logging(Base, `${ns} > Dynamic script invoke reject.`);
                        if (Base.isFunction(reject)) reject.call(Base, arguments);
                    };
                    let fnChkState = function() {
                        if ($doc.readyState === 'complete') {
                            invokeScript(JS_DEPENDENCY.path(Base.Core.path(ns)), ns).then(fnResolve, fnReject);
                        } else {
                            Base.Core.sleep(3).then(fnChkState);
                        }
                    };
                    Base.Core.sleep(0).then(fnChkState);
                });
            },
            /** scripts in namespace are called consecutively. */
            invoker : async function(ns) {
                if (!ns) return undefined;
                return Base.Core.pf(function(resolve, reject) {
                    let index   = 0,
                        names	= '',
                        paths	= '',
                        parts	= ns.split('.');
                    if (parts[0]==Root) {
                        parts	= parts.slice(1);
                    }
                    let fnInvoker = function() {
                        if (index < parts.length) {
                            paths = (paths ? paths +'.'+ parts[index] : parts[index]);
                            names = (index < parts.length-1) ? paths+'.base' : paths;    
                            Base.Define.invoke(names).then(function(oModule) {
                                if (oModule && oModule['init']) {
                                    oModule?.init.call(oModule);
                                }
                                index++;
                                fnInvoker();
                            });
                        } else {
                            if (Base.isFunction(resolve)) resolve.call(Base, Base.Core.find(ns));
                        }
                    };
                    fnInvoker();
                });
                /*
	            const promiseList = [];
                for(let index = 0; index < parts.length; index++) {
                    paths = (paths ? paths +'.'+ parts[index] : parts[index]);
                    names = (index < parts.length-1) ? paths+'.base' : paths;
                    promiseList.push(Base.Define.invoke(names).then(function(oModule) {
                        if (oModule && oModule['init']) {
                            oModule?.init.call(oModule);
                        }
                    }));
                }
                return Promise.all(promiseList);
                */
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
                if (Base['isDebug'] && !Base['isExtendLogging']) {
                    moduleList.unshift({name:'Debug', filePath:'base.debug', isAsync:true, isExtend:false});
                }
                const This = this;
                const promiseList = [];
                moduleList.forEach(function(m) {
                    promiseList.push(This.module((parent ? parent : Base), m));	
                });
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
    const fnGenerator = (path, name, vars) => Base.extends({name:name, filePath:`${path.toLowerCase()}`}, vars);

    // base common module.
    Base.Define.modules(Base, [
        {name:'DomHelper'	, filePath:'base.dom'		, isAsync:false, isExtend:true},
        {name:'Utils'		, filePath:'base.utils'		, isAsync:true , isExtend:true},
        {name:'Control'		, filePath:'base.control'	, isAsync:false, isExtend:true},
        {name:'Observer'	, filePath:'base.observer'	, isAsync:true , isExtend:true},
        {name:'Timer'		, filePath:'base.timer'	    , isAsync:true , isExtend:true},
        {name:'Fetch'		, filePath:'base.fetch'		, isAsync:true , isExtend:true, require:['Timer']},
        {name:'Excel'		, filePath:'base.excel'		, isAsync:true , isExtend:true, require:['Utils', 'Fetch']},
        {name:'Validation'	, filePath:'base.validation', isAsync:true , isExtend:true, require:['Utils', 'Fetch', 'DomHelper']},
    ]).then((...args) => {
        // event module.
        Base.Define.modules(Base, [
            {name:'Event'	, filePath:'base.event'	    , isAsync:true , isExtend:true, require:['Utils']},
        ]).then((...args) => {
            const eventVar = {isAsync:true, isExtend:true, require:['Utils', 'Event']};
            Base.Define.modules(Base.Event, [
                fnGenerator('event.eventtype'  ,'EventType'       ,eventVar),
                fnGenerator('event.keycodes'   ,'KeyCodes'        ,eventVar),
                fnGenerator('event.keynames'   ,'KeyNames'        ,eventVar),
                fnGenerator('event.handler'    ,'EventHandler'    ,eventVar),
                fnGenerator('event.delegator'  ,'EventDelegator'  ,eventVar),
            ]).then((...args) => {});
        });

        // schdule module.
        Base.Define.modules(Base, [
            {name:'Schedule'	, filePath:'base.schedule'	, isAsync:true , isExtend:true, require:['Timer']},
        ]).then((...args) => {
            const scheduleVar = {isAsync:true, isExtend:true, require:['Utils', 'Timer', 'Schedule']};
            Base.Define.modules(Base.Schedule, [
                fnGenerator('schedule.cron-parser'   ,'CronParser'   ,scheduleVar),
                fnGenerator('schedule.cron-container','CronContainer',scheduleVar),
                fnGenerator('schedule.scheduler'     ,'Scheduler'    ,scheduleVar),
                fnGenerator('schedule.task-manager'  ,'TaskManager'  ,scheduleVar),
                fnGenerator('schedule.task-processer','TaskProcesser',scheduleVar),
            ]).then((...args) => {});
        });

        // control module.
        const ctrlVar = {isAsync:true, isExtend:true, require:['Control', 'Utils', 'Fetch', 'DomHelper', 'Event', 'Timer', 'Observer']};
        Base.Define.modules(Base.Control, [
            fnGenerator('control.calendar' ,'Calendar'  ,ctrlVar),
            fnGenerator('control.component','Component' ,ctrlVar),
            fnGenerator('control.context'  ,'Context'   ,ctrlVar),
            fnGenerator('control.image'    ,'Image'     ,ctrlVar),
            fnGenerator('control.form'     ,'Form'      ,ctrlVar),
            fnGenerator('control.page'     ,'Page'      ,ctrlVar),
            fnGenerator('control.popup'    ,'Popup'     ,ctrlVar),
            fnGenerator('control.ui'       ,'Ui'        ,ctrlVar),
        ]).then((...args) => {

        //     // ui control module.
        //     const uiVar = {isAsync:true, isExtend:true, require:['Control', 'Context', 'Component', 'Ui']};
        //     Base.Define.modules(Base.Control.Ui, [ 
        //         fnGenerator('control.ui.menu'      ,'MenuControl'       ,uiVar),
        //         fnGenerator('control.ui.tab'       ,'TabControl'        ,uiVar),
        //         fnGenerator('control.ui.panel'     ,'PanelControl'      ,uiVar),
        //         fnGenerator('control.ui.layer'     ,'LayerControl'      ,uiVar),
        //         fnGenerator('control.ui.calendar'  ,'CalendarControl'   ,uiVar),
        //         fnGenerator('control.ui.editor'    ,'EditorControl'     ,uiVar),
        //         fnGenerator('control.ui.image'     ,'ImageControl'      ,uiVar),
        //         fnGenerator('control.ui.pagination'     ,'PaginationControl'    ,uiVar),
        //         fnGenerator('control.ui.tab-list-panel' ,'TabListPanelControl'  ,uiVar),
        //     ]);
        });
    });   

}) (window, __DOMAIN_NAME||'');