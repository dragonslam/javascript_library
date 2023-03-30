/** common.control.ui.pagination.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    const PaginationTemplateElements = {
        default : {
            wapper: '[pagination-role="wapper"]',
            first : '[pagination-role="first"]',
            prev  : '[pagination-role="prev"]',
            item  : '[pagination-role="item"]',
            next  : '[pagination-role="next"]',
            last  : '[pagination-role="last"]',        
        }
    };
    const PaginationControlOptions = {
        'pc' : {
            default  : {
                template :`${Base.config['template_path']}/pagination.html`,
                elements : PaginationTemplateElements.default,
                show : {
                    btnFirst	: false,
                    btnPrevious	: true,
                    btnNext		: true,
                    btnLast		: false,
                }
            },
            detail  : {
                template :`${Base.config['template_path']}/pagination.html`,
                elements : PaginationTemplateElements.default,
                show : {
                    btnFirst	: true,
                    btnPrevious	: true,
                    btnNext		: true,
                    btnLast		: true,
                }
            },
        },
        'mo' : {
            default  : {
                template :`${Base.config['template_path']}/pagination.html`,
                elements : PaginationTemplateElements.default,
                show : {
                    btnFirst	: false,
                    btnPrevious	: true,
                    btnNext		: true,
                    btnLast		: false,
                }
            },
            detail  : {
                template :`${Base.config['template_path']}/pagination.html`,
                elements : PaginationTemplateElements.default,
                show : {
                    btnFirst	: true,
                    btnPrevious	: true,
                    btnNext		: true,
                    btnLast		: true,
                }
            },
        },
    };

    class PaginationControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
			super(parent);
            this._container= undefined;
            this._elements = {};
            this._template = {};
            this._callback = undefined;
            this._type = {};
            this._event= {};
            this._data = {
                totalCount : 0,
                rowsPerPage: 10,
                pageGroup  : 10,
                pageIdx : 0
            };
        }
        init(type, container, options = {}) {
            if (!type && !type['template']) {
                throw new Error('PaginationControl을 생성하는데 필요한 type 객체가 없습니다.');
            }
            if (!container) {
                throw new Error('PaginationControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
            this._type = type;
            this._container = container;
            this.setOptions(options);
            return this;
        }
        setOptions(options = {}) {
            if (typeof options != 'object') {
                throw new Error('PaginationControl에서 사용할 수 없는 option 입니다.');
            }
            if (options['data']) {
                this._data =  Base.extends(this._data, options['data']);
            }
            if (options['show']) {
                this._type.show=  options['show'];
            }
            if (options['onPaging']) {
                this._callback =  options['onPaging'];
            }
            if (options['events']) {
                this._event =  options['events'];
            }
        }
        getPaginationData() {
            const data = this._data;
            const show = this._type.show;
            if (data.totalCount <= 0) {
                data.totalCount = 1;
                data.pageIdx = 1;
            }
            let totalPage = Math.ceil(data.totalCount / data.rowsPerPage);
            let startPage =(Math.ceil(data.pageIdx / data.pageGroup) - 1) * data.pageGroup;
            const paginationData = Base.extends({
                totalPage   : totalPage,
                startPage   : startPage,
                endPage     : startPage + data.pageGroup,
                showFirst	: (show.btnFirst && totalPage > data.pageGroup && data.pageIdx > data.pageGroup),
                showPrev    : (show.btnPrevious && totalPage > data.pageGroup && data.pageIdx > data.pageGroup),
                showNext	: (show.btnNext && totalPage > data.pageGroup && totalPage-startPage > data.pageGroup),
                showLast	: (show.btnLast && totalPage > data.pageGroup && totalPage-startPage > data.pageGroup),
                pageObj     : []
            }, data);
            if (paginationData.endPage > totalPage) {
                paginationData.endPage = totalPage;
            }
            for (let i = paginationData.startPage; i < paginationData.endPage; i++) {
                paginationData.pageObj.push({
                    page    : (i+1),
                    active  : (i+1) == data.pageIdx,
                });
            }
            return paginationData;
        }
        render(options = {}) {
            const This = this;
            if (typeof options == 'number' && This._data) {
                This._data.pageIdx = options;
            } else {
                This.setOptions(options);
            }
            if (!This._type || !This._type['template'] || !This._type['elements']) {
                throw new Error('PaginationControl에서 사용할 수 없는 type option 입니다.');
            }
            if (!This._data || !This._data['rowsPerPage'] || !This._data['pageIdx']) {
                throw new Error('PaginationControl에서 사용할 수 없는 data option 입니다.');
            }
            
            return Base.Core.pf(function(resolve, reject) {
                // import layer template.
                This.getRemoteTemplate(This._type.template).then(function(result) {
                    const pageTemplate = Control.Ui.createElementFromHTML(result);
                    Object.keys(This._type.elements).forEach((key) => {
                        This._template[key] = (key == 'wapper' ? pageTemplate : pageTemplate.find(This._type.elements[key]))?.outerHtml_().trimHtml();
                    });
                    
                    // page data 계산.
                    const pageData = This.getPaginationData();
                    const pageNavi = Control.Ui.createElementFromHTML(This._template.wapper).empty();
                    if (pageData.showFirst && This._template.first) {
                        let item = Control.Ui.createElementFromHTML(This._template.first);
                            item.data('page', 1);
                            pageNavi.append(item);
                    }
                    if (pageData.showPrev && This._template.prev) {
                        let item = Control.Ui.createElementFromHTML(This._template.prev);
                            item.data('page',  pageData['startPage']-pageData['pageGroup']+1);
                            pageNavi.append(item);
                    }
                    if (pageData.pageObj && pageData.pageObj.length > 0) {
                        pageData.pageObj.forEach((o) => {
                            let item = Control.Ui.createElementFromHTML(This._template.item).text_(o.page);
                            if (o.active) {
                                item.addClass('active');
                            } else {
                                item.data('page', o.page);
                            }
                            pageNavi.append(item);
                        });
                    }
                    if (pageData.showNext && This._template.next) {
                        let item = Control.Ui.createElementFromHTML(This._template.next);
                            item.data('page',  pageData['startPage']+pageData['pageGroup']+1);
                            pageNavi.append(item);
                    }
                    if (pageData.showLast && This._template.last) {
                        let item = Control.Ui.createElementFromHTML(This._template.last);
                            const lastPage = ((Math.ceil(pageData['totalPage'] / pageData['pageGroup']) - 1) * pageData['pageGroup'])+1;
                            item.data('page', lastPage);
                            pageNavi.append(item);
                    }

                    // Event bind..
                    pageNavi.find('a[data-page]')?.bind('click', function(e) {
                        const That = Base(this);
                        if (This._event && Base.isFunction(This._event['onBeforPageChange'])) {
                            This._event['onBeforPageChange'](e);
                        }
                        if (This._parent && Base.isFunction(This._callback)) {
                            This._callback.call(This._parent, String(That.data('page')).parseInt());
                        }
                        if (This._event && Base.isFunction(This._event['onAfterPageChange'])) {
                            This._event['onAfterPageChange'](e);
                        }
                    });

                    This._container.empty().append(pageNavi);
                    Base.tracking(`${This.classPath}.render()`, This, pageData);

                    if (Base.isFunction(resolve)) resolve.call(This._parent, pageData);
                })
                .catch(function(error) {
                    if (Base.isFunction(reject)) reject.call(This._parent, error);
                });
            });
        }
    }

    const ctrl = Base.Control.Ui.PaginationControl;
    Base.extends(Base.Control.Ui.PaginationControl, {
        PaginationOptions : PaginationControlOptions,
        init : function(parent, options = {}) {
            if (!parent || !parent['rootClassPath']) {
                throw new Error('CalendarControl을 초기화 할 수 없습니다.');
            }
            const This = this;
            This.PaginationOptions.Parent = parent;
            This.PaginationOptions[parent.rootClassPath] = Base.extends(options, this.PaginationOptions[parent.rootClassPath]);
            This.PaginationOptions.getType = function(type = '') {
                return Base.extends({}, This.PaginationOptions[This.PaginationOptions.Parent.rootClassPath][type||'default']);
            };
            This.PaginationOptions.getEvent = function() {
                return Base.extends({}, This.PaginationOptions[This.PaginationOptions.Parent.rootClassPath]['events']);
            };
            return This;
        },        
		createControl : function(clazz, container, options = {}) {
            return Base.Core.module(clazz, new PaginationControlBase(clazz), ctrl.className)
                    .init(this.PaginationOptions.getType(options['type']||''), container
                        , Base.extends({events: this.PaginationOptions.getEvent()}, options));
		},
	});

}) (window, __DOMAIN_NAME||'');