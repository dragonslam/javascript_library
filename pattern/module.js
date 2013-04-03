/* 
    @name dataModule - By javarouka (MIT Licensed)    
    @url http://blog.javarouka.me/2012/02/javascripts-pattern-2-module-pattern.html
*/
var spec = {
    url: '/some/path/data',
    callback: function(data) { }, // 콜백 지정
    parser: function jsonParser(data) { } // 파서 지정
};
// 모듈화. 생성 인자로 객체를 받는다.
// spec 객체를 바탕으로 객체 생성.
var dataModule = (function(spec) {
    
    // private 영역 시작

    // 데이터 캐시
    var dataCache = {};
    
    // 데이터 캐시 아이디
    var id = 0;
    
    var url = spec.url || '/default/data';
    // ... 기타 사용 변수
    
    var connectServer = function() { }
    var sendRequest = function(opt) { }
    var parseData = spec.parser || function(data) {};
    
    var callback = spec.callback || function() { };    
    var headers = spec.headers || {};

    // private 영역 끝.
    
    
    // 필요한 것만 공개. 접근 제한은 public이 된다
    // 리턴되는 객체의 메서드들은 클로저로서
    // private 영역의 변수에 접근이 가능하다.
    return {
        send: function() {
            connectServer(spec.url, spec.method);
            var data = sendRequest(headers);
            dataCache[id++] = data;
            return parseData(data, callback);
        },
        cache: function(id) { return dataCache[id]; },
        getLastCacheId: function() { return id; }
    } 
    
})(spec); // 익명 함수를 바로 실행

// @Test 코드
// 데이터 요청
var rs = dataModule.send();
console.log(dataModule.getLastCacheId()) // 마지막 요청 아이디