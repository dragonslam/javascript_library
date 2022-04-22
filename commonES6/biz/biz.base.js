/* biz.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/19
*/
(function($w, root) {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Appl  = Base.Core.namespace('biz');
    const Module= Base.Core.module(Appl);

    Appl.configuration = {
		isStatusSave: true,
        ajaxOptions	: {
			type	: 'post',
			dataType: 'json',
			useMask	: true,
			async	: true,
			cache	: false
		},
		cacheOptions: {
			type	: 'session',
			format	: 's'
		},
    };
    Appl.init	= function(options) {
		Base.logging(this, 'init()');
		const This = this;
		
		This.setSetting(options||{});
		This.cache= Base.Util.cache( Object.assign({prifix:This.classPrifix, span:30, format:'m'}, Base.Util.clone(Appl.configuration.cacheOptions)) );
		Module.init();

		return This;
	};
	Appl.isInit = function() {
		return Module['isInit'];
	};
    Appl.setSetting= function(options) {
		Base.logging(this,'setSetting()');
		Base.tracking('Module.setSetting()-> AS-IS', Module.options);
		Module.options= Object.assign(Module.options||{}, options||{});
		Base.tracking('Module.setSetting()-> TO-BE', Module.options);
		return this;
	};
	Appl.getSetting= function() {
		Base.logging(this,'getSetting()');		
		return Module.options;
	};


    Module.options	= {
        pageType	: ''
       ,menuType	: ''
    };
    Module.init= function() {
		Base.logging(this, 'init()');		
		let This = this;
		This.cache= Base.Util.cache( Object.assign({prifix:This.classPrifix, span:30, format:'m'}, Base.Util.clone(Appl.configuration.cacheOptions)) );
		This.cont = {
			 oContainer 	: $O('#wrap')
			,oNavigation	: $O('#wrap .gnb .navi .navi_box')
		};
		
		This.initEventListner();

		
		Base.logging(This, 'initialize completed.');010
		return This;
	};
	Module.initEventListner= function() {
		Base.logging(this, 'initEventListner()');
		let This = this;

		return This;
	};


	Appl.init();
	
}) (window, __DOMAIN_NAME||'');