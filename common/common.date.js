/* common.date.js - Date prototype
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2012/09/23
	https://github.com/dragonslam/javascript_library/blob/master/common/common.date.js
*/
Date.prototype.addDate = function(yy, mm, dd, hh, mi, ss, ms) {
	return new Date(
			this.getFullYear()	+ (yy||0),
			this.getMonth() 	+ (mm||0),
			this.getDate() 		+ (dd||0),
			this.getHours() 	+ (hh||0),
			this.getMinutes() 	+ (mi||0),
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
Date.prototype.parseDate = function(dateString, spliter) {
    var arr = dateString.split(spliter);
    if (arr.length == 3)
        return new Date(String(arr[0]).Int(), String(arr[1]).Int()-1, String(arr[2]).Int());
    else
        return null;
};
Date.prototype.compare = function(date) 
{    // 현재 날짜가 date보다 이전이면 -1, 같으면 0, 이후이면 1이다.
    var cVal = this.calculator(date);
    return (cVal == 0) ? 0 : ((cVal > 0) ? 1 : -1);
};
Date.prototype.calculator = function(date) 
{    // 지정된 날자에서 date 만큼을 빼준다. 
    return this - date;
};
Date.prototype.getLastDay = function() 
{    // 해당월의 마지막 일을 반환.
    var days = "31,28,31,30,31,30,31,31,30,31,30,31";
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
Date.prototype.toDateString = function(type) {
    type = typeof(type) == "number" ? type : 0;    
    var f = "yyyyMMdd";

    switch (type) {
        case	0	: f = "yyyyMMdd";			break;
        case	1	: f = "yyyy-MM-dd";			break;
        case	2	: f = "yyyy/MM/dd";			break;
        case	10	: f = "yyyy년 MM월 dd일";	break;
        case	11	: f = "yyyy-MM-dd";			break;
        case	12	: f = "yyyy/MM/dd";			break;
        default	: f = "yy년 MM월 dd일";	break;
    }
    return this.format(f);
};
Date.prototype.toDateTimeString = function(type) {
    type = typeof(type) == "number" ? type : 0;    
    var f = "hhmmss";
    
    switch (type) {
        case  0    : f = "hhmmss";        break;
        case  1    : f = "hh:mm";        break;
        case  2    : f = "hh:mm";        break;
        case 10    : f = "hh:mm";        break;
        case 11    : f = "hh:mm:ss";    break;
        case 12    : f = "hh:mm:ss";    break;
        default    : f = "hh시 mm분 ss초";    break;
    }
    return this.toDateString(type) +" "+ this.format(f); 
};

Number.prototype.toWeekName = function(type) {    
    var weeks = "";
    if (type == 1)
        weeks = "일,월,화,수,목,금,토".split(",");
    else if (type == 2)
        weeks = "일요일,월요일,화요일,수요일,목요일,금요일,토요일".split(",");
    else
        weeks = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(",");

    return weeks[this];
};
String.prototype.toWeekName = function(type) {
    return this.isFinite() ? parseInt(this).toWeekName(type) : '';
} ;
Date.prototype.toWeekName = function(type) {
    return this.getDay().toWeekName();
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
	if (sDate.getDay() >= 1) {
		weekCnt++;	// 매월 1일이 주중일 경우 시작 주일을 추가.
	}
	return weekCnt; 
};
Number.prototype.toMeridiem = function(type) {    
    var meridiem = "";
    if (type == 1)
        meridiem = "am,pm".split(",");
    else if (type == 2)
        meridiem = "오전,오후".split(",");
    else
        meridiem = "am,pm".split(",");

    return meridiem[(this > 12 ? 1 : 0)];
};
String.prototype.toMeridiem = function(type) {
    return this.isFinite() ? parseInt(this).toMeridiem(type) : '';
};
Date.prototype.toMeridiem = function(type) {
    return this.getHours().toMeridiem();
};

Date.prototype.format = function (f) {

    if (!this.valueOf()) return " ";    

    var d = this;
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function ($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return String(d.getFullYear() % 1000).digits(2);
            case "MM": return String(d.getMonth() + 1).digits(2);
            case "dd": return String(d.getDate()).digits(2);
            case "E0": return d.getDay().toWeekName(0);
            case "E1": return d.getDay().toWeekName(1);
            case "E2": return d.getDay().toWeekName(2);            
            case "HH": return String(d.getHours()).digits(2);
            case "hh": return String((h = d.getHours() % 12) ? h : 12).digits(2);
            case "mm": return String(d.getMinutes()).digits(2);
            case "ss": return String(d.getSeconds()).digits(2);
            case "a/p": return d.getHours().toMeridiem(2);
            default: return $1;
        }
    });
};
