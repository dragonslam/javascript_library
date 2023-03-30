/** common.base.control.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];

    /**
     * Default implementation of control.
     * @param {*} element 
     */
    const Control = Base.Control;

    /**
     * HashNumber used to generate a default prime number. 
     */
    Control.HashNumber = 0x5F5E0E3;

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

    const ControlContext = {
        controlNumber : 0,
        getControlNumber : function() {
          return ++ControlContext.controlNumber;
        }
    };

    class ControlBase {
      constructor(parent) {
          this._parent    = parent;
          this._container = null;
          this._elements  = null;
          this._isInit    = false;
          this._isDebug   = !!Base['isDebug'];
          this._id        = '';
          this._template  = '';
          this._data      = {};
          this._controlNum= ControlContext.getControlNumber();
      }
      getId() {
          return this._id||'';
      }
      setId(id) {
          this._id = id;
      }
      getHashNumber(str, length = 10) {
        return String(Base.Utils.hashing(str, Control.HashNumber)).digits(length);
      }
      getContainer(idx) {
          if (this._container && this._container instanceof NodeList && typeof idx == 'number') {
            return this._container[idx];
          }
          return this._container;
      }
      setContainer(container) {
          this._container = container;
      }
      getParent() {
          return this._parent;
      }
      setParent(parent) {
          this._parent = parent;
      }
      getElements() {
          return this._elements;
      }
      setElements(elements) {
          this._elements = elements;
      }
      bind(name, callback, isExtend = true) {
          if (!name || !callback) return;
          const This = this;       
          const Befor= This[name]; 
          This[name] = (...args)=>{
              if (Base.isFunction(Befor)) Befor?.apply(This, args);
              if (Base.isFunction(callback)) callback.apply(This, args);
          }
          if (This._parent && isExtend) {
              const Asis= This._parent[name];
              This._parent[name] = (...args)=>{
                  if (Base.isFunction(Asis)) Asis?.apply(This._parent, args);
                  This[name].apply(This, args);
              }
          }
      }
    }

    Control.ControlBase = ControlBase;

}) (window, __DOMAIN_NAME||'');