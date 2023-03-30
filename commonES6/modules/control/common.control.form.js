/** common.control.form.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    String.prototype.replaceXss = function(source, target) {
		source = source.replace(new RegExp("(\\W)", "g"), "\\$1");
		target = target.replace(new RegExp("\\$", "g"), "$$$$");
		return this.replace(new RegExp(source, "gm"), target);
	};	

	if(!Number.toLocaleString) {
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

	const messageCodes = {
		 MSG0001 : '특수문자 <{(%"\")}> 는 사용할 수 없습니다.',
		 MSG0002 : '자 이상은 등록 할 수 없습니다.'
	};

    class FormValidator extends Control.ControlBase {
        constructor(clazz) {
			super();
            this._parent    = clazz;
            this._container = clazz.getContainer();
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            return this;
        }
        /*
        messagePrint(obj, msgID, msg) {
            if (obj instanceof jQuery) {
                var oMsg = obj.html();
                var cMsg = obj.attr('handelMsgId');
                var nMsg = msgID;
                var hide = (obj.css('display') == 'none');
                if (cMsg != nMsg) {
                    if (hide) {
                        obj.show();	
                    }
                    obj.html('<span style="color:red;">'+ (typeof msg == 'string' ? msg : '') + messageCodes[nMsg] +'</span>');
                    obj.attr('handelMsgId', nMsg);
                    $w.setTimeout(function() {
                        obj.attr('handelMsgId', '');
                        obj.html(oMsg);
                        if (hide) {
                            obj.hide();	
                        }
                    }, 3000);
                }
            }
        }
        cleanXss(str){
            if(typeof str === 'string' && str !== ''){
                if (!isNaN(str)) {
                    return str;
                }
                var tmp = String(str);
                if (tmp === '') {
                    return str;
                }
                tmp = tmp.replaceXss('<', '').replaceXss('>', '');
                tmp = tmp.replaceXss('(', '').replaceXss(')', '');
                tmp = tmp.replaceXss('{', '').replaceXss('}', '');
                tmp = tmp.replaceXss('%', '').replaceXss('&', '');
                tmp = tmp.replaceXss("'", '').replaceXss('"', '');
                tmp = tmp.replaceXss('//', '');
                return tmp;
            }
            return str;
        }
        
        // 등록값 점검.
        keyupValidator(obj, vType) {
            if (obj instanceof $) {
                obj.keyup(function() {
                    var o		= $(this);
                    var vChar	= o.attr('validator-cleanChar');
                    var vTraget	= o.attr('validator-target');
                    var oTarget = $('#'+ vTraget);
                    var oValue	= o.val();
                    var oResult	= '';
                    
                    if (vType == 'cleanText') {				
                        oResult	= cleanXss(oValue);
                        if (vChar !== '' && vChar !== undefined) {
                            var chars = vChar.split(',');
                            for (var i = 0; i < chars.length; i++) {
                                oResult = oResult.replaceXss(chars[i], '');
                            }
                        }
                        if (oValue !== '' && oValue !== oResult) {
                            if (oTarget && oTarget.length > 0) {
                                messagePrint(oTarget, 'MSG0001');
                            }
                            o.val(oResult);
                        }
                    }
                    else if (vType == 'number') {
                        if (oValue != '') {
                            oResult = oValue.match(/[0-9]/g).join('');
                            //oResult = oValue.parseInt();
                            if (oValue != oResult) obj.val(oResult);
                        }
                    }
                    else if (vType == 'float') {
                        if (!oValue.endWith('.')) {
                            oResult = oValue.parseFloat();
                            if (oValue != oResult) obj.val(oResult);
                        }				
                    }		           
                });			
            }
        }
        // 특정값 등록 방지.
        keydownValidator(obj, vType) {
            if (obj instanceof $) {
                // alpabat alpaNum number float
                obj.keydown(function(e) {
                    var obj		= $(this);
                    var isValid	= true;
                    //var oValue	= String(obj.val());
                    e = (e ? e : event);
                    var keyCd = e.keyCode;
                    vType	= obj.attr('validator-type');
                   
                    if (vType == 'number' && (
                            keyCd != 8 && keyCd != 9 && keyCd != 46 &&
                            (keyCd < 48 || keyCd > 57) &&
                            (keyCd < 96 || keyCd > 105)
                    )){
                        isValid = false;
                    } 
                    else if (vType == 'float' && (
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
        }
        lengthValidator(obj, vLength) {
            if (obj instanceof $ && vLength > 0) {
                obj.blur(function() {
                    var o		= $(this);				
                    var vTraget	= o.attr('validator-target');
                    var oTarget = $('#'+ vTraget);
                    var oValue	= o.val();
                    if (oValue !== '' && oValue.length > vLength) {
                        o.val(oValue.substring(0, vLength));
                        if (oTarget && oTarget.length > 0) {
                            messagePrint(oTarget, 'MSG0002', vLength);
                        }
                    }
                });
            }
        }
        numberFormatter(obj, vType, isFormat) {
            isFormat = isFormat ? isFormat : false;
            if (obj instanceof $) {
                obj.css('text-align', 'right');
                obj.focus(function() {
                    var o		= $(this);
                    var oValue	= o.val();
                    if (oValue !== '' && oValue.length > 0) {
                        o.val(oValue.replaceAll(',', ''));					
                    }
                });
                obj.blur(function() {
                    var o		= $(this);
                    var oValue	= String(o.val());
                    if (oValue !== '' && oValue.length > 0) {
                        
                        if (vType == 'number') {
                            if (oValue != '') {
                                oValue = oValue.match(/[0-9]/g).join('');
                                //oValue = oValue.parseInt();
                            }
                        }
                        else if (vType == 'float') {
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
        }        
        setValidator(obj) {
            if (obj instanceof $) {
                var vType	= String(obj.attr('validator-type')),
                    vLength	= String(obj.attr('validator-length')),
                    vFormat	= String(obj.attr('validator-format')).toLowerCase(),
                    isFormat= (vFormat === 'y' || vFormat === 'yes' || vFormat === 'use');
                
                if (vType !== '' && vType !== undefined) {
                    switch (vType) {
                        case 'text' 	 : 
                            keyupValidator(obj, vType);
                            break;			
                        case 'cleanText' : 
                            keyupValidator(obj, vType);
                            break;
                        case 'alpabat'	 : 
                            keydownValidator(obj, vType);
                            break;
                        case 'alpaNum'	 : 
                            keydownValidator(obj, vType);
                            break;
                        case 'number' 	 :				
                            keyupValidator(obj, vType);
                            keydownValidator(obj, vType);						
                            numberFormatter(obj, vType, isFormat);
                            break;
                        case 'float'	 : 
                            keyupValidator(obj, vType);
                            keydownValidator(obj, vType);
                            numberFormatter(obj, vType, isFormat);
                            break;
                    }
                }
                if (vLength !== '' && vLength !== undefined) {
                    vLength = parseInt(vLength, 10);
                    if (vLength > 0) {
                        lengthValidator(obj, vLength);
                    }
                }
            }
        }
        */
    }

    const ctrl = Base.Control.Form;
    Base.extends(Base.Control.Form, {
		createFormValidator : function(clazz) {
            return Base.Core.module(clazz, new FormValidator(clazz), ctrl.className);
		}
	});

}) (window, __DOMAIN_NAME||'');