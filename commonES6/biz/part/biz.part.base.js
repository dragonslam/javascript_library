/* es6.biz.base.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/19
*/
(function($w, root) {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Appl  = Base.Core.namespace('biz');
    const Part  = Base.Core.namespace('biz.part');
  
    Part.init	= function(module) {
		Base.logging(this, 'init()');
		const This = this;
		const path = String('biz/part/{0}.module.{1}').format(This.getClassPath(), module);
        
		Base.Core.loader(path).then(function(...args) {
            Base.Core.get(This.classPath, module).init();
		});

		return This;
	};

}) (window, __DOMAIN_NAME);