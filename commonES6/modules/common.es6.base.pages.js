/* common.es6.base.pages.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
	const Util = Base.Util;
	const Fetch= Base.Fetch;
    const Pages= {
		_env	: {
			isUseCache	 : true,
			isRunningTran: false,
			tranContext	 : '',
			trans : {}
		},
		_data	: {},
		_elem	: {},
		isInit	: false,
		isHelper: !!Base.global['is_debug'],
		init 	: function() {
			Base.logging(this, 'init()');
			let This = this;
			This._cache	= Util.cache( {prifix:This.classPrifix, span:10, format:'m'} );
			/** 
			 * TO-DO :: Initialize each page module.
			This.initEventListner()
				.initTransaction('tranContext', {
					LIST_TRAN : {method:'GET', endpoint:'search' ,render:'pageShowListRender' ,isAsync:true },
					VIEW_TRAN : {method:'GET', endpoint:'view/{seq}' ,render:'pageShowViewRender' ,isAsync:true }
				})
				.pageBeforeShow()
				.pageShow();
			*/
			return This;
		},
        initEventListner : function() {
			Base.logging(this, 'initEventListner()');
			this.isInit = true;
			return this;
		},
		initTransaction : function(context, trans = {}) {
			Base.logging(this, 'initTransaction()');
			this._env.tranContext = context;
			this._env.trans = trans;
			return this;
		},
		startTransaction: function() {
			Base.logging(this, 'startTransaction()');
			return this;
		},
		_runTran : function(tranId, params = {}) {
			let This = this,
				_Env = this._env,
				_Tran= this._env.trans[tranId];			
			if(!_Tran) {
				alert(`This is an undefined transaction.\n\n\r- {${tranId}}`);
				return false;
			}
						
			const cacheName = tranId +'#'+ Util.serializeQuerystring(params);
			if (_Env.isUseCache && This._cache.isStatus(cacheName)) {
				Base.logging(this, `_runTransaction(${tranId})->UseCache`);
				_Tran.isRunning = false;
				This._data[tranId] = JSON.parse(This._cache.get(cacheName));
				This._transSuccess(tranId);
				This._endTransaction();
			}
			else {
				Base.logging(this, `_runTransaction(${tranId})->UseFetch`);				
				let endpoint= _Tran.endpoint;
				if (endpoint.includes('{') > 0) {					
					Object.keys(params).forEach((key) => {
						endpoint = endpoint.replaceAll(`{${key}}`, (params[key]||''));
					});
				} 
				let apiUrl = (endpoint.isUrl()) ? endpoint : ('/'+ _Env.tranContext +'/'+ endpoint);
				
				This._data[tranId] = '';
				_Env.isRunningTran = true;
				_Tran.isRunning = true;
				Fetch[_Tran.method.toLowerCase()].call(This, apiUrl, params)
					.then(
						function(data) {
							if (_Env.isUseCache && !!!Base.global['is_debug']) {
								This._cache.set(cacheName, Util.jsonToString(data));
							}
							This._data[tranId] = data;
							This._transSuccess(tranId);
							_Tran.isRunning = false;
							This._endTransaction();
						},
						function(error) {
							This._tranError(error);
							_Tran.isRunning = false;
							This._endTransaction();
						}
					);
			}
			return This;
		},
		_transSuccess : function(tranId) {
			Base.logging(this, `_transSuccess(${tranId})`);
			Base.tracking(`>> _transSuccess(${tranId})`, this);
			let This = this,
				_Tran= This._env.trans[tranId],
				_Data= This._data[tranId];
				
			let renders=_Tran['render'].split(',');
				renders.forEach(render => {
					Base.tracking(`>> ${render}() => `, _Data);
					This[render] && This[render].call(This, _Data);
				});
		},
		_tranError : function(error) {
			Base.logging(this, `_tranError(${error})`);
			Base.tracking('>> HttpError => ', error);
		},
		_tranCheck : function() {
			let isRun = false;
			if (this._env.trans) {				
				Object.keys(this._env.trans).forEach((tran) => {
					if(!isRun) isRun = this._env.trans[tran].isRunning;					
				});
			}
			this._env.isRunningTran = isRun;
			return isRun;
		},
		_endTransaction : function() {
			if(!this._tranCheck()) {
				Base.logging(this, `_endTransaction() => Transaction All Complete.`);
			}
		},
		pageBeforeShow : function() {
			Base.logging(this, 'pageBeforeShow()');
			return this;
		},
		pageShow : function() {
			Base.logging(this, 'pageShow()');
			return this;
		},
	};
    
    Base.extends(Base.Pages, Pages);

}) (window, __DOMAIN_NAME||'');