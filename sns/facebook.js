// sns.js
// need snsSettings
if (typeof console == "undefined") {    
	window.logStack = new Array();
	window.console = {
		"log": function (s) {
			logStack.push(s);
		}
	}
}

window.snsService = {
	//----------------------------------------------------------------------
	// Facebook 
	//----------------------------------------------------------------------
	"FacebookInit": function (settings, callback) {
		window.fbAsyncInit = function () {
			if (typeof FB == 'undefined') {
				setTimeout(function () {
					console.log("FB is not defined. Retrying.")
					snsService.FacebookInit(settings, callback);
				}, 1000);
			}
			else {
				// init the FB JS SDK
				FB.init({
					appId: settings.FACEBOOK_APP_ID, // App ID from the App Dashboard
					channelUrl: '//' + settings.GSocialUrl + '/channel.html', // Channel File for x-domain communication
					status: true, // check the login status upon init?
					cookie: true, // set sessions cookies to allow your server to access the session?
					xfbml: true  // parse XFBML tags on this page?
				});

				// Additional initialization code such as adding Event Listeners goes here		
				FB.getLoginStatus(function (response) {
					if (callback)
						callback(response);
				});
			}
		}

		// Load the SDK's source Asynchronously
		// Note that the debug version is being actively developed and might 
		// contain some type checks that are overly strict. 
		// Please report such bugs using the bugs tool.
		(function (d, debug) {
			var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
			if (d.getElementById(id)) { return; }
			js = d.createElement('script'); js.id = id; js.async = true;
			js.src = "//connect.facebook.net/ko_KR/all" + (debug ? "/debug" : "") + ".js";
			ref.parentNode.insertBefore(js, ref);
		} (document, /*debug*/false));
	}
	, "FacebookLogin": function (settings, callback) {
		FB.login(function (response) {
			if (response.authResponse) {
				var authResponse = response.authResponse;
				FB.api('/me', function (response) {
					var authResult = $.extend({}, authResponse, response);
					callback(authResult);
				});
			} else {
				console.log('FB login cancelled');
			}
		});
	}
	, "FacebookFriends": function (settings, callback) {
		FB.api('/me/friends', function (response) {
			if (response.data) {
				callback(response.data);
			}
			else {
				console.log('FB error get friends');
			}
		});
	}
	, "FacebookPostMessage": function (settings, to, link, pictureUrl, name, caption, description, redirect_uri, callback) {
		var obj = {
			method: 'feed',
			name: name,
			to: to,
			link: link,
			picture: pictureUrl,
			caption: caption,
			description: description
			//redirect_uri: redirect_uri // redirect_url 이 있으면 안됨....
		};

		FB.ui(obj, callback);
	}
	//----------------------------------------------------------------------
	// Planet X Cyworld
	//----------------------------------------------------------------------	
	// It has moved to server side.
	//----------------------------------------------------------------------
	// Twitter
	//----------------------------------------------------------------------
	, "TwitterShare": function (settings, url, text, callback) {		
		$.popup(settings.TWITTER_SHARE_URL + '?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), 600, 400);		
	}		
	//----------------------------------------------------------------------
	// Me2Day
	//----------------------------------------------------------------------
	, "Me2DayLogin": function (settings) {
		ajaxService.Post(settings.GetMe2DayAuthUrl
			, {}
			, function (model) {
				$.popup(model.AuthUrl, 1024, 800);
			});
	}
	//----------------------------------------------------------------------
	// Yozm
	//----------------------------------------------------------------------
	, "YozmPostMessage": function (settings, link, prefix) {
		$.popup(settings.YozmPostUrl + "?link=" + encodeURIComponent(link) + "&prefix=" + encodeURIComponent(prefix) + "&source_id=none", 800, 600);
	}
	//----------------------------------------------------------------------
	// MyPeople
	//----------------------------------------------------------------------
	, "MyPeopleShare": function (settings, link, prefix) {
		$.popup(settings.MyPeopleShareUrl + "?link=" + encodeURIComponent(link) + "&prefix=" + encodeURIComponent(prefix) + "&source_id=none", 800, 600);
	}
}