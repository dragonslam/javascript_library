/* ********************************************************
 * 11ST SellerTool Site - tMall base
 * ******************************************************** */
(function($w, $) {
	"use strict";
	
	if (!!!$w) return;
	if (!!!$ ) return;
	let Root='__ROOT';
	let Base=$w[Root]	= ($w[Root]||{});
		Base.pageInfo	= ($w['$P']||{});
		Base.userInfo	= ($w['$U']||{});
		Base.className	= Root;
		Base.classPath	= Root;
		Base.namespace	= function(ns) {
			let This	= this,
				clazz	= Base,
				paths	= Root,			
				parts	= ns.split('.'),
				isNewbie= false;
			if (parts[0]==Root) {
				parts	= parts.slice(1);
			}
			for (let i = 0; i < parts.length; i++) {
				if (typeof clazz[parts[i]] === 'undefined') {
					isNewbie = true;
					clazz[parts[i]] = {};
				}
				clazz=clazz[parts[i]];
				clazz.className	 = parts[i];
				clazz.classPath	 = paths = paths+'.'+parts[i];
				clazz.classPrifix= clazz['classPath']+(Base.userInfo['uNo']?'.'+Base.userInfo['uNo']:'');
			}
			if (isNewbie) Base.logging(this, 'ns( '+ns+' )');			
			return clazz;
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

			let This = this;
			if (obj instanceof Date) {
				return (new Date( obj.getTime() ));
			}
			if (obj instanceof Array) {
				let copy = [];
				for (let i = 0; i < obj.length; i++) {
					copy[i] = This.clone(obj[i]);
				}
				return copy;
			}
			if (obj instanceof Object) {
				let copy = (dest instanceof Object) ? dest : {};
				for (let attr in obj) {
					if (obj.hasOwnProperty(attr)) {
						copy[attr] = This.clone(obj[attr]);
					}
				}
				return copy;
			}
			return obj;
			//throw new Error("Unable to copy obj! Its type isn't supported.");
		};
		Base.ajax = function(param){			
			if (!param||!param['url']) throw Exception('IllegalArgumentException - param is empty');

			let oParam		= param || {};
			let oCaller		= oParam['caller']|| this,
				oData		= oParam['data']  || {},
				vMethod		= oData ['method']|| '',
				vFullUrl	= oParam['url']+'?__t='+(new Date()).getTime();
			if (typeof oData==='object') {
				vFullUrl	= vFullUrl +'&'+ serializeQuerystring(oData);
			}			
			let oSuccess	= oParam['success']	|| undefined,
				oComplete	= oParam['complete']|| undefined,
				oError		= oParam['error']	|| undefined,
				oBeforeSend	= oParam['beforeSend']||undefined;
			
			/*** Ajax Process Start Observer. */
			Base.Process.ajax.doStart(vFullUrl, oParam);
			Base.logging(oCaller, 'ajax('+ param['url'] +'?m='+ vMethod +')');
			oParam['success'] = function() {
				let chkTime = (new Date()).getTime() - (oParam['_AJAX_SEND_DATE'] || (new Date())).getTime();
				/*** Ajax Process End Observer. */
				Base.Process.ajax.doComplate(vFullUrl, 'success');
				Base.logging(oCaller, (vMethod||'getAjaxData')+'(ajaxcall success, '+ (chkTime / 1000) +'s)', (chkTime > 500));
				if (typeof oSuccess == 'function') {
					oSuccess.apply(oCaller, arguments);
				}
			};
			oParam['error'] = function() {
				let chkTime = (new Date()).getTime() - (oParam['_AJAX_SEND_DATE'] || (new Date())).getTime();
				/*** Ajax Process End Observer. */
				Base.Process.ajax.doComplate(vFullUrl, 'error');
				Base.logging(oCaller, (vMethod||'getAjaxData')+'(ajaxcall error, '+ (chkTime / 1000) +'s)', true);
				if (typeof oError == 'function') {
					oError.apply(oCaller, arguments);
				} else {
					alert('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도하세요');
				}
			};
			oParam['beforeSend'] = function() {
				if (typeof oBeforeSend == 'function') {
					Base.logging(oCaller, (vMethod||'getAjaxData')+'(beforeSend)');
					oBeforeSend.apply(oCaller, arguments);
				}
			};
			oParam['complete'] = function() {
				/*** Ajax Process End Observer. */
				Base.Process.ajax.doComplate(vFullUrl, 'complete');
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
				if (!Base['oChkModule']) Base['oChkModule']= {};
					Base['oChkModule'][url] = false;
				
				// IE의 경우.
				let h=document.getElementsByTagName('head')[0],
					s=document.createElement('script');
					s.src = String('/{0}/{1}.{0}?v={2}').format('js', url, (new Date()).format('yyyymmdd'));
					s.type= 'text/javascript';
					s.charset= 'euc-kr';
					s.onload = function() {
						if (typeof callback == 'function') {
							if (!Base['oChkModule'][url]) {
								Base['oChkModule'][url] = true;
								callback();	
							}
						}
					};
					h.appendChild(s);
			} else {
				let _tp = 'application/x-www-form-urlencoded;charset=euc-kr';
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
			let n=$w['navigator'];
			let a= n['userAgent'].toLowerCase();
			if (a.indexOf('msie') != -1) {
				// 익스플로러 일 경우 
				let rv = -1;
				if (n.appName == 'Microsoft Internet Explorer') {
					let re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
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
			let n=$w['navigator'],
				p= n['platform'],
				a= n['userAgent'];

			let _iPad		= (/ipad/i.test(p)),
				_iPhone		= (/iphone/i.test(p)),
				_iOS		= (_iPad || _iPhone),
				_galtab		= (/SHW-M/i.test(a)),   // 갤텝
				_Android	= (/linux armv7/i.test(p)),
				_TouchPad	= (/hp-tablet/gi).test(n.appVersion),
				_HasTouch	= ('ontouchstart' in window && !_TouchPad),
				_BlackBerry = (/BlackBerry/i.test(p)),
				_Mobile		= (_iOS || _Android) ? true : false;
			
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
		Base.getPageID = function() {
			let pageId = '';
			if (this.pageInfo['pId']) {
				pageId = this.pageInfo['pId'] +'@'+ this.pageInfo['sId']
			}
			return pageId;
		};
		
	    //window 팝업 호출
		Base.openPopup = function(url, name, width, height, scroll, resize) {
			Base.logging(this, 'openPopup( '+ url +' )');
			
	        if (!url) return;
	        if (!name)return;

			let w = width ||500,
	        	h = height||600,	        
	        	o = new StringBuilder();
	        	o.append('width=' +w)
		         .append('height='+h)	        
		         .append('scrollbars='+(scroll||'no'))
		         .append('resizable=' +(resize||'no'))
		         .append('status=no').append('menubar=no').append('toolbar=no').append('location=no').append('directories=no');

	        if ($w['screen']) {
				let x = ($w['screen'].availWidth -(10+w)) / 2,
	            	y = ($w['screen'].availHeight-(30+h)) / 2;
	            o.append('left='+ x).append('top='+ y).append('screenX='+ x).append('screenY='+ y);
	        }
			let _w=$w.open(url, name, o.toString(','));
	        	_w.resizeTo(w + 30, h + 30);
	        	_w.focus();
	        return _w;
	    };
		
	    if (!!$w[Root]) {
	    	$w[Root]['logging'] = $w[Root]['tracking'] = $w[Root]['wtf'] = function() {};
	    	if (!!$w['$U'] && !!$w['$U']['isDebug']) {
	    		$w[Root]['getModule']('./common.es5.helper', function() {});
	    	}
	    }
	    
	    // Process Manager.
	    Base.Process= {
    		log	: {
	    		log_trace : [],
	    		doLogging : function(o) {
	    			this.log_trace.push(o);
	    		}
	    	},
	    	ajax: {
	    		_observer : {
	    			interval	: 200,	    			
	    			checkCount	: 0,
	    			checkLimit	: 10,
	    			doAjaxProcessChecker: undefined,
	    			doAjaxProcessStart	: undefined,
	    			doAjaxProcessEnd	: undefined
	    		},
	    		_total_call_cnt	: 0,
	    		_runing_call_cnt: 0,
				_last_call_time	: 0,
				_call_url_trace	: {},
				_call_history	: [],
				doStart : function(callUrl, param) {
					if(!callUrl) return;
					let That = this;					
					if(!That._call_url_trace[callUrl]) {
						That._call_url_trace[callUrl] = {
							first_call	: (new Date()),
							last_call	: 0,
							cool_time	: 0,
							call_cnt	: 0,
							call_success: 0,
							call_status	: 0,
							call_param	: undefined
						};
					}
					That._total_call_cnt++;
					That._runing_call_cnt++;
					That._last_call_time = (new Date()).getTime();
					That._call_url_trace[callUrl].call_cnt++;
					That._call_url_trace[callUrl].call_status	= 0;
					That._call_url_trace[callUrl].call_param	= (param||{});
					That._call_url_trace[callUrl].last_call		= (new Date());
					if (That._observer && That._observer['doAjaxProcessStart'] &&
						That._runing_call_cnt === 1
					) {
						Base.logging(That, ' >>> _observer.doAjaxProcessStart()');
						That._observer['doAjaxProcessStart']((param||{}));
						/** Ajax Call Checking. **/
						if(!That._observer['doAjaxProcessChecker']) {
							That._observer['checkCount'] = 0;
							That._observer['doAjaxProcessChecker'] = $w.setInterval(function() {
								Base.logging(That, ' >>> _observer.doAjaxProcessChecker()');
								That.doCheckProcessEnd();
								That._observer['checkCount']++;								
							},  That._observer['interval']);
						}
					}
				},
				doComplate : function(callUrl, status) {
					if(!callUrl) return;
					let That = this;
					if (That._call_url_trace[callUrl]&&That._call_url_trace[callUrl].call_status==0) {
						That._call_url_trace[callUrl].call_success++;
						That._call_url_trace[callUrl].call_status	= (status||0);
						That._call_url_trace[callUrl].cool_time		= (new Date()).getTime() - That._call_url_trace[callUrl].last_call.getTime();
						That._call_history.push({'url':callUrl, 'stack':Base.clone(That._call_url_trace[callUrl])});
						That._runing_call_cnt--;
					}
					if (That._runing_call_cnt == 0) {
						That._last_call_time = 0;
					}
				},
				isProcessing: function() {
					return this._runing_call_cnt > 0;
				},
				setProccessObserver: function(observer) {
					if (typeof observer == 'object') this._observer = $.extend(this._observer, observer);
				},
				doCheckProcessEnd: function() {
					// 모든 Ajax Call 종료 확인.
					if(!this.isProcessing()) {
						if (this._observer && this._observer['doAjaxProcessEnd']) {						
							Base.logging(this, ' >>> _observer.doAjaxProcessEnd()');
							$w.clearInterval(this._observer['doAjaxProcessChecker']);
							this._observer['doAjaxProcessChecker'] = undefined;
							this._observer['checkCount'] = 0;
							this._observer['doAjaxProcessEnd']();
						}
					}
					else {
						if (this._observer['checkCount'] > this._observer['checkLimit']) {
							Base.logging(this, ' >>> _observer.doAjaxProcessEnd()');
							$w.clearInterval(this._observer['doAjaxProcessChecker']);
							this._observer['doAjaxProcessChecker'] = undefined;
							this._observer['checkCount'] = 0;
							this._observer['doAjaxProcessEnd']();
						}
					}
				}
	    	}
		};	    
}) (window, jQuery);