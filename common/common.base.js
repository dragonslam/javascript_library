(function($w, $) {
	"use strict";
	
	if (!!!$w) return;
	if (!!!$ ) return;
	var Root='root';
	var Base=$w[Root]	= ($w[Root]||{});
		Base.pageInfo	= ($w['$P']||{});
		Base.userInfo	= ($w['$U']||{});

		Base.className	= Root;
		Base.classPath	= Root;
		Base.namespace	= function(ns) {
			var This	= this,
				parent	= Base,
				paths	= Root,			
				parts	= ns.split('.'),
				isNewbie= false;
			if (parts[0]==Root) {
				parts	= parts.slice(1);
			}
			for (var i = 0; i < parts.length; i++) { 
				if(typeof parent[parts[i]] === 'undefined') {
					isNewbie = true;
					parent[parts[i]] = {};
				}
				parent=parent[parts[i]];
				parent.className = parts[i];
				parent.classPath = paths = paths+'.'+parts[i];
			}
			if (isNewbie) Base.logging(this, 'ns( '+ns+' )');			
			return parent;
		};
		Base.module	= function(clazz, source) {
			return $.extend({
				isInit	 	:false,
				isHelper 	:!!Base['isHelper'],
				className	:(clazz['className']||Root),
				classPath	:(clazz['classPath']||Root)+'.module',
				classPrifix	:(clazz['classPath']||Root)+((Base.userInfo['uNo']||'') ? '.'+Base.userInfo['uNo'] : '')
			}, source||{});
		};
		Base.clone = function(obj, dest) {
			if (null == obj || "object" != typeof obj) return obj;
			
			var This = this;
			if (obj instanceof Date) {
				return (new Date( obj.getTime() ));
			}
			if (obj instanceof Array) {
				var copy = [];
				for(var i = 0; i < obj.length; i++) {
					copy[i] = This.clone(obj[i]);
				}
				return copy;
			}
			if (obj instanceof Object) {
				var copy = (dest instanceof Object) ? dest : {};
				for(var attr in obj) {
					if (obj.hasOwnProperty(attr)) {
						copy[attr] = This.clone(obj[attr]);
					}
				}
				return copy;
			}
			throw new Error("Unable to copy obj! Its type isn't supported.");
		};
		Base.ajax = function(param){			
			if (!param||!param['url']) throw Exception('IllegalArgumentException - param is empty');

			var oParam		= param || {};
			var oCaller		= oParam['caller']|| this,
				oData		= oParam['data']  || {},
				vMethod		= oData ['method']|| '';
				
			var oSuccess	= oParam['success']	|| undefined,
				oComplete	= oParam['complete']|| undefined,
				oError		= oParam['error']	|| undefined,
				oBeforeSend	= oParam['beforeSend']||undefined;
			
			Base.logging(oCaller, 'ajax('+ param['url'] +'?m='+ vMethod +')');
			oParam['success'] = function() {
				var chkTime = (new Date()).getTime() - (oParam['_AJAX_SEND_DATE'] || (new Date())).getTime();
				Base.logging(oCaller, (vMethod||'getAjaxData')+'(ajaxcall success, '+ (chkTime / 1000) +'s)', (chkTime > 500));
				if (typeof oSuccess == 'function') {
					oSuccess.apply(oCaller, arguments);
				}
			};
			oParam['error'] = function() {
				var chkTime = (new Date()).getTime() - (oParam['_AJAX_SEND_DATE'] || (new Date())).getTime();
				Base.logging(oCaller, (vMethod||'getAjaxData')+'(ajaxcall error, '+ (chkTime / 1000) +'s)', true);
				if (typeof oError == 'function') {
					oError.apply(oCaller, arguments);
				}
				else {
					alert('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도하세요');
				}
			};
			oParam['beforeSend'] = function() {
				if (typeof oBeforeSend == 'function') {
					//Base.logging(oCaller, (vMethod||'getAjaxData')+'(beforeSend)');
					oBeforeSend.apply(oCaller, arguments);
				}
			};
			oParam['complete'] = function() {
				if (typeof oComplete == 'function') {
					Base.logging(oCaller, (vMethod||'getAjaxData')+'(complete)');
					//oComplete.apply(oCaller, arguments);
				}
			};			
			oParam = $.extend({ 
				type	: 'post',
				dataType: 'json',
				url		: '',
				data	: {},
				async	: true,
				cache	: false
			}, oParam);
			$.ajax(oParam);
			
			oParam['_AJAX_SEND_DATE'] = new Date();
		};
		Base.getModule = function(url, callback) {
			Base.logging(this, 'gm( '+ url.replaceAll('/', '.') +' )');
			if (!!!url) return;
			if (!!document.documentMode||(!!$w['$U'] && !!$w['$U']['isDebug'])) {
				if(!Base['oChkModule']) Base['oChkModule']= {};
					Base['oChkModule'][url] = false;
				
				// IE의 경우.
				var h=document.getElementsByTagName('head')[0],
					s=document.createElement('script');
					s.src = String('/{0}/{1}.{0}?v={2}').format('js', url, (new Date()).format('yyyymmdd'));
					s.type= 'text/javascript';
					s.charset= 'euc-kr';
					s.onload = function() {
						if (typeof callback == 'function') {
							if(!Base['oChkModule'][url]) {
								Base['oChkModule'][url] = true;
								callback();	
							}
						}
					};
					h.appendChild(s);
			}
			else {
				var _tp = 'application/x-www-form-urlencoded;charset=euc-kr';
				$.ajax({
					url: String('/{0}/{1}.{0}?v={2}').format('js', url, (new Date()).format('yyyymmdd')),
					dataType: 'script',
					contentType: _tp,
				    beforeSend : function(o){ o.overrideMimeType(_tp); },
				    success : function() {
				    	if (typeof callback == 'function') {
				    		callback(); 
				    	}
				    },
					async: !(typeof callback == 'function'),
					cache: true
				});
			}
		};
		Base.getBrowser = function() {
			var n=$w['navigator'];
			var a= n['userAgent'].toLowerCase();
			if (a.indexOf('msie') != -1) {
				// 익스플로러 일 경우 
				var rv = -1;
				if (n.appName == 'Microsoft Internet Explorer') {
					var re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
					if (re.exec(n.userAgent) != null) rv = parseFloat(RegExp.$1);
				}
				return 'Internet Explorer '+rv;
			}
			if (a.indexOf('beonex') != -1) 		return 'Beonex';
			if (a.indexOf('chimera') != -1) 	return 'Chimera';			
			if (a.indexOf('chrome') != -1)		return 'Chrome';
			if (a.indexOf('firefox') != -1) 	return 'Firefox';
			if (a.indexOf('mozilla/5.0') != -1)	return 'Mozilla';
			if (a.indexOf('netpositive') != -1)	return 'NetPositive';
			if (a.indexOf('netscape') != -1)	return 'Netscape';
			if (a.indexOf('opera') != -1)		return 'Opera';
			if (a.indexOf('phoenix') != -1) 	return 'Phoenix';
			if (a.indexOf('safari') != -1) 		return 'Safari';
			if (a.indexOf('skipstone') != -1)	return 'SkipStone';
			if (a.indexOf('staroffice') != -1)	return 'StarOffice';
			if (a.indexOf('webtv') != -1) 		return 'WebTV';
		};
		Base.getDevice = function() {
			var n=$w['navigator'],
				p= n['platform'],
				a= n['userAgent'];

			var _iPad		= (/ipad/i.test(p));
			var _iPhone		= (/iphone/i.test(p));
			var _iOS		= (_iPad || _iPhone);
			var _galtab		= (/SHW-M/i.test(a));    // 갤텝
			var _Android	= (/linux armv7/i.test(p));
			var _TouchPad	= (/hp-tablet/gi).test(n.appVersion);
			var _HasTouch	= ('ontouchstart' in window && !_TouchPad);
			var _BlackBerry = (/BlackBerry/i.test(p));
			var _Mobile		= (_iOS || _Android) ? true : false;
			
	        return {
				 navigator	: n
				,agent		: a
				,platform	: p
				,isMobile 	: _Mobile
				,isAndroid	: _Android
				,isIos		: _iOS
				,isIphone	: _iPhone
				,isIpad		: _iPad
				,isGaltab	: _galtab
				,isTouchPad	: _TouchPad
				,isTouch	: _HasTouch
				,isTablet	: function() {
					return (this.isGaltab || ($(window).width() > 640));
				} 
				,isWide		: function() {
				    return ($(window).width() > $(window).height());
				}
				,isBlackBerry: _BlackBerry
	        };
	};
	Base.tracking= Function.prototype.bind.call(console.log, $w, '%c[DEBUG]', 'color:red;');
}) (window, jQuery);
