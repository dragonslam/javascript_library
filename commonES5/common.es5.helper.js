(function($w, $) {
	"use strict";
	
	if (!!!$ ) return;
	if (!!!$w) return;
	if (!!!$w['__ROOT']) return;
	if (!!!$w['console']) return;

	var Base = $w['__ROOT'];
		Base.isHelper	= (!!$w['$U'] && !!$w['$U']['uNo']&& !!$w['$U']['isDebug']);
		Base.isLogging	= (!!Base['isHelper']);
	if (Base.getBrowser() === 'Chrome' && !!!Base.getDevice().isMobile) {
		Base.wtf	 = Function.prototype.bind.call(console.warn, $w, '%c[WTF ]', 'color:red;');
		Base.tracking= Function.prototype.bind.call(console.log, $w, '%c[DEBUG]', 'color:red;');		
		Base.logging = function(caller, data, level) {
			if (!!!data) return;
			var msg = (caller && caller['classPath'] ? caller['classPath']+'.' : '');
			var oLvl= {lvl:'INFO ', col:'gray', txt:'black'};
			if (typeof level == 'boolean' && !!level) { 
				oLvl= {lvl:'WARNN', col:'orange', txt:'orange'};
			}
			else if (typeof level == 'object' && !!level['txt']) {
				oLvl= {txt:(level['txt']||''), col:(level['col']||'')};
			}
			if (typeof data == 'object') {
				if (!!Base['isHelper']) {
					Base.tracking(msg +'Object', data);	
				}
				else {
					console[console.group ? 'group' : 'log'](msg +'Object');
					for(var prop in data) {
		                if (typeof data[prop] != 'function') {
		                	console.log('%c    '+ prop +' : ['+ data[prop] +']', 'color:'+ oLvl['txt'] +';');
		                }
		            }
					if (console.group)
						console.groupEnd();
				}
			}
			else {
				console.log('%c['+ oLvl['lvl'] +']', 'color:'+oLvl['col']+';', (msg+(data||'')) );
			}
			if (!!Base['Process']) Base.Process.log.doLogging({'caller':caller, 'data':(msg+(data||''))});
		};		
	}
	else {
		Base.wtf	 = function() {console.log(arguments)};
		Base.tracking= function() {console.log(arguments)};		
		Base.logging = function(caller, data, level) {
			if (!!!data) return;
			var msg = (caller && caller['classPath'] ? caller['classPath']+'.' : '');
			var oLvl= {lvl:'INFO ', col:'gray', txt:'black'};
			if (typeof level == 'boolean' && !!level) { 
				oLvl= {lvl:'WARNN', col:'orange', txt:'orange'};
			}
			else if (typeof level == 'object' && !!level['txt']) {
				oLvl= {txt:(level['txt']||''), col:(level['col']||'')};
			}
			if (typeof data == 'object') {
				if (!!Base['isHelper']) {
					Base.tracking(msg +'Object', data);	
				}
				else {
					console[console.group ? 'group' : 'log'](msg +'Object');
					for(var prop in data) {
		                if (typeof data[prop] != 'function') {
		                	console.log('    '+ prop +' : ['+ data[prop] +']');
		                }
		            }
					if (console.group)
						console.groupEnd();
				}
			}
			else {
				if (oLvl['lvl'] == 'INFO') {
					console[console.info ? 'info' : 'log']('['+ oLvl['lvl'] +'] '+ (msg+(data||'')));
				}
				else {
					console.log('['+ oLvl['lvl'] +'] '+ (msg+(data||'')) );
				}
			}
			if (!!Base['Process']) Base.Process.log.doLogging({'caller':caller, 'data':(msg+(data||''))});
		};
	}
		Base.supportFilter = function(obj, callback) {
			Base.logging(this, 'supportFilter()');
		};
		Base.supportDashboard = function(obj) {
			Base.logging(this, 'supportDashboard()');			
		};
		
}) (window, jQuery);