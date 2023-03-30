/** common.base.debug.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const LoggerHelper = {
        group   : function() {console.log(arguments)},
        groupEnd: function() {console.log(arguments)},
        error   : function() {console.log(arguments)},
        wtf     : function() {console.log(arguments)},
        tracking: function() {console.log(arguments)},
        logging : function(caller, data, lvl = 'INFO') {
            if (!!!data) return;
            if (caller && typeof caller['_isDebug'] === 'boolean' && caller['_isDebug'] === false) return;
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
                console.log( this.getLogTime(lvl) +(msg+(data||'')) );
            }
        },
        getLogTime:function(lvl) {
            let time = Date.now() - Base.log;
            Base.log = Date.now();
            return ((time > 50) ? String(time).padLeft(5, ' ').substring(0, 5) : '['+lvl)+'] ';
        },        
    };
    const TITLE_STYLE  = 'font-weight:bold; color:#ffffff; background-color:#313235; background:linear-gradient(95deg, #107BF9 -0.96%, #2470D1, #C83732, #E20A65 99.96%); border-radius:3px; padding:2px;';
    const LOGGER_STYLE = 'color:{0}; background-color:#fefefe; border-radius:3px; border:solid 1px #efefef; padding:1px; background:linear-gradient(95deg, {1}, {2});';
    const ChromeHelper = {
        error   : Function.prototype.bind.call(console.error,$w,`%c[ER0R]`, LOGGER_STYLE.format('#EE230D', '#deeefe', '#fedede')),
        wtf     : Function.prototype.bind.call(console.warn, $w,`%c[WTF ]`, LOGGER_STYLE.format('#C83732', '#deeefe', '#fedede')),
        tracking: Function.prototype.bind.call(console.log, $w, `%c[WARN]`, LOGGER_STYLE.format('#2470D1', '#deeefe', '#fedede')),  
        group   : function(msgId) {
            console.group(`%c[${msgId}]`, LOGGER_STYLE.format('#F0F0F0', '#2470D1', '#C83732'));
            console.time(msgId);
        },
        groupEnd: function(msgId) {
            console.timeEnd(msgId);
            console.groupEnd(msgId);
        },
        logging : function(caller, data, level) {
            if (!!!data || !!!caller) return;
            if (caller && typeof caller['_isDebug'] === 'boolean' && caller['_isDebug'] === false) return;
            let msg = (caller && caller['classPath'] ? caller['classPath']+'.' : '');
            let oLvl= {lvl:'INFO', col:'gray', txt:'black'};
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
                oLvl = this.getLogTime(oLvl);
                console.log(`%c${oLvl['lvl']}`, LOGGER_STYLE.format(oLvl['col'], '#fefefe', '#eeeeee'), (msg+(data||'')) );
            }
        },
        getLogTime:function(oLvl) {
            let time = Date.now() - Base.log;
            Base.log = Date.now();
            oLvl.lvl = (time > 100 ? String(time).padLeft(5, ' ').substring(0, 5) : '[INFO')+']';
            oLvl.col = (time > 100 ? 'blue' :'gray');
            return oLvl;
        },        
    };
    
    if (Base.getBrowser().isChrome || Base.getBrowser().isSafari) {
        Base.extends(Base, ChromeHelper, {isExtendLogging:true});
        console.log(`%c [ ${root.toUpperCase()} ] - ES6 JS Framework - Develop Environment - ${__DOMAIN_CONF['js_base_name']} %c - %c Configurations : `
            , TITLE_STYLE, 'color:#333333; background-color:#ffffff;', LOGGER_STYLE.format('#F0F0F0', '#2470D1', '#C83732')
            , Base.config
        );
    }
    else {
        Base.extends(Base, LoggerHelper, {isExtendLogging:true});
    }
}) (window, __DOMAIN_NAME||'');