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

    Base.config = Object.assign({
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
                This.initializer = undefined;
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
    const _Fix= '__';
    const ClassBuilder= (parent, name, source) => new Clazz(parent, name, source);

    Base['className'] = Root;
    Base['classPath'] = Root;
    Base.Core = ClassBuilder(Base, 'Core', {
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
                clazz = clazz[_Fix+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        module : function(clazz, source) {
            if (!clazz) return undefined;
            Base.logging(clazz, 'module()');            
            return ClassBuilder(clazz, 'module', Base.extends(source||{}, {
                className : (clazz['className']||Root),
                classPath : (clazz['classPath']||Root)+'.module',
                classUUID : (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : '')
            }));
        },
        pageModule: function(clazz) {
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
        const _version    = (new Date()).format('yyyymmdd');
        const _dependency = {
            getModulePath : (file = '') => `modules/common.es6.base.${file}`,
            getScriptPath : (file = '') => `${Base.config['js_path']}/${file}.js?v=${_version}`,
            modules : {
                deffers : 0,
                list: { },
                add : (m) => {
                    let This = _dependency.modules;
                    This.deffers++;
                    This.list[m['name']] = Base.extends(m, {
                        isLoaded : false,
                        jsFile   : _dependency.getModulePath(m['file'])
                    });
                    return This.list[m['name']];
                },
                done : (m) => {
                    let This = _dependency.modules,
                        That = _dependency.modules.list[m['name']];
                    This.deffers--; 
                    That.isLoaded = true;
                    return That;
                },
                failed: (m) => {
                    let This = _dependency.modules,
                        That = _dependency.modules.list[m['name']];
                    That.isLoaded = false;
                    return That;
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
                return tagScriptLoader(src, id, isAsync);
            } else {
                return xhrScriptLoader(src, id, isAsync);
            }     
        };        
        const importScript = async function(src = '', id = '', isAsync = true) {
            if (_dependency?.scripts[id]) {
                Base.logging(this, `importScript( ${src}, ${id} ) -> loaded.`);
                return Base.Core.pf(r => r.call(Base));
            }
            else {
                Base.logging(this, `importScript( ${src}, ${id} ) -> loadding.`);
                _dependency.scripts[id] = _dependency.getScriptPath(src);
                return loadScript(_dependency.scripts[id], id, isAsync);
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
                                $w.setTimeout(_chkObj, 10);
                            }
                        };
                        $w.setTimeout(_chkObj, 10);
                    };
                    const _rejectFn = function() {
                        Base.logging(Base, `${ns} > Dynamic script invoke reject.`);
                        if (Base.isFunction(reject)) reject.call(Base, arguments);
                    };
                    const _chkState = function() {
                        if ($doc.readyState === 'complete') {
                            invokeScript(Base.Core.path(ns), ns).then(_resolveFn, _rejectFn);
                        } else {
                            $w.setTimeout(_chkState, 100);
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
                moduleObj = _dependency.modules.add(moduleObj);
                return Base.Core.pf(function(resolve, reject) {
                        importScript(moduleObj['jsFile'], moduleObj['name'], moduleObj['isAsync'])
                            .then(
                                function() {
                                    Base.tracking(`${moduleObj['name']} module import complate.`, arguments);
                                    _dependency.modules.done(moduleObj);
                                    resolve.apply(Base, arguments);
                                },
                                function() {                                    
                                    Base.tracking(`${moduleObj['name']} module import failed.`, arguments);
                                    _dependency.modules.failed(moduleObj);
                                    reject.apply(Base, arguments);
                                }
                            );
                });
            },
            modules : function(moduleList) {
                if (moduleList?.length) {
                    if (Base.config['is_debug']) {
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
 * import base modules
 */
 (function($w, root) {
    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const Root = root||'';
    const Base = $w[Root];

    Base.Dynamic.modules([
        {name:'DomHelper', file:'dom', isAsync:true, isExtend:true},
        {name:'Utils', file:'utils', isAsync:true, isExtend:true},
        {name:'Fetch', file:'fetch', isAsync:true, isExtend:true},
        {name:'Pages', file:'pages', isAsync:true, isExtend:true},
        {name:'Ui'   , file:'ui'   , isAsync:true, isExtend:true}
    ]);
}) (window, __DOMAIN_NAME||'');