/** common.control.page.js */
(function($w, root) {
	'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base 	= $w[root];
	const Utils	= Base.Utils;
	const Fetch	= Base.Fetch;
	const Control= Base.Control;

	/** Page control basic options interface. */
	const PageControlOptions = {
		cacheOption : {  } /** Utils.cache initialize options */ ,
		pageContext : null /** Current Page application context */ , 
		panelControl: null /** Current PanelControl */ , 
		elements 	: {    /** List of HTML Element objects to use on the page */ 
			container	: {},
			elementList	: {
				'element_id1' : {selecter: '', events  : {'on':'event', 'callback':'callback_function'}},
				'element_id2' : {selecter: '', events  : {'on':'event', 'callback':'callback_function'}},
			}
		},
		events   	: { /** List of events. Attach to the HTML Element object for use in the page */ },
		transactions: { /** Setting up the API that the page calls */
			'tranid': {
				method		: 'GET', 			/** GET, POST, PUT, DEL */
				datatype	: 'JSON', 			/** Datatype : JSON, TEXT, HTML, default : JSON */
				endpoint	: 'endpoint.action',/** Api call url : `/${context}/${endpoint}` */
				callback	: 'show_tranid',	/** Function name to receive and process the result after completing the API call  */
				isUseCache	: true, 			/** Use a data cache. default : true */
				cacheOption	: {type:'local', span:60, format:'m'} /** Utils.cache class option. */
			}
		}
	};
	
	/** Page control handler. */
	class PageControlHandler {
		constructor(oPage, options = {}) {
			this.page	= oPage;
			this.options= Base.extends({}, PageControlOptions, (options||{}));
			this.page._context	= this.options?.pageContext || null;

			if (this.page._context?.panelControl && this.page._context.panelControl instanceof Control.ControlBase) {
				this.page._panel = this.options.pageContext.panelControl;
				this.page._parent.onShowPage = ()=> this.page.onShowPage();
				this.page._parent.setPanelContext = (o)=> this.page.setPanelContext(o);
				this.page._parent.getPanelContext = (s)=> this.page.getPanelContext(s);
			} else {
				this.page._panel = null;
			}
			this.initPage();
		}	
		initPage() {
			this.initCacheHelper(this.options?.cacheOption)
				.initElementSelecter(this.options?.elements)
				.initEventListner(this.options?.events)
				.initTransaction(this.options?.transactions)
			;
			return this;
		}
		initCacheHelper(opts = {}) {
			//Base.logging(this.page, 'initCacheHelper()');
			const Page = this.page;
			const Opts = Base.extends({}, {prifix:Page.classUUID, span:10, format:'m'}, opts);
			Page._cache= Utils.cache( Opts );
			return this;
		}
		initElementSelecter(elements = {}) {
			//Base.logging(this.page, 'initElementSelecter()');
			const Page = this.page;
			if(!elements['container']) {
				throw new Error('The HTML Element value of the entire region(container) of the Page control is undefined.');
			}
			if (typeof elements['container']['selecter'] == 'string' && !Base(elements['container']['selecter'])) {
				throw new Error('The HTML Element value of the entire region(container) of the Page control is undefined.');
			}
			/** Select control container element. */
			const container	= elements['container'];
			Page.setContainer( (container['selecter'] ? Base(container['selecter']) : container) );
			Page.setElements({child_elements : Page.find('[id]')});
			Page._id = Page.getContainer()?.attr('id');
			if (!!elements['isRestructuring']) {
				Base.logging(this.page, 'initElementSelecter().Restructuring()');
				Page._env.isRestructuring = true;
				if (Page.getElements().child_elements instanceof NodeList) {
					Page.getElements().child_elements.forEach(function(obj, idx) {
						if (obj.id) {
							const _id = Page.getID(obj.id);
							Page.find(`label[for="${obj.id}"]`)?.attr('for', _id);
							obj.id = _id;
						}
					});
				} else {
					let obj = Page.getElements().child_elements;
					if (obj?.id) {
						const _id = Page.getID(obj.id);
						Page.find(`label[for="${obj.id}"]`)?.attr('for', _id);
						obj.id = _id;
					}
				}
			}
			if (elements['elementList']) {
				Object.keys(elements['elementList']).forEach((id) => {
					const elem = elements['elementList'][id];
					/** Select HTML elements. */
					Page.setElements(id, Page.find(elem['selecter']));
					if (elem['events']) {
						let _event = {};
						_event[id] = elem['events'];
						this.initEventListner(_event);
					}
				});
			}
			return this;
		}
		/** Bind events to HTML elements.
		* @param  events : {{elementId : [eventLists]}, ... }
		*/
        initEventListner(events = {}) {
			//Base.logging(this.page, 'initEventListner()');
			const Page = this.page;
			const _bindEvent = function(elm, id, evt) {
				elm?.bind.call(elm, evt['on'], function(e) {
					Page[(evt['callback'] ? evt['callback'] : `${evt['on']}_${id}`)]?.call(Page, e);
				});
			};
			Object.keys(events).forEach((id) => {
				if (events[id] instanceof Array) {
					events[id].forEach((evt) => {						
						_bindEvent(Page.getElements(id), id, evt);
					});
				} else {
					_bindEvent(Page.getElements(id), id, events[id]);
				}
			});
			return this;
		}
		initTransaction(transactions = {}) {
			//Base.logging(this.page, 'initTransaction()');
			const Page = this.page;
			Page._env.trans = transactions;
			Object.entries(Page._env.trans).forEach(([key,obj])=>{
				Page._env.trans[key] = Base.extends({					
					isAsync		: true,
					isUseCache	: true 
				}, obj);
			});
			return this;
		}
		_tranStart(tranId, params = {}) {
			let This = this,
				Page = this.page,
				Env  = this.page._env,
				Tran = this.page._env.trans[tranId],
				Cache= this.page._cache,
				Param= Base.extends({}, params);
			if(!Tran) {
				alert(`This is an undefined transaction.\n\n\r- {${tranId}}`);
				return false;
			}
			const isUseCache = (typeof Tran['isUseCache'] == 'boolean') ? Tran['isUseCache'] : Env.isUseCache;
			const uniqueName = `${tranId}#${Utils.serializeString(params)}`;
			if (isUseCache && Tran['cacheOption']) {
				if(!Tran['cache']) {
					Tran['cache'] = Utils.cache( Base.extends({}, {prifix:Page.classUUID, span:10, format:'m'}, Tran['cacheOption']) );
				}
				Cache = Tran['cache'];
			}
			if (isUseCache && Cache.isStatus(uniqueName)) {
				Base.logging(Page, `_tranStart(${tranId}) => UseCache()`);
				Tran.isRunning = false;
				Page._data[tranId] = JSON.parse(Cache.get(uniqueName));
				This.tranSuccess(tranId, Param);
				This.tranComplete();
			}
			else {				
				Base.group(Page.classPath +'.Transaction.'+ tranId);
				Base.logging(Page, `_tranStart(${tranId}) => UseFetch(isAsync:${Tran['isAsync']})`);
				let endpoint= Tran.endpoint;
				if (endpoint.includes('{') > 0) {
					Object.keys(params).forEach((key) => {
						endpoint = endpoint.replaceAll(`{${key}}`, (params[key]||''));
					});
				} 
				let apiUrl = (endpoint.isUrl()) ? endpoint : ('/'+ endpoint);
				
				Page._data[tranId] = '';
				Env.isRunningTran = true;
				Tran.isRunning = true;
				Fetch[Tran.method.toLowerCase()].call(Page, apiUrl, params, {
					isAsync	: (Tran['isAsync'] === false ? false : true), // 비동기 방식 호춯 확인.
					datatype: (Tran['datatype']||'json')
				})
					.then(function(data) {
						Base.groupEnd(This.page.classPath +'.Transaction.'+ tranId);
						if (isUseCache && !Base['isDebug']) {
							Cache.set(uniqueName, JSON.stringify(data));
						}
						Page._data[tranId] = data;
						This.tranSuccess(tranId, Param);
					})
					.catch(function(error) {
						Base.groupEnd(This.page.classPath +'.Transaction.'+ tranId);
						This.tranError(tranId, error, Param);
					})
					.finally(function() {
						This.tranComplete();
					});
			}
			return This;
		}
		tranSuccess(tranId, param) {
			Base.logging(this.page, `tranSuccess(${tranId})`);
			let Page = this.page,
				Tran = Page._env.trans[tranId],
				Data = Page._data[tranId];
			if (Tran['callback']) {
				if (Base.isFunction(Tran['callback'])) {
					Base.tracking(`${Page['classPath']}.callback(${tranId}).call() => Function()`, Data);
					Tran['callback'].call(Page, Data, param, {});
				}
				else {
					Tran['callback'].split(',').forEach(callback => {
						Base.tracking(`${Page['classPath']}.callback(${tranId}).call() => ${callback}()`, Data);
						Page[callback]?.call(Page, Data, param, {});
					});
				}
			}
			Tran.isRunning = false;
			return this;
		}
		tranError(tranId, error, param) {
			Base.logging(this.page, `tranError(${tranId})`);
			let Page = this.page,
				Tran = Page._env.trans[tranId];
			let callbacks=Tran['callback'].split(',');
				callbacks.forEach(callback => {
					Base.tracking(`${Page['classPath']}.callback(${tranId}).call(${callback}) =>`, error);
					if ((error['errorMessage']||error['message']||'')) {
						alert((error['errorMessage']||error['message']||''));
					}
					Page[callback]?.call(Page, {}, param, error);
				});			
			Tran.isRunning = false;
			return this;
		}
		tranIsRun() {
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
		tranComplete() {
			if(!this.tranIsRun()) {
				Base.logging(this.page, `tranComplete() => Transaction All Complete.`);				
			}
		}
	};

	/**  */
	class PageControlBase extends Control.ControlBase {
        constructor(parent) {
			super(parent);
            this._env = {
				isRebase: false,
                isUseCache: false,
                isRunningTran: false,
                trans: {}
            };
            this._handler= {};
        }
        init(oContext = {}) {
			Base.logging(this, 'init()');
			const This	= this;
			if (!oContext || (!oContext['elements'] && !oContext['container'])) {
				throw new Error('No required arguments.');
			}
			if (oContext['menuData'] && oContext['container']) {
				Base.extends(oContext, {
					pageContext : oContext,
					elements	: {container:oContext.container, isRestructuring:true},
				});
			}
            This._handler= new PageControlHandler(This, oContext);
            This._isInit = true;

			Base.tracking(`${This.classPath}.init() => complate`, This);			
			This.onBeforLoad?.call(This);
			This.onLoadPage?.call(This);
			This.onAfterLoad?.call(This);
			This.getParent()?.onInitComplete?.call(This.getParent());
            return This;
        }

		/** Page Control Events */
		onBeforLoad() {
			Base.logging(this, 'onBeforLoad()');
			return this;
		}
		onLoadPage() {
			Base.logging(this, 'onLoadPage()');
			return this;
		}
		onAfterLoad() {
			Base.logging(this, 'onAfterLoad()');
			return this;
		}
		onShowPage() {
			Base.logging(this, 'onShowPage()');
			return this;
		}

		/** Page Control Extend functions  */
        createGrid(options = {}) {
            Base.tracking(`${this.classPath}.createGrid()`, options);
			if (!$w['jQuery'] || !$w['overpass']) {
				throw new Error('There is no required grid generator.');
			}
			const auth =  Fetch.getHeaderData()?.auth;
			if (options instanceof Array) {
				options.forEach((o)=> o.auth=auth);
			} else {
				options.auth = auth;
			}

            return $w.overpass.grid.create(options);
        }
		createEditor(p) {
            Base.tracking(`${this.classPath}.createEditor()`, p);
            return Base.Core.pf(function(resolve) {
				let chkCount = 0;
                let chkEditor= function() {
					chkCount++;
					if(chkCount > 10) {
						throw new Error('There is no required summernote.');
					}

					if(!$w['jQuery']['summernote']) {						
						Base.Timer.sleep(1).then(chkEditor);
					} else {
						if(!$w['jQuery']['summernote']['dom']) {
							Base.Timer.sleep(1).then(chkEditor);
						} else {
							let map = [];
							(Array.isArray(p) === true ? p : [p]).forEach(function(v) {
								let editor = Base.Control.Ui.EditorControl.createControl(v);
								map[editor.getId()] = editor;
							});
							resolve(map);
						}
					}
                };
                Base.Timer.sleep(1).then(chkEditor);
            });
        }
        startTransaction(runTran = {}, param = {}) {
            Base.logging(this, 'startTransaction()');
            const This = this;
            if (typeof runTran == 'object') {
                Object.keys(runTran).forEach((tranId) => {
                    if (This._env.trans[tranId]) {
                        This._handler._tranStart(tranId, runTran[tranId]);
                    }
                });
            } else if (typeof runTran == 'string') {
                if (This._env.trans[runTran]) {
                    This._handler._tranStart(runTran, param);
                }
            }
            return this;
        }
        show() {
            Base.logging(this, 'show()');
            this.getContainer()?.show();
            return this;
        }
        hide() {
            Base.logging(this, 'hide()');
            this.getContainer()?.hide();
            return this;
        }
        find(...arg) {
			if (arg.length == 1 && String(arg).startWith('#')) {
				return this.getContainer()?.find(this.getID(arg));
			} else {
				return this.getContainer()?.find(arg);
			}
        }
		findAll(...args) {
            return this.getContainer()?.findAll(args);
        }
		findJQ(...arg) {
			if (!$w['jQuery']) return undefined;
			return $w.jQuery(this.find.apply(this, arg));
        }
		getContainer() {
			if (Base.getName(this.getPanel()) == 'SubPanelControlBase') {
				const ctxt = this.getContext();				
				return this._container.find(`div.dev-panel-sub-cont[_sub-panel-id="${ctxt.contextID}"]`)||this._container;
			}
			return this._container;
		}
		getElements(id) {
			return (id ? this._elements[id] : this._elements);
		}
		setElements() {
			if (arguments.length == 1) {
				this._elements = arguments[0];
			} else {
				if (typeof arguments[0] == 'string') {
					this._elements[arguments[0]] = arguments[1];
				}
			}
			return this;
		}
		getID(arg) {
			if (!!this._env?.isRestructuring && !!arg) {
				if (String(arg).startWith('#')) {
					return '#'+(this['classUUID']||this['classPath']).replaceAll('.', '_') +'-'+ String(arg).replaceAll('#', '');
				} else {
					return (this['classUUID']||this['classPath']).replaceAll('.', '_') +'-'+ String(arg).replaceAll('#', '');
				}
			} else {
				return arg;
			}
		}
		getContext() {
			return this._context || undefined;
		}
		setPanelContext(context = undefined) {
			if (context && context['container']) {
				// Base.tracking(`${this.classPath}.setPanelContext()`, context);
				this._context  = context;
				this._container= context.container;
			}
			return this._context;
		}
		getPanelContext(menuHash) {			
			menuHash = menuHash || this.getContext()?.menuData?.menuHash || '';
			if (this.getPanel()) return this.getPanel().getPanelContext(menuHash);
		}
		getPanel() {
			return this._panel ? this._panel : undefined;		
		}
    }
	
	const ctrl = Base.Control.Page;
    Base.extends(Base.Control.Page, {
		PageControl : PageControlBase,
		/** Create and return a private built-in common page control object */
		createControl : function(clazz, PageControlPrototype = {}) {
			return Base.extends(Base.Core.module(clazz, new PageControlBase(clazz), ctrl.className), PageControlPrototype);
		}
	});

}) (window, __DOMAIN_NAME||'');