/** common.control.image.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils	= Base.Utils;
    const Control= Base.Control;

   const defaultOptions = {
        changeDataCheckArr: ["dispSeq", "imgDiviCd"],
        maxImageSize: 236, //최대 이미지사이즈 제한px
        imgDiviCd: undefined, // 이미지 구분 {key:"", value: ""} 형태. array 일 경우 select, object 일 경우
        minWidth: undefined, // 최소 폭
        minHeight: undefined, // 최소 높이
        maxAddCount: undefined, // 추가 가능한 최대 이미지 수. 넘기지 않을 경우 무한.
        button: true, // 전체 버튼 노출 여부
        viewButton: true, // 미리보기 버튼 노출여부
        modButton: true, // 수정버튼 노출 여부
        delButton: true // 삭제버튼 노출 여부
    };

    class ImageControl extends Control.ControlBase {
        constructor(clazz, options={}) {
            super();
            this._parent = clazz;
            this._options = options;
            this._imageObjGrp = {};
            this._imageElArr = [];
            this._addImageArea = undefined;
            this._imageAreaTemplete = undefined;

        }
        init(obj = {}) {
            if (!obj['container']) {
                throw new Error('Image 를 생성하는데 필요한 container가 없습니다.');
            }
            if (!obj['options']) {
                throw new Error('Image 생성하는데 필요한 option이 없습니다.');
            }
            const This = this;

            Base.extends(This._options, obj.options);
            This.setContainer(obj.container);

            return Base.Core.pf((resolve, reject) => {
                This._addImageArea = This._container.querySelector("[data-image-role='add-image-area']");
                This._imageAreaTemplete = This._container.querySelector("[data-image-role='image-area']").cloneNode(true);
                This.getContainer().querySelector("[data-image-role='image-area']").remove();
                This.initEventBind();
                if (Base.isFunction(resolve)) resolve.call(This._parent, This);
            });
        }
        initEventBind(){
            const This = this;
            const Appl  = Base.Core.namespace(This.rootClassPath);
            This._container.addEventListener('click', (e)=>{
                const targetEl = e.target;
                let el;
                if(el = targetEl.closest('[data-image-role="view-image-button"]')){
                    const imageWrapEl = el.closest("[data-image-id]");
                    const imageEl = imageWrapEl.querySelector("img");
                    let imageSrc;
                    if(imageEl.dataset.orgSrc){
                        const urlIdx = imageEl.dataset.orgSrc.indexOf("?");
                        if(urlIdx >= 0){
                            imageSrc = imageEl.dataset.orgSrc.substring(0, urlIdx);
                            const urlSearchObj = new URLSearchParams(imageEl.dataset.orgSrc.substring(urlIdx).replaceAll("?", ""));
                            urlSearchObj.delete("RS");
                            urlSearchObj.delete("SP");
                            const urlSearch = urlSearchObj.toString();
                            if(urlSearch){
                                imageSrc += "?"+urlSearch;
                            }
                        }else{
                            imageSrc = imageEl.dataset.orgSrc;
                        }
                    }else{
                        imageSrc = imageEl.getAttribute("src");
                    }

                    if(This._options.imageViewType == "popup"){
                        Appl.Popup.imageOpen(This, imageSrc);
                    }else if(This._options.imageViewType == "fullLayer"){
                        Appl.Layer.createLayer(This, {
                            layerName: "이미지 상세보기",
                            layerClassName: "type2",
                            contents: This.getViewFullLayerImageEl(imageSrc),
                            isDispButton: false,
                            onOpen: (obj)=>{typeof $w.pinchZoom == 'function' && pinchZoom()}
                        });
                    }else{
                        Appl.Layer.createLayer(This, {
                            contents: This.getViewLayerImageEl(imageSrc),
                            isDispButton: false
                        });
                    }
                }else if(el = targetEl.closest('[data-image-role="modify-image-button"]')){
                    This.browse().then((arr)=>{
                        const newImageData = arr[0];
                        const imageWrapEl = el.closest("[data-image-id]");
                        const imageId = imageWrapEl.dataset.imageId;
                        const imageData = This._imageObjGrp[imageId];
                        Base.extends(imageData, newImageData, { crud: imageData.crud === "R" ? "U" : imageData.crud });

                        const imgTagEl = imageWrapEl.querySelector("img");
                        imgTagEl.src = newImageData.image?.src;
                        imgTagEl.dataset.orgSrc = "";
                        This.procImagePosition(imgTagEl);
                    }).catch(alert);
                }else if(el = targetEl.closest('[data-image-role="delete-image-button"]')){
                    const options = This._options;
                    const imageWrapEl = el.closest("[data-image-id]");
                    const imageId = imageWrapEl.dataset.imageId;

                    const elIdx = This._imageElArr.findIndex(el=>el.dataset.imageId == imageId);
                    if(elIdx >= 0){
                        This._imageElArr[elIdx].remove();
                        This._imageElArr.splice(elIdx, 1);
                    }

                    if(This._imageObjGrp[imageId].crud == "C"){
                      delete This._imageObjGrp[imageId];
                    }else{
                        This._imageObjGrp[imageId].crud = "D";
                    }
                    if(options.maxAddCount){
                        const visibleImageCount = Object.values(This._imageObjGrp).filter(i=> i.crud !== "D").length;
                        if(options.maxAddCount > visibleImageCount){
                            This._addImageArea.style.display = "";
                        }
                    }
                }else if(el = targetEl.closest('[data-image-role="add-image-button"]')){
                    const options = This._options;
                    This.browse(!options.maxAddCount).then((arr)=>{
                        arr.forEach(file =>{
                            This.createImageElement(Base.extends(file, {crud: "C" }));
                        });
                    }).catch(alert);
                }

            });
        }
        getViewLayerImageEl(imageSrc){
            return `<img src="${imageSrc}" onerror="this.src='/common/image/noimg.jpg'" style="max-width:900px;">`
        }
        getViewFullLayerImageEl(imageSrc){
           return `<div class="box-prd-detail-zoom">
                <div class="swiper-wrapper">
                    <div class="swiper-slide">
                        <div class="swiper-zoom-container">
                            <img src="${imageSrc}" onerror="this.src='/common/image/noimg.jpg'"/>
                        </div>
                    </div>
                </div>
            </div>`
        }
        createSelectBoxOption(obj){
            return `<li><a href="javascript:void(0);" data-value="${obj.key}">${obj.value}</a></li>`;
        }
        createImage(file){
            return Base.Core.pf((resolve, reject) => {
                if (!file) {
                    const image = new Image();
                    image.onload = function() {
                        resolve(this);
                    };
                    image.src = "/common/image/noimg.jpg";
                }else{
                    const reader = new FileReader();
                    reader.onload = function(f) {
                        const image = new Image();
                        image.onload = function() {
                            resolve(this);
                        };
                        image.src = f.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        createImageElement(newImageObj){
            const This = this;
            const options = This._options;
            const image = This._imageAreaTemplete.cloneNode(true);
            const imgTagEl = image.querySelector("img");

            const imageArr = Object.values(This._imageObjGrp);
            const imageIdx = imageArr.length;

            if(!newImageObj.dispSeq){
                const maxDispSeq = imageArr.reduce((acc, curr)=>Math.max(acc, curr.dispSeq) , 0);
                newImageObj.dispSeq = maxDispSeq + 1;
            }

            if(Array.isArray(options.changeDataCheckArr)){
                newImageObj.orgData = {};
                options.changeDataCheckArr.forEach(checkData => {
                    newImageObj.orgData[checkData] = newImageObj[checkData];
                });
            }

            This._imageObjGrp[imageIdx] = newImageObj;
            This._imageElArr.push(image);

            // 이미지 관련 처리
            image.dataset.imageId = imageIdx;
            imgTagEl.src = This._imageObjGrp[imageIdx].image?.src;
            imgTagEl.dataset.orgSrc = This._imageObjGrp[imageIdx].url||"";

            const imageElArr = This.getContainer().querySelectorAll('[data-image-id]');
            if(imageElArr.length > 0){
                let targetEl;
                imageElArr.forEach((el, idx)=>{
                    const imageId = el.dataset.imageId;
                    const dispSeq = This._imageObjGrp[imageId].dispSeq;
                    if(dispSeq <= This._imageObjGrp[imageIdx].dispSeq){
                        targetEl = el;
                    }
                });
                if(targetEl){
                    targetEl.insertAdjacentElement('afterend', image);
                }else{
                    imageElArr[0].insertAdjacentElement('beforebegin', image);
                }
            }else {
                This._addImageArea.insertAdjacentElement('beforebegin', image);
            }
            //append후 이미지 position 처리
            This.procImagePosition(imgTagEl);

            if(options.maxAddCount){
                const visibleImageCount = imageArr.filter(i=> i.crud !== "D").length+1;
                if(options.maxAddCount <= visibleImageCount){
                    This._addImageArea.style.display = "none";
                }
            }

            //셀렉트박스
            const imageDiviArea = image.querySelector("[data-image-role=image-divi-area]");
            if(!options.imgDiviCd){
                imageDiviArea.remove();
            }else{
                let optionArrTxt = "";
                options.imgDiviCd.forEach(o=> {
                    optionArrTxt += This.createSelectBoxOption(o);
                });
                imageDiviArea.querySelector(".select-box__list").insertAdjacentHTML('afterbegin', optionArrTxt);

                const imgDiviCdValueEl = imageDiviArea.querySelector('input[data-role="value"]');
                if(This._imageObjGrp[imageIdx].imgDiviCd){
                    imgDiviCdValueEl.value = This._imageObjGrp[imageIdx].imgDiviCd;
                }
                options.uiHandler.customSelectBox.init(image);
                This._imageObjGrp[imageIdx].imgDiviCd = imgDiviCdValueEl.value;
                imageDiviArea.querySelector('input[data-role="value"]').addEventListener('change', (e)=>{
                    This._imageObjGrp[imageIdx].imgDiviCd = e.target.value;
                });

            }

            //버튼 노출처리
            if (!options.button) {
                image.querySelector('[data-image-role="image-button-wrap"]').remove();
            }else{
                if (!options.viewButton) {
                    image.querySelector('[data-image-role="view-image-button"]').remove();
                }
                if (!options.modButton) {
                    image.querySelector('[data-image-role="modify-image-button"]').remove();
                }
                if (!options.delButton) {
                    image.querySelector('[data-image-role="delete-image-button"]').remove();
                }
            }

            if($w.jQuery?.ui){
                const dragImgEl = document.createElement("img");
                dragImgEl.className = imgTagEl.className;
                dragImgEl.style.top = imgTagEl.style.top;
                dragImgEl.style.left = imgTagEl.style.left;
                dragImgEl.style.zIndex = 9999;
                $w.jQuery(imgTagEl).draggable({
                    helper: function() {
                        dragImgEl.src = imgTagEl.src;
                        return dragImgEl;
                    },
                    containment: This.getContainer(),
                    opacity: 0.8
                }).droppable({
                    drop: function(e, u) {
                        const draggable = u.draggable.closest("[data-image-id]");	//drag 이미지
                        const droppable = $w.jQuery(e.target).closest("[data-image-id]");	//drop 대상
                        if (draggable.index() < droppable.index()) {
                            droppable.after(draggable);
                        } else {
                            droppable.before(draggable);
                        }

                        This.getContainer().querySelectorAll("[data-image-id]").forEach((el, idx)=>{
                           const imageId = el.dataset.imageId;
                            This._imageObjGrp[imageId].dispSeq = idx;
                        });
                    }
                });
            }
        }
        procImagePosition(imgTagEl){
            const divImageEl = imgTagEl.closest(".cmn-image__attach");
            const top = ((divImageEl.clientHeight - imgTagEl.clientHeight)/2);
            const left = ((divImageEl.clientWidth - imgTagEl.clientWidth)/2);
            imgTagEl.style.top = top+"px";
            imgTagEl.style.left = left+"px";
            imgTagEl.classList.remove("cmn-image__pic-posit");
        }
        addImage(obj){
            const This = this;
            const imageObjArr = Array.isArray(obj) ? obj : [obj];
            imageObjArr.forEach(imageObj =>{
                Base.Fetch.get(imageObj.url, {},{dataType:'blob'}).then(function(blob) {
                    This.createImage(blob).then(image=>{
                        This.createImageElement(Base.extends(imageObj, {image, crud: "R" }));
                    });
                }).catch(function(error) {
                    This.createImage().then(image=>{
                        This.createImageElement(Base.extends(imageObj, {image, crud: "R" }));
                    });
                });
            });
        }
        browse(isMultiple= false){
            const This = this;
            const options = This._options;

            return Base.Core.pf((resolve, reject) => {

                const inputFile = document.createElement("input");
                inputFile.setAttribute("type", "file");
                inputFile.multiple = isMultiple;
                inputFile.addEventListener("change", (e)=>{
                    const list = [];
                    const files = e.target.files;
                    Array.from(files).forEach(file=>{
                        This.createImage(file).then(image=>{
                            if((options.minWidth && options.minWidth > image.width) || (options.minHeight && options.minHeight > image.height)){
                                reject("이미지 사이즈가 작습니다.");
                           }
                            list.push({image, file});
                            if(files.length == list.length){
                                resolve(list);
                            }
                        });
                    });
                });
                inputFile.click();
            });
        }
        getImages(){
            const This = this;
            const resultImageArr = [];

            Object.values(This._imageObjGrp).forEach(itemObj =>{
                const orgData = itemObj.orgData;

                if(itemObj.crud == "R" || itemObj.crud == "U"){
                    itemObj.crud = "R";
                    if(!Utils.isEmptyObject(orgData)){
                        for(let key in orgData){
                            if(itemObj[key]!= orgData[key]){
                                itemObj.crud = "U";
                                break;
                            }
                        }
                    }
                    if(itemObj.file?.size > 0){
                        itemObj.crud = "U";
                    }
                }else if(itemObj.crud == "D" ){
                    delete itemObj.file;
                    if(!Utils.isEmptyObject(orgData)){
                        for(let key in orgData){
                            itemObj[key] = orgData[key];
                        }
                    }
                }
                resultImageArr.push(itemObj);
            });

            return resultImageArr;
        }
        reset(){
            const This = this;
            This._imageElArr.forEach(el => el.remove());
            This._imageElArr = [];
            delete This._imageObjGrp;
            This._imageObjGrp = {};
            if(This._options.maxAddCount){
                This._addImageArea.style.display = "";
            }
        }
    }

    const ctrl = Base.Control.Image;
    Base.extends(Base.Control.Image, {
        createControl : function(clazz) {
            return Base.Core.module(clazz, new ImageControl(clazz,  Base.extends({}, defaultOptions)), ctrl.className);
        },
    });

}) (window, __DOMAIN_NAME||'');