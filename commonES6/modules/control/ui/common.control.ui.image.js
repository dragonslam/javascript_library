/** common.control.ui.image.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Control= Base.Control;

    const defaultOption ={
        templatePath : `${Base.config['template_path']}/imageUploader.html`,
        imageViewType: "layer", //layer, fullLayer, popup
        wrapClassName: "cmn-image__upload"
    };

    class ImageControlBase extends Control.Ui.UiControlBase {
        constructor(parent) {
            super();
            this._parent = parent;
        }
        init(container) {
            if(!container) {
                throw new Error('ImageControl 생성하는데 필요한 container 객체가 없습니다.');
            }
            this._container = container;
            return this;
        }
        create(defaultOption, obj){
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                const map ={};
                if(!obj) {
                    throw new Error('ImageControl 설정이 올바르지 않습니다.');
                }
                const ImageContainerArr = Array.isArray(obj) ? obj : [obj];
                ImageContainerArr.forEach((imageObj, idx) =>{
                    if(!imageObj.container) {
                        throw new Error('ImageControl 생성하는데 필요한 container 객체가 없습니다.');
                    }
                    const containerName = imageObj.container.attr('image-container');
                    if (!containerName) {
                        throw new Error("ImageControl 이름이 올바르지 않습니다.");
                    };

                    This.addImageContainer(imageObj.container, Base.extends({}, defaultOption, imageObj.properties)).then((r)=> {
                        map[containerName] = r;
                        if(Object.keys(map).length === ImageContainerArr.length){
                            if (Base.isFunction(resolve)) resolve.call(This._parent, idx === 0 ? r : map);
                        }
                    });
                });
            });
        }
        addImageContainer(container, options={}){
            const This = this;
            return Base.Core.pf(function(resolve, reject) {
                This.getRemoteTemplate(options.templatePath).then((imageTemplate ) => {
                    const imageObj ={
                        container: Control.Ui.createElementFromHTML(imageTemplate),
                        options: options
                    };

                    const imageControl = Control.Image.createControl(This);
                    imageControl.init(imageObj).then((obj) =>{
                        container.classList.add(options.wrapClassName);
                        container.replaceWith(obj._container);

                        if (Base.isFunction(resolve)) resolve.call(This._parent, obj);
                    });
                }).catch(function(error) {
                    if (Base.isFunction(reject)) reject.call(This._parent, error);
                });

            });
        }
    }


    const ctrl = Base.Control.Ui.ImageControl;
    Base.extends(Base.Control.Ui.ImageControl, {
        defaultOption,
        init : function(parent, options = {}) {
            if (!parent || !parent['rootClassPath']) {
                throw new Error('ImageControl을 초기화 할 수 없습니다.');
            }
            const This = this;
            This.defaultOption.Parent = parent;
            Base.extends(This.defaultOption, options);
            return This;
        },
        create : function(obj) {
            const Parent = this.defaultOption.Parent;
            return Base.Core.module(Parent, new ImageControlBase(Parent), ctrl.className)
                    .init(Parent.getContainer())
                    .create(this.defaultOption, obj);
        }
    });


}) (window, __DOMAIN_NAME||'');