/** common.base.observer.js */
(function($w, root) {
    'use strict';
    
    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base  = $w[root];
    const Observer = {
        /**
         * 기준 영역에 대상이 보여지는지 감지.
         * @param {*} element 감지 대상
         * @param {*} options 감지 옵션
         * @returns 
         */
        intersection : async function(element, options = {}, notify) {
            if (!element) {
                throw new Error('There is no observing target element.');
            }
            if (!options || options['root']) {
                throw new Error('There is no observing target element.');
            }
            const intersectionObserverOptions = Base.extends({
                root      : null,   // 기준 영역
                rootMargin: '0px',  // root 영역의 여백
                threshold : 0.1     // root에 지정된 영역 내에 10% 보여질 때 감지
            }, options);
            const observer = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting) {
                    if (Base.isFunction(notify)) notify(entries);
                }
            }, intersectionObserverOptions);
            observer.observe(element);
            return observer;
        },
        /**
         * Target Element의 변경 여부를 감지.
         * @param {*} element 감시 대상
         * @param {*} options 
         * @returns 
         */
        mutation : async function(element, options = {}, notify) {
            if (!element) {
                throw new Error('There is no observing target element.');
            }
            const mutationObserverOptions = Base.extends({
                attributes   : true,    // 대상 노드의 속성 변화 감지
                childList    : false,   // 대상 노드의 자식 요소(텍스트 포함)의 변화 감지
                characterData: false,   // 대상 노드의 데이터 변화 감지
                subtree      : false,   // 대상 노드의 자식 뿐만 아니라 손자 이후로 모두 감시
                //attributeFilter    : '' ,     // 모든 속성 돌연변이를 관찰 할 필요가 없는 경우 속성 네임 스페이스없이 속성 로컬 이름의 배열로 설정
                attributeOldValue    : false,   // 대상 노드의 속성 변경 전의 내용도 기록에 남김
                characterDataOldValue: false,   // 대상 노드의 데이터 변경 전의 내용도 기록에 남김
            }, options);
            const observer = new MutationObserver(function(entries) {
                if (Base.isFunction(notify)) notify(entries);
            });
            observer.observe(element, mutationObserverOptions);
            return observer;
        },
        /**
         * Target Element 객체의 너비, 높이의 변화를 감지.
         * @param {*} element 감시 대상
         * @returns 
         */
        resize  : async function(element, options = {}, notify) {
            if (!element) {
                throw new Error('There is no observing target element.');
            }            
            const observer = new ResizeObserver(function(entries) {
                if (Base.isFunction(notify)) notify(entries);
            });
            observer.observe(element);
            return observer;
        },
    };

    Base.extends(Base.Observer, Observer);

}) (window, __DOMAIN_NAME||'');