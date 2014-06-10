var GV_IsConsoleLogging = true;

function $Logging(msg) {
    if (GV_IsConsoleLogging)
        if (window.console && typeof(window.console) == "object")
			window.console.log(msg);
        else
            alert(msg);
	
	return msg;
}
document.onfocusin = function() {
    if(event.srcElement.tagName=="A"||event.srcElement.tagName=="IMG") document.body.focus(); 
}

/*--------------------------------------------------------------------------------*\
* Dynamic script loading 
/*--------------------------------------------------------------------------------*/
var LoadScript = function(url, callback, charset, defer, id) {
	if (typeof url != 'string' || url.isEmpty()) return;
		
	var head = document.getElementsByTagName('head')[0];	
	var script = document.createElement('script');
	var charset = (charset && typeof charset == 'string') ? charset : 'UTF-8';
	
	if (id && typeof id == 'string' && id != ''){
		script.id = id;
	}
	script.src = url;
	script.charset = charset;
	script.type = 'text/javascript';
	script.defer = (defer && typeof defer == 'boolean') ? 'defer' : '';
	
	var loaded = false;
	if (typeof callback == 'function') {
		script.onreadystatechange = function() {
			if (this.readyState == 'loaded' || this.readyState == 'complate') {
				if (loaded) return;
				callback(true);
				loaded = true;
			}
		};
		script.onload = function() {
			callback(true);
			loaded = true;
		};
	}
	
	head.appendChild(script);
};

/*--------------------------------------------------------------------------------*\
* Mobile device check 
/*--------------------------------------------------------------------------------*/
var MobileDevice = function() {
	
	if (typeof window.$MobileDevice != 'object') {
		var nv = window.navigator;
		var pf = nv.platform;
		var ua = nv.userAgent;		
			
		var _iPad		= (/ipad/i.test(pf));
		var _iPhone		= (/iphone/i.test(pf));
		var _iOS		= (_iPad || _iPhone);
		var _Android	= (/linux armv7/i.test(pf));
		var _galtab		= (/SHW-M/i.test(ua));	// 갤텝
		var _Mobile		= (_iOS || _Mobile) ? true : false;
		var _TouchPad	= (/hp-tablet/gi).test(nv.appVersion);
		var _HasTouch	= 'ontouchstart' in window && !_TouchPad;
		
		window.$MobileDevice = {
				 navigator	: nv
				,agent		: ua
				,platform	: pf
				,isMobile	: _Mobile
				,isIos		: _iOS
				,isIphone	: _iPhone
				,isIpad		: _iPad
				,isAndroid	: _Android
				,isGaltab	: _galtab				
				,isTouchPad	: _TouchPad
				,isTouch	: _HasTouch
				,isTablet	: function() {
					return (this.isGaltab || ($(window).width() > 640));
				} 
				,isWide		: function() {
					return ($(window).width() > $(window).height());
				}
			};
	}
	return window.$MobileDevice;
};

/*--------------------------------------------------------------------------------*\
* StringBuilder object
\*--------------------------------------------------------------------------------*/
var StringBuilder = function()
{ 
    this.buffer = [];
}
StringBuilder.prototype = {
    append : function(str) { 
        this.buffer[this.buffer.length] = str; 
    },
    toString : function(s) { 
        return this.buffer.join(s ? s : ""); 
    }
}


/*--------------------------------------------------------------------------------*\
* Dictionary object
\*--------------------------------------------------------------------------------*/
function Dictionary(id, value) {
    this.id		= id;
	this.value	= value;
}
Dictionary.prototype = {
    toString : function() {
        return "id:"+ this.id +", value:"+ this.value;
    },
    logging : function() {
        return $Logging(this.toString());
    }
}


/*--------------------------------------------------------------------------------*\
* Reflecte object
\*--------------------------------------------------------------------------------*/
var Reflector = function(obj) {
	if (typeof obj != 'object') return null;
	
	return {
		getProperties : function() {
			var properties = [];
			for(var prop in obj) {
				if (typeof obj[prop] != 'function') properties.push(prop);
			}
			return properties;
		},
		getMethod : function() {
			var methods = [];
			for(var method in obj) {
				if (typeof obj[method] == 'function') methods.push(method);
			}
			return methods;
		},
		getOwnMethod : function() {
			var methods = [];
			for(var method in obj) {
				if (typeof obj[method] == 'function' && obj.hasOwnProperty(method)) 
					methods.push(method);
			}
			return methods;
		}
	};
}

/*--------------------------------------------------------------------------------*\
* Clone object
* var o = Object.create(obj);
\*--------------------------------------------------------------------------------*/
var Clone = function(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = Clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = Clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


/*--------------------------------------------------------------------------------*\
* Size object
\*--------------------------------------------------------------------------------*/
function Size(x, y) {
    this.x	= parseInt(x);
	this.y	= parseInt(y);
}
Size.prototype = {
    /*
        @최대 Size에 비례하는 Size를 계산하여 반환.
    */
    balance : function(maxLimit) {
        var balance = new Size(0,0);
        if ((this.x != 0 && this.y != 0) && (maxLimit.x != 0 || maxLimit.y != 0) && (this.x > maxLimit.x || this.y > maxLimit.y)) {

            var aW	= (maxLimit.x  > 0) ? (maxLimit.x / this.x) : 1;
            var aH	= (maxLimit.y  > 0) ? (maxLimit.y / this.y) : 1;

            if (aW <= aH) {
                balance.x	= parseInt(this.x * aW);
                balance.y	= parseInt(this.y * aW);
            } else {
                balance.x	= parseInt(this.x * aH);
                balance.y	= parseInt(this.y * aH);
            }
        } else {
            balance.x	= this.x;
            balance.y	= this.y;
        }
        return balance;
    },
    /*
        @비교하는 size와 같으면 true
    */
    compare : function(size) {
        return ((this.x == size.x) && (this.y == size.y));
    },    
    toString : function() {
        return "x:"+ this.x +",y:"+ this.y;
    },
    logging : function()  {
        return $Logging(this.toString());
    }
}

/*--------------------------------------------------------------------------------*\
* Rectangle object
\*--------------------------------------------------------------------------------*/
function Rectangle(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.offsetX = x + width;
	this.offsetY = y + height;    
}
Rectangle.prototype = {
    containPoint : function() {
        if (arguments && arguments.length > 0) {
            if (arguments.length == 2)  {
                var x = arguments[0];
                var y = arguments[1];
                return ((this.x < x && this.offsetX > x) && (this.y < y && this.offsetY > y));
            }
            else if (typeof arguments[0] == "object") {
                var o = arguments[0];
                if (o instanceof Size) {
                    return ((this.x < o.x && this.offsetX > o.x) && (this.y < o.y && this.offsetY > o.y));
                }
            }
        }
        return false;
    },
    compare : function(rectangle) {
        if (rectangle instanceof Rectangle) {
            return ((this.x == rectangle.x) && (this.y == rectangle.y) 
                && (this.width == rectangle.width) && (this.height == rectangle.height));
        }
        else {
            return false;
        }
    },    
    toString : function() {
        return "x:"+ this.x +",y:"+ this.y +",width:"+ this.width +",height:"+ this.height;
    },
    logging : function()  {
        return $Logging(this.toString());
    }
};

/*--------------------------------------------------------------------------------*\
* QueryObject object
\*--------------------------------------------------------------------------------*/
var QueryObject = function() {

	if (typeof window.$Query != 'object') {
		var o	= new Object();		
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
		o.setQuery = function(name, value) {
			this[this._encode(name)] = this._encode(value);
			var loc		= window.document.location;
			var query	= this.getQuerystring();		
			return loc.origin + loc.pathname + query + loc.hash;
		};
		
		var q = location.search.substring(1);
		if (q) {
			var vg	= /([^&=]+)=?([^&]*)/g;	// 그룹화 정규식.
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
* Cookie object
\*--------------------------------------------------------------------------------*/
var Cookie = function(expiresDay) {
	var expdate = (typeof expiresDay == 'number') ? expiresDay : 1;	
	return {
		get : function(cName) {
		    cName = cName + '=';
		    var cookieData = document.cookie;
		    var start = cookieData.indexOf(cName);
		    var cValue = '';
		    if(start != -1){
		         start += cName.length;
		         var end = cookieData.indexOf(';', start);
		         if(end == -1)end = cookieData.length;
		         cValue = cookieData.substring(start, end);
		    }
		    return unescape(cValue);		
		},
		set : function(cName, cValue, expireDays) {
		    this.setOwner(cName, cValue, ((typeof expireDays == 'number' ? expireDays : expdate) * 24 * 60 * 60 * 1000))
		},
		setOwner : function(cName, cValue, expire) {			 
			var expdate = new Date();
		    expdate.setTime(expdate.getTime() + (typeof expire == 'number' ? expire : (expdate * 24 * 60 * 60 * 1000)));
		    document.cookie = cName+"=" + cValue + "; path=/; domain="+document.domain+"; expires=" + expdate.toGMTString();
		},
		remove : function(name) {
			this.set(name, '', -1);
		},
		getItem : function(name) {
			return this.get(name);
		},
		setItem : function(name, value) {
			this.set(name, value);
		},
		removeItem : function(name) {
			this.remove(name);
		}
	};
}; 	

/*--------------------------------------------------------------------------------*\
* Cache object
\*--------------------------------------------------------------------------------*/
var Cache = function(type) {
	var _cacheType 	= (typeof name != 'string' || name == '') ? 'local' : type; // cache || local || session		
	var _cacheStorage= null;
	var _cacheExpires= null;
	var _defaultCache= {
			set : function() { return;},
			get : function() { return '';},
			isStatus : function() { return false;},
			remove : function() { return;}
		};	
	
	if (_cacheType == 'session') {
		if (!window.sessionStorage) return _defaultCache;
		
		_cacheStorage = window.sessionStorage;
		_cacheExpires = 60 * 60 * 12;	// 12 hours
	} 
	else if (_cacheType == 'cache') {
		if (!window.localStorage) return _defaultCache;
		
		_cacheStorage = window.localStorage;
		_cacheExpires = 60 * 5;			// 5 mins
	}
	else if (_cacheType == 'local') {
		if (!window.localStorage) return _defaultCache;
		
		_cacheStorage = window.localStorage;
		_cacheExpires = 60 * 60 * 24 * 7;	// 7 days
	}
	else if (_cacheType == 'cookie') {
		_cacheStorage = com.lotte.smp.Cookie(1);
		_cacheExpires = 60 * 60 * 24 * 1;	// 1 day
	}
	else {
		return _defaultCache;
	}
	
	return {
		type	: _cacheType,
		storage : _cacheStorage,
		expires : _cacheExpires, 
		set : function(name, value, expires) {
			if (typeof name != 'string' || name == '') return;
			if (value == 'undefined') return;			
			if (expires=='undefined' || typeof expires != 'number') { expires = this.expires; }
	
			var date = new Date();
			var schedule= Math.round((date.setSeconds(date.getSeconds()+expires))/1000);			
	
			this.storage.setItem(name, value);
			this.storage.setItem('time_'+name, schedule);
		},
		get : function(name) {			
			if (this.isStatus(name)) {
				return this.storage.getItem(name);
			}
			else {
				return '';
			}
		},
		isStatus : function(name) {
			if (this.storage.getItem(name) == null || this.storage.getItem(name) == '')
				return false;
			
			var date = new Date();
			var current = Math.round(+date/1000);
	
			// Get Schedule
			var stored_time = this.storage.getItem('time_'+name);
			if (stored_time=='undefined' || stored_time=='null') { stored_time = 0; }
	
			// Expired
			if (stored_time < current) {	
				this.remove(name);
				return false;
			} else {
				return true;
			}
		},
		remove : function(name) {			
			this.storage.removeItem(name);
			this.storage.removeItem('time_'+name);
		}
	};
};