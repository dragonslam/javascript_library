/* common.es6.control.pages.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
	const Utils= Base.Utils;
	const Fetch= Base.Fetch;

	const PageOptions = {
		cacheOption : { /** Utils.cache initialize options */ },
		elements 	: { /** List of HTML Element objects to use on the page */ 
			selecter: '',
			events	: {}
		},
		events   	: { /** List of events. Attach to the HTML Element object for use in the page */ },
		transactions: { /** Setting up the API that the page calls */
			context : ""/** The main context name of the API called by the page */,
			tranList: { /** List of APIs that the page calls */ }
		}
	};
	const Handler = function(oPage, options = undefined) {
		this.page = oPage;
		this.options = Base.extends({}, PageOptions, (options||{}));
		this._initPage();
	};
	Handler.prototype = {
		_initPage : function() {
			this._initCacheHelper(this.options?.cacheOption)
				._initElementSelecter(this.options?.elements)
				._initTransaction(this.options?.transactions)
			;
			return this;
		},
		_initCacheHelper : function(opts = {}) {
			Base.logging(this.page, '_initCacheHelper()');
			const Page = this.page;
			const Opts = Base.extends({}, {prifix:Page.classUUID, span:10, format:'m'}, opts);
			Page._cache= Utils.cache( Opts );
			return this;
		},
		_initElementSelecter: function(elementList = {}) {
			Base.logging(this.page, '_initElementSelecter()');
			const Page = this.page;
			Object.keys(elementList).forEach((id) => {
				const elem = elementList[id];
				if (elem['selecter']) {
					Page._elem[id] = Base(elem.selecter);
				}
				if (elem['events']) {
					Object.keys(elem.events).forEach((idx) => {													
						let _event = elem.events[idx];
						Page._elem[id]?.Bind.call(Page._elem[id], _event['on'], function(e) {
							Page[(_event['callback'] ? _event['callback'] : `${_event['on']}_${id}`)]?.call(Page, e);
						});
					});
				}
			});
			return this;
		},
        _initEventListner : function(events = {}) {
			Base.logging(this.page, '_initEventListner()');
			const Page = this.page;
			Object.keys(events).forEach((id) => {
				let _event= events[id];
				Page._elem[id]?.Bind.call(Page._elem[id], _event['event'], function(e) {
					Page[(_event['callback'] ? _event['callback'] : `${_event['event']}_${id}`)]?.call(Page, e);
				});
			});
			return this;
		},
		_initTransaction : function(transactions = {}) {
			Base.logging(this.page, '_initTransaction()');
			const Page = this.page;
			Page._env.tranContext = transactions?.context;
			Page._env.trans = transactions?.tranList;
			return this;
		},
		_runTransaction : function(tranId, params = {}) {
			let This = this,
				Page = this.page,
				Env  = this.page._env,
				Tran = this.page._env.trans[tranId],
				Cache= this.page._cache;
			if(!Tran) {
				alert(`This is an undefined transaction.\n\n\r- {${tranId}}`);
				return false;
			}
			const isUseCache = (typeof Tran['isUseCache'] == 'boolean') ? Tran['isUseCache'] : Env.isUseCache;
			const uniqueName = `${tranId}#${Utils.serializeQuerystring(params)}`;
			if (isUseCache && Tran['cacheOption']) {
				if(!Tran['cache']) {
					Tran['cache'] = Utils.cache( Base.extends({}, {prifix:Page.classUUID, span:10, format:'m'}, Tran['cacheOption']) );
				}
				Cache = Tran['cache'];
			}
			if (isUseCache && Cache.isStatus(uniqueName)) {
				Base.logging(Page, `_runTransaction(${tranId})->UseCache`);
				Tran.isRunning = false;
				Page._data[tranId] = JSON.parse(Cache.get(uniqueName));
				This._tranSuccess(tranId);
				This._tranComplete();
			}
			else {
				Base.logging(Page, `_runTransaction(${tranId})->UseFetch`);				
				let endpoint= Tran.endpoint;
				if (endpoint.includes('{') > 0) {
					Object.keys(params).forEach((key) => {
						endpoint = endpoint.replaceAll(`{${key}}`, (params[key]||''));
					});
				} 
				let apiUrl = (endpoint.isUrl()) ? endpoint : ('/'+ Env.tranContext +'/'+ endpoint);
				
				Page._data[tranId] = '';
				Env.isRunningTran = true;
				Tran.isRunning = true;
				Fetch[Tran.method.toLowerCase()].call(Page, apiUrl, params)
					.then(function(data) {
						if (isUseCache ) { //&& !!!Base.config['is_debug']
							Cache.set(uniqueName, JSON.stringify(data));
						}
						Page._data[tranId] = data;
						This._tranSuccess(tranId)
							._tranComplete();
					})
					.catch(function(error) {
						This._tranError(tranId, error)						
							._tranComplete();
					});
			}
			return This;
		},
		_tranSuccess : function(tranId) {
			let Page = this.page,
				Tran = Page._env.trans[tranId],
				Data = Page._data[tranId];

			Base.tracking(`${Page['classPath']}._transSuccess(${tranId}) =>`, Page);
			let renders=Tran['render'].split(',');
				renders.forEach(render => {
					Base.tracking(`${Page['classPath']}._tranRender(${tranId}).call(${render}) =>`, Data);
					Page[render]?.call(Page, Data);
				});
			Tran.isRunning = false;
			return this;
		},
		_tranError : function(tranId, error) {
			let Page = this.page,
				Tran = Page._env.trans[tranId];
			Base.tracking(`${Page['classPath']}._tranError(${tranId}) =>`, error);
			Tran.isRunning = false;
			return this;
		},
		_tranIsRun : function() {
			let Page = this.page,
				Trans= Page._env.trans;
			let isRun = false;
			if (Trans) {				
				Object.keys(Trans).forEach((tran) => {
					if(!isRun) isRun = Trans[tran].isRunning;					
				});
			}
			Page._env.isRunningTran = isRun;
			return isRun;
		},
		_tranComplete : function() {
			if(!this._tranIsRun()) {
				Base.logging(this.page, `_tranComplete() => Transaction All Complete.`);
			}
		},
	};

	const Pages = {
		_env	: {
			isUseCache	 : true,
			isRunningTran: false,
			tranContext	 : '',
			trans : {}
		},
		_data	: {},
		_elem	: {},
		handler : {},
		isInit	: false,
		isHelper: !!Base.config['is_debug'],
		init 	: function(options = {}) {
			Base.logging(this, 'init()');
			Base.tracking('>> Page Module :: ', this);
			this.handler = new Handler(this, options);
			return this;
		},
		startTransaction: function(runTrans = {}) {
			Base.logging(this, 'startTransaction()');
			const This = this;
			Object.keys(runTrans).forEach((tranId) => {
				if (This._env.trans[tranId]) {
					This.handler._runTransaction(tranId, runTrans[tranId]);
				}
			});
			return this;
		},
		show : function() {
			Base.logging(this, 'show()');
			return this;
		},
	};
    
    Base.extends(Base.Control.Pages, Pages);

}) (window, __DOMAIN_NAME||'');