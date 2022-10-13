/* common.es6.base.control.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/10/05
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base      = $w[root];
    const Control   = {
        
    };

    Base.extends(Base.Control, Control);

}) (window, __DOMAIN_NAME||'');