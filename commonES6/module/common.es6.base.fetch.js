/* common.es6.base.fetch.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w) {
    if (!!!$w) return;
    if (!!!$w['$O']) return;

    const Base  = $w['$O'];
    const DEFAULT_HEADER= {}; //{'AJAX_YN' : 'Y'};
    const POST_HEADER   = Object.assign({
        'Content-Type'  : 'application/x-www-form-urlencoded; charset=UTF-8'
    }, DEFAULT_HEADER);

    const _convertRequestQuery= (data={}) => {
        let resArr= [];
        const add = function(key, value){
            resArr.push(String( key ).encode() + '=' + String( !value ? '' : value ).encode() );
        }
        Object.entries(data).forEach(([key, value]) => {
            if (value?.constructor === Array) {
                value.forEach(v => add(key, v));
            } else {
                add(key, value);
            }
        });
        return resArr.join('&');
    };    

    const _convertRequestPost= (data={}, options) => {
        const requestInit = Object.assign({
            headers: POST_HEADER
           ,body   : null
        }, options);

       if (data instanceof Object) {
            data['_'] = Date.now();
            if (requestInit.headers['Content-Type'] == 'application/json'){
                requestInit.body = JSON.stringify(data);
            } else {
                requestInit.body = _convertRequestQuery(data);
            }
        } else if(typeof data === 'string') {
            requestInit.body = data;
        }
        return requestInit;
    };
    
    const _convertResponseData = (response, dataType='text') => {
        return response[(dataType.includes('json') ? 'json' : 'text')]();
    };

    const _fetch = async (requestPath, requestInit) => {
        const response = await $w['fetch'].call($w, requestPath, requestInit);
        if (response.status == 200) {
            const dataType = requestInit.dataType?.toLowerCase() || response.headers.get('content-type') || 'text';
            return _convertResponseData(response, dataType);
        } else {
            response.resultData = await _convertResponseData(response, 'text');
            throw new HttpError(response);
        }
    };

    const FetchHender= {        
        get : async function(url, data={}, options={}) {
            const requestPath = url +(url.includes('?')?'&':'?')+ _convertRequestQuery(Object.assign(data, {'_' : Date.now()}));
            const requestInit = Object.assign({method : 'GET', headers : DEFAULT_HEADER}, options);
            return _fetch(requestPath, requestInit);
        },        
        post: async function(url, data={}, options={}){
            const requestPath = url;
            const requestInit = _convertRequestPost(Object.assign({method : 'POST'}, options), data);
            return _fetch(requestPath, requestInit);
        },
        put : async function(url, data={}, options={}) {
            const requestPath = url;
            const requestInit = _convertRequestPost(Object.assign({method : 'PUT'}, options), data);
            return _fetch(requestPath, requestInit);
        },
        del : async function(url, data={}, options={}) {
            const requestPath = url;
            const requestInit = _convertRequestPost(Object.assign({method : 'DEL'}, options), data);
            return _fetch(requestPath, requestInit);
        },
    };

    class HttpError extends Error {
        constructor(response) {
            let responsObj;
            try {
                responsObj = JSON.parse(response.resultData);
            } catch(e) {
                responsObj = {error_message: "요청을 처리할 수 없습니다"};
            }
    
            super(`${response.status} for ${response.url}`);
            this.name = 'HttpError';
            Object.assign(this, responsObj);
        }
    };
    
    Object.assign(Base.Fetch, FetchHender);

})(window);