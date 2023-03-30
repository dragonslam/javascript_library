/** common.control.ui.panel.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;
    const Panel  = Base.Control.Ui.PanelControl;

    const DEFAULT_PANEL = Base.config['default_panel'];
    const IDENTITY_NAME = '_panel-id';
    const ACTIVE_CLASS  = 'inactive';

    class PanelControlContext extends Control.Context.ContextBase {
        constructor(context) {
            if (!context) {
                throw new Error('PanelControl의 Context 정보가 없습니다.');
            }
            if (!context['menuData'] || !context['panelControl']) {
                throw new Error('PanelControl Context의 필수 정보가 없습니다.');
            }
            super(context);
            this.isRun          = false
            this.isComplete     = false;
            this.menuData       = context['menuData'];
            this.tabControl		= context['tabControl'];
            this.panelControl	= context['panelControl'];

            if (context['pageControl']) {
                this.setPageControl(context['pageControl']);
            }
        }
        setPageControl(control) {
            if(!control) {
                throw new Error('올바른 PageContro이 아닙니다.');
            }
            this.pageControl	= control;
            this.classPath	 	= control.classPath;
            this.rootClassPath	= control.rootClassPath;
            if (control instanceof Base.Control.Page.PageControl) {
                this.container		= control.getContainer();
                this.templateHtml	= control.getContainer().html_().trimHtml();
            }
        }
    }
    class PanelControlContextManager extends Control.Context.ManagerBase {
        constructor(parent) {
            if (!parent instanceof Base.Control.Page.PageControl) {
                throw new Error('PanelControlContext을 생성하는데 필요한 상위 PageContro이 없습니다.');
            }
            super(parent);
            this._key   = 'menuHash';
            this._subKey= 'menuPath';
        }
        add(context = {}, clazz) {
            if(!context['menuData'] || !context['menuData']['menuHash']) {
                throw new Error('PanelControl 고유 ID를 등록해주세요.');
            }
            if (clazz && !clazz instanceof Base.Control.Page.PageControl) {
                throw new Error('PanelControlContext을 생성하는데 필요한 상위 PageControl이 없습니다.');
            }
            Base.tracking(`${this._parent.classPath}.PanelControlContextManager.add()`, context, clazz);
            let controlClz= clazz||this._parent;
            let contextID = this.id(context.menuData, controlClz);
            this._applicationMapByKey[context.menuData[this._key]]= context.menuData;
            this._applicationContext[contextID] = new PanelControlContext(Base.extends({}, context, {contextID : contextID}));
            return this.getContextById(contextID);
        }
        keyFilter(key) {
            return String(key||'').trim().split('.action')[0];
        }
    }
    
    class PanelControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
            if (!parent instanceof Base.Control.Page.PageControl) {
                throw new Error('PanelControl을 생성하는데 필요한 상위 PageContro이 없습니다.');
            }
			super(parent);
            this._current   = '';
            this._context   = Control.Ui.PanelControl.PanelContext;
            this._elements  = {};
            if(!this._context || !this._context instanceof PanelControlContextManager) {
                throw new Error('PanelContext가 없습니다.');
            }
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('PanelControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!options['template']) {
                throw new Error('PanelControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            const This = this;
            This._prefix    = 'MainPanel';
            This._options   = options;
            This._container = options['container'];
            This._template  = options['template'];
            This._delegator = options['delegator'];
            This._id        = This.getContainer()?.attr('id');
            This._tabControl= Control.Ui.TabControl.createControl(This);
            This._tabControl.init(Base.extends({
                template	: This._template['tabButton'],
                delegator   : This._delegator,
                maxTabCount	: Control.Ui.TabControl?.config?.subMaxCount || 8,
				maxTabOveMsg: Control.Ui.TabControl?.config?.maxTabOveMsg||'동시에 열 수 있는 최대 탭 개수({0}개)가 모두 열려있습니다.',
                onActiveTab	: This.active,
                onCloseTab	: This.remove,
                doCloseCheck: This.doCloseCheck,
                maxTabOverCallback : function() {
                    Base.logging(This, `showMaxTabOverMessage()`);
                    alert(String(options['tabControlOption']['maxTabOveMsg']).format(options['tabControlOption']['maxTabCount']));
                }
            }, options['tabControlOption']||{}));

            if (This.getContainer().find('#__main_panel__')) {
                This.addPanelContext({tabNo:DEFAULT_PANEL, tabName: '메인', menuHash:DEFAULT_PANEL});
                This.getContainer().find('#__main_panel__').attr(IDENTITY_NAME, This.getPanelContext(DEFAULT_PANEL).contextID);
            }
            if (Base.isFunction(This._delegator)) {
                Control.Ui.PanelControl.EventDelegator = This._delegator;
            }
            return This;
        }
        getContainer(menu) {
            return (menu && this.isAlready(menu)) ? this.getPanelContext(menu).container : this._container;
        }
        getPanelContext(menu) {
            if (menu) {
                if (typeof menu == 'string') menu = this._context.getContextAsMap(menu)||{menuHash:menu};
                return this._context.get(Base.extends(menu, {prefix:this._prefix}), this._parent);
            } else {
                return this._context;
            }
        }
        getTabControl() {
            return this._tabControl;
        }
        addPanelContext(menu, ctrl = undefined) {
            Base.tracking(`${this.classPath}.addPanelContext()`, arguments);
            if(!menu) {
                throw new Error('PanelContext을 생성하는데 필요한 필수 정보가 없습니다.');
            }
            if (this.isAlready(menu)) {
                if(!this.getPanelContext(menu)['pageControl'] && ctrl) {
                    this.getPanelContext(menu).setPageControl(ctrl);
                }
            } else {
                this._current= menu['menuHash'];
                this._elements[menu['menuHash']] = this._context.add({
                    menuData 	: Base.extends(menu, {prefix:this._prefix}),
                    pageControl	: ctrl||undefined,
                    tabControl	: this._tabControl,
                    panelControl: this,
                }, this._parent);
            }
            return this.getPanelContext(menu);
        }
        isAlready (menu) {
            Base.logging(this, `isAlready(${menu['menuHash']})`);
            return (this.getPanelContext(menu) ? true : false);
        }
        addPanel(menuData) {
            Base.tracking(`${this.classPath}.addPanel()`, menuData);
            if (!menuData || !menuData['menuHash'] || !this.getPanelContext(menuData)) {
                throw new Error('PanelControl을 생성하는데 필요한 필수 MenuData가 없습니다.');
            }
            const This = this;
            const panelContext  = This.getPanelContext(menuData);
            const panelMenuData = panelContext.menuData;
            const isReloadPanel =(!!panelContext.container);

            if (panelContext.isRun === true) {
                return Base.Core.pf(function() {
                    Base.wtf(`${This.classPath}.addPanel() => Adding that Panel is running now.`);
                });
            }
            return Base.Core.pf(function(resolve, reject) {
                // Add Panel Start.
                panelContext.isRun = true;
                // 
                Base.Fetch.setHeaderData(panelContext.menuData); 

                // Create Panel.
                panelContext.templatePath = panelMenuData.menuPath; // (panelMenuData.menuPath.indexOf('?') > 0 ? '&':'?') +`_scrNo=${panelMenuData.scrNo}&_menuNo=${panelMenuData.tabNo}`;
                if(!isReloadPanel) {
                    panelContext.container= Control.Ui.createElementFromHTML(This._template['contPanel']);
                    panelContext.container.attr('id', `__panel_${panelMenuData.menuHash}`).attr(IDENTITY_NAME, panelContext.contextID);
                }

                Base.group(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                // Import panel contents.
                Base.Fetch.getWithResponse(panelContext.templatePath).then(function(result) {
                    // Panel template check.
                    if ((result['data']||'').indexOf('po-contents') < 0) {
                        throw new Error('사용할 수 없는 Panel Template입니다.');
                    }
                    // Collect response header info.
                    if (result['response'] && result['response']['headers']) {
                        const responseHeader= result['response']['headers'];
                        panelContext.controlPath= String(responseHeader.get('Template-Path')).nvl(panelMenuData.menuPath);
                        panelContext.buttonAuth = String(responseHeader.get('authBtnId')).nvl('');
                    } else {
                        panelContext.controlPath= panelMenuData.menuPath;
                        panelContext.buttonAuth = '';
                    }
                    // Append Sub Tab.
                    // panelContext.container.find('div.menu-tabs>ul').appendHtml(This._template['favButton']);
                    panelContext.container.find('div.loc-nav .base').attr(IDENTITY_NAME, panelContext.contextID).addClass(ACTIVE_CLASS);
                    panelContext.container.find('div.loc-nav span.base a').text_(panelMenuData.tabName);
                    if (panelMenuData['favorite'] === 'Y') {
                        panelContext.container.find('div.loc-nav .bookmarkBtn').classList.add('on');
                    }
                    if (panelMenuData['menuHelp'] === 'Y') {
                        panelContext.container.find('div.loc-nav .help-menu-info').style.display = '';
                        panelContext.container.find('div.loc-nav .help-menu-info .d-help').dataset.scrNo = panelMenuData['scrNo'];
                    }
                    // Append Contents.
                    panelContext.templateHtml = (result['data']||'').trimHtml();
                    panelContext.container
                                .find('div.dev-panel-sub-cont')
                                .appendHtml(panelContext.templateHtml);

                    // Button Auth.
                    if (panelContext.buttonAuth) {
                        panelContext.buttonAuth.split(',').forEach(function(btnId, idx) {
                            panelContext.container.find(`button[btn-id=${btnId}]`)
                                ?.attr('disabled', 'disabled')?.attr('id', 'none')?.attr('btn-id', 'none')
                                ?.bind('click', function() {
                                    alert(This._options.message?.btnAuthMsg||'버튼에 대한 권한이 없습니다.');
                                });
                        });
                    }

                    // Script import.
                    if (panelMenuData['isLoadJs'] == true) {
                        Base.Define.invokeOnControl(This.getParent()['rootClassPath'], panelContext.controlPath).then(function(oModule) {
                            if (oModule) {
                                if (oModule && Base.isFunction(oModule['init'])) {
                                    panelContext.setPageControl(oModule);
                                    oModule.init(panelContext);
                                }
                            }
                            Base.groupEnd(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                        });
                    } else {
                        panelContext.pageControl = undefined;
                        Base.groupEnd(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                    }
                    
                    if(!isReloadPanel) {
                        // Active 상태의 Panel의 인증 정보 설정.
                        This._tabControl.addTab(panelContext.menuData);
                        This.getContainer().prepend(panelContext.container);
                        This.initEvent(panelContext.container);
                    }
                    // Add Panel Complete.
                    panelContext.isRun      = false;
                    panelContext.isComplete = true;

                    if (Base.isFunction(This._options['onAppendPanel'])) {
                        This._options['onAppendPanel'].call(This.getParent(), panelContext);
                    }
                    // Panel global event.
                    if (Base.isFunction(Panel?.events?.onAppendPanel)) {
                        Panel.events.onAppendPanel(panelContext?.container);
                    }
                    // Panel container observer.
                    if (This._options['observer']) {
                        This.setObservers(panelContext, This._options['observer'], This._options['onObserveNotify'], panelContext.container.find('div.dev-panel-sub-cont'));
                    }
                    // Promise resolve.
                    if (Base.isFunction(resolve)) resolve(panelContext);
                }).catch(function(e) {
                    if (This._isDebug === true) {
                        Base.tracking(`${This.classPath}.addPanel() => Error : `, e);
                    }
                    if (e.name == 'HttpError' && e.status != 404) {
                        $w.alert(e.errorMessage);
                        This.remove(panelMenuData.menuHash);
                    } else {
                        This.getRemoteTemplate(This._template['errorPanel']).then(function(result) {
                            panelContext.container.find('div.loc-nav').hide();
                            panelContext.container.find('div.dev-panel-sub-cont').appendHtml((result||'').trimHtml());
                            if(!isReloadPanel) {
                                This._tabControl.addTab(panelContext.menuData);
                                This.getContainer().prepend(panelContext.container);
                            }
                        }).catch(function (error){
                            if (error.alerted !== true) {
                                Base.tracking(`${This.classPath}.addPanelError()`, panelContext, error);
                            }
                        });
                    }
                    // Promise reject.
                    if (Base.isFunction(reject)) reject(panelContext);
                    Base.groupEnd(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                });
            });
        }
        /** 요청한 판넬에 대한 리로드 처리. */
        async reloadPanel(menuData, isRecall = false) {
            Base.tracking(`${this.classPath}.reloadPanel()`, this, menuData);
            const This = this;
            const Menu = menuData||This.getPanelContext(This._current).menuData;
            return Base.Core.pf(function(resolve, reject) {
                if (!Menu) reject();
                const Ctxt = This.getPanelContext(Menu);
                Ctxt.menuData = Base.extends({}, Ctxt.menuData, Menu);
                const fnReloadPanel = function(callback) {
                    if (Menu && Menu['isReload'] === true) {
                        // 리로드시 기존 UI를 사용하지 않고 다시 Load하는 경우.
                        Ctxt.container.find('div.dev-panel-sub-cont').empty();
                        This.addPanel(Menu);
                    } 
                    else {
                        // 리로드시 기존 UI를 사용하여 다시 Load하는 경우.
                        Ctxt.container.find('div.dev-panel-sub-cont')
                            .empty()
                            .appendHtml(Ctxt.templateHtml);
                        Ctxt.pageControl?.init(Ctxt);
                        // Active 상태의 Panel의 인증 정보 설정.
                        Base.Fetch.setHeaderData(Ctxt.menuData); 
                    }
                    if (Base.isFunction(This._options['onReloadPanel'])) {
                        This._options['onReloadPanel'].call(This._parent, Ctxt);
                    }
                    // Panel global event.
                    if (Base.isFunction(Panel?.events?.onReloadPanel)) {
                        Panel.events.onReloadPanel(Ctxt?.container);
                    }
                    if (Base.isFunction(callback)) callback(Ctxt);
                };
                if (Ctxt && Ctxt.container?.find('div.dev-panel-sub-cont')) {
                    if (Ctxt['subPanelControl'] && !isRecall) {
                        Ctxt.subPanelControl?.removeAll(false).then(function() {
                            fnReloadPanel(resolve);
                        });
                    } else {
                        fnReloadPanel(resolve);
                    }
                }
            });
        }
        /**
         * menu 정보를 기반으로 기존의 Panel과 Tab을 Acvive함. 
         * @param {*} menu menu : tab number || menuData Object
         * @param {*} isReload Panel의 리로드 여부.
         * @returns 
         */
        activePanel(menu, isReload = false, isUseHistory = true) {
            const This = this;
            return Base.Core.pf(function(resolve) {
                if (typeof menu == 'number' && menu > -1) {
                    This._tabControl.goTab(menu, isUseHistory);
                } else {
                    Base.tracking(`${This.classPath}.activePanel()`, menu);
                    const Ctxt = This.getPanelContext(menu);
                    const Menu = Ctxt['menuData'];
                    if (!Ctxt || !Menu) {
                        throw new Error('Invalid MenuData.!!');
                    } else {
                        This._tabControl.active(Menu['menuHash']);
                        This.active(Menu['menuHash']);
                        // 현재 MenuPath와 요청 MenuPath를 비교하여 다른 경우 리로드 처리함.
                        if (Menu['menuPath'] != menu['menuPath']) {
                            isReload = true;
                        }
                    }
                    if (isReload) {
                        This.reloadPanel(Base.extends(Base.Utils.clone(menu), {isReload:true})).then((ctx)=>{
                            // TabName울 임의대로 변경한 경우 이를 보정함. 
                            This._tabControl.active(ctx.menuData.menuHash, ctx.menuData);
                            resolve(ctx);
                        });
                    } else {
                        // SubPanel이 있는 경우 기본 Panel로 이동.
                        if (Ctxt['subPanelControl']) {
                            Ctxt.subPanelControl.activePanel(0, false, false);
                        }
                        Base.Timer.sleep(1).then(()=> resolve(Ctxt));
                    }
                }
            });
        }
        active(menuId) {
            Base.logging(this, `active(${menuId})`);
            if(!menuId) {
                menuId = this._current;
            } else {
                this._current = menuId;
            }
            const This = this;
            const Cont = This.getContainer();
            const Ctxt = This.getPanelContext(menuId);
            if (Ctxt && Ctxt['contextID']) {
                // Active 상태의 Panel의 인증 정보 설정.
                Base.Fetch.setHeaderData(Ctxt.menuData); 

                if (Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`)) {                
                    Cont.prepend(Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`));
                }
                if (Ctxt['pageControl']) {
                    Ctxt.pageControl?.setPanelContext?.(Ctxt);
                }
                if (Ctxt['subPanelControl']) {
                    Ctxt.subPanelControl?.active();
                } else {
                    Ctxt.pageControl?.onShowPage?.();
                    /** Panel global event */
                    Panel?.events?.onActivePanel?.(Ctxt?.container);
                }
                if (Base.isFunction(This._options['onActivePanel'])) {
                    This._options['onActivePanel'].call(This._parent, Ctxt);
                }
            }
            return This;
        }
        goPreviousSubPanel() {
            const This = this;
            const Ctxt = This.getPanelContext(This._current);
            if (Ctxt && Ctxt['contextID']) {
                if (Ctxt['subPanelControl']) Ctxt.subPanelControl?.goPreviousSubPanel();
            }
        }
        goNextSubPanel() {
            const This = this;
            const Ctxt = This.getPanelContext(This._current);
            if (Ctxt && Ctxt['contextID']) {
                if (Ctxt['subPanelControl']) Ctxt.subPanelControl?.goNextSubPanel();
            }
        }
        doCloseCheck(menuId) {
            Base.logging(this, `doCloseCheck(${menuId})`);
            if (!menuId) return false;
            const This = this;
            const Ctxt = This.getPanelContext(menuId);
            if (Ctxt && Ctxt['contextID']) {
                Base.tracking(`${this.classPath}.doCloseCheck()`, Ctxt);
                if (Ctxt?.observer) return [!Ctxt?.observerVal?.mutation, Ctxt?.observerVal?.mutation];
                else return true;
            }
            return false;
        }
        async remove(menuId, isRecall = false) {
            Base.logging(this, `remove(${menuId})`);            
            const This = this;            
            const Cont = This.getContainer();
            return Base.Core.pf(function(resolve, reject) {
                if (!menuId) if (Base.isFunction(reject)) reject();
                const Ctxt = This.getPanelContext(menuId);
                const fnRemovePanel = function() {
                    if (Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`)) {
                        Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`).remove();
                        This._options['onClosePanel']?.call(This._parent, menuId);
                    }
                    This._context.deleteContextById(Ctxt.contextID);
                    This._elements[menuId] = undefined;
                    delete This._elements[menuId];
                    if (Base.isFunction(resolve)) Base.Timer.sleep(10).then(()=> resolve());
                };
                if (Ctxt && Ctxt['contextID']) {
                    if (Ctxt['subPanelControl'] && !isRecall) {
                        Ctxt.subPanelControl?.removeAll(true).then(function() {
                            fnRemovePanel();
                        });
                    } else {
                        fnRemovePanel();
                    }
                } else {
                    if (Base.isFunction(resolve)) resolve();
                }
            });
        }
        initEvent(currentPanel) {
            const This = this;
            currentPanel.find('div.loc-nav a.title')?.bind('click', function(e) {
                const menuId = Base(e.target).parent('span').attr(IDENTITY_NAME);
                //alert(`Tab-Btn : ${menuId}`);
            });
            if (Base.isFunction(This._options['onClickFavBtn'])) {
                currentPanel.find('div.loc-nav .ico-fav')?.bind('click', function(e) {
                    const That = Base(e.target);
                    const Ctxt = This._context.getContextById(That.parent('span').attr(IDENTITY_NAME));
                    const menuId = Ctxt.menuData.tabNo; //That.parent('span').attr(IDENTITY_NAME);
                    That.disabled= true;
                    This._options['onClickFavBtn'].call(This._parent, menuId, That.hasClass('on'), function(isCheck) {
                        Base.Timer.sleep(300).then(function() {
                            That[(isCheck?'addClass':'removeClass')]('on');
                            That.disabled = false;
                        });
                    });
                });
            }
            if (Base.isFunction(This._options['onClickHlpBtn'])) {
                currentPanel.find('div.loc-nav .help-menu-info .d-help')?.bind('click', function(e) {
                    const That = Base(e.target);
                    const Ctxt = This._context.getContextById(That.closest(`[${IDENTITY_NAME}]`).attr(IDENTITY_NAME));
                    const scrNo = Ctxt.menuData.scrNo;
                    This._options['onClickHlpBtn'].call(This._parent, scrNo, That);
                });
            }
        }
    }

    class MobilePanelControlBase extends PanelControlBase {
        constructor(parent) {
            super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('MobilePanelControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!options['template']) {
                throw new Error('MobilePanelControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            const This = this;
            This._prefix    = 'MainPanel';
            This._options   = options;
            This._container = options['container'];
            This._template  = options['template'];
            This._delegator = options['delegator'];
            This._id        = This.getContainer()?.attr('id');

            if (Base.isFunction(This._delegator)) {
                Control.Ui.PanelControl.EventDelegator = This._delegator;
            }
            return This;
        }
        addPanelContext(menu, ctrl = undefined) {
            Base.tracking(`${this.classPath}.addPanelContext()`, arguments);
            if(!menu) {
                throw new Error('PanelContext을 생성하는데 필요한 필수 정보가 없습니다.');
            }
            let ctx = this.getPanelContext(menu);
            if (this.isAlready(menu)) {
                if(!ctx['pageControl'] && ctrl) {
                    ctx.setPageControl(ctrl);
                }
            } else {
                this._current= menu['menuHash'];
                this._elements[menu['menuHash']] = this._context.add({
                    menuData 	: Base.extends(menu, {prefix:this._prefix}),
                    pageControl	: ctrl||undefined,
                    panelControl: this,
                }, this._parent);
                ctx = this.getPanelContext(menu);
                if (ctrl && menu['tabNo'] == DEFAULT_PANEL) {
                    this.getContainer().find('#__main_panel__').attr(IDENTITY_NAME, ctx.contextID);
                }
            }
            return ctx;
        }
        addPanel(menuData) {
            Base.tracking(`${this.classPath}.addPanel()`, menuData);
            if (!menuData || !menuData['menuHash'] || !this.getPanelContext(menuData)) {
                throw new Error('MobilePanelControl을 생성하는데 필요한 필수 MenuData가 없습니다.');
            }
            const This = this;
            const panelContext  = This.getPanelContext(menuData);
            const panelMenuData = panelContext.menuData;
            const isReloadPanel =(!!panelContext.container);

            if (panelContext.isRun === true) {
                return Base.Core.pf(function() {
                    Base.wtf(`${This.classPath}.addPanel() => Adding that Panel is running now.`);
                });
            }
            return Base.Core.pf(function(resolve, reject) {
                // Add Panel Start.
                panelContext.isRun = true;
                // 
                Base.Fetch.setHeaderData(panelContext.menuData); 

                // Create Panel.
                panelContext.templatePath = panelMenuData.menuPath;
                if(!isReloadPanel) {
                    panelContext.container= Control.Ui.createElementFromHTML(This._template['contPanel']);
                    panelContext.container.attr('id', `__panel_${panelMenuData.menuHash}`).attr(IDENTITY_NAME, panelContext.contextID);
                }

                Base.group(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                // Import panel contents.
                Base.Fetch.getWithResponse(panelContext.templatePath).then(function(result) {
                    // Panel template check.
                    if ((result['data']||'').indexOf('po-contents') < 0) {
                        throw new Error('사용할 수 없는 Panel Template입니다.');
                    }
                    // Collect response header info.
                    if (result['response'] && result['response']['headers']) {
                        const responseHeader= result['response']['headers'];
                        panelContext.controlPath= String(responseHeader.get('Template-Path')).nvl(panelMenuData.menuPath);
                        panelContext.buttonAuth = String(responseHeader.get('authBtnId')).nvl('');
                    } else {
                        panelContext.controlPath= panelMenuData.menuPath;
                        panelContext.buttonAuth = '';
                    }

                    // Append Contents.
                    panelContext.templateHtml = (result['data']||'').trimHtml();
                    panelContext.container
                                .find('.dev-panel-sub-cont')
                                .append(Control.Ui.createElementFromHTML((panelContext.templateHtml||JSON.stringify(panelMenuData))));
                                
                    // Set Title & SubMenu
                    panelContext.container.find('.title-sub__h2')?.text_(panelMenuData.tabName);
                    if (panelMenuData.parent) {
                        panelContext.container.find('.title-sub__list ul')?.empty();
                        if (panelMenuData.parent.nodes && panelMenuData.parent.nodes.length > 1) {
                            let menuList = [];
                            panelMenuData.parent.nodes.forEach((path)=> {
                                let data = This.getParent().MenuControl.getMenuDataSet(path);
                                menuList.push(This._template['contMenuBtn'].format(data['menuPath'], data['menuHash'], data['tabName']));
                            });
                            panelContext.container.find('.title-sub__list ul')?.appendHtml(menuList.join(''));
                            panelContext.container.find(`.title-sub__list ul li a[data-menu-path="${panelMenuData['menuPath']}"]`)
                                       ?.parent()?.addClass('title-sub__item--active');
                        } else {
                            panelContext.container.find('.title-sub__rcont')?.remove();    
                            panelContext.container.find('.title-sub__list ul')?.remove();
                        }
                    } else {
                        panelContext.container.find('.title-sub__rcont')?.remove();
                        panelContext.container.find('.title-sub__list ul')?.remove();
                    }

                    // Button Auth.
                    if (panelContext.buttonAuth) {
                        panelContext.buttonAuth.split(',').forEach(function(btnId, idx) {
                            panelContext.container.find(`button[btn-id=${btnId}]`)
                                ?.attr('disabled', 'disabled')?.attr('id', 'none')?.attr('btn-id', 'none')
                                ?.bind('click', function() {
                                    alert(This._options.message?.btnAuthMsg||'버튼에 대한 권한이 없습니다.');
                                });
                        });
                    }

                    // Script import.
                    if (panelMenuData['isLoadJs'] == true) {
                        Base.Define.invokeOnControl(This.getParent()['rootClassPath'], panelContext.controlPath).then(function(oModule) {
                            if (oModule) {
                                if (oModule && Base.isFunction(oModule['init'])) {
                                    panelContext.setPageControl(oModule);
                                    oModule.init(panelContext);
                                }
                            }
                        });
                    } else {
                        panelContext.pageControl = undefined;
                    }
                    Base.groupEnd(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                    
                    if(!isReloadPanel) {
                        // Active 상태의 Panel의 인증 정보 설정.
                        This.getContainer().prepend(panelContext.container);
                        This.initEvent(panelContext.container);
                    }
                    // Add Panel Complete.
                    panelContext.isRun      = false;
                    panelContext.isComplete = true;

                    if (Base.isFunction(This._options['onAppendPanel'])) {
                        This._options['onAppendPanel'].call(This.getParent(), panelContext);
                    }
                    // Panel global event.
                    if (Base.isFunction(Panel?.events?.onAppendPanel)) {
                        Panel.events.onAppendPanel(panelContext?.container);
                    }
                    // Panel container observer.
                    // if (This._options['observer']) {
                    //     This.setObservers(panelContext, This._options['observer'], This._options['onObserveNotify'], panelContext.container.find('.dev-panel-sub-cont'));
                    // }
                    // Promise resolve.
                    if (Base.isFunction(resolve)) resolve(panelContext);
                }).catch(function(e) {
                    if (This._isDebug === true) {
                        Base.tracking(`${This.classPath}.addPanel() => Error : `, e);
                    }
                    if (e.name == 'HttpError' && e.status != 404) {
                        $w.alert(e.errorMessage);
                        This.remove(panelMenuData.menuHash);
                    } else {
                        This.getRemoteTemplate(This._template['errorPanel']).then(function(result) {
                            panelContext.container.find('.loc-nav')?.hide();
                            panelContext.container.find('.dev-panel-sub-cont').appendHtml((result||'').trimHtml());
                            if(!isReloadPanel) {
                                This.getContainer().prepend(panelContext.container);
                            }
                        }).catch(function (error){
                            if (error.alerted !== true) {
                                Base.tracking(`${This.classPath}.addPanelError()`, panelContext, error);
                            }
                        });
                    }
                    panelContext.isRun = false;

                    // Promise reject.
                    if (Base.isFunction(reject)) reject(panelContext);
                    Base.groupEnd(`${This.classPath}.addPanel(${panelMenuData['menuHash']}::${panelMenuData['tabName']})`);
                });
            });
        }
        /** 요청한 판넬에 대한 리로드 처리. */
        async reloadPanel(menuData, isRecall = false) {
            Base.tracking(`${this.classPath}.reloadPanel()`, this, menuData);
            const This = this;
            const Menu = menuData||This.getPanelContext(This._current).menuData;
            return Base.Core.pf(function(resolve, reject) {
                if (!Menu) reject();
                const Ctxt = This.getPanelContext(Menu);
                Ctxt.menuData = Base.extends({}, Ctxt.menuData, Menu);
                if (Menu && Menu['isReload'] === true) {
                    // 리로드시 기존 UI를 사용하지 않고 다시 Load하는 경우.
                    Ctxt.container.find('.dev-panel-sub-cont').empty();
                    This.addPanel(Menu);
                } 
                else {
                    // 리로드시 기존 UI를 사용하여 다시 Load하는 경우.
                    Ctxt.container.find('.dev-panel-sub-cont')
                        .empty()
                        .appendHtml((Ctxt.templateHtml||JSON.stringify(Menu)));
                    Ctxt.pageControl?.init(Ctxt);
                    // Active 상태의 Panel의 인증 정보 설정.
                    Base.Fetch.setHeaderData(Ctxt.menuData); 
                }
                if (Base.isFunction(This._options['onReloadPanel'])) {
                    This._options['onReloadPanel'].call(This._parent, Ctxt);
                }
                // Panel global event.
                if (Base.isFunction(Panel?.events?.onReloadPanel)) {
                    Panel.events.onReloadPanel(Ctxt?.container);
                }
                if (Base.isFunction(resolve)) resolve(Ctxt);
            });
        }
        /**
         * menu 정보를 기반으로 기존의 Panel과 Tab을 Acvive함. 
         * @param {*} menu menu : tab number || menuData Object
         * @param {*} isReload Panel의 리로드 여부.
         * @returns 
         */
        activePanel(menu, isReload = false, isUseHistory = true) {
            const This = this;
            return Base.Core.pf(function(resolve) {
                Base.tracking(`${This.classPath}.activePanel()`, menu);
                const Ctxt = This.getPanelContext(menu);
                if (!Ctxt ||!Ctxt['menuData']) {
                    throw new Error('Invalid MenuData.!!');
                } else {
                    This.active(Ctxt.menuData.menuHash);
                    // 현재 MenuPath와 요청 MenuPath를 비교하여 다른 경우 리로드 처리함.
                    if (Ctxt.menuData.menuPath != menu['menuPath']) {
                        isReload = true;
                    }
                }
                if (isReload) {
                    This.reloadPanel(menu).then(resolve);
                } else {
                    Base.Timer.sleep(1).then(resolve);
                }
            });
        }
        replacePanel() {
            const This = this;            
            if (This._container.find('.dev-panel-wrap') instanceof NodeList) {
                Base.tracking(`${This.classPath}.removePanel()`, this);
                This._container.findAll('.dev-panel-wrap')?.forEach(function(el) {
                    (el.attr('id') != '__main_panel__') && This.remove(el.attr(IDENTITY_NAME));
                });
            }
        }
        async remove(menuId, isRecall = false) {
            Base.logging(this, `remove(${menuId})`);            
            const This = this;            
            const Cont = This.getContainer();
            const Ctxt = This.getPanelContext(menuId);
            return Base.Core.pf(function(resolve, reject) {
                if (!menuId) if (Base.isFunction(reject)) reject();                
                if (Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`)) {
                    Cont.find(`div.dev-panel-wrap[${IDENTITY_NAME}="${Ctxt.contextID}"]`).remove();
                    if (!isRecall) This._options['onClosePanel']?.call(This._parent, menuId);
                }
                if (Ctxt) {
                    This._context.deleteContextById(Ctxt.contextID);
                    This._elements[menuId] = undefined;
                    delete This._elements[menuId];
                }
                if (Base.isFunction(resolve)) Base.Timer.sleep(10).then(resolve);
            });
        }
        initEvent(container) {
            const This = this;
            container.find('.title-sub .btn-prev-page')?.bind('click', function(e) {
                $w.history.go(-1);
            });
            container.find('.title-sub__list ul li a')?.bind('click', function(e) {
                const That = Base(e);
                if(!That.parent().hasClass('title-sub__item--active')) {
                    if (Base.isFunction(This._options['onClickMenu'])) {
                        This._options['onClickMenu'].call(This.getParent(), e, this.dataset);
                    }
                    container.find('.title-sub__rcont')?.find('.title-sub__menu')?.click();
                }
            });
        }

        getCurrentMenuId(){
            const contextID =  this._container.findAll('.dev-panel-wrap')[0].attr(IDENTITY_NAME);
            return this._context.getContextById(contextID)?.menuData.menuHash;
        }
    }


    const SUB_IDENTITY_NAME = '_sub-panel-id';
    class SubPanelControlBase extends PanelControlBase {
        constructor(parent) {
            super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            const This = this;
            if (!This.getParent()['_container']) {
                throw new Error('SubPanelControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!This.getParent()['_context']) {
                throw new Error('SubPanelControl을 생성하는데 필요한 필수 Page Context가 없습니다.');
            }
            if (!options['template'] || !options['template']['subTabButton'] || !options['template']['subPanelCont']) {
                throw new Error('SubPanelControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            This._count     = 0;
            This._prefix    = 'SubPanel';
            This._options   = options;
            This._template  = options.template.subPanelCont;
            This._delegator = Control.Ui.PanelControl.EventDelegator;
            This._container = This.getParent().getContainer().find('.dev-panel-sub-warp');

            options['tabControlOption'] = Base.extends({
                container	: This.getParent().getContainer().find('div.loc-nav__lcont'),
                template	: options.template.subTabButton,
                delegator   : This._delegator,
                itemTag		: 'span',
                activeClass : 'inactive',
                maxTabCount	: Control.Ui.TabControl?.config?.subMaxCount || 8,
				maxTabOveMsg: Control.Ui.TabControl?.config?.maxTabOveMsg||'동시에 열 수 있는 최대 탭 개수({0}개)가 모두 열려있습니다.',
                onActiveTab	: This.active,
                onCloseTab	: This.remove,
                doCloseCheck: This.doCloseCheck,
            }, options['tabControlOption']||{});

            const defaultMenu= Base.extends({isBase:true}, This.getParent().getContext().menuData);
            const defaultCtx = This.addSubPanelContext(defaultMenu);
            if (This.find('.dev-panel-sub-cont')) {
                This.find('.dev-panel-sub-cont').attr(SUB_IDENTITY_NAME, defaultCtx.contextID);
            }
            if (This.getParent() instanceof Base.Control.Page.PageControl) {
                This.getParent().getContext().addProperty('subPanelControl', This);
                This.getParent().setPanelContext(defaultCtx);   // SubPanelControl용 Context로 교체함.
            }

            This._tabControl= Control.Ui.TabControl.createSubTabControl(This);
            This._tabControl.init(Base.extends({
                defaultNo : defaultCtx.menuData.menuHash,
                maxTabOverCallback : function(){
                    Base.logging(This, `showMaxTabOverMessage()`);
                    alert(String(options['tabControlOption']['maxTabOveMsg']).format(options['tabControlOption']['maxTabCount']));
                }
            }, options['tabControlOption']||{}));

            return This;
        }
        getSubPanelUniqueId(subLink) {  
            let prefix = [this._context.keyFilter(this.getParent().classPath)];
            if (subLink['menuPath']) prefix.push(this._context.keyFilter(subLink['menuPath']));
            if (subLink['panelUID']) prefix.push(this._context.keyFilter(subLink['panelUID']));
            let subUUID= prefix.join('#').replaceAll('.', '/');
            return this.getHashNumber(subUUID);
        }
        addSubPanelContext(subLink) {
            const This  = this;
            const menuId= This.getSubPanelUniqueId(subLink);
            if (This._elements[menuId]) {
                return This._elements[menuId];
            } else {
                const menuData  = Base.extends({isLoadJs:true}, subLink, {tabNo:menuId, menuHash:menuId});
                const context   = This.addPanelContext(menuData, This.getParent());
                context.menuData= Base.extends(context.menuData, menuData);
                return This._elements[menuId] = context;
            }
        }
        addPanel(subLink, options = {}, onAppendPanelCallback = undefined) {
            Base.logging(this, `addPanel(${subLink['tabName']})`);
            Base.tracking(`${this.classPath}.addPanel()`, arguments);

            this._count++;
            const This = this;
            const panelContext = This.addSubPanelContext(subLink);
            const panelMenuId  = panelContext.menuData.menuHash;

            if (panelContext.isRun === true) {
                Base.wtf(`${This.classPath}.addPanel() => Adding that Panel is running now.`);
                return panelContext;
            }
            if (This._delegator && Base.isFunction(This._delegator) && !options['isDelegate']) {
                This._delegator('subLink', panelMenuId, function() {
                    This.addPanel(subLink, Base.extends({}, options, {isDelegate : true}), onAppendPanelCallback);
                }, [Control.Ui.PanelControl.currentPanels(This)]);
                return panelContext;
            }
            if (This._tabControl.isAlready(panelContext.menuData)) {
                This._tabControl.active(panelMenuId);
                This.active(panelMenuId);
            } else {
                if (This._tabControl.isValid(panelContext.menuData)) {
                    Base.group(`${This.classPath}.addPanel()`);
                    // Add Panel Start.
                    panelContext.isRun = true;
                    panelContext.menuData.data = Base.extends({}, options?.data);
                    // Html template load.
                    Base.Fetch.getWithResponse(panelContext.menuData.menuPath, panelContext.menuData.data).then(function(result) {
                        Base.tracking(`${This.classPath}.addPanel() => Template:`, result);
                        // Panel Context setting.
                        panelContext.tabControl	 = This._tabControl;
			            panelContext.panelControl= This;
                        // Create panel element.
                        panelContext.container= Control.Ui.createElementFromHTML(This._template);
                        panelContext.container.attr(SUB_IDENTITY_NAME, panelContext.contextID);
                        // Append Contents.
                        panelContext.template = String(result['data']||'').trimHtml();
                        panelContext.container.appendHtml(panelContext.template);
                        // show panel & tab.
                        This._tabControl.addTab(panelContext.menuData);
                        This._container.prepend(panelContext.container);
                        // response header data collect. js path || page scrNo.
                        if (result['response']) {
                            panelContext.menuData.scrNo = ((r)=>r?r.headers.get('scrNo'):'')(result['response']) || panelContext.menuData.scrNo || '';
                            panelContext.controlPath = ((r)=>r?r.headers.get('Template-Path'):'')(result['response']) || panelContext.menuData.menuPath;
                        } else {
                            panelContext.controlPath = panelContext.menuData.menuPath;
                        }
                        
                        // Active 상태의 Panel의 인증 정보 설정.
                        Base.Fetch.setHeaderData(panelContext.menuData); 

                        // Script import.
                        if (panelContext.menuData['isLoadJs'] === true || panelContext.menuData['isLoadJs'] === 'true') {
                            Base.Define.invokeOnControl(This.getParent().rootClassPath, panelContext.controlPath).then(function(oModule) {
                                panelContext.pageControl= oModule;
                                panelContext.classPath	= oModule['classPath']||'';
                                if (oModule && Base.isFunction(oModule['init'])) {
                                    oModule.onInitComplete = function() {
                                        if (Base.isFunction(onAppendPanelCallback)) {
                                            Base.Timer.sleep(300).then(onAppendPanelCallback);
                                        }
                                    };
                                    oModule.init(panelContext);
                                } else {
                                    if (Base.isFunction(onAppendPanelCallback)) {
                                        Base.Timer.sleep(300).then(onAppendPanelCallback);
                                    }
                                }
                                Base.groupEnd(`${This.classPath}.addPanel()`);
                            });
                        } else {
                            if (Base.isFunction(onAppendPanelCallback)) {
                                Base.Timer.sleep(300).then(onAppendPanelCallback);
                            }
                            Base.groupEnd(`${This.classPath}.addPanel()`);
                        }
                        // Add Panel Complete.
                        panelContext.isRun      = false;
                        panelContext.isComplete = true;
                    }).catch(function(error) {
                        panelContext.isRun      = false;
                        if (This._isDebug === true) {
                            Base.tracking(`${This.classPath}.addPanel() => Error : `, error);
                        }
                        if (error.alerted !== true) {
                            Base.tracking(`${This.classPath}.addSubPanelError()`, panelContext, error);
                        }
                        if (error.name == 'HttpError' && error.status != 404) {
                            $w.alert(error.errorMessage);
                        }
                        Base.groupEnd(`${This.classPath}.addPanel()`);
                    }).finally(function() {
                        if (Base.isFunction(This._options['onAppendPanel'])) {
                            This._options['onAppendPanel'].call(This.getParent(), panelContext);
                        }
                        // Panel global event.
                        if (Base.isFunction(Panel?.events?.onAppendPanel)) {
                            Panel.events.onAppendPanel(panelContext?.container);
                        }
                        // Panel container observer.
                        if (This._options['observer']) {
                            This.setObservers(panelContext, This._options['observer'], This._options['onObserveNotify']);
                        }
                    });
                }
            }
            return panelContext;
        }
        /** 요청한 서브 판넬에 대해서만 갱신. */
        async reloadPanel(menuId) {
            Base.tracking(`${this.classPath}.reloadPanel()`, this, arguments);
            if(!menuId) return;
            const This = this;
            const Ctxt = This._elements[menuId];
            return Base.Core.pf(function(resolve, reject) {
                if (Ctxt) {
                    // Active 상태의 Panel의 인증 정보 설정.
                    Base.Fetch.setHeaderData(Ctxt.menuData); 

                    Ctxt.container.empty().appendHtml(Ctxt.template);
                    Ctxt.pageControl?.init(Ctxt);
                    if (Base.isFunction(This._options['onReloadPanel'])) {
                        This._options['onReloadPanel'].call(This.getParent(), Ctxt);
                    }
                    // Panel global event.
                    if (Base.isFunction(Panel?.events?.onReloadPanel)) {
                        Panel.events.onReloadPanel(Ctxt?.container);
                    }
                }
                if (Base.isFunction(resolve)) {
                    Base.Timer.sleep(500).then(resolve(This));
                }
            });
        }
        active(menuId) {
            Base.logging(this, `active(${menuId})`);
            if(!menuId) {
                menuId = this._current;
            } else {
                this._current = menuId;
            }
            const This = this;
            const Cont = This.getContainer();
            const Ctxt = This._elements[menuId];
            if (Ctxt && Ctxt['contextID']) {
                // Active 상태의 Panel의 인증 정보 설정.
                Base.Fetch.setHeaderData(Ctxt.menuData); 

                if (Cont.find(`.dev-panel-sub-cont[${SUB_IDENTITY_NAME}="${Ctxt.contextID}"]`)) {
                    Cont.prepend(This.find(`.dev-panel-sub-cont[${SUB_IDENTITY_NAME}="${Ctxt.contextID}"]`));
                }
                Ctxt.pageControl?.setPanelContext?.(Ctxt);
                Ctxt.pageControl?.onShowPage?.();
                /** Panel global event */
                if (Base.isFunction(Panel?.events?.onActivePanel)) {
                    Panel.events.onActivePanel(Ctxt?.container);
                }
            }
            return This;          
        }
        goPreviousSubPanel() {
            this._tabControl.goPreviousTab();
        }
        goNextSubPanel() {
            this._tabControl.goNextTab();
        }
        remove(menuId, isBaseActive = true) {
            Base.logging(this, `remove(${menuId})`);
            if (!menuId) return;
            const This = this;
            const Cont = This.getContainer();
            const Ctxt = This._elements[menuId];
            if (Ctxt && Ctxt['contextID']) {
                if (Cont.find(`.dev-panel-sub-cont[${SUB_IDENTITY_NAME}="${Ctxt.contextID}"]`)) {
                    const elem = Cont.find(`.dev-panel-sub-cont[${SUB_IDENTITY_NAME}="${Ctxt.contextID}"]`);
                    Array.from((elem instanceof NodeList ? elem : [elem])).forEach((e)=>e.remove());
                    
                    if (Base.isFunction(This._options['onClosePanel'])) {
                        This._options['onClosePanel'].call(This.getParent(), menuId);
                    }
                }
                This._context.deleteContextById(Ctxt.contextID);
                This._elements[menuId] = undefined;
                delete This._elements[menuId];
            }
            if (isBaseActive) {
                This.active(String('0').padLeft(10, '0'));
            }
            return This;
        }
        /** Sub Panel Control의 모든 하위 판넬을 삭제. */
        async removeAll(isAll = false) {
            Base.tracking(`${this.classPath}.removeAll()`, this);
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                let baseTabMenuId = '';
                Object.keys(This._elements).forEach((key) => {
                    if (This._elements[key]?.menuData['isBase'] === true) {
                        baseTabMenuId = key;
                    } else {
                        Base.tracking(`${This.classPath}.removeAll() => item:`, This._elements[key].menuData);
                        This.closeSubPanel(key);
                    }
                });
                if (baseTabMenuId) {
                    if (isAll)  This.closeSubPanel(baseTabMenuId);
                    else        This.active(baseTabMenuId);
                }
                if (Base.isFunction(resolve)) {
                    Base.Timer.sleep(500).then(resolve);
                }
            });
        }
        /** Sub Panel 및 Tab 닫기. */
        closeSubPanel(menuHash) {
            Base.logging(this, `closeSubPanel(${menuHash})`);
            this._tabControl.remove(menuHash);
            this.remove(menuHash);
            return this;
		}
    }
    
    const Ctrl = Base.Control.Ui.PanelControl;
    Base.extends(Base.Control.Ui.PanelControl, {
        EventDelegator: undefined,
        PanelContext  : undefined,
        createContext : function(clazz) {
            this.PanelContext = new PanelControlContextManager(clazz);
		},
		createControl : function(clazz, isMobile = false) {
            if(!this.PanelContext) {
                this.createContext(clazz);
            }
            if (isMobile === true) {
                return Base.Core.module(clazz, new MobilePanelControlBase(clazz), Base.getName(MobilePanelControlBase));
            } else {
                return Base.Core.module(clazz, new PanelControlBase(clazz), Base.getName(PanelControlBase));
            }
		},
        createSubPanelControl : function(clazz) {
            return Base.Core.module(clazz, new SubPanelControlBase(clazz), Base.getName(SubPanelControlBase));
		},
        currentPanels : function(clazz) {
            const Panels= {type:'panels', depth:0, tree:[]};
            while (clazz && Panels.tree.indexOf(clazz.classPath) < 0 && Panels.depth < 10) {
                Panels.depth++;
                Panels.tree.push(clazz.classPath);
                clazz =clazz?._panel || clazz;
                if (clazz.className == 'PanelControl') {
                    Panels.mainObj= clazz;
                    Panels.mainId = clazz?._current;
                }
                if (clazz.className == 'SubPanelControl' ) {
                    Panels.subObj= clazz;
                    Panels.subId = clazz?._current;
                }
                clazz = clazz['getParent'] ? clazz.getParent() : false;
            }
            return Panels;
        },
        showPanels : function(panels) {
            if(!panels) return;
            if (panels?.mainObj && panels?.mainId) {
                if (panels?.mainObj._current !== panels.mainId) {
                    panels?.mainObj.activePanel({menuHash: panels.mainId});
                }
			}
			if (panels?.subObj && panels?.subId) {
                if (panels?.subObj._current !== panels.subId) {
                    panels?.subObj.activePanel({menuHash : panels.subId});
                }
			}
        },
	});

}) (window, __DOMAIN_NAME||'');