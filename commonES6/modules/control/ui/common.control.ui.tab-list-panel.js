/** common.control.ui.tab-list-panel */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    /**
     * TabListPanelControlBase
     */
    const TAB_BUTTON_IDENTITY_NAME = '_tab-list-button-id';
    const TAB_PANEL_IDENTITY_NAME = '_tab-list-panel-id';
    class TabListPanelControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
            if (!parent instanceof Base.Control.Page.PageControl) {
                throw new Error('TabListPanelControl을 생성하는데 필요한 상위 PageContro이 없습니다.');
            }
			super(parent);
            this._elements  = {};
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('TabListPanelControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!options['template']) {
                throw new Error('TabListPanelControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            if (!options['tabList']) {
                throw new Error('TabListPanelControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            if (options['tabList'] && options['tabList'].length > 6) {
                throw new Error('TabListPanelControl에서 생성 가능한 최대 Tab은 6개 까지 입니다.');
            }
            const This      = this;
            This._count     = 0;
            This._options   = options;
            This._container = options['container'];
            This._template  = options['template'];
            This._delegator = undefined; //Control.Ui.PanelControl.EventDelegator;
            This._isReload  = (typeof options['isAutoReLoad'] == 'boolean') ? options['isAutoReLoad'] : false;
            This._tabList   = [];
            // TabMenuSet element 생성.
            This._menuSet   = Control.Ui.createElementFromHTML(This._template['tabMenuSet']);
            This._menuSet.find('.menu-set').empty();
            
            // TabList 만큼 Tab 추가.
            options['tabList'].forEach(function(tabItem) {
                This.addTabMenuSet(tabItem);
            });

            // Tab List Style 적용.            
            if (This._options?.styleClass) {
                This.addStyle(This._menuSet, This._options.styleClass?.tabMenuBar);
                This.addStyle(This._menuSet.find('.menu-set'), This._options.styleClass?.tabMenuSet);
            }
            
            // Container를 비운 후 TabMenuSet 추가.
            This._container.empty().append(This._menuSet);
            Base.tracking(`${This.classPath}.onInit() => complate:`, This);
            return This;
        }
        getUniqueName() {
            return (this._parent ? (this._parent['classUUID']||this._parent['classPath']).replaceAll('.','_') : '') 
            + '-' + this._controlNum.toString(36) + (this._count++).toString(36);
        }
        getPanelContext(tabNumber = 0) {
            return this._elements[this._tabList[tabNumber].id];
        }
        getContainer(tabNumber) {
            return (typeof tabNumber == 'number') ? this.getContext(tabNumber).container : this._container;
        }
        isAlready (tabNumber = 0) {            
            return this.find(`[${TAB_PANEL_IDENTITY_NAME}="${this._tabList[tabNumber].id}"]`);
        }
        isValidTabClick (tabCount) {
            const This = this;
            if (Base.isFunction(This._options['onValidTabClick'])) {
                return This._options['onValidTabClick'].call(This._parent, tabCount);
            }
            return true;
        }
        addTabMenuSet(tabItem = {}) {
            Base.logging(this, `addTabMenuSet()`);
            const This = this;
            const count= This._count;
            const style= This._options?.styleClass;
            tabItem.id      = This.getUniqueName();
            tabItem.isReLoad= (typeof tabItem['isReLoad'] == 'boolean') ? tabItem['isReLoad'] : This._isReload;

            // TabItem element 생성.
            let oTabItem= Control.Ui.createElementFromHTML(This._template['tabMenuItem'])
                .attr(TAB_BUTTON_IDENTITY_NAME, tabItem.id);

            // Tab List Item Style 적용.
            if (style) This.addStyle(oTabItem, style?.tabMenuItem);
            
            oTabItem.bind('click', function() { 
                if (This.isValidTabClick(count)) {
                    if (This._delegator && Base.isFunction(This._delegator)) {
                        This._delegator('tabList', count, function() {
                            This.active(count);
                        }, [Control.Ui.PanelControl.currentPanels(This)]);
                    } else {
                        This.active(count); 
                    }
                }
            });
            oTabItem.find('a').text_(tabItem['title']);

            // PanelContainer element 생성.
            let oContainer = Control.Ui.createElementFromHTML(This._template['tabContainer'])
                                .attr(TAB_PANEL_IDENTITY_NAME, tabItem.id)
                                .hide();

            // Tab Container Style 적용.
            if (style) This.addStyle(oContainer, style?.tabContainer);

            // Context 생성.
            This._elements[tabItem.id] = {
                caller      : This.getParent(),
                menuData    : tabItem,
                container   : oContainer,
                component   : undefined,
                instance    : undefined,
                callback    : undefined,
                destroy     : function() {
                    This.remove(This._count);
                }
            };
            // append tab emement.
            This._menuSet.find('ul').append(oTabItem);
            // add Tab Menu Item.
            This._tabList.push(tabItem);
        }
        /**
         * Tab 활성화 진행
         * @param {*} tabNumber  tabList Array의 순서
         * @param {*} actionData actionUrl 호출 시 전달 데이터
         * @returns 
         */
         async active(tabNumber = 0, actionData = {}) {
            Base.logging(this, `active(${tabNumber})`);
            const This = this;
            const panelContext  = This.getPanelContext(tabNumber);
            const panelMenuId   = panelContext.menuData.id;
            
            This.find(`[${TAB_BUTTON_IDENTITY_NAME}]`).removeClass('on');
            This.find(`[${TAB_PANEL_IDENTITY_NAME}]`)?.hide();
            return Base.Core.pf(function(resolve, reject) {
                if(!This.isAlready(tabNumber)) {
                    This.loadPanel(tabNumber, actionData).then(function() {
                        This.find(`[${TAB_BUTTON_IDENTITY_NAME}="${panelMenuId}"]`).addClass('on');
                        This.find(`[${TAB_PANEL_IDENTITY_NAME}="${panelMenuId}"]`).show();
                        if (Base.isFunction(resolve)) resolve(panelContext);
                    })
                    .catch(function() {
                        if (Base.isFunction(reject)) reject(panelContext);
                    });
                } else {
                    This.find(`[${TAB_BUTTON_IDENTITY_NAME}="${panelMenuId}"]`).addClass('on');
                    This.find(`[${TAB_PANEL_IDENTITY_NAME}="${panelMenuId}"]`).show();
                    if (panelContext.menuData.isReLoad) {
                        This.reloadPanel(tabNumber, actionData).then(function() {
                            if (Base.isFunction(resolve)) {
                                Base.Timer.sleep(10).then(resolve(panelContext));
                            }
                        })
                        .catch(function(error) {
                            if (Base.isFunction(reject)) reject(error);
                        });
                    } else {
                        if (Base.isFunction(resolve)) resolve(panelContext);
                    }
                }   
            });
        }
        async loadPanel(tabNumber = 0, actionData = {}) {
            const This = this;
            const panelContext  = This.getPanelContext(tabNumber);
            const panelMenuData = panelContext.menuData;
            const panelContainer= panelContext.container;

            if (!This.getContainer() || !panelContainer) {
                throw new Error('PanelContainer가 없습니다.');
            }
            return Base.Core.pf(function(resolve, reject) {
                // create component.
                panelContext.component = Base.Control.Component.importComponent(This.getParent()).init({
                    container : panelContainer,
                    actionUrl : panelMenuData['actionUrl']||'',
                    scriptUrl : panelMenuData['scriptUrl']||'',
                    isLoadJS  : panelMenuData['isLoadJS'],
                    id        : panelMenuData['id'],
                    data      : Base.extends(panelMenuData['data']||{}, actionData),
                });
                // append container.
                This.getContainer().append(panelContainer);
                // component show.
                panelContext.component
                    .show(panelContext)
                    .then(function(oComponentContext) {
                        if (Base.isFunction(resolve)) resolve(oComponentContext);
                    })
                    .catch(function(error) {
                        if (Base.isFunction(reject)) reject(error);
                    })
                    .finally(function() {
                        if (Base.isFunction(This._options['onAppendPanel'])) {
                            This._options['onAppendPanel'].call(This.getParent(), panelContext);
                        }
                        // Panel container observer.
                        if (This._options['observer']) {
                            This.setObservers(panelContext, This._options['observer'], This._options['onObserveNotify']);
                        }
                    });
            });
        }
        /** 요청한 판넬에 대한 리로드 처리. */
        async reloadPanel(tabNumber = 0, actionData = {}) {
            Base.tracking(`${this.classPath}.reloadPanel()`, this, arguments);
            const This = this;
            const panelContext  = This.getPanelContext(tabNumber);
            panelContext.container.empty();
            panelContext.component= undefined;
            panelContext.instance = undefined;
            return This.loadPanel(tabNumber, actionData);
        }
        async remove(tabNumber = 0) {
            Base.tracking(`${this.classPath}.remove()`, this, arguments);
            const This = this;
            const panelContext  = This.getPanelContext(tabNumber);            
            return Base.Core.pf(function(resolve) {
                panelContext.container.empty();
                if (Base.isFunction(resolve)) resolve();
            });
        }
    }
    
    const ctrl = Base.Control.Ui.TabListPanelControl;
    Base.extends(Base.Control.Ui.TabListPanelControl, {
        createControl : function(clazz) {
            return Base.Core.module(clazz, new TabListPanelControlBase(clazz), ctrl.className);
		},
	});

}) (window, __DOMAIN_NAME||'');