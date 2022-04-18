/* 
 * String prototype 
 */
String.prototype.meta = function() {
    var str = this;
    var result = '';
    for(var i = 0; i < str.length; i++) {
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
String.prototype.isDotNumber = function()
{	// 소수점 2자리 까지
    return (this.search(/^(?:\d*\.\d{1,2}|\d+)$/ ) != -1);
};
String.prototype.isKor = function() {
    return (/^[가-힣]+$/).test(this.remove(arguments[0])) ? true : false;
};
String.prototype.isEmail = function() {
    return (/\w+([-+.]\w+)*@\w+([-.]\w+)*\.[a-zA-Z]{2,4}$/).test(this.trim());
};
String.prototype.isUrl = function() {
    return (/(file|ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).test(this.trim());
};
String.prototype.isPhone = function() {
    var arg = arguments[0]||'';
    return eval('(/(02|0[3-9]{1}[0-9]{1})'+ arg +'[1-9]{1}[0-9]{2,3}'+ arg +'[0-9]{4}$/).test(this)');
};
String.prototype.isMobile = function() {
    var arg = arguments[0]||'';
    return eval('(/01[016789]'+ arg +'[1-9]{1}[0-9]{2,3}'+ arg +'[0-9]{4}$/).test(this)');
};
String.prototype.Int = function()
{   // 10진수 숫자로 변환.
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
String.prototype.toComma = function()
{	// 숫자에 3자리마다 , 를 찍어서 반환
    var s = (this.nvl('0')).trim();
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
    var p = 1;
    if (c) {
        for (var i = 0; i < c; i++) p = p*10;
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
        var s = '';
        for (var i = this.length; i < cnt; i++) {
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
        var s = '';
        for (var i = this.length; i < cnt; i++) {
            s += str;
        }
        return this + s;
    } else {
        return this;
    }
};
String.prototype.digits = function(cnt)
{	// 숫자의 자리수(cnt)에 맞도록 반환
    return this.padLeft(cnt, '0');
};
Number.prototype.digit = function(cnt)
{	// 숫자의 자리수(cnt)에 맞도록 반환
    return String(this).digits(cnt);
};
String.prototype.startWith = function(str) {
    if (this.equals(str))    return true;
    if (str.length > 0)
        return (str.equals(this.substr(0, str.length)));
    else
        return false;
};
String.prototype.endWith = function(str) {
    if (this.equals(str))    return true;
    if (String(str).length > 0)
        return (str.equals(this.substr(this.length - str.length, str.length)));
    else
        return false;
};
String.prototype.bytes = function()
{	// 바이트 계산.
    var b = 0;
    for (var i=0; i<this.length; i++) b += (this.charCodeAt(i) > 128) ? 2 : 1;
    return b;
};
String.prototype.getBytesLength = function() {
    var s = this, b = '';
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
String.prototype.substringBytes = function(start, limitBytes)
{    // 원하는 바이트 까지 잘라서 반환.
    var b = 0, l = 0, s = '';
    for(var i=0; i<this.length; i++) {
        b = (this.charCodeAt(i) > 128) ? 2 : 1;
        if (i >= start) {
            l += b;
            s += this.charCodeAt(i);
        }
        if (l >= limitBytes)
            break;
    }
    return s;
};
String.prototype.indexesOf = function(ptn) {
    var p=0, s=-1, h=-1;
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
// "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
String.prototype.format = function() {
    var args = arguments;
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
String.prototype.removeHtml = function() {
    return this.replace(/[<][^>]*[>]/gi, ' ');
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
    }
    catch (e) {
        return this;
    }
};
String.prototype.decode = function() {
    try {
        return decodeURIComponent(this);
    }
    catch (e) {
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
String.prototype.devide = function(q) { // ','가 포함된숫자 처리, 0으로 나눌 때 처리
    let a = isNaN(this.getNumber())?0:this.getNumber(),
        b = isNaN(q)?0:q,
        r = a / b;
    return isNaN(r)?0:r;
}
//날자 체크 (년/월/일 검사)
String.prototype.isDate = function() {
    // yyyy-mm-dd
    if ((/^(19|20)\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(this)) return true;
    // mm-dd-yyyy
    if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](19|20)\d{2}$/).test(this)) return true;
    // yy-mm-dd
    if ((/^\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(this)) return true;
    // mm-dd-yy
    if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2}$/).test(this)) return true;

    return false;
};
//시간 체크    hh:mm:ss
String.prototype.isTime = function() {
    return (/^(2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this);
};
//날자시간 체크 
String.prototype.isDateTime = function() {
    // yyyy-mm-dd hh:mm:ss
    if ((/^(19|20)\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this)) return true;
    // mm-dd-yyyy hh:mm:ss
    if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](19|20)\d{2} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this)) return true;
    // yy-mm-dd hh:mm:ss
    if ((/^\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this)) return true;
    // mm-dd-yyyy hh:mm:ss
    if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(this)) return true;

    return false;
};
String.prototype.toDate = function() {
    var s = d = t = '';
    var y = m = d = hh = mm = ss = 0;
    if (this.isNumber())
    {    // 숫자로만 구성된 문자열
        if (this.length > 7) {
            y = String(this.substr(0, 4)).parseInt();
            m = String(this.substr(4, 2)).parseInt();
            d = String(this.substr(6, 2)).parseInt();
            if (this.length == 10)
            {	// YYYYMMDDhh
                hh= String(this.substr(8, 2)).parseInt();
            }
            else if (this.length == 12)
            {	// YYYYMMDDhhmm
                hh= String(this.substr(8, 2)).parseInt();
                mm= String(this.substr(10,2)).parseInt();
            }
            else if (this.length == 14)
            {	// YYYYMMDDhhmmss    
                hh= String(this.substr(8, 2)).parseInt();
                mm= String(this.substr(10,2)).parseInt();
                ss= String(this.substr(12,2)).parseInt();
            }
        }
    }
    else {
        var srz = (this.length > 20) ? String(this.split(",")[0]) : this;
        if ((/^(19|20)\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(srz))
        {	// yyyy-mm-dd, yyyy/mm/dd
            s = (srz.split('-').length == 3) ? srz.split('-') : srz.split('/');
            y = String(s[0]).parseInt();
            m = String(s[1]).parseInt();
            d = String(s[2]).parseInt();
        }
        if ((/^\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])$/).test(srz))
        {	// yy-mm-dd, yy/mm/dd
            s = (srz.split('-').length == 3) ? srz.split('-') : srz.split('/');
            y = String(s[0]).parseInt() + 1900;
            m = String(s[1]).parseInt();
            d = String(s[2]).parseInt();
        }
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](19|20)\d{2}$/).test(srz))
        {	// mm-dd-yyyy, mm/dd/yyyy
            s = (srz.split('-').length == 3) ? srz.split('-') : srz.split('/');
            y = String(s[2]).parseInt();
            m = String(s[0]).parseInt();
            d = String(s[1]).parseInt();
        }
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-]\d{2}$/).test(srz))
        {	// mm-dd-yy, , mm/dd/yy
            s = (srz.split('-').length == 3) ? srz.split('-') : srz.split('/');
            y = String(s[2]).parseInt() + 1900;
            m = String(s[0]).parseInt();
            d = String(s[1]).parseInt();
        }
        if ((/^(19|20)\d{2}[\/-](0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1]) (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(srz))
        {	// yyyy-mm-dd hh:mm:ss, yyyy/mm/dd  hh:mm:ss
            s = ( srz.split(' '));
            d = (s[0].split('-').length == 3) ? s[0].split('-') : s[0].split('/');;
            t = (s[1].split(':'));
            y = String(d[0]).parseInt();
            m = String(d[1]).parseInt();
            d = String(d[2]).parseInt();
            hh= String(t[0]).parseInt();
            mm= String(t[1]).parseInt();
            ss= (t.length == 3 ? String(t[2]).parseInt() : 0);
        }
        if ((/^(0[1-9]|1[012])[\/-](0[1-9]|[12][0-9]|3[0-1])[\/-](19|20)\d{2} (2[0-3]|[0-1]\d)(:[0-5]\d){1,2}$/).test(srz))
        {	// mm-dd-yyyy hh:mm:ss, mm/dd/yyyy hh:mm:ss
            s = ( srz.split(' '));
            d = (s[0].split('-').length == 3) ? s[0].split('-') : s[0].split('/');;
            t = (s[1].split(':'));
            y = String(d[2]).parseInt();
            m = String(d[0]).parseInt();
            d = String(d[1]).parseInt();
            hh= String(t[0]).parseInt();
            mm= String(t[1]).parseInt();
            ss= (t.length == 3 ? String(t[2]).parseInt() : 0);
        }
    }
    return (y > 0) ? new Date(y, (m-1), d, hh, mm, ss) : null;
};

Number.prototype.toJSON	=
    Boolean.prototype.toJSON=
        String.prototype.toJSON	= function (key) {
            return '{"'+ key +'" : "'+ this.valueOf() +'"}';
        };
Date.prototype.toJSON = function (key, format) {
    return String(isFinite(this.valueOf()) ? this.format((format||'yyyy-mm-dd HH:mi:ss')) : "").toJSON(key);
};


var JSONtoString = function(obj, step) {
    if (typeof step == 'number' && step > 2) return "''";
    var cnt		= 0;
    var json	= '';
    var depth	= (typeof step == 'number') ? step : 0;
    for(var prop in obj) {
        if (typeof obj[prop] != 'function') {
            if (cnt > 0) json += ',';
            if (typeof obj[String(prop)] == 'object') {
                json+= "'"+ prop +"':"+ JSONtoString(obj[String(prop)], depth++) +"";
            }
            else {
                json+= "'"+ prop +"':'"+ String(obj[String(prop)]).encode() +"'";
            }
            cnt ++;
        }
    }
    return '{'+ json +'}';
};
var serializeQuerystring = function(obj) {
    if (!!!obj) return obj;
    var query = [];
    for(var prop in obj) {
        if (typeof obj[prop] != 'function') {
            query[query.length] = String('{0}={1}').format(prop, String(obj[String(prop)]).encode());
        }
    }
    return query.join('&');
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
    return this.addDate(0, month);
};
Date.prototype.addYear = function(year) {
    return this.addDate(year);
};
Date.prototype.now = function() {
    return new Date();
};
Date.prototype.compare = function(date)
{    // 현재 날짜가 date보다 이전이면 -1, 같으면 0, 이후이면 1이다.
    var cVal = this.calculator(date);
    return (cVal == 0) ? 0 : ((cVal > 0) ? 1 : -1);
};
Date.prototype.calculator = function(date)
{    // 지정된 날자에서 date 만큼을 빼준다. 
    return this.getTime() - date.getTime();
};
Date.prototype.getLastDay = function()
{    // 해당월의 마지막 일을 반환.
    var days = '31,28,31,30,31,30,31,31,30,31,30,31';
    if (this.getMonth() == 1 && this.isLeapYear())    // 윤년 2월달이면 일수가 다르다.
        return 29;
    else
        return String(days.split(',')[this.getMonth()]).Int();
};
Date.prototype.isLeapYear = function()
{    // 윤년인지 검사.
    var year = (this.getFullYear() < 1900) ? this.getFullYear() + 1900 : this.getFullYear();
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
    var weeks = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat';
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

    var oDate = new Date(this.getTime());
    oDate.setHours(0, 0, 0, 0);
    var sDate = new Date(oDate.getFullYear(), 0, 1);
    var weekCnt = 0, isFlag = false;
    while( !isFlag ) {
        var std = sDate.addDay((weekCnt*7)),
            etd = sDate.addDay((weekCnt*7)+7);
        isFlag	= (oDate.compare(std) > -1 && oDate.compare(etd) < 0);
        weekCnt++;
    }
    return weekCnt;
};
Date.prototype.getWeekOfMonth = function()
{	// 월 주자 반환.
    if (!this.valueOf()) return 0;

    var oDate = new Date(this.getTime()),
        sDate = oDate.addDay(-oDate.getDate()+1);
    var weekCnt = 0, isFlag = false;
    while( !isFlag ) {
        var std = sDate.addDay((weekCnt*7)),
            etd = sDate.addDay((weekCnt*7)+7);
        isFlag	= (oDate.compare(std) > -1 && oDate.compare(etd) < 0);
        weekCnt++;
    }
    return weekCnt;
};
Number.prototype.toMeridiem = function(type) {
    var meridiem = '';
    if (type == 1)
        meridiem = 'am,pm'.split(',');
    else if (type == 2)
        meridiem = '오전,오후'.split(',');
    else
        meridiem = 'am,pm'.split(',');

    return meridiem[(this > 12 ? 1 : 0)];
};
String.prototype.toMeridiem = function(type) {
    return this.isFinite() ? parseInt(this).toMeridiem(type) : '';
};
Date.prototype.toMeridiem = function(type) {
    return this.getHours().toMeridiem();
};
//  "20080223153033".toDate().format('yyyy-mm-dd hh:mi:ss E0')
Date.prototype.format = function (f) {
    if (!this.valueOf()) return ' ';
    var d = this;
    return f.replace(/(yyyy|yy|mm|dd|yw|mw|E0|E1|E2|hh|mi|ss|a\/p)/gi, function ($1) {
        switch ($1) {
            case 'yyyy': return d.getFullYear();
            case 'yy' : return String(d.getFullYear() % 1000).digits(2);
            case 'mm' : return String(d.getMonth() + 1).digits(2);
            case 'dd' : return String(d.getDate()).digits(2);
            case 'yw' : return d.getWeek();
            case 'mw' : return d.getWeekOfMonth();
            case 'E0' : return d.getDay().toWeekName(0);
            case 'E1' : return d.getDay().toWeekName(1);
            case 'E2' : return d.getDay().toWeekName(2);
            case 'HH' : return String(d.getHours()).digits(2);
            case 'hh' : return String((h = d.getHours() % 12) ? h : 12).digits(2);
            case 'mi' : return String(d.getMinutes()).digits(2);
            case 'ss' : return String(d.getSeconds()).digits(2);
            case 'a/p': return d.getHours().toMeridiem(2);
            default: return $1;
        }
    });
};


/* 
 * Common function 
 */
var StringBuilder = function(str) {
    this.buffer = [];
    this.append(str);
};
StringBuilder.prototype = {
    append : function(str) {
        if (str) this.buffer.push(str);
        return this;
    },
    clear : function() {
        this.buffer.length = 0;
        return this;
    },
    size : function() {
        return this.buffer.length;
    },
    toString : function(s) {
        return this.buffer.join(s || "");
    }
};
/*--------------------------------------------------------------------------------*\
 * Cookie object
\*--------------------------------------------------------------------------------*/
var oCookie = function(expiresDay, domain, path) {
    var expires	= (typeof expiresDay == 'number') ? expiresDay : 1,
        domain	= (domain||''),
        path	= (path||'/');
    return {
        get : function(cName) {
            if (!(cName||'')) return;
            var cookieName = escape(cName)+'=',
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
            return decodeURIComponent(cookieValue);
        },
        set : function(cName, cValue, expireDays, secure ) {
            this.setOwner(cName, cValue, (typeof expireDays == 'number' ? expireDays : expires), (typeof secure == 'boolean' ? secure : false))
            return this;
        },
        setOwner : function(cName, cValue, expire, secure) {
            var cookie  = [escape(cName) + '=' + encodeURIComponent(cValue)],
                expdate = new Date();

            expdate.setDate(expdate.getDate() + (typeof expire == 'number' ? expire : expires));
            cookie.push('expires='+expdate.toGMTString());
            if (!!domain)cookie.push('domain='+domain);
            if (!!path)	 cookie.push('path='+path);
            if (!!secure)cookie.push('secure');

            document.cookie = cookie.join('; ');
        },
        remove : function(name) {
            return this.set(name, '', -1);
        },
        getItem : function(name) {
            return this.get(name);
        },
        setItem : function(name, value) {
            this.set(name, value);
        },
        removeItem : function(name) {
            this.remove(name);
        },
        clear : function() {
            return;
        }
    };
};
/*--------------------------------------------------------------------------------*\
 * Query collection
\*--------------------------------------------------------------------------------*/
var oQuery = function() {
    if (typeof window.$Query != 'object') {
        var o = new Object();
        o._encode = function(s) {
            return encodeURIComponent(s);
        };
        o._decode = function(s) {
            if (!s) return '';
            return decodeURIComponent(s.replace(/\+/g, " ")); // 인코딩된 공백문자열을 다시 공백으로
        };
        o.getParam = function(name) {
            return this[name];
        };
        o.getQuery = function() {
            var query = '';
            for(var q in this) {
                if (typeof this[q] != 'function') {
                    query += (query ? '&' : '?') + q + '=' + this[q];
                }
            }
            return query;
        };
        o.setQuery = function(key, value) {
            this[key] = value;
        };
        o.getUrl = function() {
            var loc   = window.document.location;
            var query = this.getQuery();
            return loc.origin + loc.pathname + query + loc.hash;
        };

        var q = location.search.substring(1);
        if (q){
            var vg = /([^&=]+)=?([^&]*)/g;    // 그룹화 정규식.
            var tmp;
            while (tmp = vg.exec(q)) {
                (function() {
                    var k = o._decode(tmp[1]);
                    var v = o._decode(tmp[2]);
                    var c;
                    if (k) {
                        o[k] = v;
                        //c = k.charAt(0).toUpperCase() + k.slice(1);
                        //o["get" + c] = function() { return v; }
                        //o["set" + c] = function(val) { v = val; }
                    }
                })();
            }
        }
        window.$Query = o;
    }
    return window.$Query;
};
/*--------------------------------------------------------------------------------*\
 * Cache object
 * var _c = oCache({type:'local', span:5, format:'m'});	// localStorage 5min cache.
\*--------------------------------------------------------------------------------*/
var oCache = function(options) {
    // type, span/* integer */, format/* s, m, h, d, M, y, w */
    var _opts	 = options || {},
        _type	 = _opts['type']  || 'cache', // cache || local || session
        _span	 = _opts['span']  || 0,
        _format	 = _opts['format']|| 's',
        _expires = _opts['date']  || getCacheExpires(_span, _format),
        _prifix	 = _opts['prifix']|| '';
    var _storage = null;
    var _default = {
        set : function() { return;},
        get : function() { return '';},
        isStatus : function() { return false;},
        remove: function() { return; },
        clear : function() { return; }
    };

    if (_type == 'session') {
        if (!window.sessionStorage) return _default;
        _storage = window.sessionStorage;
        _expires = _expires || getCacheExpires(12, 'h'); // 12 hours
    }
    else if (_type == 'cache') {
        if (!window.sessionStorage) return _default;
        _storage = window.sessionStorage;
        _expires = _expires || getCacheExpires(5, 'm'); // 5 minutes
    }
    else if (_type == 'local') {
        if (!window.localStorage) return _default;
        _storage = window.localStorage;
        _expires = _expires || getCacheExpires(7, 'd'); // 7 days
    }
    else if (_type == 'cookie') {
        _storage = oCookie(1);
        _expires = _expires || getCacheExpires(1, 'd'); // 1 days
    }
    else {
        return _default;
    }

    function getCacheExpires(s, f) {
        var exp = 0;
        switch(f) {
            case 's' : exp = s;					 break;
            case 'm' : exp = s * 60;				 break;
            case 'h' : exp = s * 60 * 60;			 break;
            case 'd' : exp = s * 60 * 60 * 24;		 break;
            case 'w' : exp = s * 60 * 60 * 24 * 7;	 break;
            case 'M' : exp = s * 60 * 60 * 24 * 30; break;
            case 'y' : exp = s * 60 * 60 * 24 * 365;break;
        }
        return exp;
    }

    return {
        type    : _type + (_prifix ? '/'+_prifix : ''),
        expires : _expires,
        storage : _storage,
        set : function(name, value, expires) {
            if (!!!name)  return;
            if (!!!value) return;
            if (!!!expires) {
                expires = this.expires;
            }
            else {
                if (typeof expires == 'object' && expires instanceof Date) {
                    expires = Math.round((expires.getTime() - (new Date()).getTime()) / 1000);
                }
                else if (typeof expires != 'number') {
                    expires = this.expires;
                }
            }
            var schedule = Math.round((new Date()).getTime()/1000) + expires;
            try {
                this.storage.setItem(this.type +'@d_'+ name, value);
                this.storage.setItem(this.type +'@t_'+ name, schedule);
            } catch(e) {
                // security mode
            }
            return this;
        },
        get : function(name) {
            if (this.isStatus(name)) {
                return this.storage.getItem(this.type +'@d_'+ name);
            }
            else {
                return '';
            }
        },
        isStatus : function(name) {
            if (!!!this.storage.getItem(this.type +'@t_'+ name)) return false;

            var current_sec= Math.round((new Date()).getTime()/1000),
                stored_sec	= this.storage.getItem(this.type +'@t_' + name) || 0;

            // Expired
            if (stored_sec < current_sec) {
                this.remove(name);
                return false;
            } else {
                return true;
            }
        },
        remove : function(name) {
            this.storage.removeItem(this.type +'@d_'+ name);
            this.storage.removeItem(this.type +'@t_'+ name);
            return this;
        },
        clear : function() {
            for (var item in this.storage) {
                if (String(item).startWith(this.type)) {
                    this.storage.removeItem(item);
                }
            }
            //this.storage.clear();
            return this;
        }
    };
};
 