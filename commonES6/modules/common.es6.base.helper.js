/* common.es6.base.helper.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/15
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const LoggerHelper = {
        wtf     : function() {console.log(arguments)},
        tracking: function() {console.log(arguments)},
        logging : function(caller, data, lvl = 'INFO') {
            if (!!!data) return;
            var msg = (caller && caller['classPath'] ? caller['classPath']+'.' : '');
            if (typeof data == 'object') {
                console.log('['+ lvl +'] '+ msg +' Object');
                for(var prop in data) {
                    if (typeof data[prop] != 'function') {
                        console.log('    '+ prop +' : ['+ data[prop] +']');
                    }
                }
            }
            else {
                console.log('['+ lvl +'] '+ (msg+(data||'')) );
            }        
        },
    };
    const ChromeHelper = {
        wtf     : Function.prototype.bind.call(console.warn, $w, '%c[WTF ]', 'color:red;'),
        tracking: Function.prototype.bind.call(console.log, $w, '%c[WARN]', 'color:red;'),
        logging : function(caller, data, level) {
            if (!!!data) return;
            var msg = (caller && caller['classPath'] ? caller['classPath']+'.' : '');
            var oLvl= {lvl:'INFO', col:'gray', txt:'black'};
            if (typeof level == 'boolean' && !!level) { 
                oLvl= {lvl:'WARN', col:'orange', txt:'orange'};
            }
            else if (typeof level == 'object' && !!level['txt']) {
                oLvl= {txt:(level['txt']||''), col:(level['col']||'')};
            }
            if (typeof data == 'object') {
                this.tracking(msg +'Object', data);	
            }
            else {
                console.log('%c['+ oLvl['lvl'] +']', 'color:'+oLvl['col']+';', (msg+(data||'')) );
            }        
        },
    };
    
    if (Base.Browser().isChrome() || Base.Browser().isSafari()) {
        Object.assign(Base, ChromeHelper);
    }
    else {
        Object.assign(Base, LoggerHelper);
    }
}) (window, __DOMAIN_NAME||'');