/** common.control.ui.menu.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    const DEFAULT_PANEL	= Base.config['default_panel']||'0000000000';
    const getPath = (menuData = {})=>{
        return String(menuData['menuPath']||'').trim().split('.action')[0];
    };

    class MenuControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
			super(parent);
        }
        init(options = {}) {
            Base.logging(this, 'init()');
            if (!options['container']) {
                throw new Error('MenuControl을 생성하는데 필요한 필수 HTML Container 없습니다.');
            }
            this._options   = options;
            this._container = options['container'];
            this._handler   = options['uiHandler'];
            this._id        = this.getContainer().attr('id');
            this._menuDataMap={};
            this.menuDataCollect(); // Menu Html Element에서 Menu Data 수집.
            this.userInfoCollect(); // Menu Html Element에서 사용자 정보 수집.
            this.bindClickEvent();  // Menu Element에 click event binding.
            return this;
        }
        menuDataCollect() {
            const This = this;
            const fnCollector = function(container) {
                if (container.find('a[data-menu-path]')) {
                    Array.from(container.find('a[data-menu-path]')).forEach(function(e) {
                        let menuData = Base.Utils.clone((e?.dataset||{}));
                        if (menuData && menuData['menuPath'] && menuData['menuPath'] != '/') {
                            let menuPath = getPath(menuData);
                            let originVal= This._menuDataMap[menuPath]||{};
                            if (originVal['tabNo'] && originVal['menuHash'] && originVal['tabNo'] == menuPath['tabNo']) {
                                menuData = Base.extend(menuData, originVal);
                            } else {
                                menuData['tabNo']   = menuData['tabNo']  || originVal['tabNo'] || This.getHashNumber(menuPath);
                                menuData['tabName'] = menuData['tabName']||originVal['tabName']|| e?.text || '';
                                // menu hash 생성.
                                menuData['menuHash']= This.getHashNumber(menuData['tabNo']+'#'+menuPath);
                            }
                            // menu data 반영.
                            Object.keys(menuData).forEach((key) => {
                                if(!e.dataset[key]) e.dataset[key] = menuData[key];
                            });

                            This._menuDataMap[menuPath] = menuData;
                            if (This._isDebug) {
                                // menuHash 데이터 검증.
                                if(!This._menuDataMap['__HashNumbers']) {
                                    This._menuDataMap['__HashNumbers'] = {};
                                }
                                if(!This._menuDataMap['__HashNumbers'][menuData['menuHash']]) {
                                    This._menuDataMap['__HashNumbers'][menuData['menuHash']] = {data:[], elem:[], chk:0};
                                }
                                This._menuDataMap['__HashNumbers'][menuData['menuHash']].data.push(menuData);
                                This._menuDataMap['__HashNumbers'][menuData['menuHash']].elem.push(e);
                                This._menuDataMap['__HashNumbers'][menuData['menuHash']].chk++;
                            }
                        }
                    });
                }
            }
            This.getContainer(1) && fnCollector(This.getContainer(1));  // Site Map container
            This.getContainer(0) && fnCollector(This.getContainer(0));  // LNB Menu container
        }
        userInfoCollect() {
            let userName = this.getContainer(0).find('.user-name');
            let userId   = this.getContainer(0).find('.user-id');
            if (userName && userName instanceof Element) {
                $w['$U']['uNm'] = userName?.text_();
            }
            if (userId) {
                userId = userId instanceof NodeList ? userId[0] : userId;
                userId = userId?.text_().replaceAll('[', '').replaceAll(']', '').split('/');
                $w['$U']['uId'] = (userId[0]||'').trim().getAlphaNum();
                $w['$U']['vNm'] = (userId[1]||'').trim();
                if(!$w['$U']['uId'] || $w['$U']['uId'] == 'null') {
                    $w['$U']['uId'] = String(Base.Utils.getRandom(1000, 9999)).digits(4);
                }
            }
        }
        bindClickEvent() {
            const This = this;
            This._container?.bind('click', function (e) {
                const el = e.target;
                if (el.closest(".bookmarkBtn")) {   // 즐겨찾기버튼 클릭
                    const menuId = el.closest('li')?.querySelector('[data-tab-no]').dataset.tabNo;
                    if (Base.isFunction(This._options['onClickFavBtn']) && menuId) {
                        This._options['onClickFavBtn'].call(This._parent, menuId, el.classList.contains('on'), function (isCheck) {
                            if (isCheck) {
                                el.classList.add('on');
                            } else {
                                el.classList.remove('on');
                            }
                            if (el.closest(".lyr-sitemap")) { layerClose('lyr-sitemap'); }  //사이트맵닫기
                        });
                    }
                } else if (el.closest("a[data-menu-path]")) {  // 메뉴명 클릭
                    if (This._isDebug) {
                        // 개발자 편의를 위한 임시 탭
                        if (e.ctrlKey) {
                            return $w.open(`?templatePath=${String(el.dataset.menuPath).decode()}`,'_blank');
                        };
                        if (e.shiftKey) {
                            return $w.open(`?templatePath=${String(el.dataset.menuPath).decode()}`,'_self');
                        };
                    }
                    if (Base.isFunction(This._options['onClickMenu'])) {
                        This._options['onClickMenu'].call(This._parent, e, el.dataset);
                        if (el.closest(".lyr-sitemap")) { layerClose('lyr-sitemap'); }  //사이트맵닫기
                    }
                } else if (el.closest(".btn-hb-menu") || el.closest(".btn-side-menu")) {  //lnb 닫기
                    lnbFn();
                    if (Base.isFunction(overpass.grid?.ui?.resize)) {
                        Base.Timer.sleep(300).then(function() {
                            overpass.grid.ui.resize();
                        });
                    }
                }
            });
        }
        /**
         * MenuID를 기준으로 Menu Element 반환.
         * @param {*} menuId 
         * @returns 
         */
        getMenu(menuId) {
            let menu = this.getContainer(0).find(`a[data-tab-no='${menuId}']`);
            if (menu) {
                return menu instanceof NodeList ? menu[0] : menu;
            }
            return undefined;
        }
        /**
         * MenuHash 기준으로 MenuData 반환.
         * @param {*} menuHash
         * @returns 
         */
        getMenuDataSetById(menuHash) {
            let result = {};
            Object.keys(this._menuDataMap).some((key)=> {
                if (this._menuDataMap[key]['menuHash'] == menuHash) {
                    result = this._menuDataMap[key]; return true;
                }
                return false;
            });
            return result;
        }
        /**
         * MenuPath를 기준올 MenuData 반환.
         * @param {*} menuPath 
         * @returns 
         */
        getMenuDataSet(menuPath) {
            let pureMenuPath = String(menuPath||'').trim().split('.action')[0];
            return this._menuDataMap[pureMenuPath];
        }
        openMenuByPath(oQuery) {
            const This = this;
            if(!oQuery) return;
            let path, elem = undefined;
            if (oQuery.getHash('t')) {
                path = oQuery.getHash('t');
                elem = This.getMenu(path);
            }
            if (oQuery.get('templatePath')) {
                path = oQuery.get('templatePath').decode();
                if (path.indexOf(oQuery.location.hostname) > 0) {
                    path=path.substring(path.indexOf(oQuery.location.hostname)+oQuery.location.hostname.length);
                }
                if (path.indexOf('?') > 0) {
                    oQuery = Base.Utils.querystringHelper(path);
                    path = oQuery.pathname;
                }
                elem = This.getContainer(0).find(`a[data-menu-path="${path}"]`);
            }

            if (elem) {
                if (elem instanceof NodeList) elem = Base(elem[0]);
                Base.tracking(`${This.classPath}.openMenuByPath() => templatePath:${path}`, oQuery, elem);
                const menuData= Base.extends({}, {data:oQuery.params}, elem.data());
                This.getParent()?.loadApplication?.call(This.getParent(), menuData);
                if (This._handler && This._handler['event']) {
                    if (elem.parent('.lnb-menu__depth2')) {
                        This._handler.event.click({target:elem.parent('.lnb-menu__depth2').parent().find('a.dep1')});
                        This._handler.event.click({target:elem});
                    }
                }
                $w?.history?.replaceState(null, '', '/index.action');
            }
        }
    }

    class MobileMenuControlBase extends MenuControlBase {
        constructor(parent) {
            super(parent);
        }
        addMenuDataSet(menuData) {
            let menuPath = getPath(menuData);
            this._menuDataMap[menuPath] = Base.extends(menuData, {
                menuHash : this.getHashNumber((menuData['tabNo']||'//')+'#'+menuPath)
            });
            return this._menuDataMap[menuPath];
        }
        menuDataCollect() {
            const This = this;
            const fnMianPanel=()=>{
                This.addMenuDataSet({
                    isMain   : true,
                    tabName  : '메인',
                    tabNo    : DEFAULT_PANEL,
                    menuPath : '/index.action',
                });
            };
            const fnCollector = function(container) {
                if (container.find('a[data-menu-path]')) {
                    Array.from(container.find('a[data-menu-path]')).forEach(function(e) {
                        let menuData = Base.Utils.clone((e?.dataset||{}));
                        if (menuData && menuData['menuPath'] && menuData['menuPath'] != '/') {
                            let menuPath = getPath(menuData);
                            let originVal= This._menuDataMap[menuPath]||{};
                            if (originVal['tabNo'] && originVal['menuHash'] && originVal['tabNo'] == menuPath['tabNo']) {
                                menuData = Base.extend(menuData, originVal);
                            } else {
                                menuData['tabNo']   = menuData['tabNo']  || originVal['tabNo'] || This.getHashNumber(menuPath);
                                menuData['tabName'] = menuData['tabName']||originVal['tabName']|| e?.text || '';
                                // menu hash 생성.
                                menuData['menuHash']= This.getHashNumber(menuData['tabNo']+'#'+menuPath);
                            }
                            if(!menuData['parent'] && e.closest('.lnb-menu__depth2')) {                                
                                const parent= Base(e.closest('.lnb-menu__depth2'))?.parent();
                                const nodes = parent?.find('ul.lnb-menu__sub a');
                                if (parent && nodes) {
                                    menuData['parent'] = {
                                        name : parent.find('a.dep1')?.text_(),
                                        nodes: Array.from(nodes instanceof NodeList ? nodes:[nodes]).map((o)=>getPath(o.dataset))
                                    };
                                }
                            }
                            // menu data 반영.
                            Object.keys(menuData).forEach((key) => {
                                if(!e.dataset[key] && key != 'parent') e.dataset[key] = menuData[key];
                            });

                            This._menuDataMap[menuPath] = menuData;
                        }
                    });
                }
            }

            fnMianPanel();          // Main Dashboard 메뉴 정보 등록.
            fnCollector(This.getContainer());  // LNB Menu container
        }        
    }

    Base.extends(Base.Control.Ui.MenuControl, {
		createControl : function(clazz, isMobile = false) {
            if (isMobile === true) {
                return Base.Core.module(clazz, new MobileMenuControlBase(clazz), Base.getName(MobileMenuControlBase));
            } else {
                return Base.Core.module(clazz, new MenuControlBase(clazz), Base.getName(MenuControlBase));
            }
		}
	});

}) (window, __DOMAIN_NAME||'');