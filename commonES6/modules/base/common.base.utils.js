/** common.base.util.js */
(function($w, root) {
    'use strict';

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
        isEmptyObject: function(obj) {
            if(typeof obj !== 'object' || obj === null) {
                return true;
            }else{
                return !Object.keys(obj).length;
            }
        },
        cookie : function(expiresDay = 1, cookieDomain = '', cookiePath = '') {
            class CookieBuilder {
                constructor(expiresDay = 1, cookieDomain = '', cookiePath = '') {
                    this.expires= (typeof expiresDay == 'number') ? expiresDay : 1;
                    this.domain	= (cookieDomain||'');
                    this.path	= (cookiePath||'/');
                }
                setOwner(name = '', value = '', expireDays = 0, secure = false) {
                    let cookie  = [name.encode() + '=' + value.encode()],
                        expdate = new Date();
        
                    expdate.setDate(expdate.getDate() + expireDays);
                    cookie.push('expires='+expdate.toUTCString());
                    if (!!this.domain) cookie.push('domain='+ this.domain);
                    if (!!this.path) cookie.push('path='+ this.path);
                    if (!!secure) cookie.push('secure');
        
                    document.cookie = cookie.join('; ');
                    return this;
                }
                set(name = '', value = '', expireDays, secure ) {
                    return this.setOwner(name, value, (typeof expireDays == 'number' ? expireDays : this.expires), (typeof secure == 'boolean' ? secure : false))
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
                    this.expires = this._options['date']||this.getCacheExpires();
                    this.storage = this.getCacheStorage();
                }                
                getCacheExpires() {
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
                getCacheStorage() {
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
        serializeString : function(obj, spacter = '&') {
            if (!!!obj) return obj;
            let query = [];
            for(let prop in obj) {
                if (typeof obj[prop] != 'function') {
                    query[query.length] = String('{0}={1}').format(prop, String(obj[prop]).encode());
                }
            }
            return query.join(spacter);
        },
        querystringHelper : function(url = '') {
            class QuerystringHelper {
                constructor($w, str) {
                    this.hashs      = {};
                    this.params     = {};
                    this.isParam    = false;
                    this.document   = $w.document;
                    this.location   = $w.document.location;
                    this.pathname   = this.location.pathname;
                    this.hashString = this.location.hash;
                    this.queryString= this.location.search;
                    if (str) {
                        this.isParam        = true;
                        this.pathname       = str;
                        this.queryString    = '';
                        this.hashString     = '';
                        if (str.indexOf('?')> 0) {
                            this.pathname       = str.substring(0, str.indexOf('?'));
                            this.queryString    = str.substring(str.indexOf('?'), str.length);
                            if (this.queryString.indexOf('#') > 0) {
                                let h = this.queryString;
                                this.queryString= h.substring(0, h.indexOf('#'));
                                this.hashString = h.substring(h.indexOf('#'), h.length);
                            }
                        } else {
                            if (str.indexOf('#')> 0) {
                                this.hashString = str.substring(str.indexOf('#'), str.length);
                            }
                        }                        
                    }
                    this.parse();
                }
                encode(s) { return String(s).encode(); }
                decode(s) { return String(s).replace(/\+/g, " ").decode(); }
                parse() {
                    let obj = null;
                    let regxp = /([^&=]+)=?([^&]*)/g;    // 그룹화 정규식.
                    if (this.queryString) {                        
                        let query = this.queryString.substring(1);                    
                        while (obj= regxp.exec(query)) {
                            this.set(this.decode(obj[1]), this.decode(obj[2]));
                        }
                    }
                    if (this.hashString) {
                        let hash  = this.hashString.substring(1);
                        while (obj= regxp.exec(hash)) {
                            this.setHash(this.decode(obj[1]), this.decode(obj[2]));
                        }
                    }
                    return this;
                }
                get(name = '') {
                    return this.params[name]||'';
                }
                set(name = '', value = '') {
                    this.params[name] = value;
                    return this;
                }
                getHash(name = '') {
                    return this.hashs[name]||'';
                }
                setHash(name = '', value = '') {
                    this.hashs[name] = value;
                    return this;
                }
                getQuery() {
                    let query = [];
                    for(const q in this.params) {
                        if (typeof this.params[q] != 'function') {
                            query.push( this.encode(q) +'='+ this.encode(this.params[q]) );
                        }
                    }
                    return (query.length > 0 ? '?'+query.join('&') : '');
                }
                getHashs() {
                    let hash = [];
                    for(const h in this.hashs) {
                        if (typeof this.hashs[h] != 'function') {
                            hash.push( this.encode(h) +'='+ this.encode(this.hashs[h]) );
                        }
                    }
                    return (hash.length > 0 ? '#'+hash.join('&') : '');
                }
                getUrl() {
                    return (this.isParam?'':this.location.origin) + this.pathname + this.getQuery() + this.getHashs();
                }
            };
            return new QuerystringHelper($w, url);
        },
        /**
         * 소수 목록. 255개.
         */
        primeNumbers: [
            2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
            101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 
            173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 
            251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 
            337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 
            421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499,
            503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599,
            601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691,
            701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797,
            809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887,
            907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997,
            1009,1013,1019,1021,1031,1033,1039,1049,1051,1061,1063,1069,1087,1091,
            1093,1097,1103,1109,1117,1123,1129,1151,1153,1163,1171,1181,1187,1193,
            1201,1213,1217,1223,1229,1231,1237,1249,1259,1277,1279,1283,1289,1291,
            1297,1301,1303,1307,1319,1321,1327,1361,1367,1373,1381,1399,1409,1423,
            1427,1429,1433,1439,1447,1451,1453,1459,1471,1481,1483,1487,1489,1493,
            1499,1511,1523,1531,1543,1549,1553,1559,1567,1571,1579,1583,1597,1601,
            1607,1609,1613
        ],
        hashing: function(str, size) {
            let hash = 13;
            let len  = str.length;
            for(let i= 0; i < str.length; i++) {
                hash+=(str.charCodeAt(i) * this.primeNumbers[(len-(i+1))%this.primeNumbers.length]);
            }
            return hash%size;
        },
        hashTable : function(hashSize) {
            function hashStringToInt(str, size) {
                let hash = 17;
                for(let i= 0; i < str.length; i++) {
                    hash = (13 * hash * str.charCodeAt(i)) % size;
                }
                return hash;
            }
            class HashTable {
                constructor(size) {
                    this.count = 0;
                    this.table = new Array(size);
                }
                getSize() {
                    return this.table.length;
                }
                reset() {
                    this.count = 0;
                    this.table = new Array(this.table.length);
                    return this;
                }
                resize(size = 10) {
                    const newTable = new Array(this.table.length + size);
                    this.forEach(function(key, value) {
                        const idx = hashStringToInt(key, newTable.length);
                        if (newTable[idx]) {
                            newTable[idx].push([key, value]);
                        } else {
                            newTable[idx] = [[key, value]];
                        }
                    });
                    this.table = newTable;
                    return this;
                }
                setItem(key, value) {
                    this.count++;
                    const idx = hashStringToInt(key, this.table.length);
                    if (this.table[idx]) {
                        this.table[idx].push([key, value]);
                    } else {
                        this.table[idx] = [[key, value]];
                    }
                    return this;
                }
                getItem(key) {
                    const idx = hashStringToInt(key, this.table.length);
                    if (this.table[idx] && this.table[idx].find((el) => el[0] === key)) {
                        return this.table[idx].find((el) => el[0] === key)[1];
                    } else {
                        return undefined;
                    }
                }
                getItemCount() {
                    return this.count;
                }
                removeItem(key) {
                    const idx = hashStringToInt(key, this.table.length);
                    if (this.table[idx]) {
                        this.table[idx].splice(this.table[idx].findIndex((el) => el[0] === key), 1);
                    }
                    return this;
                }
                forEach(listener) {
                    if(!listener || !Base.isFunction(listener)) return;
                    this.table.forEach((item) => {
                        if (item) {
                            item.forEach(([key, value]) => {
                                listener(key, value);
                            });
                        }
                    });
                }
            }

            return new HashTable(hashSize);
        },
        getRandom : function(min = 0, max = 1000) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
        },
        size : function(pointX, pointY) {
            class Size {
                constructor(x, y) {
                    this.x = parseInt(x, 10)||0;
                    this.y = parseInt(y, 10)||0;
                }
                /**
                 * 최대 Size에 비례하는 Size를 계산하여 반환.
                 */
                balance(maxSize) {
                    let balance = new Size(0,0);
                    if ((this.x != 0 && this.y != 0) && (maxSize.x != 0 || maxSize.y != 0) && (this.x > maxSize.x || this.y > maxSize.y)) {
                        let balanceX  = (maxSize.x > 0)? maxSize.x/this.x : 1;
                        let balanceY  = (maxSize.y > 0)? maxSize.y/this.y : 1;
                        if (balanceX <= balanceY) {
                            balance.x = parseInt(this.x*balanceX, 10);
                            balance.y = parseInt(this.y*balanceX, 10);
                        } else {
                            balance.x = parseInt(this.x*balanceY, 10);
                            balance.y = parseInt(this.y*balanceY, 10);
                        }
                    } else {
                        balance.x = this.x;
                        balance.y = this.y;
                    }
                    return balance;
                }
                /**
                 * 비교하는 size와 같으면 true
                 */
                compare(size) {
                    return ((this.x == size.x) && (this.y == size.y));
                }
                toString() {
                    return `x:${this.x}, y:${this.y}`;
                }
            }
            return new Size(pointX, pointY);
        },
    };

    Utils.Ui = {
        createComboOptions(start, end, step = 1, len = 2, add) {
            let arr = [];
            let stp = 50;   // max option count.
            let cnt = 0;
            let chk = end - start;
            let lmt = (chk/step) > stp? start+stp:end;
            let iif = (c)=>(start<end ? c<=lmt:c>=lmt);
            for(cnt = start; iif(cnt);) {
                arr.push(`<option value="${cnt}">${String(cnt+(add||0)).digits(len)}</option>`);
                cnt = cnt + step;
            }
            if((chk/step) > stp && chk/stp > 1) {
                cnt=cnt - (cnt%stp);
                for(cnt = cnt+stp; cnt <= end;) {
                    arr.push(`<option value="${cnt}">${String(cnt+(add||0)).digits(len)}</option>`);
                    cnt = cnt + stp;
                }
                cnt = cnt - stp;
            } else {
                cnt = cnt - step;
            }
            if (cnt < end) {
                arr.push(`<option value="${end}">${String(end+(add||0)).digits(len)}</option>`);
            }
            return {
                opts : arr,
                push : function(val, txt) {
                    this.opts.push(`<option value="${val}">${txt}</option>`);
                    return this;
                },
                build:function(obj) {
                    obj?.empty().appendHtml(this.opts.join(''));
                    this.opts.splice(0,this.opts.length);
                }
            };
        },
    };

    Base.extends(Base.Utils, Utils);

}) (window, __DOMAIN_NAME||'');