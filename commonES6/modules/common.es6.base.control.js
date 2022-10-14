/* common.es6.base.control.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/10/05
*/
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
	const Utils= Base.Utils;
	const Fetch= Base.Fetch;
    
    /**
     * Default implementation of control.
     * @param {*} element 
     */
    const Control = {};

    /**
     * Common events fired by controls so that event propagation is useful.  Not
     * all controls are expected to dispatch or listen for all event types.
     * Events dispatched before a state transition should be cancelable to prevent
     * the corresponding state change.
     * @enum {string}
     */
    Control.EventType = {
        BEFORE_SHOW: 'beforeshow',
        SHOW: 'show',
        HIDE: 'hide',
        DISABLE: 'disable',
        ENABLE: 'enable',
        HIGHLIGHT: 'highlight',
        UNHIGHLIGHT: 'unhighlight',
        ACTIVATE: 'activate',
        DEACTIVATE: 'deactivate',
        SELECT: 'select',
        UNSELECT: 'unselect',
        CHECK: 'check',
        UNCHECK: 'uncheck',
        FOCUS: 'focus',
        BLUR: 'blur',
        OPEN: 'open',
        CLOSE: 'close',
        ENTER: 'enter',
        LEAVE: 'leave',
        ACTION: 'action',
        CHANGE: 'change'
    };
    /**
     * Errors thrown by the control.
     */
    Control.Error = {
        NOT_SUPPORTED: 'Method not supported',
        DECORATE_INVALID: 'Invalid element to decorate',
        ALREADY_RENDERED: 'Control already rendered',
        PARENT_UNABLE_TO_BE_SET: 'Unable to set parent control',
        CHILD_INDEX_OUT_OF_BOUNDS: 'Child control index out of bounds',
        NOT_OUR_CHILD: 'Child is not in parent control',
        NOT_IN_DOCUMENT: 'Operation not supported while control is not in document',
        STATE_INVALID: 'Invalid control state'
    };
    /**
     * Common control states.  controls may have distinct appearance depending
     * on what state(s) apply to them.  Not all controls are expected to support
     * all states.
     */
    Control.State = {
        ALL: 0xFF,
        DISABLED: 0x01,
        HOVER: 0x02,
        ACTIVE: 0x04,
        SELECTED: 0x08,
        CHECKED: 0x10,
        FOCUSED: 0x20,
        OPENED: 0x40
    };
    /** 
     * Static helper method; returns the type of event controls are expected to
     * dispatch when transitioning to or from the given state. 
     * */
    Control.getStateTransitionEvent = function(state, isEntering) {
        switch (state) {
          case Control.State.DISABLED:
            return isEntering ? Control.EventType.DISABLE : Control.EventType.ENABLE;
          case Control.State.HOVER:
            return isEntering ? Control.EventType.HIGHLIGHT : Control.EventType.UNHIGHLIGHT;
          case Control.State.ACTIVE:
            return isEntering ? Control.EventType.ACTIVATE : Control.EventType.DEACTIVATE;
          case Control.State.SELECTED:
            return isEntering ? Control.EventType.SELECT : Control.EventType.UNSELECT;
          case Control.State.CHECKED:
            return isEntering ? Control.EventType.CHECK : Control.EventType.UNCHECK;
          case Control.State.FOCUSED:
            return isEntering ? Control.EventType.FOCUS : Control.EventType.BLUR;
          case Control.State.OPENED:
            return isEntering ? Control.EventType.OPEN : Control.EventType.CLOSE;
          default:
            // Fall through.
        }
      
        // Invalid state.
        throw new Error(Control.Error.STATE_INVALID);
    };

    Control.ControlBase = function(element) {
        this.element    = element||undefined;
        this.isDocument = false;
        this.id         = null;
        this.dom        = null;
        this.model      = null;
        this.parent     = null;
        this.children   = null;
        this.template   = null;
    };
    Control.ControlBase.prototype= {
        getId : function() {
            return this.id||'';
        },
        setId : function(id) {
            this.id = id;
        },
        getElement : function() {
            return this.element;
        },
        setElement : function(element) {
            this.element = element;
        },
        getDom : function() {
            return this.dom;
        },
    };

    Base.extends(Base.Control, Control);

}) (window, __DOMAIN_NAME||'');