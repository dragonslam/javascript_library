/* biz.part.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/19
*/
(function($w, root) {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Appl  = Base.Core.namespace('biz');
    const Part  = Base.Core.namespace('biz.part');
	const Module= Base.Core.module(Part);
  
    Part.init	= function(module) {
		Base.logging(this, 'init()');
		const This = this;
		const path = String('biz/part/{0}.module.{1}').format(This.getClassPath(), module);
        
		Base.Core.loader(path).then(function(...args) {
            Base.Core.get(This.classPath, module).init();
		});

		Module.init();

		return This;
	};

	Module.init = function() {
		Base.logging(this, 'init()');
		const This = this;
	
		Base.tracking('>> Page Module :: ', this);
	
		return This;
	};

	/*** Page Group의 공통 기능을 구현해 보아요. */

}) (window, __DOMAIN_NAME||'');