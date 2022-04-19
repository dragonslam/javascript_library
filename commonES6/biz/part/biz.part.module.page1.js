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
  const Page  = Base.Core.namespace('biz.part.page1');
  const Module= Base.Core.module(Page);

  
  Part.init	= function(module) {
    Base.logging(this, 'init()');
    const This = this;
    Module.init();
    return This;
  };

  Module.init = function() {
    Base.logging(this, 'init()');
    const This = this;

    return This;
  };
}) (window, __DOMAIN_NAME);