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
* StringBuilder prototype
\*--------------------------------------------------------------------------------*/
var StringBuilder = function()
{ 
    this.buffer = new Array(); 
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
* Dictionary prototype
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
* Reflector prototype
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
* Size prototype
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
    		
    		var aW	= (maxLimit.x  > 0) ? (maxLimit.x / orignal.x) : 1;
    		var aH	= (maxLimit.y  > 0) ? (maxLimit.y / orignal.y) : 1;
    
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
