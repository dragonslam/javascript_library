/* biz.part.module.page1.js
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
  const Module= Base.Core.page(Page);

  
  Page.init	= function(module) {
    Base.logging(this, 'init()');
    const This = this;
    Module.init();
    return This;
  };

  Base.extends(Module, {
  
    /*** 개별 Page의 기능을 구현해 보아요. */
    
  });
  
  
}) (window, __DOMAIN_NAME||'');