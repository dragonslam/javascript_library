/* biz.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/19
*/
(function($w, root) {
	'use strict';
	
	if (!!!$w) return;
	if (!!!$w[root]) return;
	
	const Base = $w[root];
	const Appl = Base.Core.namespace('biz');
	
	Appl.const = {};
	Appl.configuration = {
		isStatusSave: true,
		ajaxOptions	: {type: 'post', dataType: 'json', useMask: true, async: true, cache: false},
		sessionCache: {type:'cache', span:30, format:'s'},
		localCache	: {type:'local', span:3 , format:'h'},
		calendar	: {
			min_year: -5,
			max_year:  5,
			format	: 'yyyy.MM.dd'
		},
	};

	const elements		= {
		container		: {selecter : 'body'},
		elementList		: {
			'header'	: {selecter : 'h1'				},
			'contents'	: {selecter : '#profileBox'		},
		}
	};
	const transactions = {		
	};
	
	Appl.init	= function() {
		Base.logging(this, `init()`);
		if (!!this.isInit) return this;
		Base.Control.Page.createControl(this, PageControlPrototype).init({
			cacheOption : Appl.configuration.sessionCache,
			elements	: elements,
			transactions: transactions
		});
		this.isInit = true;
		return this;
	};


	/** Page Control이 화면에 표시된 후 초기 작업을 재정의. */
	const PageControlPrototype = {
		onLoadPage : function() {
			Base.tracking(`${this.classPath}.onLoadPage()`, this);
			const This = this;
			const Elem = This.getElements();
		},
	};
	
}) (window, __DOMAIN_NAME||'');
