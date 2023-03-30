/* biz.part.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/19
*/
(function($w, root) {
	if (!!!$w) return;
	if (!!!$w[root]) return;
	
	const Base = $w[root];
	const Appl = Base.Core.namespace('biz');
	const Part = Base.Core.namespace('biz.part');

	const elements		= {
		container		: {selecter : 'body'},
		elementList		: {
			'header'	: {selecter : 'h1'				},
			'contents'	: {selecter : '#profileBox'		},
		}
	};
	const transactions = {		
	};
	
	Part.init	= function(options) {
		Base.logging(this, `init()`);
		if (!!this.isInit) return This;
		const This = this;
		Base.Control.Page.createControl(Part, PageControlPrototype).init({
			cacheOption : Appl.configuration.sessionCache,
			elements	: elements,
			transactions: transactions
		});
		This.isInit = true;
		return This;
	};

	/** Page Control이 화면에 표시된 후 초기 작업을 재정의. */
	const PageControlPrototype = {
		onLoadPage : function() {
			Base.tracking(`${this.classPath}.onLoadPage()`, this);
			const This = this;
			const Elem = This.getElements();
		},
	};

	/*** Page Group의 공통 기능을 구현해 보아요. */

}) (window, __DOMAIN_NAME||'');