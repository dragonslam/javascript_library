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
* StringBuilder object
\*--------------------------------------------------------------------------------*/
var StringBuilder = function()
{ 
    this.buffer = [];3
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
    this.getProperties = function() {
		var properties = [];
		for (var prop in obj) {
			if (typeof obj[prop] != 'function') {
				properties.push(prop);
			}
		}
		return properties;
	};
	this.getMethods = function() {
		var methods = [];
		for (var method in obj) {
			if (typeof obj[method] == 'function') {
				methods.push(method);
			}
		}
		return methods;
	};
	this.getOwnMethods = function() {
		var methods = [];
		for (var method in obj) {
			if (  typeof obj[method] == 'function' && obj.hasOwnProperty(method)) {
				methods.push(method);
			}
		}
		return methods;
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

    var o = {};

    var q = location.search.substring(1);
    if (q) {

        // 실제 그룹화 정규식.
        var vg = /([^&=]+)=?([^&]*)/g;
        
        // 인코딩된 공백문자열을 다시 공백으로
        var sp = /\+/g;

        // 정규식을 사용하여 값을 추출
        var decode = function(s) {
            if (!s) {
                return '';
            }
            return decodeURIComponent(s.replace(sp, " "));
        };

       // 한번씩 exec를 실행하여 값을 받아온다.
        var tmp; 
        while (tmp = vg.exec(q)) {
            (function() {
                var k = decode(tmp[1]);
                var v = decode(tmp[2]);
                var c;
                if (k) {
                    o[k] = v;
                    c = k.charAt(0).toUpperCase() + k.slice(1);
                    o["get" + c] = function() { return v; }
                    o["set" + c] = function(val) { v = val; }
                }
            })();
        }
    }
    return o;
};

/*--------------------------------------------------------------------------------*\
* dynamic script loading 
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
				callback();
				loaded = true;
			}
		};
		script.onload = function() {
			callback();
			loaded = true;
		};
	}
	
	head.appendChild(script);
};
