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
		isTran	: false,
		isHelper: !!Base.global['is_debug'],
		init 	: function() {
			Base.logging(this, 'init()');
			let This = this;
			This._cache	= Util.cache( {prifix:This.classPrifix, span:10, format:'m'} );
			This.initEventListner()
				.initTransaction('tranContext', {
					LIST_TRAN : {method:'GET', endpoint:'search_1' ,render:'pageShowListRender' ,isAsync:true },
					VIEW_TRAN : {method:'GET', endpoint:'search_2' ,render:'pageShowViewRender' ,isAsync:true }
				})
				.pageBeforeShow()
				.pageShow();
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
		_runTransaction : function(tranId, params = {}) {
			let This = this,
				_Env = this._env,
				_Tran= this._env.trans[tranId];			
			if (_Tran) {
				_Env.isRunningTran = true;

				let cacheName = tranId +'#'+ Util.serializeQuerystring(params);
				if (_Env.isUseCache && This._cache.isStatus(cacheName)) {
					Base.logging(this, `_runTransaction(${tranId})->UseCache`);
					This._data[tranId] = JSON.parse(This._cache.get(cacheName));
					This._transSuccess(tranId);
				}
				else {
					Base.logging(this, `_runTransaction(${tranId})->UseFetch`);					
					Fetch[_Tran.method.toLowerCase()].call(This
						, '/'+ _Env.tranContext +'/'+ _Tran.endpoint
						, params						
					).then(function(data) {
							if (_Env.isUseCache && !!!Base.global['is_debug']) {
								This._cache.set(cacheName, Util.jsonToString(data));
							}
							This._data[tranId] = data;
							This._transSuccess(tranId);
						},
						function(msg) {
							This._tranError(msg);
						}
					);
				}
			}
		},
		_transSuccess : function(tranId) {
			Base.logging(this, '_transSuccess()');
			let This = this,
				_Env = this._env,
				_Tran= this._env.trans[tranId],
				_Data= this._data[tranId];
			if (_Tran) {
				let renders = (_Tran.render||'').split(',');
				renders.forEach(render => {
					Base.tracking(`>> ${render}() => `, _Data);
					This[render].call(This, _Data);
				});
				_Env.isRunningTran = false;
			}
			return This;
		},
		_tranError : function(httpError) {
			Base.logging(this, `tranError(${httpError})`);
			Base.tracking('>> HttpError => ', httpError);
			return this;
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