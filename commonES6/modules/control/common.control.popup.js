/** common.control.popup.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils  = Base.Utils;
    const Control= Base.Control;
    const DeleteDeffer = {};
    const PopupContext = {};
    const PopupOptions = {
        toolbar     : 'no',
        scrollbars  : 'no',
        resizable   : 'no',
        status      : 'no',
        menubar     : 'no',
        width       : 1200, 
        height      : 900, 
        //top         : 0,
        //left        : 0,
    };

    const fnSizeBalance = function(curr, min, max) {
        if (curr < min) return min;
        if (curr > max) return max;
        return curr;
    };
    const fnImageLoader = function(imageSrc) {
        return Base.Core.pf(function(resolve, reject) {
            if (!imageSrc) {
                if (Base.isFunction(reject)) reject(new Error('Not found image scr.'));
            }
            let oImg = new Image();
            oImg.addEventListener('load', function() {
                if (Base.isFunction(resolve)) resolve(oImg);
            });
            oImg.addEventListener('error', function(err) {
                if (Base.isFunction(reject)) reject(err);
            });
            oImg.src = imageSrc;
        });
    };
    class PopupControlBase extends Control.ControlBase {
        constructor() {
			super();
            this._parent = parent;
        }
        init(isMobile = false) {
            Base.logging(this, 'init()');
            this._isMobile = isMobile;
            return this;
        }
        getUniqueName(caller, options = {}) {
            return caller['classPath'].replaceAll('.','_')+'-'+options['popupWinId'];
        }
        addContext(context) {
            PopupContext[context['popupId']] = context;
            return PopupContext[context['popupId']];
        }
        removeContext(popupId) {
            const This = this;
            if (popupId) {
                DeleteDeffer[popupId] = {};
                Base.Timer.sleep(3000).then(()=> {
                    This.removeContext();
                });
            } else {
                Object.keys(PopupContext).forEach((key)=> {
                    if (DeleteDeffer[key] && PopupContext[key] && 
                        PopupContext[key]['popupWin'] && 
                        PopupContext[key]['popupWin']?.closed === true
                    ) {
                        delete DeleteDeffer[key];
                        delete PopupContext[key];
                    }
                });
            }
        }
        async open(caller, options = {}) {
            if (!caller) {
                throw new Error('PopupControl을 사용하는 주체가 없습니다.');
            }
            if (!options['popupWinId']) {
                throw new Error('Popup WindowID 정보가 없습니다.');
            }
            if (!options['actionUrl'] && !options['contents']) {
                throw new Error('Popup Url 정보가 없습니다.');
            }
            const This = this;
            const popupId = this.getUniqueName(caller, options);
            // HTML 내용으로 팝업을 Open하는 경우 전용 팝업 URL을 사용한다.
            if (options['contents']) {
                options['actionUrl']= '/common/popup.action';
                options['isLoadJS'] = false;
            }
            Base.tracking(`${This.classPath}.open()`, options);
            return Base.Core.pf(function(resolve) {
                const _data= Base.extends(options['data']||{}, {popupId:popupId});
                const _url = [options['actionUrl'], Base.Utils.serializeString(_data, '&')];
                const _ctx = {
                    caller  : caller,
                    options : options,
                    popupId : popupId,
                    popupWin: null,
                    popupWinUrlPath : _url.join(options['actionUrl'].indexOf('?') > 0 ? '&':'?'),
                    popupWinOptions : Utils.serializeString(Base.extends({},PopupOptions,{
                        width : options['width'] ||PopupOptions['width'],
                        height: options['height']||PopupOptions['height']
                    }), ','),
                };
                Base.tracking(`${This.classPath}.open() => NewWin:`, _ctx);
                _ctx.callback = function(...args) {
                    Base.tracking('>>>> PopupWindow.callback()', _ctx, arguments);
                    if (Base.isFunction(_ctx.options['onSelect'])) _ctx.options['onSelect'].apply(_ctx.caller, args);
                };
                _ctx.onLoad = function(...args) {
                    Base.tracking('>>>> PopupWindow.onLoad()', _ctx, arguments);
                    if (Base.isFunction(_ctx.options['onOpen'])) _ctx.options['onOpen'].apply(_ctx.caller, args||[_ctx]);
                    if (Base.isFunction(resolve)) resolve.call(caller, _ctx.popupWin);
                };
                _ctx.onUnload = function(...args) {
                    Base.tracking('>>>> PopupWindow.onUnload()', _ctx, arguments);
                    if(options['isDispDimed'] && document.querySelector("[data-dimed-id='dimed-wrapper']")){
                        uiCmn.dimedOff("wrapper");
                    }
                    if (Base.isFunction(_ctx.options['onClose'])) _ctx.options['onClose'].apply(_ctx.caller, args||[_ctx]);
                    This.removeContext(_ctx.popupId);
                };

                _ctx.popupWin = $w.open(_ctx['popupWinUrlPath'], _ctx['popupId'], _ctx['popupWinOptions']);
                if (_ctx.popupWin && _ctx.popupWin != null) {
                    if (options['isDispDimed']) {
                        uiCmn.dimedOn("wrapper");
                    }
                    _ctx.popupWin.onload = function() {
                        Base.tracking('>>>> PopupWindowOpen::', this, arguments);
                        if (_ctx.popupWin[root]) {
                            _ctx.popupWin[root].Popup = _ctx;
                        }
                    };
                    This.addContext(_ctx);                    
                } else {
                    alert('팝업이 차단되었습니다.\n\n팝업 차단을 해제한 후 진행 부탁 드립니다.');
                }
            });
        }
        async imageOpen(caller, options = {}) {
            if (!caller) {
                throw new Error('PopupControl을 사용하는 주체가 없습니다.');
            }
            if (!options) {
                throw new Error('이미지 주소가 없습니다.');
            }
            if (options['imageSrc'] && options['imageSrc'] instanceof Array) {
                return this.imagesOpen(caller, options);
            }
            const This = this;
            const popupId = this.getUniqueName(caller, {popupWinId:'imagePopup'});
            Base.tracking(`${This.classPath}.imageOpen()`, options);
            return Base.Core.pf(function(resolve, reject) {
                const _ctx = {
                    caller  : caller,
                    imageSrc: (typeof options == 'string' ? options : options['imageSrc']),
                    popupId : popupId,
                    popupWin: null,
                };                
                fnImageLoader(_ctx.imageSrc).then(function(oImg){
                    let popWidth  = fnSizeBalance(oImg.width , options['minWidth'] ||100, options['maxWidth']||1000);
                    let popHeight = fnSizeBalance(oImg.height, options['minHeight']||100, options['maxHeight']||800);
                    let popWindow = Utils.size(oImg.width, oImg.height).balance(Utils.size(popWidth, popHeight));
                    let imageAttr = '';                    
                    if (!options['isOrignal']) {
                        popWidth  = popWindow.x;
                        popHeight = popWindow.y;
                        imageAttr = `style="width:100%; height:100%;" `;
                    }
                    _ctx.popupWinOptions = Utils.serializeString(Base.extends({},PopupOptions,{
                        width : popWidth,
                        height: popHeight,
                    }), ',');
                    _ctx.popupWin = $w.open('', _ctx['popupId'], _ctx['popupWinOptions']);
                    let fnShowImage= function() {
                        if (_ctx.popupWin['document']) {
                            if (_ctx.popupWin.document.querySelector('body')?.childNodes.length) {
                                _ctx.popupWin.document.querySelector('body')?.childNodes?.forEach((e) => e.remove());
                                _ctx.popupWin.resizeTo(popWindow.x, popWindow.y);
                                Base.Timer.sleep(1).then(fnShowImage);
                            } else {
                                Base.tracking('>>>> ImagePopupWindowOpen::', _ctx);
                                let htmlTag = '<head><title>Image Preview</title></head><body style="padding:0px;margin:0px;" onclick="self.close();">';
                                _ctx.popupWin.document.write(`<html>${htmlTag}<img src="${oImg.src}" ${imageAttr} title="Image Preview" /></body></html>`);
                                if (Base.isFunction(resolve)) resolve.call(caller, _ctx);
                            }                            
                        } else {
                            Base.Timer.sleep(1).then(fnShowImage);
                        }
                    };
                    fnShowImage();
                })
                .catch(function() {
                    if (Base.isFunction(reject)) reject.apply(caller, arguments);
                });
            });
        }
        async imagesOpen(caller, options = {}) {
            if (!caller) {
                throw new Error('PopupControl을 사용하는 주체가 없습니다.');
            }
            if (!options) {
                throw new Error('이미지 주소가 없습니다.');
            }
            const This = this;
            const popupId = this.getUniqueName(caller, {popupWinId:'imagePopup'});            
            Base.tracking(`${This.classPath}.imageOpen()`, options);
            return Base.Core.pf(function(resolve, reject) {
                const _ctx = {
                    caller  : caller,
                    imageSrc: options['imageSrc'],
                    popupId : popupId,
                    popupWin: null
                };
                const promiseList = [];
                _ctx.imageSrc.forEach((src) => promiseList.push(fnImageLoader(src)));
                Promise.all(promiseList).then(function(oImgs) {
                    let _width = options['minWidth']||100;
                    let _height= options['minHeight']||100;
                    let _html = [];
                    oImgs.forEach(function(img) {
                        _width =fnSizeBalance(img.width, _width, options['maxWidth']||1000);
                        _height=fnSizeBalance(img.height+1,_height, options['maxHeight']||800);
                        _html.push(`<img src="${img.src}" title="Image Preview" style="width:100%; height: auto; padding-bottom:2px;"/>`);
                    });
                    _ctx.popupWinOptions = Base.Utils.serializeString(Base.extends({},PopupOptions,{
                        width : _width,
                        height: _height,
                    }), ',');
                    _ctx.popupWin = $w.open('', _ctx['popupId'], _ctx['popupWinOptions']);
                    let fnShowImage= function() {
                        if (_ctx.popupWin['document']) {
                            if (_ctx.popupWin.document.querySelector('body')?.childNodes.length) {
                                _ctx.popupWin.document.querySelector('body')?.childNodes?.forEach((e) => e.remove());
                                _ctx.popupWin.resizeTo(_width, _height);
                                Base.Timer.sleep(1).then(fnShowImage);
                            } else {
                                Base.tracking('>>>> ImagePopupWindowOpen::', _ctx);
                                let htmlTag = '<head><title>Image Preview</title></head><body style="padding:0px;margin:0px;" onclick="self.close();">';
                                _ctx.popupWin.document.write(`<html>${htmlTag}${_html.join('')}</body></html>`);
                                if (Base.isFunction(resolve)) resolve.call(caller, _ctx);
                            }
                        } else {
                            Base.Timer.sleep(1).then(fnShowImage);
                        }
                    };
                    fnShowImage();
                })
                .catch(function() {
                    if (Base.isFunction(reject)) reject.apply(caller, arguments);
                });
            });
        }
    }

    const ctrl = Base.Control.Popup;
    Base.extends(Base.Control.Popup, {
        popupContexts : PopupContext,
        getContext    : function(popupId = '') {
            if (DeleteDeffer[popupId]) delete DeleteDeffer[popupId];
            return PopupContext[popupId];
        },
		createControl : function(clazz) {
            return Base.Core.module(clazz, new PopupControlBase(), ctrl.className);
		},
	});

}) (window, __DOMAIN_NAME||'');