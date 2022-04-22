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
        return Base['__DomHelper'] && Base['__DomHelper'].apply($w, arguments);
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
    Base.extends = function(...args) {
        return Object.assign.apply($w, args);
    };
    Base.toString = function(arg) {
        return Object.prototype.toString.call(arg);
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
 * - script loader
 */
(function($w, root) {
    if (!!!$w) return;    
    if (!!!$w[root]) return;

    const $doc = $w.document;
    const Root = root||'';
    const Base = $w[Root];
    class Clazz {
        constructor(clazz, source = {}) {
            this.className = clazz;
            this.classPath = clazz;
            this.extends(source);
        }
        extends(source = {}) {
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
            return Base.extends(ClassBuilder((clazz['className']||''), source||{}), {
                className : (clazz['className']||Root),
                classPath : (clazz['classPath']||Root)+'.module',
                classUUID : (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : '')
            });
        },
        page    : function(clazz) {
            return this.module(clazz, Base.Pages);
        }, 
        loader  : async function(src = '', id = '', isAsync = true) {
            Base.logging(this, `loader( ${src} )`);

            const xhrScriptLoader = function(src) {
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
            const tagScriptLoader = function(src) {
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
                    return tagScriptLoader(src);
                } else {
                    return xhrScriptLoader(src);
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
    Base.Pages= ClassBuilder('Pages');

}) (window, __DOMAIN_NAME||'');