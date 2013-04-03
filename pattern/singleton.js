/* 
    @name Singletonify - By javarouka (MIT Licensed)    
    @url http://blog.javarouka.me/2012/02/javascripts-pattern-1-singeton-patterrn.html
*/
var Singletonify = function(cons) {
    
    // 유일 객체 변수
    var INSTANCE;
    
    // 클로저 생성
    var c = function() {
        // 유일 객체가 정의되지 않았다면 객체를 생성.
        if(INSTANCE === undefined) {
            
            // 여기서부터 new 연산자의 내용을 흉내냅니다.
            
            // 새 함수를 선언하고 인자로 전달받은 함수의 프로토타입으로 연결합니다.
            var F = function() {};
            F.prototype = cons.prototype;
            
            // 객체를 생성하고 생성된 객체를 컨텍스트로 호출합니다.            
            var t = new F();
            var ret = cons.apply(t, Array.prototype.slice.call(arguments));
            
            // 이때, 반환값이 객체이면 객체를, 아니라면 위의 객체를
            // 생성 객체로 지정합니다.
            INSTANCE = (typeof ret === 'object') ? ret : t;             
        }
        
        // 객체를 리턴합니다.
        return INSTANCE;
    }

    // 팩토리 메서드로도 접근할 수 있게 합니다
    c.getInstance = function() {
        return c.apply(null, Array.prototype.slice.call(arguments));
    }

    // 생성자를 대체한 클로저를 리턴
    return c;
};

// 테스트 함수
function javarouka(value) {
    this.v = value;
}

// 싱글톤화
var Single = Singletonify(javarouka);

// 테스트
var s1 = Single.getInstance("hello");
var s2 = new Single("javascript");
var s3 = new Single("world");

console.log(s1 === s2); // true
console.log(s2 === s3); // true

console.log(s1.v); // hello
console.log(s2.v); // hello
console.log(s3.v); // hello