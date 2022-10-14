/* common.es6.control.ui.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/10/05
*/
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base   = $w[root];
    const Utils  = Base.Utils;
	const Fetch  = Base.Fetch;
    const Control= Base.Control;

    const UiControl = Base.Core.inherits(function() {}, Control.ControlBase);

    Base.extends(Base.Control.Ui, UiControl);

}) (window, __DOMAIN_NAME||'');