/* biz.part.module.profile.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/22
*/
(function($w, root) {
  'use strict';

  if (!!!$w) return;
  if (!!!$w[root]) return;

  const Base = $w[root];
  const Appl = Base.Core.namespace('biz');
  const Part = Base.Core.namespace('biz.part');
  const Page = Base.Core.namespace('biz.part.profile'); 

  const elements = {
		container		: {selecter : 'body'},
		elementList	: {
      'profileImg'  : {selecter : '#profileImg' , events:[{'on':'click'}]},
      'profileName' : {selecter : '#profileName', events:[{'on':'click', callback:'click_profileName'}]},
      'profileLoc'  : {selecter : '#profileLocation'},
      'profileFlow' : {selecter : '#profileFollowers'},
      'profileRepo' : {selecter : '#publicRepos'},
      'profileLink' : {selecter : '#profileLink'},
      'packageRst'  : {selecter : '#packageResult'},
		}
  };
  const transactions = {
    'TRAN_TEST'  : {method:'GET', datatype:'JSON', endpoint:'commonES6/package.json', callback:'show_package' },
    'TRAN_TEST2' : {method:'GET', datatype:'JSON', endpoint:'commonES6/package.json', callback:'show_package2', isUseCache:true},
    'TRAN_TEST3' : {method:'GET', datatype:'JSON', endpoint:'commonES6/package.json', callback:'show_package,show_package2' },
    'GIT_PROFILE': {method:'GET', datatype:'JSON', endpoint:'https://api.github.com/users/dragonslam', callback:'show_profile', isUseCache:true, cacheOption:{type:'local', span:60, format:'m'}},
  };

  // Page initializ.
  Page.init	= function() {
    Base.logging(this, `init()`);
    if (!!this.isInit) return this;
    Base.Control.Page.createControl(this, PageControlPrototype).init({
      cacheOption : Appl.configuration.sessionCache,
      elements	: elements,
      transactions: transactions
    });
    this.isInit = true;
    return this;
  };

  /** Page Control이 화면에 표시된 후 초기 작업을 재정의. */
  const PageControlPrototype = {
    onLoadPage : function() {
      Base.tracking(`${this.classPath}.onLoadPage()`, this);
      const This = this;
      This.startTransaction({
          /* tranId : {tranParams} */
          'TRAN_TEST'  : {'_d' : Date.now()},
          'TRAN_TEST2' : {},
          'TRAN_TEST3' : {},
          'GIT_PROFILE': {}
      });
    },
    click_profileImg  : function(e) {
      Base.logging(this, 'click_profileImg()');
      const This = this;
      const profile = This._data['GIT_PROFILE']||{};
      if (profile['blog']) {
        $w.open(profile['blog']);
      }
    },
    click_profileName : function(e) {
      Base.logging(this, 'click_profileName()');
      const This = this;
      This.startTransaction({'TRAN_TEST3' : {'_test': 'testtest'}});
    },
  
    show_package  : function(data) {
      Base.logging(this, 'show_package()');
      this._elements?.packageRst?.text_(Base.Utils.jsonToString(data));
    },
    show_package2 : function(data) {
      Base.logging(this, 'show_package2()');
    },
    show_profile  : function(data) {
      Base.logging(this, 'show_profile()');
      const This = this;
      const elem = This._elements;
      
      elem.profileName?.text_(data['name']||'');
      elem.profileLoc?.text_(data['location']||'');
      elem.profileFlow?.text_(data['followers']||'');
      elem.profileRepo?.text_(data['public_repos']||'');  
      elem.profileImg?.attr('src', data['avatar_url']||'');
      elem.profileLink?.attr('href', data['blog']||'');
      
      Base.logging(This, 'profileNameText : '+ elem.profileName.text_());
      Base.logging(This, 'profileLinkText : '+ elem.profileLink.text_());
  
      return This;
    },
  };

}) (window, __DOMAIN_NAME||'');