/** common.control.ui.menu.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
	const Appl = Base.Core.namespace('pc');
    const Control= Base.Control;

    const toolbar = [
		// [groupName, [list of button]]
		['fontname', ['fontname']],
		['fontsize', ['fontsize']],
		['style', ['bold'/*, 'italic'*/, 'underline', 'strikethrough', 'clear']],
		['color', ['forecolor', 'color']],
		['table', ['table']],
		['para', ['ul', 'ol', 'paragraph']],
		['height', ['height']],
		//['insert', ['picture', 'link', 'video']],
		['insert', ['picture', 'link']],
		['view', ['codeview', 'fullscreen', 'help']]
	];
    // 고정 값
    const fixedOption = {
		lang: "ko-KR",              // 언어
		toolbar: toolbar,           // 툴바
		shortcuts: false,           // 단축키 비활성화
		tabDisable: false,          // tab 비활성화
		spellCheck: true,           // 맞춤법 검사
		disableGrammar: false,      // 브라우저 확장앱 사용가능여부
		codeviewFilter: false,      // 코드 필터
		codeviewIframeFilter: true  // 코드 필터
	};

    const defaultOption = {
        disableDragAndDrop: true,  // drag and drop
		uploadImageOnly: true,
		placeholder: null,       // 기본 노출 TEXT
		height: 300,             // 에디터 높이
		minHeight: 300,          // 최소 높이
		maxHeight: 300,          // 최대 높이
		focus: false,            // 에디터 생성 시 초점,
		airMode: false,          // 툴바 없이 생성
		fixed: false,            // 높이 고정
		deleteToolbar: false,     // 툴바 가리기
        editable : true // 수정불가
    };

    class EditorControlBase extends Control.Ui.UiControlBase {
        constructor(options = {}) {
			super();
			const This = this;
			This.override();
			This.init(options);
        }
        init(options = {}) {
			const This = this;

            if (!options['container']) {
                throw new Error('EditorControl을 생성하는데 필요한 container 객체가 없습니다.');
            }
			if (!$w['jQuery']) {
				throw new Error('There is no required grid generator.');
			}

            This._container = options['container'];
			This._options = Object.assign({},defaultOption,options.properties,fixedOption,{ callbacks: {} });
			This._box = $w['jQuery'](This._container.find("[editor-box]"));
			This._id = This._container.attr("editor-container");
			This._textarea = This._container.find("textarea").name;
			This._dirName = options['dirName'] ? options['dirName'] : "tempdesc";

			if (!This._box) {
				throw new Error('에디터가 올바르지 않습니다.');
			}
			if (!This._id) {
				throw new Error('에디터 이름이 올바르지 않습니다.');
			};

			// callback 처리
			This._options.callbacks = {
				/*onPaste: paste,*/
				onImageUpload: function() { imageUpload.apply(This,arguments) },
				onMousedown: function() { mousedown.apply(This,arguments) }
			};

			// TODO: 크기 고정 (임시)
			This._options.minHeight = This._options.height;
			This._options.maxHeight = This._options.height * (This._options.fixed ? 1 : 2); //높이 고정이면 원래값, 아닌경우 최대 2배까지 증가가능

			if (This._options.editable === false || This._options.deleteToolbar) { //toolbar X
				This._options.toolbar = [];
			};

			This._box.summernote(This._options); // 에디터 생성

			if (This._options.editable === false) {
				This._box.summernote("disable");
			};

			const imageUpload = (files) => {
				const _This = this;
				if (_This._options.editable === false) {
					return false;
				}
				;
				const acceptType = ["image/jpg", "image/png", "image/jpeg"];
				let index = -1;

				while (++index < files.length) {
					if (This._options.uploadImageOnly && !acceptType.includes(files[index].type)) {
						throw new Error(acceptType.join(", ") + 'upload 형식이 올바르지 않습니다.');
						continue;
					}

					let formData = new FormData();
					formData.enctype = "multipart/form-data";
					formData.append("file", files[index]);
					formData.append("dirName",This._dirName);

					Base.Fetch.post("/common/uploadEditorImage.action", formData, {contentType: "multipart/form-data"}).then(function (fileUrl) {
						if (!fileUrl) return;
						let appendTag = document.createElement('div');
						let img = document.createElement('IMG');
						img.setAttribute("src",fileUrl);
						img.setAttribute("onerror","this.onerror=null; this.src='/common/image/noimg.jpg'");
						appendTag.append(img);
						_This._box.summernote("pasteHTML", $w['jQuery'](appendTag).html());
					}).catch(function () {
						alert("이미지 업로드 시 오류가 발생하였습니다.");
					});
				}
			}
			const mousedown = (e) => {
				const _This = this;
				if ( _This._options.editable === false && e.target.nodeName === "IMG") {
					Appl.Popup.imageOpen(_This, e.target.src);
				} else {
					return;
				}
			}
        }
		override() {
			const summernoteOverride = () => {
				/**
				 * open source 오류 로 인한 override
				 * @todo - 추후 summernote 개선될 시 삭제
				 */
				const $dom = $w['jQuery'].summernote.dom;
				$dom.walkPoint = (function(_super) {
					return function(startPoint, endPoint, handler, isSkipInnerOffset) {
						let point = startPoint;
						while (point) {
							handler(point);
							if ($dom.isSamePoint(point, endPoint)) {
								break;
							};

							let isSkipOffset = isSkipInnerOffset && startPoint.node !== point.node && endPoint.node !== point.node;
							point = nextPointWithEmptyNode(point, isSkipOffset);
						};
					};
				})($dom.walkPoint);
			};
			const nextPointWithEmptyNode = (point, isSkipInnerOffset) => {
				const $dom = $w['jQuery'].summernote.dom;
				let node, offset;

				if ($dom.nodeLength(point.node) === point.offset) {
					if ($dom.isEditable(point.node)) {
						return null;
					};

					let nextTextNode = getNextTextNode(point.node, $dom);

					if (nextTextNode) {
						node = nextTextNode;
						offset = 0;
					} else {
						node = point.node.parentNode;
						offset = $dom.position(point.node) + 1;
					}; // if next node is editable, return current node's sibling node.

					if ($dom.isEditable(node)) {
						node = point.node.nextSibling;
						offset = 0;
					};
				} else if ($dom.hasChildren(point.node)) {
					node = point.node.childNodes[point.offset];
					offset = 0;

				} else {
					node = point.node;
					offset = isSkipInnerOffset ? $dom.nodeLength(point.node) : point.offset + 1;

				};

				return {
					node: node,
					offset: offset
				};
			};
			const getNextTextNode = (actual, $dom) => {
				if (!actual.nextSibling) {
					return undefined;
				};
				if (actual.parent !== actual.nextSibling.parent) {
					return undefined;
				};
				if ($dom.isText(actual.nextSibling)) {
					return actual.nextSibling;
				};
				return getNextTextNode(actual.nextSibling, $dom);
			};

			this._overrideInit = false;
			if(!this._overrideInit) {
				summernoteOverride();
				this._overrideInit = true;
			}
		}
		getId(){
			return this._id;
		}
		remove() {
			this._box.summernote("destroy");
		}
		setEditable(isEdit){
			this._box.summernote(isEdit ? "enable" : "disable");
		}
		reset(){
			this._box.summernote("reset");
			if(!this._textarea) {
				this.getContainer().find("textarea[name='" + this._textarea + "']").value = "";
			} else {
				this.getContainer().find("textarea")[0].value = "";
			}
		}
		focus(){
			this._box.summernote("focus");
		}
		isEmpty(){
			return this._box.summernote("isEmpty");
		}
		insertText(txt){
			if (!txt) return;
			this._box.summernote("insertText", txt);
		}
		pasteHTML(html){
			if (!html) return;
			this._box.summernote("pasteHTML", html);
		}
		val(){
			return this._box.summernote("code");
		}
		getLastRange(){
			return this._box.summernote('editor.getLastRange');
		}
    }

    Base.extends(Base.Control.Ui.EditorControl, {
		createControl : function(clazz) {
            return Base.Core.module(clazz, new EditorControlBase(clazz), Control.Ui.EditorControl.className);
		},
	});

}) (window, __DOMAIN_NAME||'');