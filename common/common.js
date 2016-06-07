/* common.function.js - MAD common script
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2012/04/03
	https://github.com/dragonslam/javascript_library/blob/master/common/common.js
*/
if (typeof console == 'undefined') {
	window.logStack	= new Array();
	window.console	= {"log" : function(s) {logStack.push(s);}}
}
var $isDebug	= true;
var $debug		= function(msg) {if ($isDebug) {window.console.log(msg);}};

/*--------------------------------------------------------------------------------*\
* Dynamic script loading 
/*--------------------------------------------------------------------------------*/
var LoadScript = function(url, callback, charset, defer, id) {
    if (typeof url != 'string' || url === '' || url === 'undefined') return;
    
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
            
        var _iPad        = (/ipad/i.test(pf));
        var _iPhone        = (/iphone/i.test(pf));
        var _iOS        = (_iPad || _iPhone);
        var _Android    = (/linux armv7/i.test(pf));
        var _galtab        = (/SHW-M/i.test(ua));    // 갤텝
        var _Mobile        = (_iOS || _Mobile) ? true : false;
        var _TouchPad    = (/hp-tablet/gi).test(nv.appVersion);
        var _HasTouch    = 'ontouchstart' in window && !_TouchPad;
        
        window.$MobileDevice = {
                 navigator    : nv
                ,agent        : ua
                ,platform    : pf
                ,isMobile    : _Mobile
                ,isIos        : _iOS
                ,isIphone    : _iPhone
                ,isIpad        : _iPad
                ,isAndroid    : _Android
                ,isGaltab    : _galtab                
                ,isTouchPad    : _TouchPad
                ,isTouch    : _HasTouch
                ,isTablet    : function() {
                    return (this.isGaltab || ($(window).width() > 640));
                } 
                ,isWide        : function() {
                    return ($(window).width() > $(window).height());
                }
            };
    }
    return window.$MobileDevice;
};

/*--------------------------------------------------------------------------------*\
* StringBuilder object
\*--------------------------------------------------------------------------------*/
var StringBuilder = function() { 
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
    this.id        = id;
    this.value    = value;
}
Dictionary.prototype = {
    toString : function() {
        return "id:"+ this.id +", value:"+ this.value;
    },
    logging : function() {
        return $debug(this.toString());
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
    this.x    = parseInt(x);
    this.y    = parseInt(y);
}
Size.prototype = {
    /*
        @최대 Size에 비례하는 Size를 계산하여 반환.
    */
    balance : function(maxLimit) {
        var balance = new Size(0,0);
        if ((this.x != 0 && this.y != 0) && (maxLimit.x != 0 || maxLimit.y != 0) && (this.x > maxLimit.x || this.y > maxLimit.y)) {

            var aW    = (maxLimit.x  > 0) ? (maxLimit.x / this.x) : 1;
            var aH    = (maxLimit.y  > 0) ? (maxLimit.y / this.y) : 1;

            if (aW <= aH) {
                balance.x    = parseInt(this.x * aW);
                balance.y    = parseInt(this.y * aW);
            } else {
                balance.x    = parseInt(this.x * aH);
                balance.y    = parseInt(this.y * aH);
            }
        } else {
            balance.x    = this.x;
            balance.y    = this.y;
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
        return $debug(this.toString());
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
        return $debug(this.toString());
    }
};

/*--------------------------------------------------------------------------------*\
* Query object
\*--------------------------------------------------------------------------------*/
var Query = function() {

    if (typeof window.$Query != 'object') {
        var o    = new Object();        
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
            var loc        = window.document.location;
            var query    = this.getQuery();        
            return loc.origin + loc.pathname + query + loc.hash;
        };
        
        var q = location.search.substring(1);
        if (q) {
            var vg    = /([^&=]+)=?([^&]*)/g;    // 그룹화 정규식.
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
			return this;
        },
        setOwner : function(cName, cValue, expire) {             
            var expdate = new Date();
            expdate.setTime(expdate.getTime() + (typeof expire == 'number' ? expire : (expdate * 24 * 60 * 60 * 1000)));
            document.cookie = cName+"=" + cValue + "; path=/; domain="+document.domain+"; expires=" + expdate.toGMTString();
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
* Cache object
\*--------------------------------------------------------------------------------*/
var Cache = function(type, span/* integer */, format/* s, m, h, d, M, y, w */) {
    var _cacheType	= (typeof type != 'string' || type == '') ? 'cache' : type; // cache || local || session
    var _span		= (typeof span == 'number') ? span : 0;
    var _format		= (typeof format == 'string') ? format : '';
    var _storage	= null;
    var _expires	= getCacheExpires(_span, _format);
    var _default	= {
            set : function() { return;},
            get : function() { return '';},
            isStatus : function() { return false;},
            remove : function() { return; },
			clear : function() { return; }
        };
    
    
    if (_cacheType == 'session') {
        if (!window.sessionStorage) return _default;                 
        _storage= window.sessionStorage;
        _expires= (_span != 0) ? _expires : getCacheExpires(12, 'h'); // 12 hours
    } 
    else if (_cacheType == 'cache') {
        if (!window.localStorage) return _default;                 
        _storage= window.sessionStorage;
        _expires= (_span != 0) ? _expires : getCacheExpires(5, 'm'); // 5 minutes
    }
    else if (_cacheType == 'local') {
        if (!window.localStorage) return _default;        
        _storage = window.localStorage;
        _expires= (_span != 0) ? _expires : getCacheExpires(7, 'd'); // 7 days
    }
    else if (_cacheType == 'cookie') {
        _storage = com.lotte.smp.Cookie(1);
        _expires= (_span != 0) ? _expires : getCacheExpires(1, 'd'); // 1 days
    }
    else {
        return _default;
    }
    
    function getCacheExpires(s, f) {
        var exp = 0;
        switch(f) {
            case 's' : exp = s;                        break;
            case 'm' : exp = s * 60;                break;
            case 'h' : exp = s * 60 * 60;            break;
            case 'd' : exp = s * 60 * 60 * 24;        break;
            case 'w' : exp = s * 60 * 60 * 24 * 7;    break;
            case 'M' : exp = s * 60 * 60 * 24 * 30;    break;
            case 'y' : exp = s * 60 * 60 * 24 * 365;break;
        }
        return exp;
    }
    
    return {
        type    : _cacheType,
        storage : _storage,
        expires : _expires, 
        set : function(name, value, expires) {
            if (typeof name != 'string' || name == '') return;
            if (value == 'undefined') return;            
            if (expires=='undefined' || typeof expires != 'number') { expires = this.expires; }
    
            var date = new Date();
            var schedule= Math.round((date.setSeconds(date.getSeconds()+expires))/1000);            
    
            this.storage.setItem(this.type +'@'+ name, value);
            this.storage.setItem(this.type +'@time_' + name, schedule);

			return this;
        },
        get : function(name) {            
            if (this.isStatus(name)) {
                return this.storage.getItem(this.type +'@'+ name);
            }
            else {
                return '';
            }
        },
        isStatus : function(name) {
            if (this.storage.getItem(this.type +'@'+ name) == null || this.storage.getItem(this.type +'@'+ name) == '')
                return false;
            
            var date = new Date();
            var current = Math.round(+date/1000);
    
            // Get Schedule
            var stored_time = this.storage.getItem(this.type +'@time_' + name);
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
            this.storage.removeItem(this.type +'@'+ name);
            this.storage.removeItem(this.type +'@time_' + name);
        },
		clear : function() {
			for (var item in this.storage) {
				if (String(item).startWith(this.type)) {
					this.storage.removeItem(item);
				}
			}
			//this.storage.clear();
		}
    };
};



var fn_bindFormValidator = function() {
	String.prototype.equals = function(str) {
	    return (this === str);
	};
	String.prototype.isFinite = function() {
	    return isFinite(this);
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
	String.prototype.bytes = function() {
	    var b = 0;
	    for (var i=0; i<this.length; i++) b += (this.charCodeAt(i) > 128) ? 2 : 1;
	    return b;
	};
	String.prototype.isPhone = function() {
	    var arg = arguments[0] ? arguments[0] : "";
	    return eval("(/(02|0[3-9]{1}[0-9]{1})" + arg + "[1-9]{1}[0-9]{2,3}" + arg + "[0-9]{4}$/).test(this)");
	};
	String.prototype.isMobile = function() {
	    var arg = arguments[0] ? arguments[0] : "";
	    return eval("(/01[016789]" + arg + "[1-9]{1}[0-9]{2,3}" + arg + "[0-9]{4}$/).test(this)");
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
	String.prototype.isAlphaNum = function() {
	    return (this.search(/[^A-Za-z0-9_-]/) == -1);
	};
	String.prototype.isAlpha = function() {
	    return (this.search(/[^A-Za-z]/) == -1);
	};
	String.prototype.parseInt = function() {
		if (this === '' || this === undefined) return 0;		
		if (isFinite(this)) {
			return parseInt(this, 0);
		}
		else {
			return this.trim().replace(/[^-_0-9]/g, "").parseInt();
		}
	};
	String.prototype.parseFloat = function() {
		if (this === '' || this === undefined) return 0.0;
		
		var result = this.trim().replace(/[^-_0-9.0-9]/g, "");
		if (result !== "") {
			return parseFloat(result);	
		}
		else {
			return "";
		}
	};
	String.prototype.replaceXss = function(source, target) {
		source = source.replace(new RegExp("(\\W)", "g"), "\\$1");
		target = target.replace(new RegExp("\\$", "g"), "$$$$");
		return this.replace(new RegExp(source, "gm"), target);
	};	

	if (!Number.toLocaleString) {
		Number.prototype.toLocaleString = function() {
			var s = String(this);
		    if (s.isFinite()) {        
		        while((/(-?[0-9]+)([0-9]{3})/).test(s)) {
		            s = s.replace((/(-?[0-9]+)([0-9]{3})/), "$1,$2");
		        }
		    }
	        return s;
		};
	}
	var messageCodes = {
		 "MSG0001" : "특수문자 <{(%'\")}> 는 사용할 수 없습니다.",
		 "MSG0002" : "자 이상은 등록 할 수 없습니다."
	};
	var messagePrint = function(obj, msgID, msg) {
		if (obj instanceof $) {
			var oMsg = obj.html();
			var cMsg = obj.attr("handelMsgId");
			var nMsg = msgID;
			var hide = (obj.css("display") == "none");
			if (cMsg != nMsg) {
				if (hide) {
					obj.show();	
				}
				obj.html("<span style='color:red;'>"+ (typeof msg == "string" ? msg : "") + messageCodes[nMsg] +"</span>");
				obj.attr("handelMsgId", nMsg);
				window.setTimeout(function() {
					obj.attr("handelMsgId", "");
					obj.html(oMsg);
					if (hide) {
						obj.hide();	
					}
				}, 3000);
			}
		}
	};
	var cleanXss = function(str){
		if(typeof str === "string" && str !== ""){
			if (!isNaN(str)) {
				return str;
			}
			var tmp = String(str);
			if (tmp === "") {
				return str;
			}
			tmp = tmp.replaceXss("<", "").replaceXss(">", "");
			tmp = tmp.replaceXss("(", "").replaceXss(")", "");
			tmp = tmp.replaceXss("{", "").replaceXss("}", "");
			tmp = tmp.replaceXss("%", "").replaceXss("&", "");
			tmp = tmp.replaceXss("'", "").replaceXss('"', "");
			tmp = tmp.replaceXss("//", "");
			return tmp;
		}
		return str;
	};
	
	// 등록값 점검.
	var keyupValidator = function(obj, vType) {
		if (obj instanceof $) {
			obj.keyup(function() {
				var o		= $(this);
				var vChar	= o.attr("validator-cleanChar");
				var vTraget	= o.attr("validator-target");
				var oTarget = $("#"+ vTraget);
				var oValue	= o.val();
				var oResult	= "";
				
				if (vType == "cleanText") {				
					oResult	= cleanXss(oValue);
					if (vChar !== "" && vChar !== undefined) {
						var chars = vChar.split(",");
						for (var i = 0; i < chars.length; i++) {
							oResult = oResult.replaceXss(chars[i], "");
						}
					}
					if (oValue !== "" && oValue !== oResult) {
						if (oTarget && oTarget.length > 0) {
							messagePrint(oTarget, "MSG0001");
						}
						o.val(oResult);
					}
				}
				else if (vType == "number") {
					if (oValue != "") {
						oResult = oValue.match(/[0-9]/g).join("");
						//oResult = oValue.parseInt();
						if (oValue != oResult) obj.val(oResult);
					}
				}
				else if (vType == "float") {
					if (!oValue.endWith('.')) {
						oResult = oValue.parseFloat();
						if (oValue != oResult) obj.val(oResult);
					}				
			    }		           
			});			
		}
	};
	// 특정값 등록 방지.
	var keydownValidator = function(obj, vType) {
		if (obj instanceof $) {
			// alpabat alpaNum number float
			obj.keydown(function(e) {
				var obj		= $(this);
				var isValid	= true;
				//var oValue	= String(obj.val());
				e = (e ? e : event);
				var keyCd = e.keyCode;
				vType	= obj.attr("validator-type");
			   
			    if (vType == "number" && (
			    		keyCd != 8 && keyCd != 9 && keyCd != 46 &&
			    		(keyCd < 48 || keyCd > 57) &&
			    		(keyCd < 96 || keyCd > 105)
			    )){
			    	isValid = false;
			    } 
			    else if (vType == "float" && (
			    		keyCd != 8 && keyCd != 9 && keyCd != 46 &&
			    		keyCd != 110 && keyCd != 190 &&
			    		(keyCd < 48 || keyCd > 57) &&
			    		(keyCd < 96 || keyCd > 105)
			    )){
			    	isValid = false;
			    }		    	
		    	if(!isValid) {
		    		e.returnValue=false;
		    		return false;
		    	}		           
			});
		}
	};
	var lengthValidator = function(obj, vLength) {
		if (obj instanceof $ && vLength > 0) {
			obj.blur(function() {
				var o		= $(this);				
				var vTraget	= o.attr("validator-target");
				var oTarget = $("#"+ vTraget);
				var oValue	= o.val();
				if (oValue !== "" && oValue.length > vLength) {
					o.val(oValue.substring(0, vLength));
					if (oTarget && oTarget.length > 0) {
						messagePrint(oTarget, "MSG0002", vLength);
					}
				}
			});
		}
	};
	var numberFormatter = function(obj, vType, isFormat) {
		isFormat = isFormat ? isFormat : false;
		if (obj instanceof $) {
			obj.css("text-align", "right");
			obj.focus(function() {
				var o		= $(this);
				var oValue	= o.val();
				if (oValue !== "" && oValue.length > 0) {
					o.val(oValue.replaceAll(",", ""));					
				}
			});
			obj.blur(function() {
				var o		= $(this);
				var oValue	= String(o.val());
				if (oValue !== "" && oValue.length > 0) {
					
					if (vType == "number") {
						if (oValue != "") {
							oValue = oValue.match(/[0-9]/g).join("");
							//oValue = oValue.parseInt();
						}
					}
					else if (vType == "float") {
						oValue = oValue.parseFloat();
					}
					if (!isFormat) {
						o.val(oValue);
					}
					else {
						o.val(oValue.toLocaleString());
					}
				}
			});
		}
	};
	
	var setValidator = function(obj) {
		if (obj instanceof $) {
			var vType	= String(obj.attr("validator-type")),
				vLength	= String(obj.attr("validator-length")),
				vFormat	= String(obj.attr("validator-format")).toLowerCase(),
				isFormat= (vFormat === "y" || vFormat === "yes" || vFormat === "use");
			
			if (vType !== "" && vType !== undefined) {
				switch (vType) {
					case "text" 	 : 
						keyupValidator(obj, vType);
						break;			
					case "cleanText" : 
						keyupValidator(obj, vType);
						break;
					case "alpabat"	 : 
						keydownValidator(obj, vType);
						break;
					case "alpaNum"	 : 
						keydownValidator(obj, vType);
						break;
					case "number" 	 :				
						keyupValidator(obj, vType);
						keydownValidator(obj, vType);						
						numberFormatter(obj, vType, isFormat);
						break;
					case "float"	 : 
						keyupValidator(obj, vType);
						keydownValidator(obj, vType);
						numberFormatter(obj, vType, isFormat);
						break;
				}
			}
			if (vLength !== "" && vLength !== undefined) {
				vLength = parseInt(vLength, 10);
				if (vLength > 0) {
					lengthValidator(obj, vLength);
				}
			}
		}
	};
	
	if (arguments.length > 0) {
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (arg instanceof $ && arg.length > 0) {
				if (arg.length == 1) {
					setValidator(arg);
				}
				else {
					arg.each(function() {
						setValidator($(this));
					});
				}			
			}
			else if (typeof arg == "object") {
				if (arg.obj instanceof $) {
					if (arg.type)
						arg.obj.attr("validator-type", arg.type);
					if (arg.length)
						arg.obj.attr("validator-length", arg.length);
					if (arg.target)
						arg.obj.attr("validator-target", arg.target);
					if (arg.clean)
						arg.obj.attr("validator-cleanChar", arg.clean);
					
					setValidator(arg.obj);
				}
				else {
					// TO-DO : JSON....
				}
			}
			else if (typeof arg == "string") {
				if ($("#"+arg).length > 0) {
					w.fn_bindFormValidator($("#"+arg));
				}	
			}
		}
	}
	else {
		$("input[type='text'][validator='true']").each(function() {
			w.fn_bindFormValidator($(this));			
		}); 
	}
};
