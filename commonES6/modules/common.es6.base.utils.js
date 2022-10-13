/* common.es6.base.util.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/15
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const Utils= {
        clone : function(obj, dest) {
            let This = this;
            if (null == obj || 'object' != typeof obj) return obj;
            if (obj instanceof Date) {
                return (new Date( obj.getTime() ));
            }
            if (obj instanceof Array) {
                let copy = [];
                for (let i = 0; i < obj.length; i++) {
                    copy[i] = This.clone(obj[i]);
                }
                return copy;
            }
            if (obj instanceof Object) {
                let copy = (dest instanceof Object) ? dest : {};
                Object.entries(obj).forEach(([key, value]) => {
                    if (obj.hasOwnProperty(key)) {
                        copy[key] = This.clone(obj[key]);
                    }
                });
                return copy;
            }
            return obj;
        },
        cookie : function(expiresDay = 1, cookieDomain = '', cookiePath = '') {
            class CookieBuilder {
                constructor(expiresDay = 1, cookieDomain = '', cookiePath = '') {
                    this.expires= (typeof expiresDay == 'number') ? expiresDay : 1;
                    this.domain	= (cookieDomain||'');
                    this.path	= (cookiePath||'/');
                }
                #setOwner(name = '', value = '', expireDays = 0, secure = false) {
                    let cookie  = [name.encode() + '=' + value.encode()],
                        expdate = new Date();
        
                    expdate.setDate(expdate.getDate() + expireDays);
                    cookie.push('expires='+expdate.toGMTString());
                    if (!!this.domain) cookie.push('domain='+ this.domain);
                    if (!!this.path) cookie.push('path='+ this.path);
                    if (!!secure) cookie.push('secure');
        
                    document.cookie = cookie.join('; ');
                    return this;
                }
                set(name = '', value = '', expireDays, secure ) {
                    return this.#setOwner(name, value, (typeof expireDays == 'number' ? expireDays : this.expires), (typeof secure == 'boolean' ? secure : false))
                }
                get(name = '') {
                    if (!name) return;
                    let cookieName = name.encode()+'=',
                        cookieData = document.cookie,
                        cookieValue= '',
                        start	= cookieData.indexOf(cookieName),
                        endPoint= 0;
                    if (start  != -1){
                        start  += cookieName.length;
                        endPoint= cookieData.indexOf(';', start);
                        if (endPoint == -1) {
                            endPoint = cookieData.length;
                        }
                        cookieValue = cookieData.substring(start, endPoint);
                    }
                    return cookieValue.decode();
                }           
                remove(name) {
                    return this.set(name, '', -1);
                }
                getItem(name) {
                    return this.get(name);
                }
                setItem(name, value) {
                    return this.set(name, value); 
                }
                removeItem(name) {
                    return this.remove(name);
                }
                clear() {
                    return this;
                }
            }
            return new CookieBuilder(expiresDay, cookieDomain, cookiePath);
        },
        /** Cache object 
         *    type  : cache || local || session
         *  , span  : integer 
         *  , format: s, m, h, d, M, y, w
         *  let _c = oCache({type:'local', span:5, format:'m'});	// localStorage 5min cache.
        */
        cache : function(options = {}) {
            class CacheBuilder {
                constructor(options = {}) {
                    this._options = Base.extends({
                        type  : 'cache', // cache || local || session
                        span  : 0,
                        format: 's',
                        prifix: '',
                    }, options||{});
                    this.type    = this._options['type'];
                    this.prifix  = this._options['type']+(this._options['prifix'] ? ('/'+this._options['prifix']) : '');
                    this.expires = this._options['date']||this.#getCacheExpires();
                    this.storage = this.#getCacheStorage();
                }                
                #getCacheExpires() {
                    const fn = {
                        's' : (s) => s   ,
                        'm' : (s) => s*60,
                        'h' : (s) => fn.m(s)*60 ,
                        'd' : (s) => fn.h(s)*24 ,
                        'w' : (s) => fn.d(s)*7  ,
                        'M' : (s) => fn.d(s)*30 ,
                        'y' : (s) => fn.d(s)*365,
                    };
                    return fn[this._options['format']].call(this, this._options['span']);
                }
                #getCacheStorage() {
                    const fn = {
                        'session': ()=>$w['sessionStorage'],
                        'cache'  : ()=>$w['sessionStorage'],
                        'local'  : ()=>$w['localStorage'],
                        'cookie' : ()=>Util.cookie(1),                        
                    };
                    return fn[this._options['type']].call(this);
                }
                set(name = '', value = '', expire = '') { 
                    if (!!!name)  return;
                    if (!!!value) return;
                    if (!!!expire) {
                        expire = this.expires;
                    }
                    else {
                        if (typeof expire == 'object' && expire instanceof Date) {
                            expire = Math.round((expire.getTime() - (new Date()).getTime()) / 1000);
                        }
                        else if (typeof expire != 'number') {
                            expire = this.expires;
                        }
                    }
                    const expireTime = Math.round((new Date()).getTime()/1000) + expire;
                    try {
                        this.storage.setItem(this.prifix +'@d_'+ name, value);
                        this.storage.setItem(this.prifix +'@t_'+ name, expireTime);
                    } catch(e) {
                        // security mode
                    }
                    return this;
                }
                get(name) { 
                    return this.isStatus(name) ? this.storage.getItem(this.prifix +'@d_'+ name) : '';
                }
                isStatus(name) { 
                    if (!!!this.storage.getItem(this.prifix +'@t_'+ name)) return false;

                    var currentTime= Math.round((new Date()).getTime()/1000),
                        expireTime = this.storage.getItem(this.prifix +'@t_' + name) || 0;
        
                    // expired
                    if (expireTime < currentTime) {
                        this.remove(name);
                        return false;
                    }
                    return true;
                }
                remove(name) { 
                    this.storage.removeItem(this.prifix +'@d_'+ name);
                    this.storage.removeItem(this.prifix +'@t_'+ name);
                    return this;
                }
                clear() { 
                    for (var item in this.storage) {
                        if (String(item).startWith(this.type)) {
                            this.storage.removeItem(item);
                        }
                    }
                    //this.storage.clear();
                    return this;
                }
            };

            return new CacheBuilder(options);
        },
        stringBuilder : function(str = '') {
            class StringBuilder {
                constructor(str) {
                    this.buffer = [];
                    this.append(str);
                }
                append(str) {
                    if (str) this.buffer.push(str);
                    return this;
                }
                clear() {
                    this.buffer.length = 0;
                    return this;
                }
                size() {
                    return this.buffer.length;
                }
                toString(s) {
                    return this.buffer.join(s || "");
                }
            };            
            return new StringBuilder(str);
        },
        jsonToString : function(obj, step) {
            if (typeof step == 'number' && step > 2) return "''";
            let cnt		= 0,
                json	= '',
                depth	= (typeof step == 'number') ? step : 0;
            for(let prop in obj) {
                if (typeof obj[prop] != 'function') {
                    if (cnt > 0) json += ',';
                    if (typeof obj[prop] == 'object') {
                        json+= "'"+ prop +"':"+ this.jsonToString(obj[prop], depth++) +"";
                    }
                    else {
                        json+= "'"+ prop +"':'"+ String(obj[prop]).encode() +"'";
                    }
                    cnt ++;
                }
            }
            return `{${json}}`;
        },
        serializeQuerystring : function(obj) {
            if (!!!obj) return obj;
            let query = [];
            for(let prop in obj) {
                if (typeof obj[prop] != 'function') {
                    query[query.length] = String('{0}={1}').format(prop, String(obj[prop]).encode());
                }
            }
            return query.join('&');
        },
        querystringHelper : function() {
            class QuerystringHelper {
                constructor($w) {
                    this.params = {};
                    this.document = $w.document;
                    this.location = $w.document.location;
                    this.queryString = this.location.search;
                    this.#parseQuery();
                }
                #encode(s) { return String(s).encode(); }
                #decode(s) { return String(s).replace(/\+/g, " ").decode(); }
                #parseQuery() {
                    if (!this.queryString) return;
                    let obj = null;
                    let query = this.queryString.substring(1);
                    let regxp = /([^&=]+)=?([^&]*)/g;    // 그룹화 정규식.
                    while (obj= regxp.exec(query)) {
                        this.set(this.#decode(obj[1]), this.#decode(obj[2]));
                    }
                }
                get(name = '') {
                    return this.params[name]||'';
                }
                set(name = '', value = '') {
                    this.params[name] = value;
                    return this;
                }
                getQuery() {
                    let query = '';
                    for(const q in this.params) {
                        if (typeof this.params[q] != 'function') {
                            query += (query ? '&' : '?') + this.#encode(q) + '=' + this.#encode(this.params[q]);
                        }
                    }
                    return query;
                }
                getUrl() {
                    return this.location.origin + this.location.pathname + this.getQuery() + this.location.hash;
                }
            };
            return new QuerystringHelper($w);
        }
    };

    Base.extends(Base.Utils, Utils);

}) (window, __DOMAIN_NAME||'');