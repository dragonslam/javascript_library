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
  const Module= Base.Core.page(Page);

  
  Page.init	= function(module) {
    Base.logging(this, 'init()');

    Module.init();
    return this;
  };

  Module.init = function() {
    Base.logging(this, 'init()');
    Base.tracking('>> Page Module :: ', this);

    const This = this;
    This._data = {};
    This._elem = {
      container   : $O('#profileBox'),
      profileImg  : $O('#profileImg'),
      profileName : $O('#profileName'),
      profileLoc  : $O('#profileLocation'),
      profileFlow : $O('#profileFollowers'),
      profileRepo : $O('#publicRepos'),
      profileLink : $O('#profileLink'),
    };      
    
    This.initEventListner()
        .initTransaction();
    return This;
  };
  Module.initEventListner = function() {
    Base.logging(this, 'initEventListner()');

    const This = this;
    This._elem.profileImg.Bind('click', function() {
      if (This.isTran && This._data['profile']['blog']) {
        $w.open(This._data['profile']['blog']);
      }
    });
    This.isInit = true;
    return This;
  };
  Module.initTransaction = function() {
    Base.logging(this, 'initTransaction()');
    const This = this;

    This._data['profile'] = {};
    Base.Fetch.get('https://api.github.com/users/dragonslam')
        .then(function(json) {
          This._data['profile'] = json;
          This.isTran = true;
          This.pageShow();            
        });
    return This;
  };
  Module.pageShow = function() {
    Base.logging(this, 'pageShow()');
    const This = this;
    const _elem= This._elem;
    const _data= This._data.profile;
    
    _elem.profileName.Text(_data['name']||'');
    _elem.profileLoc.Text(_data['location']||'');
    _elem.profileFlow.Text(_data['followers']||'');
    _elem.profileRepo.Text(_data['public_repos']||'');  
    _elem.profileImg.Attr('src', _data['avatar_url']||'');
    _elem.profileLink.Attr('href', _data['blog']||'');
    
    Base.logging($O, '>> profileNameText : '+ _elem.profileName.Text());
    Base.logging($O, '>> profileLinkText : '+ _elem.profileLink.Text());

    return This;
  };
  
}) (window, __DOMAIN_NAME||'');