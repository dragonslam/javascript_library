/** common.control.ui.panel.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;    
    
    const DEFAULT_PANEL = Base.config['default_panel'];
    const IDENTITY_NAME = '_panel-num';
    const ACTIVE_CLASS  = 'active';

    class TabControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
            if (!parent) {
                throw new Error('TabControl을 생성하는데 필요한 부모 개체가 없습니다.');
            }
            super(parent);
            this._isProcess = false;
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('TabControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!options['template']) {
                throw new Error('TabControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            const This = this;
            This._options   = options;
            This._container = options['container'];
            This._id        = This.getContainer()?.attr('id');
            This._elements  = {};
            This._itemTag   = options['itemTag'];
            This._template  = options['template'];
            This._activeCls = options['activeClass']||ACTIVE_CLASS;
            This._delegator = options['delegator'];
            This._defaultNo = options['defaultNo']||DEFAULT_PANEL;

            if (This.getContainer().find('#__main_menu_button__')) {
                This.getContainer().find('#__main_menu_button__').attr(IDENTITY_NAME, This._defaultNo).addClass(This._activeCls);
                This.addEvent(This.getContainer().find('#__main_menu_button__'));
            }
            return this;
        }
        getContainer() {
            return this._container;
        }
        getCount() {
            Base.logging(this, `getCount()`);
            return this.find(this._itemTag)['length'] ? this.find(this._itemTag)['length'] : 1;
        }
        getCurrentMenuId() {
            return this.find(`${this._itemTag}.${this._activeCls}`).attr(IDENTITY_NAME);
        }
        isAlready (menuData) {
            Base.logging(this, `isAlready(${menuData['menuHash']})`);
            return (this.find(`${this._itemTag}[${IDENTITY_NAME}="${menuData['menuHash']}"]`));
        }
        isActive (menuData) {
            Base.logging(this, `isActive(${menuData['menuHash']})`);
            return (this.isAlready(menuData) 
                && (this.find(`${this._itemTag}[${IDENTITY_NAME}="${menuData['menuHash']}"]`)).hasClass(this._activeCls));
        }
        isValid(menuData) {
            Base.logging(this, `isValid(${menuData['menuHash']})`);
            const This = this;
            // Check Tab count.
            if (This.find(This._itemTag).length >= This._options['maxTabCount']) {
                if (This._options['maxTabOverCallback']) {
                    This._options['maxTabOverCallback'].call(this._parent);
                }
                return false;
            }
            return true;
        }
        addTab(menuData) {
            Base.logging(this, `addTab(${menuData['menuHash']})`);
            const This = this;
            // Append Tab.
            const currentTab= Base.Control.Ui.createElementFromHTML(this._template);
            This._isProcess = true;
            This.find(`${This._itemTag}.${This._activeCls}`)?.removeClass(This._activeCls);
            This.getContainer().append(currentTab);

            currentTab.addClass(This._activeCls).attr(IDENTITY_NAME, menuData['menuHash']);
            currentTab.find('.btn-tm em').text_(menuData['tabName']);

            This.addEvent(currentTab);
            This._isProcess = false;
            return This;
        }
        addEvent(currentTab) {
            const This = this;
            if (currentTab && currentTab['find']) {
                currentTab.find('.btn-tm')?.bind('click', function(e) {
                    This.goTab(Base(e)?.parent(This._itemTag).attr(IDENTITY_NAME));
                });
                currentTab.find('.ico-close')?.bind('click', function(e) {
                    const menuId = Base(e)?.parent(This._itemTag).attr(IDENTITY_NAME);
                    if (!menuId) return;
                    This.remove(menuId);
                });
            }
        }
        goTab(menu, isUseHistory = true) {
            const This = this;
            if (typeof menu == 'number') {
                let Tabs = this.find(`${this._itemTag}`);
                if (Tabs) {
                    Tabs =(Tabs instanceof NodeList) ? Base(Tabs[menu]) : Tabs;
                    menu = Tabs?.attr(IDENTITY_NAME);
                }
            }
            if (!menu) return;
            if (Base.isFunction(This._delegator) && isUseHistory == true) {
                This._delegator('show', menu, () => {
                    This.active(menu);
                    This._options['onActiveTab']?.call(This._parent, menu);
                }, [Control.Ui.PanelControl.currentPanels(This)]);
            } else {
                This.active(menu);
                This._options['onActiveTab']?.call(This._parent, menu);
            }
            Base.Timer.sleep(300).then(function() {
                This._isProcess = false;
            });
        }
        goFirstTab() {
            if (this._isProcess) return;            
            let Tabs = this.find(`${this._itemTag}`);
            if (Tabs) {
                Tabs= (Tabs instanceof NodeList) ? Base(Tabs[0]) : Tabs;
                this._isProcess = true;
                this.goTab(Tabs.attr(IDENTITY_NAME));
            }
        }
        goLastTab() {
            if (this._isProcess) return;            
            let Tabs = this.find(`${this._itemTag}`);
            if (Tabs) {
                Tabs= (Tabs instanceof NodeList) ? Base(Tabs[0]) : Tabs;
                this._isProcess = true;
                this.goTab(Base(Tabs[Tabs.length-1]).attr(IDENTITY_NAME));
            }
        }
        goPreviousTab() {
            if (this._isProcess) return;
            let Curr = this.find(`${this._itemTag}[${IDENTITY_NAME}].${this._activeCls}`);
            let Prev = Curr?.previousElementSibling;
            if (Prev && Prev != null) {
                this._isProcess = true;
                this.goTab(Base(Prev).attr(IDENTITY_NAME));
            }
        }
        goNextTab() {
            if (this._isProcess) return;
            let Curr = this.find(`${this._itemTag}[${IDENTITY_NAME}].${this._activeCls}`);
            let Next = Curr?.nextElementSibling;
            if (Next && Next != null) {
                this._isProcess = true;
                this.goTab(Base(Next).attr(IDENTITY_NAME));
            }
        }
        active(menuId, menuData={}) {
            Base.logging(this, `active(${menuId})`);
            if(!menuId || !this.find(`${this._itemTag}[${IDENTITY_NAME}="${menuId}"]`)) return false;
            const This = this;
            const That = This.find(`${This._itemTag}[${IDENTITY_NAME}="${menuId}"]`);
            if (!That.hasClass(This._activeCls)) {
                if (This.find(`${This._itemTag}.${This._activeCls}`)) {
                    This.find(`${This._itemTag}.${This._activeCls}`).removeClass(This._activeCls);
                }
                That.addClass(This._activeCls);
            }
            if (That && That.find('.btn-tm em') && menuData['tabName'] && That.find('.btn-tm em').text_() != menuData['tabName']) {
                That.find('.btn-tm em').text_(menuData['tabName']);
            }
            return This;
        }
        remove(menuId, isIgnore = false) {
            Base.logging(this, `remove(${menuId})`);
            if (!menuId) return;
            const This = this;
            let isClose= true;
            if (isIgnore === false)  {
                /** Check if it's OK to close the tab. */
                if (Base.isFunction(This._options['doCloseCheck'])) {
                    let checker = {};
                    isClose= This._options['doCloseCheck'].call(This._parent, menuId);
                    if (Array.isArray(isClose)) {
                        isClose = isClose[0];
                        checker = isClose[1];
                    }
                }
                if(!isClose && This._options['confirmClose']) {
                    isClose= $w.confirm(This._options['confirmClose']);
                }
            }
            if (isClose) {
                if (This.find(`${This._itemTag}[${IDENTITY_NAME}="${menuId}"]`)) {
                    const elem = This.find(`${This._itemTag}[${IDENTITY_NAME}="${menuId}"]`);
                    Array.from((elem instanceof NodeList ? elem : [elem])).forEach((e)=>e.remove());
                }
                if (Base.isFunction(This._options['onCloseTab'])) {
                    This._options['onCloseTab'].call(This._parent, menuId);
                }
                Base.Timer.sleep(30).then(function() {
                    if(!This.find(`${This._itemTag}.${This._activeCls}`)) {
                        This.goFirstTab();
                    }
                });
            }
            return This;
        }
        removeAll() {
            Base.logging(this, `removeAll()`);
            const This = this;
            if (This.getCount() > 1) {
                This.find(This._itemTag).forEach(function(obj) {
                    if (Base(obj).attr(IDENTITY_NAME) != This._defaultNo) {
                        This.remove(Base(obj).attr(IDENTITY_NAME), true);
                    }
                });
            }
            return This;
        }
    }

    class SubTabControlBase extends TabControlBase {
        constructor(parent) {
            if (!parent) {
                throw new Error('TabControl을 생성하는데 필요한 부모 개체가 없습니다.');
            }
			super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('TabControl을 생성하는데 필요한 필수 HTML Container가 없습니다.');
            }
            if (!options['template']) {
                throw new Error('TabControl을 생성하는데 필요한 필수 HTML Template이 없습니다.');
            }
            const This = this;
            This._options   = options;
            This._container = options['container'];
            This._id        = This.getContainer()?.attr('id');
            This._elements  = {};
            This._itemTag   = options['itemTag'];
            This._template  = options['template'];
            This._activeCls = options['activeClass']||ACTIVE_CLASS;
            This._delegator = options['delegator'];
            This._defaultNo = options['defaultNo']||DEFAULT_PANEL;

            if (This.getContainer().find('.base')) {
                This.getContainer().find('.base').attr(IDENTITY_NAME, This._defaultNo).addClass(This._activeCls);
                This.addEvent(This.getContainer().find('.base'));
            }

            return This;
        }
        isValid(menuData) {
            Base.logging(this, `isValid(${menuData['menuHash']})`);
            const This = this;
            // Check Tab count.
            if (This.getContainer().find(`${This._itemTag}.loc-item`).length >= This._options['maxTabCount']) {
                if (This._options['maxTabOverCallback']) {
                    This._options['maxTabOverCallback'].call(this._parent);
                }
                return false;
            }
            return true;
        }
        addTab(menuData) {
            Base.logging(this, `addTab(${menuData['menuHash']})`);            
            const This = this;
            This._isProcess = true;
            // Append Tab.            
            const currentTab = Base.Control.Ui.createElementFromHTML(this._template);
            This.find(`${This._itemTag}.${This._activeCls}`)?.removeClass(This._activeCls);
            This.getContainer().append(currentTab);

            currentTab.addClass(This._activeCls).attr(IDENTITY_NAME, menuData['menuHash']);
            currentTab.find('.title').text_(menuData['tabName']);
            
            This.addEvent(currentTab);
            This._isProcess = false;
            return This;
        }
        addEvent(currentTab) {
            const This = this;
            if (currentTab && currentTab['find']) {
                currentTab.find('.title')?.bind('click', function(e) {
                    This.goTab(Base(e)?.parent(This._itemTag).attr(IDENTITY_NAME));
                });
                currentTab.find('.ico-close')?.bind('click', function(e) {
                    const menuId = Base(e)?.parent(This._itemTag).attr(IDENTITY_NAME);
                    if (!menuId) return;
                    This.remove(menuId);
                });
            }
        }
    }

    const ctrl = Base.Control.Ui.TabControl;
    Base.extends(Base.Control.Ui.TabControl, {
        createControl : function(clazz) {
            return Base.Core.module(clazz, new TabControlBase(clazz), ctrl.className);
        },
        createSubTabControl : function(clazz) {
            return Base.Core.module(clazz, new SubTabControlBase(clazz), 'Sub'+ctrl.className);
        }
    });

}) (window, __DOMAIN_NAME||'');