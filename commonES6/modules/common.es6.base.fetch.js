/* common.es6.base.fetch.js
 	writ by yi seung-yong(dragonslam@nate.com)
 	date, 2022/04/18
*/
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];    
    const DEFAULT_HEADER= {}; //{'AJAX_YN' : 'Y'};
    const POST_HEADER   = Base.extends({
        'Content-Type'  : 'application/x-www-form-urlencoded; charset=UTF-8'
    }, DEFAULT_HEADER);
    const FETCH_RATE    = {
        timeout : 3000,
        warning : 300,
        policy  : '',
        timeout_message : 'Fetch timeout',
        warning_message : 'Fetch to slow'
    };
    const FETCH_PROCESS = {};
    class HttpError extends Error {
        constructor(response) {
            let responsObj;
            try {
                responsObj = JSON.parse(response.resultData);
            } catch(e) {
                responsObj = {error_message: 'The request could not be processed.'};
            }
    
            super(`${response.status} for ${response.url}`);
            this.name = 'HttpError';
            Base.extends(this, responsObj);
        }
    };

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
        const requestInit = Base.extends({
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

    const _timeout = async function() {
        return new Promise((_, reject) => {
            $w.setTimeout(() => {
              reject(Error(FETCH_RATE.timeout_message));
            }, FETCH_RATE.timeout);
          });
    };
    const _warning = async function() {
        return new Promise((_, reject) => {
            $w.setTimeout(() => {
              reject(Error(FETCH_RATE.warning_message));
            }, FETCH_RATE.warning);
          });
    };
    const _fetch = async function(requestPath, requestInit) {
        let _dataPath= String(requestPath).encode(),
            _process = {};
        if(!FETCH_PROCESS[_dataPath]) {
            _process = {
                isRunning   : true,
                sendCount   : 1,
                completeCnt : 0,
                dataPath    : _dataPath,
                dataType    : requestInit.dataType?.toLowerCase() || '',
                errorCnt    : 0,
                requestStart: (new Date()).getTime(),
                responseDone: 0,
                requestPath : requestPath,
                requestInit : requestInit,
            };
            FETCH_PROCESS[_dataPath] = _process;
        }
        else {
            _process = FETCH_PROCESS[_dataPath];
            _process.isRunning   = true;
            _process.sendCount++;
        }
        const response  = await $w['fetch'].call($w, requestPath, requestInit);
        if (response.status == 200) {
            _process.isRunning   = false;
            _process.dataType    = _process.dataType || response.headers.get('content-type') || 'text'
            _process.responseDone= (new Date()).getTime();
            _process.completeCnt++;
            if (_process.responseDone - _process.requestStart > FETCH_RATE.timeout) {
                Base.wtf(`>> ${FETCH_RATE.timeout_message} >> ${requestPath}`, _process);
            } 
            else if (_process.responseDone - _process.requestStart > FETCH_RATE.warning) {
                Base.wtf(`>> ${FETCH_RATE.warning_message} >> ${requestPath}`, _process);
            } 
            return _convertResponseData(response, _process.dataType);
        } else {
            _process.isRunning   = false;
            _process.errorCnt++;
            response.resultData = await _convertResponseData(response, 'text');
            throw new HttpError(response);
        }
    };
    const _fetchWithTimeout  = async function(requestPath, requestInit) {
        return Promise.race([_fetch(requestPath, requestInit), _warning(), _timeout()]);
    };

    const FetchHender= {        
        get : async function(url, data={}, options={}) {
            const requestPath = url +(url.includes('?')?'&':'?')+ _convertRequestQuery(Base.extends(data, {'_' : Date.now()}));
            const requestInit = Base.extends({method : 'GET', headers : DEFAULT_HEADER}, options);
            return _fetch(requestPath, requestInit);
        },
        post: async function(url, data={}, options={}) {
            const requestPath = url;
            const requestInit = _convertRequestPost(Base.extends({method : 'POST'},options), data);
            return _fetch(requestPath, requestInit);
        },
        put : async function(url, data={}, options={}) {
            const requestPath = url;
            const requestInit = _convertRequestPost(Base.extends({method : 'PUT'}, options), data);
            return _fetch(requestPath, requestInit);
        },
        del : async function(url, data={}, options={}) {
            const requestPath = url;
            const requestInit = _convertRequestPost(Base.extends({method : 'DEL'}, options), data);
            return _fetch(requestPath, requestInit);
        },
    };
    
    Base.extends(Base.Fetch, FetchHender);

}) (window, __DOMAIN_NAME||'');