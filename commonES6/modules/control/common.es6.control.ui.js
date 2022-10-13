/* common.es6.control.ui.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/10/05
*/
(function($w, root = '') {
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Ui    = {

    };

    Base.extends(Base.Control.Ui, Ui);

}) (window, __DOMAIN_NAME||'');