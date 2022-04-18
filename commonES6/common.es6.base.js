/* common.es6.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/14
    update, 2022/04/18
*/
const __initializeBaseModule = function($w, root, configuration = {}) {
    if (!!!$w) return;
    if (!$w['console']) {
        $w.logStack	= [];
	    $w.console	= {
            log : (s) => logStack.push('[Log]'+ s),
            dir : (s) => logStack.push('[Dir]'+ s),
            wtf : (s) => logStack.push('[Wtf]'+ s),
        };
    }

    const _win = $w;
    const _doc = $w.document;

    class Clazz {
        constructor(clazz, source = {}) {
            this.className = clazz;
            this._extends(source);
        }
        _extends(source = {}) {
            Object.assign(this, source);
        }
    };
    const ClassBuilder = (clazz, source) => new Clazz(clazz, source);

    const _Fix = '__';
    const Root = (root||'ROOT');
    const Base = $w['$O'] = $w[Root] = ($w[Root]||function() {
        return Base._fn.apply(Base, arguments);
    });

    Base.global= Object.assign({
        js_common_path	: '/js',
        js_path			: '/js',
        image_path		: '/img',
    }, configuration);

    Base.user  = $w['$U'] = ($w['$U']||{uId:'', uNo:String((new Date()).getTime()), uNm:''});
    Base.wtf   = Base.logging = Base.tracking = function(){};

    Base._fn = function(...arg) {
        if(!arg) return undefined;
        let obj = _doc.querySelectorAll(arg);
        if (obj && obj.length > 0) {
            obj.forEach((o) => Object.assign(o, Base._fn.Helper));
            if(obj.length == 1) obj = obj[0];
        } else obj = undefined;
        return obj;
    };
    Base._fn.Helper = {
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
        Text : function(txt) {
            return this.Attr('innerText', txt);
        },
        AppendText : function(txt = '') {
            return this.Attr('innerText', this.innerText + txt);
        },
        Html : function(htm) {
            return this.Attr('innerHTML', htm);
        },
        AppendHtml : function(htm = '') {
            return this.Attr('innerHTML', this.innerHTML + htm);
        },
        Show : function() {
            if (this['style']) this['style']['visibility'] = 'visible';
            return this;
        },
        Hide : function() {
            if (this['style']) this['style']['visibility'] = 'hidden';
            return this;
        },
        
    };

    Base.Browser = function() {
        const n=$w['navigator'],
              a= n['userAgent'].toLowerCase();
        function getBrowser() {
            if (a.indexOf('msie') != -1)        return 'MSIE';
            if (a.indexOf('beonex') != -1) 		return 'Beonex';
            if (a.indexOf('chimera') != -1) 	return 'Chimera';			
            if (a.indexOf('chrome') != -1)		return 'Chrome';
            if (a.indexOf('firefox') != -1) 	return 'Firefox';
            if (a.indexOf('mozilla/5.0') != -1)	return 'Mozilla';
            if (a.indexOf('netpositive') != -1)	return 'NetPositive';
            if (a.indexOf('netscape') != -1)	return 'Netscape';
            if (a.indexOf('opera') != -1)		return 'Opera';
            if (a.indexOf('phoenix') != -1) 	return 'Phoenix';
            if (a.indexOf('safari') != -1) 		return 'Safari';
            if (a.indexOf('skipstone') != -1)	return 'SkipStone';
            if (a.indexOf('staroffice') != -1)	return 'StarOffice';
            if (a.indexOf('webtv') != -1) 		return 'WebTV';
        }
        const b = getBrowser();
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
            ,agent		 : a
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
        };
    };

    Base.Core = ClassBuilder('Core', {
        namespace : function(ns) {
            let clazz	= Base,
                paths	= Root,			
                parts	= ns.split('.'),
                isNewbie= false;
            if (parts[0]==Root) {
                parts	= parts.slice(1);
            }
            for (let i = 0; i < parts.length; i++) {
                if (typeof clazz[_Fix+parts[i]] === 'undefined') {
                    isNewbie = true;
                    clazz[_Fix+parts[i]] = ClassBuilder('', {
                        className : parts[i],
                        classPath : paths = paths+'.'+parts[i],
                        classUUID : paths + (Base.user['uNo']?'.'+Base.user['uNo']:''),
                        init :  function() {
                            Base.logging(this, 'init()');
                        }
                    });
                }
                clazz=clazz[_Fix+parts[i]];
            }
            if (isNewbie) Base.logging(clazz, `namespace( ${ns} )`);
            return clazz;
        },
        module : function(clazz, source) {
            Base.logging(clazz, 'expandModule()');
            return ClassBuilder('', Object.assign({
                isInit	 	: false,
                isHelper 	: !!Base.global['is_debug'],
                className	: (clazz['className']||Root),
                classPath	: (clazz['classPath']||Root)+'.module',
                classUUID	: (clazz['classPath']||Root)+((Base.user['uNo']||'') ? '.'+Base.user['uNo'] : ''),
                init        : function() {
                    Base.logging(this, 'init()');
                },
            }, source||{}));
        },
        loader : async function(src = '') {
            if (!!!src) return;
            Base.logging(this, `moduleLoader( ${src} )`);

            const js_path= Base.global['js_path']||'',
                  js_src = String('{0}/{1}.js?v={2}').format(js_path, src, (new Date()).format('yyyymmdd'));
			if (Base.Browser().isMsIe() || !!!$w['jQuery']) {
                return new Promise(function(resolve, reject) {
                    let h=document.getElementsByTagName('head')[0],
                    s=document.createElement('script');
                    s.src  = js_src;
                    s.type = 'text/javascript';
                    s.onload = function() {
                        if (resolve) resolve.apply(Base, arguments);
                    };
                    s.onerror= function() {
                        if (reject) reject.call(Base, new Error(`${src} Loadding Error.`));
                    };
                    h.appendChild(s);
                });
			} else if ($w['jQuery']) {
                return new Promise(function(resolve, reject) {
                    let _tp = 'application/x-www-form-urlencoded;charset=utf-8';
                    $w['jQuery']['ajax'].call($w, {
                        url: js_src,
                        dataType: 'script',
                        contentType: _tp,
                        beforeSend : function(o){ o.overrideMimeType(_tp); },
                        success : function() {
                            if (resolve) resolve.apply(Base, arguments);
                        },
                        error : function() {
                            if (reject) reject.call(Base, new Error(`${src} Loadding Error.`));
                        },
                        async: (!!resolve),
                        cache: true
                    });
                });
			} else {
                throw new Error('The module could not be loaded.');
            }
        },
    });

    if (Base.global['is_debug']) {
        Base.Core.loader('module/common.es6.base.helper')
            .then(
                function() {Base.tracking('CommonHepler Loadding Complate.', arguments, 'Debug enabled.!!')},
                function() {Base.tracking('CommonHepler Loadding Error.', arguments)}
            );
    }

    Base.Util = ClassBuilder('Util');
    Base.Core.loader('module/common.es6.base.util')
        .then(
            function() {Base.tracking('CommonUtil Loadding Complate.', arguments)},
            function() {Base.tracking('CommonUtil Loadding Error.', arguments)}
        );

    Base.Fetch = ClassBuilder('Fetch');
    Base.Core.loader('module/common.es6.base.fetch')
        .then(
            function() {Base.tracking('CommonFetch Loadding Complate.', arguments)},
            function() {Base.tracking('CommonFetch Loadding Error.', arguments)}
        );
};

async function initializeBaseModule(win = {}, root = '', configuration = {}) {
    await __initializeBaseModule(win, root, configuration);
}