/*--------------------------------------------------------------------------------*\
* Date prototype
\*--------------------------------------------------------------------------------*/
Date.prototype.addSeconds = function(seconds) {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds() + seconds);
}
Date.prototype.addMinutes = function(minutes) {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes() + minutes, this.getSeconds());
}
Date.prototype.addHours = function(hours) {
	return new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours() + hours, this.getMinutes(), this.getSeconds());
}
Date.prototype.addDay = function(day) {
	return new Date(this.getFullYear(), this.getMonth(), this.getDate() + day, this.getHours(), this.getMinutes(), this.getSeconds());
}
Date.prototype.addMonth = function(month) {
	return new Date(this.getFullYear(), this.getMonth() + month, this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds());
}
Date.prototype.addYear = function(year) {
	return new Date(this.getFullYear() + year, this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds());
}
Date.prototype.now = function() {
	return new Date();
}
Date.prototype.parseDate = function(dateString, spliter)
{
	var arr = dateString.split(spliter);

	if (arr.length == 3)
		return new Date(String(arr[0]).Int(), String(arr[1]).Int()-1, String(arr[2]).Int());
	else
		return new Date();
}
Date.prototype.compare = function(date) 
{	// 현재 날짜가 date보다 이전이면 -1, 같으면 0, 이후이면 1이다.
	var cVal = this.calculator(date);

	return (cVal == 0) ? 0 : (cVal > 0) ? 1 : -1;
}
Date.prototype.calculator = function(date) 
{	// 지정된 날자에서 date 만큼을 빼준다. 
	return this - date;
}
Date.prototype.getLastDay = function() 
{	// 해당월의 마지막 일을 반환.
	var days = "31,28,31,30,31,30,31,31,30,31,30,31";
	if (this.getMonth() == 1 && this.isLeapYear())	// 윤년 2월달이면 일수가 다르다.
		return 29;
	else
		return String(days.split(',')[this.getMonth()]).Int();
}
Date.prototype.isLeapYear = function() 
{	// 윤년인지 검사.
	var year = (this.getFullYear() < 1900) ? this.getFullYear() + 1900 : this.getFullYear();
	return ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0);
}
Date.prototype.getQuarter = function() 
{	// 분기 반환.
	return (parseInt(this.getMonth() / 3) + 1); 
}
Date.prototype.getHalf = function() 
{	// 반기 반환. 
	return (parseInt(this.getMonth() / 6) + 1);
}
Date.prototype.toDateString = function(type)
{
	type = typeof(type) == "number" ? type : 0;	
	var returnStr = "YYMMDD";

	switch (type) {
		case  0	: returnStr = "YYMMDD";		break;
		case  1	: returnStr = "YY-MM-DD";		break;
		case  2	: returnStr = "YY/MM/DD";		break;
		case 10	: returnStr = "YY년 MM월 DD일 "	+ this.toWeekString(2);	break;
		case 11	: returnStr = "YY-MM-DD "			+ this.toWeekString(1);	break;
		case 12	: returnStr = "YY/MM/DD "			+ this.toWeekString(0);	break;
		default	: returnStr = "YY년 MM월 DD일";
	}
	return returnStr.replace("YY", this.getFullYear()).replace("MM", String(this.getMonth()+1).digits(2)).replace("DD", String(this.getDate()).digits(2));
}
Date.prototype.toDateTimeString = function(type)
{
	type = typeof(type) == "number" ? type : 0;	
	var returnStr = "YYYYMMDD";
	
	switch (type) {
		case  0	: returnStr = "HHMMSS";				break;
		case  1	: returnStr = "HH:MM:SS";				break;
		case  2	: returnStr = "HH:MM:SS";				break;
		case 10	: returnStr = "HH시 MM분 SS초";		break;
		case 11	: returnStr = "HH:MM:SS";				break;
		case 12	: returnStr = "HH:MM:SS";				break;
		default	: returnStr = "HH시 MM분 SS초";		break;
	}
	return this.toDateString(type) +" "+ returnStr.replace("HH", String(this.getHours()).digits(2) ).replace("MM", String(this.getMinutes()).digits(2)).replace("SS", String(this.getSeconds()).digits(2));
}
Date.prototype.toWeekString = function(type)
{
	var weeks = "";
	if (type == 1)
		weeks = "일,월,화,수,목,금,토".split(",");
	else if (type == 2)
		weeks = "일요일,월요일,화요일,수요일,목요일,금요일,토요일".split(",");
	else
		weeks = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(",");

	return weeks[this.getDay()];
}


Number.prototype.toJSON	=
Boolean.prototype.toJSON	= 
String.prototype.toJSON	= function (key) {
	return jQuery.parseJSON('{"'+ key +'" : "'+ this.valueOf() +'"}');
};

Date.prototype.toJSON = function (key, type) {
	type = typeof(type) == "number" ? type : 0;	
	return String(isFinite(this.valueOf()) ? this.toDateTimeString(type) : "").toJSON(key);
};
