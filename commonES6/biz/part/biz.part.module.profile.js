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
      packageRst  : $O('#packageResult'),
    };
    This._cache	= Base.Util.cache( {prifix:This.classPrifix, span:10, format:'m'} );
    
    This.initEventListner()
        .initTransaction('commonES6', {
          TRAN_TEST : {method:'GET', endpoint:'package.json' ,render:'packageRender' }
        })
        .startTransaction();
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
  Module.startTransaction = function() {
    Base.logging(this, 'startTransaction()');
    const This = this;

    This._data['profile'] = {};
    Base.Fetch.get('https://api.github.com/users/dragonslam')
        .then(function(json) {
          This._data['profile'] = json;
          This.pageShow(json);            
        });

    This._runTransaction('TRAN_TEST', {'_d' : Date.now()});
    return This;
  };
  Module.pageShow = function(data) {
    Base.logging(this, 'pageShow()');
    const This = this;
    const _elem= This._elem;
    
    _elem.profileName.Text(data['name']||'');
    _elem.profileLoc.Text(data['location']||'');
    _elem.profileFlow.Text(data['followers']||'');
    _elem.profileRepo.Text(data['public_repos']||'');  
    _elem.profileImg.Attr('src', data['avatar_url']||'');
    _elem.profileLink.Attr('href', data['blog']||'');
    
    Base.logging($O, '>> profileNameText : '+ _elem.profileName.Text());
    Base.logging($O, '>> profileLinkText : '+ _elem.profileLink.Text());

    return This;
  };
  Module.packageRender = function(data) {
    Base.logging(this, 'packageRender()');
    const This = this;
    const _elem= This._elem;

    _elem.packageRst.Text(Base.Util.jsonToString(data));
  };
  
}) (window, __DOMAIN_NAME||'');