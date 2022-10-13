/* biz.part.module.profile.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/22
*/
(function($w, root) {
  if (!!!$w) return;
  if (!!!$w[root]) return;

  const Base  = $w[root];
  const Appl  = Base.Core.namespace('biz');
  const Part  = Base.Core.namespace('biz.part');
  const Page  = Base.Core.namespace('biz.part.profile');
  const Module= Base.Core.pageModule(Page);

  const elements = {
    'container'   : {selecter : '#profileBox'},
    'profileImg'  : {selecter : '#profileImg' , events:[{'on':'click'}]},
    'profileName' : {selecter : '#profileName', events:[{'on':'click', callback:'click_profileName'}]},
    'profileLoc'  : {selecter : '#profileLocation'},
    'profileFlow' : {selecter : '#profileFollowers'},
    'profileRepo' : {selecter : '#publicRepos'},
    'profileLink' : {selecter : '#profileLink'},
    'packageRst'  : {selecter : '#packageResult'},
  };
  const transactions = {
    context : 'commonES6',
    tranList: {
      'TRAN_TEST'  : {method:'GET', datatype:'JSON', endpoint:'package.json', render:'show_package' },
      'TRAN_TEST2' : {method:'GET', datatype:'JSON', endpoint:'package.json', render:'show_package2', isUseCache:false},
      'TRAN_TEST3' : {method:'GET', datatype:'JSON', endpoint:'package.json', render:'show_package,show_package2' },
      'GIT_PROFILE': {method:'GET', datatype:'JSON', endpoint:'https://api.github.com/users/dragonslam', render:'show_profile', isUseCache:true, cacheOption:{type:'local', span:60, format:'m'}},
    }
  };

  // Page initializ.
  Page.init(() => {    
    // Page module initializ.
    Module.init({
      cacheOption : {span:10, format:'s'},
      elements    : elements,
      transactions: transactions
    })
    .startTransaction({
      /* tranId : {tranParams} */
      'TRAN_TEST'  : {'_d' : Date.now()},
      'TRAN_TEST2' : {},
      'TRAN_TEST3' : {},
      'GIT_PROFILE': {}
    });
  });

  Module.click_profileImg = function(e) {
    Base.logging(this, 'click_profileImg()');
    const This = this;
    const profile = This._data['GIT_PROFILE']||{};
    if (profile['blog']) {
      $w.open(profile['blog']);
    }
  };
  Module.click_profileName = function(e) {
    Base.logging(this, 'click_profileName()');
    const This = this;
    This.startTransaction({'TRAN_TEST3' : {'_test': 'testtest'}});
  };

  Module.show_package = function(data) {
    Base.logging(this, 'show_package()');
    this._elem.packageRst.Text(Base.Utils.jsonToString(data));
  };
  Module.show_package2 = function(data) {
    Base.logging(this, 'show_package2()');
  };
  Module.show_profile = function(data) {
    Base.logging(this, 'show_profile()');
    const This = this;
    const elem = This._elem;
    
    elem.profileName.Text(data['name']||'');
    elem.profileLoc.Text(data['location']||'');
    elem.profileFlow.Text(data['followers']||'');
    elem.profileRepo.Text(data['public_repos']||'');  
    elem.profileImg.Attr('src', data['avatar_url']||'');
    elem.profileLink.Attr('href', data['blog']||'');
    
    Base.logging(This, 'profileNameText : '+ elem.profileName.Text());
    Base.logging(This, 'profileLinkText : '+ elem.profileLink.Text());

    return This;
  };

}) (window, __DOMAIN_NAME||'');