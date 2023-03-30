/* common.es6.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/14	
*/
!(function($w) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w['console']) {
        $w.logStack	= [];
	    $w.console	= {
            log : (s) => logStack.push('[Log]'+ s),
            dir : (s) => logStack.push('[Dir]'+ s),
            wtf : (s) => logStack.push('[Wtf]'+ s),
            warn: (s) => logStack.push('[War]'+ s),
            error:(s) => logStack.push('[Err]'+ s),
        };
    }
}) (window);

!(function() {
    'use strict';
    /* 
    * String prototype 
    */
    String.prototype.meta = function() {
        let str = this;
        let result = '';
        for(let i = 0; i < str.length; i++) {
            if((/([\$\(\)\*\+\.\[\]\?\\\^\{\}\|]{1})/).test(str.charAt(i))) {
                result += str.charAt(i).replace((/([\$\(\)\*\+\.\[\]\?\\\^\{\}\|]{1})/), '\\$1');
            } else {
                result += str.charAt(i);
            }
        }
        return result;
    };
    String.prototype.removeRegExpChar = function(pattern) {
        return (pattern == null) ? this : eval('this.replace(/[' + pattern.meta() + ']/g, \"\")');
    };
    String.prototype.equals = function(str) {
        return (this == str);
    };
    String.prototype.nvl = function(s) {
        return this.isEmpty() ? (s ? s : '') : this+'';
    };
    String.prototype.isEmpty = function() {
        return (this == null || this == '' || this == 'undefined' || this == 'null');
    };
    String.prototype.isAlphaNum = function() {
        return (this.search(/[^A-Za-z0-9_-]/) == -1);
    };
    String.prototype.isAlpha = function() {
        return (this.search(/[^A-Za-z]/) == -1);
    };
    String.prototype.isNumber = function() {
        return this.isFinite();
        //return (this.search(/[^0-9]/) == -1);
    };
    String.prototype.isFinite = function() {
        return isFinite(this);
    };
    /** 소수점 2자리 까지 */
    String.prototype.isDotNumber = function() {	
        return (this.search(/^(?:\d*\.\d{1,2}|\d+)$/ ) != -1);
    };
    String.prototype.isKor = function() {
        return (/^[가-힣]+$/).test(this.remove(arguments[0])) ? true : false;
    };
    String.prototype.isEmail = function() {
        return (/\w+([-+.]\w+)*@\w+([-.]\w+)*\.[a-zA-Z]{2,4}$/).test(this.trim());
    };
    /** User Identity check.
     * 1. 6~20자 이내
     * 2. 영문+숫자 입력 가능(영문으로 시작)
     * 3. 특수기호 입력불가(단, 언더바/하이픈 허용) 
     * */
    String.prototype.isSafeIdentity = function() {
        return (/^[A-Za-z]{1}[A-Za-z0-9_-]{5,19}$/).test(this.trim());
    };
    String.prototype.isUrl = function() {
        return (/(file|ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).test(this.trim());
    };
    String.prototype.isPhone = function() {
        let arg = arguments[0]||'';
        return eval('(/(02|0[3-9]{1}[0-9]{1})'+ arg +'[1-9]{1}[0-9]{2,3}'+ arg +'[0-9]{4}$/).test(this)');
    };
    String.prototype.isMobile = function() {
        let arg = arguments[0]||'';
        return eval('(/01[016789]'+ arg +'[1-9]{1}[0-9]{2,3}'+ arg +'[0-9]{4}$/).test(this)');
    };
    /** 10진수 숫자로 변환 */
    String.prototype.Int = function() {
        return this.isFinite() ? parseInt(this, 10) : parseInt('0');
    };
    String.prototype.Float = function() {
        return this.isFinite() ? parseFloat(this) : parseFloat('0.0');
    };
    String.prototype.parseInt = function() {
        return String(this.trim().replace(/[^-_0-9]/g, '')).Int();
    };
    String.prototype.parseFloat = function() {
        if (arguments.length) {
            return String(this.trim().replace(/[^-_0-9.0-9]/g, '')).Float().toFixed(arguments[0]).parseFloat();
        }
        else {
            return String(this.trim().replace(/[^-_0-9.0-9]/g, '')).Float();
        }
    };
    Number.prototype.parseFloat = function() {
        if (arguments.length) {
            return this.toFixed(arguments[0]).parseFloat();
        }
        else {
            return String(this).Float();
        }
    };
    /** 숫자에 3자리마다 , 를 찍어서 반환 */
    String.prototype.toComma = function() {	
        let s = (this.nvl('0')).trim();
        if (s.isNumber()) {
            while((/(-?[0-9]+)([0-9]{3})/).test(s)) {
                s = s.replace((/(-?[0-9]+)([0-9]{3})/), '$1,$2');
            }
            return s;
        }
        else {
            return this;
        }
    };
    Number.prototype.toCutPoint = function(c) {
        let p = 1;
        if (c) {
            for (let i = 0; i < c; i++) p = p*10;
        }
        return this ? Math.floor(this*p,0)/p : 0;
    };
    Number.prototype.toComma = function() {
        return String(this).toComma();
    };
    Number.prototype.toCurrency = function() {
        let result = this.toCurrencyCal();
        return result['value'] + result['unit'];
    };
    Number.prototype.toCurrencyCal = function() {
        return this.toCurrencyFormat(10000, ['원', '만원', '억원', '조', '경'], 2);
    };
    Number.prototype.toCurrencyFormat = function(unit, words, dots) {
        unit = unit ||10000;
        words= words||['원', '만원', '억원', '조', '경'];
        dots = dots ||2;
        if (!this || unit <= 0 || !words.length) return this;

        let stp = 0,
            val = this / 1,
            rst = val;
        for(stp = 0; stp < words.length; stp++) {
            rst = Math.floor((val / Math.pow(unit, stp)));
            if (rst < unit) {
                break;
            }
        }
        rst = (stp > 0) ? (val/Math.pow(unit, stp)) : val;
        rst = rst.toFixed((rst%1 == 0) ? 0 : dots);

        return {step:stp, words:words, value:rst, unit:words[stp]};
    };
    String.prototype.padLeft = function(cnt, str) {
        cnt = (cnt && typeof(cnt) == 'number') ? cnt : 0;
        str = (str && typeof(str) == 'string') ? str : ' ';
        if (this.length < cnt) {
            let s = '';
            for (let i = this.length; i < cnt; i++) {
                s += str;
            }
            return s + this;
        } else {
            return this;
        }
    };
    String.prototype.padRight = function(cnt, str) {
        cnt = (cnt && typeof(cnt) == 'number') ? cnt : 0;
        str = (str && typeof(str) == 'string') ? str : ' ';

        if (this.length < cnt) {
            let s = '';
            for (let i = this.length; i < cnt; i++) {
                s += str;
            }
            return this + s;
        } else {
            return this;
        }
    };
    /** 숫자의 자리수(cnt)에 맞도록 반환 */
    String.prototype.digits = function(cnt) {
        return this.padLeft(cnt, '0');
    };
    /** 숫자의 자리수(cnt)에 맞도록 반환 */
    Number.prototype.digit = function(cnt){
        return String(this).digits(cnt);
    };
    String.prototype.startWith = function(str) {
        if (this.equals(str)) return true;
        if (str.length > 0)
            return (str.equals(this.substring(0, str.length)));
        else
            return false;
    };
    String.prototype.endWith = function(str) {
        if (this.equals(str)) return true;
        if (String(str).length > 0)
            return (str.equals(this.substring(this.length - str.length, this.length)));
        else
            return false;
    };
    String.prototype.bytes = function() {
        let b = 0;
        for (let i=0; i<this.length; i++) b += (this.charCodeAt(i) > 128) ? 2 : 1;
        return b;
    };
    String.prototype.getBytesLength = function() {
        let s = this, b, i, c;
        for(b = i = 0;c = s.charCodeAt(i++);b += c >> 11 ? 3 : c >> 7 ? 2 : 1);
        return b;
    };
    if (typeof '$'.trim != 'function') {
        String.prototype.trim = function() {
            return this.replace(/(^\s*)|(\s*$)/g, '');
        }
    }
    if (typeof '$'.trimLeft != 'function') {
        String.prototype.trimLeft = function() {
            return this.replace(/(^\s*)/, '');
        }
    }
    if (typeof '$'.trimRight != 'function') {
        String.prototype.trimRight = function() {
            return this.replace(/(\s*$)/, '');
        }
    }
    /** 원하는 바이트 까지 잘라서 반환. */
    String.prototype.substringBytes = function(start, limitBytes) {
        let b = 0, l = 0, s = '';
        for(let i=0; i<this.length; i++) {
            b = (this.charCodeAt(i) > 128) ? 2 : 1;
            if (i >= start) {
                l += b;
                s += this.charCodeAt(i);
            }
            if (l >= limitBytes) break;
        }
        return s;
    };
    String.prototype.indexesOf = function(ptn) {
        let p=0, s=-1, h=-1;
        while(p!=-1){
            s=p=this.indexOf(ptn, s+1);
            h++;
        }
        return h;
    };
    String.prototype.replaceAll = function(org, dest) {
        return this.split(org).join(dest);
    };
    String.prototype.remove = function(str) {
        if (str && typeof(str) == 'string')
            return this.replaceAll(str, '');
        else
            return this;
    };
    /** "{0} is dead, but {1} is alive! {0} {2}".format("Sarah Kerrigan", "Zerg Queen") */
    String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
    String.prototype.toLower = function() {
        return this.toLowerCase();
    };
    String.prototype.toUpper = function() {
        return this.toUpperCase();
    };
    /** Returns whether the given string is lower camel case (e.g. "isFooBar"). */
    String.prototype.isLowerCamelCase = function() {
        return /^[a-z]+([A-Z][a-z]*)*$/.test(this);
    };
    /** Returns whether the given string is upper camel case (e.g. "FooBarBaz"). */
    String.prototype.isUpperCamelCase = function() {
        return /^([A-Z][a-z]*)+$/.test(this);
    };
    /** Converts a string from selector-case to camelCase 
     *  (e.g. from "multi-part-string" to "multiPartString") 
     * */
    String.prototype.toCamelCase = function() {
        return this.replace(/\-([a-z])/g, function(all, match) {
            return match.toUpperCase();
        });
    };
    /** Converts a string from camelCase to selector-case 
     *  (e.g. from "multiPartString" to "multi-part-string")
     * */
    String.prototype.toSelectorCase = function() {
        return this.replace(/([A-Z])/g, '-$1').toLowerCase();
    };
    /** Capitalizes a string.
     *  converts the first letter to uppercaseand all other letters to lowercase
     * */
    String.prototype.toCapitalize = function() {
        let str = this;
        return String(str.charAt(0)).toUpperCase() + String(str.slice(1)).toLowerCase();
    };
    String.prototype.trimHtml = function() {
        return this.trim().replaceAll('\t', '').replaceAll('\n', '');
    };    
    String.prototype.escapeHtml = function() {
        return this.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    String.prototype.encode = function() {
        try {
            return encodeURIComponent(this);
        } catch (e) {
            return this;
        }
    };
    String.prototype.decode = function() {
        try {
            return decodeURIComponent(this);
        } catch (e) {
            return this;
        }
    };
    String.prototype.encode64 = function() {
        try {
            return atob(this.encode());
        } catch (e) {
            return this;
        }  
    };
    String.prototype.decode64 = function() {
        try {
            return btoa(this).decode();
        } catch (e) {
            return this;
        }  
    };
    String.prototype.getNumber = function() {
        return (this.trim().replace(/[^0-9]/g, ''));
    };
    String.prototype.getAlphabet = function() {
        return (this.trim().replace(/[^a-zA-Z]/g, ''));
    };
    String.prototype.getAlphaNum = function() {
        return (this.trim().replace(/[^0-9a-zA-Z]/g, ''));
    };
    String.prototype.getAlphaDotNum = function() {
        return (this.trim().replace(/[^0-9a-zA-Z.]/g, ''));
    };
    String.prototype.getEmailId = function() {
        return (this.trim().replace(/[^0-9a-zA-Z._-]/g,''));
    };
    String.prototype.getEmailDomain = function() {
        return (this.trim().replace(/[^0-9a-zA-Z.-]/g, ''));
    };
    String.prototype.removeHtml = function() {
        return this.replace(/[<][^>]*[>]/gi, '');
    };
    String.prototype.getFileName = function() {
        if (this.indexOf('/') > 0)
            return this.split('/')[this.split('/').length-1];
        else
            return this.split('\\')[this.split('\\').length-1];
    };
    String.prototype.getFileExpName = function() {
        return this.split('.')[this.split('.').length-1];
    };
    Number.prototype.devide = function(q) {
        let r = this / parseInt(q);
        return isNaN(r)?0:r;
    };
    /** ','가 포함된숫자 처리, 0으로 나눌 때 처리 */
    String.prototype.devide = function(q) {
        let a = isNaN(this.getNumber())?0:this.getNumber(),
            b = isNaN(q)?0:q,
            r = a / b;
        return isNaN(r)?0:r;
    }
    /** 날자 체크 (년/월/일 검사) */
    String.prototype.isDate = function(spacter) {
        if (!this || !this.trim()) return false;
        let sz = this;
        if (spacter) sz = sz.replaceAll(spacter, '-');
        // yyyy-mm-dd
        if ((/^(1|2)\d{3}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(sz)) return true;
        // mm-dd-yyyy
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](1|2)\d{3}$/).test(sz)) return true;
        // yy-mm-dd
        if ((/^\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(sz)) return true;
        // mm-dd-yy
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2}$/).test(sz)) return true;

        return false;
    };
    /** 시간 체크    hh:mm:ss */
    String.prototype.isTime = function() {
        return (/^(2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this);
    };
    /** 날자 시간 체크  */
    String.prototype.isDateTime = function(spacter) {
        if (!this || !this.trim()) return false;
        let sz = this;
        if (spacter) sz = sz.replaceAll(spacter, '-');        
        // yyyy-mm-dd hh:mm:ss
        if ((/^(1|2)\d{3}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(sz)) return true;
        // mm-dd-yyyy hh:mm:ss
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](1|2)\d{3} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(sz)) return true;
        // yy-mm-dd hh:mm:ss
        if ((/^\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(sz)) return true;
        // mm-dd-yyyy hh:mm:ss
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(sz)) return true;

        return false;
    };
    /** Convert String to Date.
     * # When converted to numbers, all expressions in date format can be converted to Date
     *   - min 6 length : yyMMdd, date 8 length : yyyyMMdd, max 14 length : yyyyMMddHHmmss
     * # Parsable replacements for common expressions
     *  - now, today, tomorrow, yesterday
     * # Expressions that need to be evaluated (based on current time)
     *  - 3y, 8m, -1y, 2d, -3w, -6h
     * @return {Date}
    */
    String.prototype.toDate = function() {
        if (!this || this == null || !this.trim()) return null;
        if (this.trim().toLowerCase() === 'now') return (new Date());
        if (this.trim().toLowerCase() ==='today')return (new Date()).format('yyyy-MM-dd').toDate();
        if (this.trim().toLowerCase() ==='tomorrow') return (new Date()).addDay( 1).format('yyyy-MM-dd').toDate();
        if (this.trim().toLowerCase() ==='yesterday')return (new Date()).addDay(-1).format('yyyy-MM-dd').toDate();
        let arr = [];
        let min = 1900;
        let max = 3000;
        let len = this.length;
        let str = this.getNumber();
        let fix = this.substring(len-1, len).toLowerCase();        
        let add = function(...args) {
            args.forEach((d)=>{ arr.push(String(d).parseInt(10)) });
        };
        if (+str > 0 && 'y,m,d,w,h'.split(',').includes(fix)) {
            // val : 7y, -3m, 99d, 12h
            let now = (new Date()).format('d').toDate();
            let val = this.substring(0, len-1).parseInt(10);
            let rst = null;
            switch (fix) {
                case 'y': rst = now.addYear(val);   break;
                case 'm': rst = now.addMonth(val);  break;
                case 'd': rst = now.addDay(val);    break;
                case 'h': rst = now.addHours(val);  break;
                case 'w': rst = now.addDay((val*7)-(val<0?-1:1));  break;
            }
            return rst;
        }
        else if (+str > 0 && str.length == 6) {
            let yy = str.substring(0, 2).parseInt();            
            add(yy + (yy<66?100:0)+min, str.substring(2, 4), str.substring(4, 6));
        }
        else if (+str > 0 && str.length >= 8) {
            add(str.substring(0, 4), str.substring(4, 6), str.substring(6, 8));
            if (str.length % 2 == 1) str=str+'0';            
            if (str.length == 10) {	// yyyyMMddHH
                add(str.substring(8, 10));
            } else if(str.length == 12) {	// yyyyMMddHHmm
                add(str.substring(8, 10), str.substring(10, 12));
            } else if(str.length == 14) {	// yyyyMMddHHmmss    
                add(str.substring(8, 10), str.substring(10, 12), str.substring(12, 14));
            }
        }
        else {
            let s='', d='', t='';
            let srz = (len > 20) ? String(this.split(",")[0]) : this;
            function _split(sz) {
                let r = [];
                if      (sz.split('-').length == 3) r = sz.split('-');
                else if (sz.split('/').length == 3) r = sz.split('/');
                else if (sz.split('.').length == 3) r = sz.split('.');
                return r.map((s)=>String(s).parseInt());
            }
            if ((/^(19|29)\d{2}[\/\.-](0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[0-1])$/).test(srz))
            {	// yyyy-mm-dd, yyyy/mm/dd, yyyy.mm.dd
                add.apply(this, _split(srz));
            }
            else if ((/^\d{2}[\/\.-](0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[0-1])$/).test(srz))
            {	// yy-mm-dd, yy/mm/dd, yy.mm.dd
                s = _split(srz);
                add((s[0]+(s[0]<66?100:0)+min), s[1], s[2]);
            }
            else if ((/^(0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[0-1])[\/\.-](19|29)\d{2}$/).test(srz))
            {	// mm-dd-yyyy, mm/dd/yyyy, mm.dd.yyyy
                s = _split(srz);
                add(s[2], s[0], s[1]);
            }
            else if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2}$/).test(srz))
            {	// mm-dd-yy, mm/dd/yy, mm.dd.yy
                s = _split(srz);
                add((s[2]+min), s[0], s[1]);
            }
            else if ((/^(19|29)\d{2}[\/\.-](0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(srz))
            {	// yyyy-mm-dd hh:mm:ss, yyyy/mm/dd  hh:mm:ss
                d = _split(srz.split(' ')[0]);
                t = (srz.split(' ')[1].split(':')).map((s)=>String(s).parseInt());
                add(d[0], d[1], d[2], t[0]||0, t[1]||0, t[2]||0);
            }
            else if ((/^(0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[0-1])[\/\.-](19|29)\d{2} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(srz))
            {	// mm-dd-yyyy hh:mm:ss, mm/dd/yyyy hh:mm:ss
                d = _split(srz.split(' ')[0]);
                t = (srz.split(' ')[1].split(':')).map((s)=>String(s).parseInt());
                add(d[2], d[0], d[1], t[0]||0, t[1]||0, t[2]||0);
            }
        }
        return (arr.length>=3 && arr[0]>=min && arr[0]<max) ? new Date(arr[0], arr[1]-1, arr[2], arr[3]||0, arr[4]||0, arr[5]||0) : null;
    };

    Number.prototype.toJSON	=
        Boolean.prototype.toJSON=
            String.prototype.toJSON	= function (key) {
                return '{"'+ key +'" : "'+ this.valueOf() +'"}';
            };
    Date.prototype.toJSON = function (key, format) {
        return String(isFinite(this.valueOf()) ? this.format((format||'F')) : "").toJSON(key);
    };

    /* 
    * Date prototype 
    */
    Date.prototype.addDate = function(yy, mm, dd, hh, mi, ss, ms) {
        return new Date(
            this.getFullYear()	+ (yy||0),
            this.getMonth() 	+ (mm||0),
            this.getDate() 		+ (dd||0),
            this.getHours() 	+ (hh||0),
            this.getMinutes()	+ (mi||0),
            this.getSeconds() 	+ (ss||0),
            this.getMilliseconds() + (ms||0)
        );
    };
    Date.prototype.addTimes = function(hours, miniutes, seconds, mss) {
        return this.addDate(0, 0, 0, hours||0, miniutes||0, seconds||0, mss||0);
    };
    Date.prototype.addSeconds = function(seconds) {
        return this.addTimes(0, 0, seconds);
    };
    Date.prototype.addMinutes = function(minutes) {
        return this.addTimes(0, minutes);
    };
    Date.prototype.addHours = function(hours) {
        return this.addTimes(hours);
    };
    Date.prototype.addDay = function(day) {
        return this.addDate(0, 0, day);
    };
    Date.prototype.addMonth = function(month) {
        let c = this.addDate(0, month);
        let o = this.getMonth()+month;
        if (o < 0) o=12+o;
        if (o >11) o=o-12;
        if (o!= c.getMonth()) {
            c = c.addDate(0,0,((o<c.getMonth()?-1:1)*c.getDate()));
        }
        return c;
    };
    Date.prototype.addYear = function(year) {
        return this.addDate(year);
    };
    Date.prototype.now = function() {
        return new Date();
    };
    Date.prototype.compare = function(date)
    {    // 현재 날짜가 date보다 이전이면 -1, 같으면 0, 이후이면 1이다.
        let cVal = this.calculator(date);
        return (cVal == 0) ? 0 : ((cVal > 0) ? 1 : -1);
    };
    Date.prototype.calculator = function(val) {
        // 지정된 날자에서 date 만큼을 빼준다. 
        let rst = this.getTime();
        if (val && val instanceof Date) {
            rst = this.getTime() - val.getTime();
        } else if (val && typeof val == 'number') {
            rst = this.getTime() - val;
        } else if (val && typeof val == 'string') {
            if (val === 'max') {
                rst = '29991231235959'.toDate().getTime();
            } else {
                // val : 7y, -3m, 99d, 12h
                let _len = val.length;
                let _val = val.substring(0, _len-1).parseInt(10);
                let _fix = val.substring(_len-1, _len).toLowerCase();
                if (_fix == 'y') rst = this.addYear(_val).getTime();
                if (_fix == 'm') rst = this.addMonth(_val).getTime();
                if (_fix == 'd') rst = this.addDay(_val).getTime();
                if (_fix == 'w') rst = this.addDay(_val*7).getTime();
                if (_fix == 'h') rst = this.addHours(_val).getTime();
            }
        }
        return rst;
    };
    Date.prototype.getLastDay = function()
    {    // 해당월의 마지막 일을 반환.
        let days = '31,28,31,30,31,30,31,31,30,31,30,31';
        if (this.getMonth() == 1 && this.isLeapYear())    // 윤년 2월달이면 일수가 다르다.
            return 29;
        else
            return String(days.split(',')[this.getMonth()]).Int();
    };
    Date.prototype.isLeapYear = function()
    {    // 윤년인지 검사.
        let year = (this.getFullYear() < 1900) ? this.getFullYear() + 1900 : this.getFullYear();
        return ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0);
    };
    Date.prototype.getQuarter = function()
    {    // 분기 반환.
        return (parseInt(this.getMonth() / 3) + 1);
    };
    Date.prototype.getHalf = function()
    {    // 반기 반환. 
        return (parseInt(this.getMonth() / 6) + 1);
    };
    Number.prototype.toWeekName = function(type) {
        let weeks = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat';
        if (type == 1)
            weeks = '일,월,화,수,목,금,토';
        else if (type == 2)
            weeks = '일요일,월요일,화요일,수요일,목요일,금요일,토요일';
        else if (type == 3)
            weeks = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday';
        return weeks.split(',')[this];
    };
    String.prototype.toWeekName = function(type) {
        return this.isFinite() ? parseInt(this).toWeekName(type) : '';
    } ;
    Date.prototype.toWeekName = function(type) {
        return this.getDay().toWeekName(type);
    };
    Date.prototype.getWeek = function()
    {	// 년 주자 반환.
        if (!this.valueOf()) return 0;

        let oDate = new Date(this.getTime());
        oDate.setHours(0, 0, 0, 0);
        let sDate = new Date(oDate.getFullYear(), 0, 1);
        let weekCnt = 0, isFlag = false;
        while( !isFlag ) {
            let std = sDate.addDay((weekCnt*7)),
                etd = sDate.addDay((weekCnt*7)+7);
            isFlag	= (oDate.compare(std) > -1 && oDate.compare(etd) < 0);
            weekCnt++;
        }
        return weekCnt;
    };
    Date.prototype.getWeekOfMonth = function()
    {	// 월 주자 반환.
        if (!this.valueOf()) return 0;

        let oDate = new Date(this.getTime()),
            sDate = oDate.addDay(-oDate.getDate()+1);
        let weekCnt = 0, isFlag = false;
        while( !isFlag ) {
            let std = sDate.addDay((weekCnt*7)),
                etd = sDate.addDay((weekCnt*7)+7);
            isFlag	= (oDate.compare(std) > -1 && oDate.compare(etd) < 0);
            weekCnt++;
        }
        return weekCnt;
    };
    Date.prototype.getTimes = function() {
        return {
            hh : this.getHours(),
            mi : this.getMinutes(),
            ss : this.getSeconds(),
            time:this.getTime(),
        };
    };
    Number.prototype.toMeridiem = function(type) {
        let meridiem = '';
        if (type == 1)
            meridiem = 'AM,PM'.split(',');
        else if (type == 2)
            meridiem = '오전,오후'.split(',');
        else
            meridiem = 'am,pm'.split(',');

        return meridiem[(this > 12 ? 1 : 0)];
    };
    String.prototype.toMeridiem = function(type) {
        return this.isFinite() ? parseInt(this).toMeridiem(type) : '';
    };
    Date.prototype.toMeridiem = function() {
        return this.getHours().toMeridiem();
    };
    /** "20080223153033".toDate().format('yyyy-mm-dd hh:mi:ss E0') */
    Date.prototype.format = function(format, isLocal = true) {
        if (!this.valueOf()) return ' ';
        let d = this;
        let M = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(',');
        let m = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
        let formatting = function() {
            format = format||'S';
            // Standard DateTime Formatting
            if (format && format.length == 1) {
                switch (format) {
                    case 't' : // "09:05 PM"                          ShortTime
                        return isLocal ? 'hh:mm TT'   : 'hh:mm TT';
                    case 'T' : // "09:05:07 PM"                       LongTime
                        return isLocal ? 'hh:mm:ss TT': 'hh:mm:ss TT';
                    case 'd' : // "04.16.2014"                        ShortDate
                        return isLocal ? 'yyyy.MM.dd' : 'dd.MM.yyyy';
                    case 'D' : // "Wednesday, April  16, 2014"        LongDate
                        return isLocal ? 'yyyy-MM-dd, E2' : 'E3, MMMM dd, yyyy';
                    case 'm' : // "Apr 16"                             MonthDay
                        return isLocal ? 'MM-dd' : 'MMM dd';
                    case 'M' : // "April  16"                          MonthDay
                        return isLocal ? 'MM-dd' : 'MMMM dd';
                    case 'y' : // "Apr, 2014"                          YearMonth
                        return isLocal ? 'yyyy-MM' : 'MMM, yyyy';
                    case 'Y' : // "April, 2014"                        YearMonth
                        return isLocal ? 'yyyy-MM' : 'MMMM, yyyy';
                    case 'f' : // "Wednesday, April  16, 2014 09:05 AM" LongDate+ShortTime
                        return isLocal ? 'yyyy-MM-dd, E2 Tt hh:mm' : 'E3, MMMM dd, yyyy hh:mm TT';
                    case 'F' : // "Wednesday, April  16, 2014 09:05:07 AM" FullDateTime
                        return isLocal ? 'yyyy년 MM월 dd일, E2 Tt hh시 mm분 ss초' : 'E3, MMMM dd, yyyy hh:mm:ss TT'; 
                    case 'g' : // "04/16/2014 09:05 AM"               ShortDate+ShortTime
                        return isLocal ? 'yyyy-MM-dd Tt hh:mm' : 'dd/MM/yyyy hh:mm TT';
                    case 'G' : // "04/16/2014 09:05:07 AM"            ShortDate+LongTime
                        return isLocal ? 'yyyy-MM-dd Tt hh:mm:ss' : 'dd/MM/yyyy hh:mm:ss TT';
                    case 'r' : // "Wed, 16 Mar 2008 09:05:07 GMT"      RFC1123
                        return 'E0, dd MMM yyyy hh:mm:ss GMT'+d.getTimezoneOffset(); 
                    case 'S' : // "2014-04-16 09:05:07"                SortableDateTime
                        return 'yyyy-MM-dd HH:mm:ss';
                    case 's' : // "2014-04-16T09:05:07"                SortableDateTime
                        return 'yyyy-MM-ddTHH:mm:ss';
                    case 'u' : // "2014-04-16 09:05:07Z"
                        return 'yyyy-MM-dd HH:mm:ssZ';
                }
            }
            return format;
        };
        return formatting().replace(/(yyyy|yy|MMMM|MMM|MM|dddd|dd|yw|mw|E0|E1|E2|E3|HH|hh|mm|ssss|ss|tt|TT|Tt)/gi, function ($1) {
            switch ($1) {
                case 'yyyy': return d.getFullYear();
                case 'yy'  : return String(d.getFullYear() % 1000).digits(2);                
                case 'MMMM': return M[d.getMonth()];
                case 'MMM' : return m[d.getMonth()];
                case 'MM'  : return String(d.getMonth() + 1).digits(2);
                case 'dddd': return d.getDay().toWeekName(3);
                case 'dd'  : return String(d.getDate()).digits(2);
                case 'yw'  : return d.getWeek();
                case 'mw'  : return d.getWeekOfMonth();
                case 'E0'  : return d.getDay().toWeekName(0);
                case 'E1'  : return d.getDay().toWeekName(1);
                case 'E2'  : return d.getDay().toWeekName(2);
                case 'E3'  : return d.getDay().toWeekName(3);
                case 'HH'  : return String(d.getHours()).digits(2);
                case 'hh'  : return String(d.getHours()%12).digits(2);
                case 'mm'  : return String(d.getMinutes()).digits(2);                
                case 'ss'  : return String(d.getSeconds()).digits(2);
                case 'ssss': return d.getMilliseconds();
                case 'tt'  : return d.getHours().toMeridiem(0);
                case 'TT'  : return d.getHours().toMeridiem(1);
                case 'Tt'  : return d.getHours().toMeridiem(2);
                default: return $1;
            }
        });
    };
})();