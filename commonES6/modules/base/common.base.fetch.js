/** common.base.fetch.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;


    let isMainRedirctError = false;
    const Base = $w[root];
    const OPTIONAL_HEADER={};
    const DEFAULT_HEADER= {};
    const JSON_CONTENTS = 'application/json';
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
    const FETCHS = {};
    class FetchProcess {
        constructor(requestPath, requestInit) {
            this.isRunning   = false;
            this.sendCount   = 0;
            this.completeCnt = 0;
            this.errorCnt    = 0;
            this.requestStart= 0;
            this.responseDone= 0;
            this.callTimeouts= [];
            this.requestPath = requestPath;
            this.requestInit = requestInit;
            this.dataType    = requestInit.dataType?.toLowerCase() || '';
        }
        run() {
            this.isRunning   = true;
            this.requestStart= (new Date()).getTime();
            this.sendCount++;
            if (Base.Fetch?.events?.onBeforeFetchLoad) {
                Base.Fetch?.events?.onBeforeFetchLoad(this.requestPath);
            }
            return this;
        }
        complete(response) {
            this.isRunning   = false;
            this.responseDone= (new Date()).getTime();
            this.timeout     = this.responseDone - this.requestStart;
            this.callTimeouts.push(this.timeout);
            this.completeCnt++;
            if (this.timeout > FETCH_RATE.timeout) {
                Base.wtf(`>> ${FETCH_RATE.timeout_message}(${this.timeout.toComma()}ms) >> ${this.requestPath}`, this);
            }
            else if (this.timeout > FETCH_RATE.warning) {
                //Base.wtf(`>> ${FETCH_RATE.warning_message}(${this.timeout.toComma()}ms) >> ${this.requestPath}`, this);
            }
            if (Base.Fetch?.events?.onAfterFetchLoad) {
                Base.Fetch?.events?.onAfterFetchLoad(this.requestPath, (this.timeout > 500 ? 0 : 500-this.timeout));
            }
        }
        error(response) {
            this.isRunning   = false;
            this.responseDone= (new Date()).getTime();
            this.timeout     = this.responseDone - this.requestStart;
            this.callTimeouts.push(this.timeout);
            this.errorCnt++;
            if (Base.Fetch?.events?.onAfterFetchLoad) {
                Base.Fetch?.events?.onAfterFetchLoad(this.requestPath, (this.timeout > 500 ? 0 : 500-this.timeout));
            }
        }
    }
    class HttpError extends Error {
        constructor(response) {
            let responsObj;
            try {
                responsObj = JSON.parse(response.resultData);
            } catch(e) {
                responsObj = {errorMessage: '일시적인 장애로 서비스가 일시 중단 되었습니다.'};
                if(response?.status){
                    responsObj.status = response.status;
                }
            }

            super(`${response.status} for ${response.url}`);
            this.name = 'HttpError';
            Base.extends(this, responsObj);
        }
    };
    //fetch에 catch가 없을경우 공통처리
    const _fetchCommonCatch= (e)=>{
        if (e.reason instanceof HttpError){
            e.promise.catch(err => {
                alert(err.errorMessage);
            });
        }
    }
    $w.addEventListener("unhandledrejection", _fetchCommonCatch);

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

    const _convertRequestPost= (url, options={}, data={}) => {
        let requestUrl = String(url);
        let requestHeaders = Base.extends({}, POST_HEADER);
        if (options['headers'] || options['contentType']) {
            requestHeaders = Base.extends(requestHeaders, {
                'Content-Type' : options['contentType']||POST_HEADER['Content-Type']
            }, options.headers||{});
            delete options['headers'];
            delete options['contentType'];
        }
        if (!requestUrl.isEmpty() && (requestUrl.startWith('/') || requestUrl.indexOf(Base.config.base_domain_url) > -1)) {
            requestHeaders = Base.extends(requestHeaders, {
                'X-Requested-With': 'XMLHttpRequest'
            });
            if (OPTIONAL_HEADER?.auth) {
                requestHeaders = Base.extends({}, OPTIONAL_HEADER.auth, requestHeaders);
            }
        }
        const requestInit = Base.extends({
             headers: requestHeaders,
             body   : null
        }, options||{});
        if (data instanceof Object) {
            if (data instanceof Array) {
                requestInit.headers['Content-Type'] = JSON_CONTENTS;
                requestInit.body = JSON.stringify(data); 
            }
            else {
                data['_'] = Date.now();
                const contentType = requestInit.headers['Content-Type']?.trim().toLowerCase();
                if (contentType.indexOf('json') >= 0){
                    requestInit.body = JSON.stringify(data);
                }else if(contentType.indexOf('multipart') >= 0){
                    delete requestInit.headers['Content-Type'];
                    requestInit.body = data;
                } else {
                    requestInit.body = _convertRequestQuery(data);
                }
            }
        } else if(typeof data === 'string') {
            requestInit.body = data;
        }
        return requestInit;
    };

    const _convertRequestGet = (url, options={}, data={}) => {
        let requestUrl = String(url);
        let requestHeaders = Base.extends({}, POST_HEADER);
        if (options['headers'] || options['contentType']) {
            requestHeaders = Base.extends(requestHeaders, {
                'Content-Type' : options['contentType']||''
            }, options.headers||{});
            delete options['headers'];
            delete options['contentType'];
        }
        if(!requestUrl.isEmpty() && (requestUrl.startWith('/') || requestUrl.indexOf(Base.config.base_domain_url) > -1)) {
            requestHeaders = Base.extends(requestHeaders, {
                'X-Requested-With': 'XMLHttpRequest'
            });
            if (OPTIONAL_HEADER?.auth) {
                requestHeaders = Base.extends({}, OPTIONAL_HEADER.auth, requestHeaders);
            }
        }
        const requestInit = Base.extends({
            method : 'GET', 
            headers: requestHeaders
        }, options||{});
        return requestInit;
    };
    
    const _convertResponseData = (response, dataType='text') => {
        let type = "text";
        if (dataType.includes('json')){
            type = "json";
        } else if(dataType.includes('blob')){
            type = "blob";
        }
        return response[type]();
    };

    const _convertXhrResponseData = (response, dataType='text') => {
        if (!response instanceof XMLHttpRequest) return;
        if (dataType.includes('json')){
            return JSON.parse(response.responseText);
        } 
        else if(dataType.includes('blob')){
            return response.response;
        }
        return response.responseText;
    };

    const _timeout = async function() {
        return new Promise((_, reject) => {
            Base.Timer.sleep(FETCH_RATE.timeout).then(()=>{ 
                reject(Error(FETCH_RATE.timeout_message));
            });
        });
    };
    const _warning = async function() {
        return new Promise((_, reject) => {
            Base.Timer.sleep(FETCH_RATE.warning).then(()=>{ 
                reject(Error(FETCH_RATE.warning_message));
            });
        });
    };
    const _fetch = async function(requestPath, requestInit, isResponse=false) {
        const procKey = String(requestPath).split('?')[0].substring(1),
              process = FETCHS[procKey] = (FETCHS[procKey] ? FETCHS[procKey] : (new FetchProcess(requestPath, requestInit))).run();
        if (requestInit['isAsync'] === false) {
            // 비동기 호출 지원.
            return Base.Core.pf(function(resolve, reject) {
                let fnError = (event)=> {
                    if (process.isRunning) {
                        process.error();
                        reject(event['target']);
                    }
                };
                let fnCallback = (event)=> {
                    if (process.isRunning) {
                        process.complete();
                        let response = event['target'];
                        let result = _convertXhrResponseData(response, requestInit['datatype']);
                        if (isResponse === true) { 
                            resolve({data: result, response: response});
                        } else {
                            resolve(result);
                        }
                    }
                };
                let xhr = new XMLHttpRequest();
                    xhr.open(requestInit['method'], requestPath, requestInit['isAsync']);                    
                    xhr.onload = fnCallback;
                    xhr.onabort= fnError;
                    xhr.onerror= fnError;
                    xhr.onreadystatechange = function(event) {
                        let response = event['target'];
                        if (XMLHttpRequest.DONE === event['target']?.readyState) {
                            if (response.status === 0 || (response.status >= 200 && response.status < 400)) {                                 
                                //fnCallback(event);
                            } else {
                                fnError(event);
                            }
                        }
                    };
                if (requestInit.mimeType || xhr.overrideMimeType) {
                    xhr.overrideMimeType( requestInit.mimeType );
                }
                if (requestInit.headers) {
                    Object.entries(requestInit.headers).forEach(([key,value])=>{
                        xhr.setRequestHeader(key, value);
                    });
                }
                xhr.send(('get' != requestInit['method'] && (requestInit.body||null)));
            });            
        } else {
            const response= await $w['fetch'].call($w, requestPath, requestInit);
            if (response.status == 200) {
                process.complete(response);
                const responseDataType = process.dataType || response.headers.get('content-type') || 'text';
                if (isResponse === true) {
                    let result = await _convertResponseData(response, responseDataType);
                    return {data: result, response: response};
                } else {
                    return _convertResponseData(response, responseDataType);
                }
            } else {
                process.error(response);
                response.resultData = await _convertResponseData(response, 'text');
                const error = new HttpError(response);
                if (Base.isDebug) {
                    Base.error('Fetch.Error()', error.reason ? error.reason : error);
                }
                if(isMainRedirctError){
                    await Base.Core.pf(function(resolve) {
                        Base.Timer.sleep(1000).then(()=>{
                            throw error;
                        });
                    });
                }else if (error?.exception?.indexOf('AuthException') >= 0) {
                    isMainRedirctError = true;
                    Base.Timer.sleep(0).then(()=>{ $w.location.href = '/'});
                    throw error;
                }else{
                    throw error;
                }
            }
        }        
    };

    const _fetchWithTimeout  = async function(requestPath, requestInit, isResponse=false) {
        return Promise.race([_fetch(requestPath, requestInit, isResponse), _warning(), _timeout()]);
    };

    const FetchHender= {
        process : FETCHS,
        get : async function(url, data={}, options={}) {
            const requestPath = url +(url.includes('?')?'&':'?')+ _convertRequestQuery(Base.extends(data, {
                // '_' : (new Date()).format('yyyymmddHH')
            }));
            return _fetch(requestPath, _convertRequestGet(url, options, data));
        },
        post: async function(url, data={}, options={}) {
            const requestPath = url;
            return _fetch(requestPath, _convertRequestPost(url, Base.extends({method : 'POST'},options), data));
        },
        put : async function(url, data={}, options={}) {
            const requestPath = url;
            return _fetch(requestPath, _convertRequestPost(url, Base.extends({method : 'PUT'}, options), data));
        },
        del : async function(url, data={}, options={}) {
            const requestPath = url;
            return _fetch(requestPath, _convertRequestPost(url, Base.extends({method : 'DEL'}, options), data));
        },
        getWithResponse : async function(url, data={}, options={}) {
            const requestPath = url +(url.includes('?')?'&':'?')+ _convertRequestQuery(Base.extends(data, {
                //'_' : Date.now()
            }));
            return _fetch(requestPath, _convertRequestGet(url, options, data), true);
        },
        postWithResponse: async function(url, data={}, options={}) {
            const requestPath = url;
            return _fetch(requestPath, _convertRequestPost(url, Base.extends({method : 'POST'},options), data), true);
        },
        setHeaderData: function(menuData= {}) {
            Base.extends(OPTIONAL_HEADER, {
                menu : menuData,
                auth :{scrNo:(menuData?.scrNo||'')},
            });
        },
        getHeaderData: function() {
            return OPTIONAL_HEADER;
        },
    };
    
    Base.extends(Base.Fetch, FetchHender);

}) (window, __DOMAIN_NAME||'');