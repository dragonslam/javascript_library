/* 
    @name Flyweight Pattern - By javarouka (MIT Licensed)    
    @url http://blog.javarouka.me/2012/02/javascripts-pattern-3-flyweight-pattern.html
*/

var Unit = function(name, maxhp, cost) {
    this.name = name;
    this.maxhp = maxhp;
    this.cost = cost;    
}

var UnitCreator = (function() {
    
    // 한번 생성한 객체는 다시 생성하지 않기 위한 저장소
    // private 이다.
    var units = {};

    // 모듈 패턴을 사용한 public 속성들
    return {
        create: function(name, maxhp, cost) {
 
            var unit = units[name];

            // 저장소에 이미 있다면 그것을 리턴
            if(unit) {
                return unit;
            }

            // 없다면 생성하고 저장소에 저장
            else {
                units[name] = new Unit(name, maxhp, cost);
                return units[name];
            }
        }
    } 
    
})();

var UnitController = (function() {
    
    // 플라이웨이트 객체를 관리할 맵
    // 역시 private 속성.
    var unitsPlayedDictionary = {};

    var self = this;

    // 모듈 패턴을 사용한 public 속성들
    return {
        produceUnit: function(id, name, maxhp, cost, player) {
            
            var unit = UnitCreator.create(name, maxhp, cost);
            
            // 공유 자원과 객체 특성을 조합 (컴포지트 패턴)
            var unitOnPlay = {
                unit: unit,
                id: id,
                player: player,
                currentHp: unit.maxHp,
                upgrade: 0                
            };
            unitsPlayedDictionary[id] = unitOnPlay;
        },     

        kill: function(id) {
            var unit = unitsPlayedDictionary[id];
            if(unit) {
                unit.currentHp = 0;
                delete unitsPlayedDictionary[id];
            }
        },
        
        upgradePower: function(id) {
            var unit = unitsPlayedDictionary[id];
            if(unit) {
                unit.upgrade = unit.upgrade + 1;
            }
        },
        
       /* 기타 메서드들 ... */
    }    
    
})();