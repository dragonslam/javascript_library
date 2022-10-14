/* common.es6.control.pages.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w, root) {
	'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
	const Utils= Base.Utils;
	const Fetch= Base.Fetch;

	const PageControlOptions = {
		cacheOption : { /** Utils.cache initialize options */ },
		elements 	: { /** List of HTML Element objects to use on the page */ 
			selecter: '',
			events	: {}
		},
		events   	: { /** List of events. Attach to the HTML Element object for use in the page */ },
		transactions: { /** Setting up the API that the page calls */
			context : ""/** The main context name of the API called by the page */,
			tranList: { /** List of APIs that the page calls */ 
				'tranid': {
					method		: 'GET', 		/** GET, POST, PUT, DEL */
					datatype	: 'JSON', 		/** datatype : JSON, TEXT, HTML, default : JSON */
					endpoint:'endpoint.action', /** Api call url : `/${context}/${endpoint}` */
					render		: 'show_tranid',/** Function name to receive and process the result after completing the API call  */
					isUseCache	: true, 		/** Use a data cache. default : true */
					cacheOption	: {type:'local', span:60, format:'m'} /** Utils.cache class option. */
				}
			}
		}
	};
	

	class PageControlHandler {
		constructor(oPage, options = {}) {
			this.page = oPage;
			this.options = Base.extends({}, PageControlOptions, (options||{}));
			this.#initPage();
		}	
		#initPage() {
			this.#initCacheHelper(this.options?.cacheOption)
				.#initElementSelecter(this.options?.elements)
				.#initTransaction(this.options?.transactions)
			;
			return this;
		}
		#initCacheHelper(opts = {}) {
			Base.logging(this.page, '_initCacheHelper()');
			const Page = this.page;
			const Opts = Base.extends({}, {prifix:Page.classUUID, span:10, format:'m'}, opts);
			Page._cache= Utils.cache( Opts );
			return this;
		}
		#initElementSelecter(elementList = {}) {
			Base.logging(this.page, '_initElementSelecter()');
			const Page = this.page;
			if (!elementList['container']) {
				throw new Error('The HTML Element value of the entire region(container) of the Page control is undefined.');
			}
			Object.keys(elementList).forEach((id) => {
				const elem = elementList[id];
				/** Select HTML elements. */
				if (elem['selecter']) {
					Page._elem[id] = Base(elem.selecter);
				}
				/** Bind events to HTML elements. */
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
		}
        #initEventListner(events = {}) {
			Base.logging(this.page, '_initEventListner()');
			const Page = this.page;
			Object.keys(events).forEach((id) => {
				let _event= events[id];
				Page._elem[id]?.Bind.call(Page._elem[id], _event['event'], function(e) {
					Page[(_event['callback'] ? _event['callback'] : `${_event['event']}_${id}`)]?.call(Page, e);
				});
			});
			return this;
		}
		#initTransaction(transactions = {}) {
			Base.logging(this.page, '_initTransaction()');
			const Page = this.page;
			Page._env.tranContext = transactions?.context;
			Page._env.trans = transactions?.tranList;
			return this;
		}
		_runTransaction(tranId, params = {}) {
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
				This.#tranSuccess(tranId);
				This.#tranComplete();
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
						if (isUseCache && !!!Base.config['is_debug'] ) {
							Cache.set(uniqueName, JSON.stringify(data));
						}
						Page._data[tranId] = data;
						This.#tranSuccess(tranId)
							.#tranComplete();
					})
					.catch(function(error) {
						This.#tranError(tranId, error)						
							.#tranComplete();
					});
			}
			return This;
		}
		#tranSuccess(tranId) {
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
		}
		#tranError(tranId, error) {
			let Page = this.page,
				Tran = Page._env.trans[tranId];
			Base.tracking(`${Page['classPath']}._tranError(${tranId}) =>`, error);
			let renders=Tran['render'].split(',');
				renders.forEach(render => {
					Base.tracking(`${Page['classPath']}._tranRender(${tranId}).call(${render}) =>`, Data);
					Page[render]?.call(Page, {}, error);
				});			
			Tran.isRunning = false;
			return this;
		}
		#tranIsRun() {
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
		}
		#tranComplete() {
			if(!this.#tranIsRun()) {
				Base.logging(this.page, `_tranComplete() => Transaction All Complete.`);
			}
		}
	};

	const PageControl = {
		_env	: {
			isUseCache	 : false,
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
			this.handler = new PageControlHandler(this, options);
			return this;
		},
		createGrid: function(elementId, transactionId, columns = {}, options = {}, handler = {}) {
			Base.logging(this, `createGrid(${elementId}, ${transactionId})`);

			return this;
		},
		startTransaction: function(runTran = {}, param = {}) {
			Base.logging(this, 'startTransaction()');
			const This = this;
			if (typeof runTran == 'object') {
				Object.keys(runTran).forEach((tranId) => {
					if (This._env.trans[tranId]) {
						This.handler._runTransaction(tranId, runTran[tranId]);
					}
				});
			} else if (typeof runTran == 'string') {
				if (This._env.trans[runTran]) {
					This.handler._runTransaction(runTran, param);
				}
			}			
			return this;
		},
		show : function() {
			Base.logging(this, 'show()');
			this._elem['container']?.Show();
			return this;
		},
		hide : function() {
			Base.logging(this, 'hide()');
			this._elem['container']?.Hide();
			return this;
		},
		find : function(...arg) {
			Base.logging(this, 'find()');
			return this._elem['container']?.Find(arg);
		},
	};
	        
    Base.extends(Base.Control.Page, {
		/** Create and return a private built-in common page control object */
		createPageControl : function(pageClass) {
			return Base.Core.module(pageClass, PageControl, 'PageControl');
		}
	});

}) (window, __DOMAIN_NAME||'');