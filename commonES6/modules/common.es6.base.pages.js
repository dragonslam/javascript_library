/* common.es6.base.pages.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const Pages= {
		_data	: {},
		_elem	: {},
		isInit	: false,
		isTran	: false,
		isHelper: !!Base.global['is_debug'],
		init 	: function() {
			Base.logging(this, 'init()');
			this.initEventListner()
				.initTransaction()
				.pageBeforeShow()
				.pageShow();
			return this;
		},
        initEventListner : function() {
			Base.logging(this, 'initEventListner()');
			this.isInit = true;
			return this;
		},
		initTransaction : function() {
			Base.logging(this, 'initTransaction()');
			this.isTran = true;
			return this;
		},
		pageBeforeShow : function() {
			Base.logging(this, 'pageBeforeShow()');
			return this;
		},
		pageShow : function() {
			Base.logging(this, 'pageShow()');
			return this;
		},
	};   
    
    Base.extends(Base.Pages, Pages);

}) (window, __DOMAIN_NAME||'');