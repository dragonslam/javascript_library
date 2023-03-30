/* common.base.validation.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const Validator = {
        /**
         * 패스워드 유효성 검사
         * 1.10자 이상 ~ 20자 이하
         * 2.영대문자, 영소문자, 숫자, 특수기호중 2가지 이상 조합
         * 3.동일문자 3회이상 반복 불가
         * 4.키보드상 연속문자열 4자 이상 사용불가
         * 5.사용자ID와 연속 3문자 이상 중복 불가
         * 6.연속된 숫자/문자 3자 이상 사용불가
         *
         * 각 CASE별 CODE, MSG 리턴
         */
        checkPassword : function(passwd, userId) {
            let code = false;
            let msg = '';

            //숫자/문자의 순서대로 3자 이상 사용금지
            const straights = ['012345678901', '987654321098', 'abcdefghijklmnopqrstuvwxyzab', 'zyxwvutsrqponmlkjihgfedcbazy'];

            //연속된 키보드 조합
            const keypads = [
                '`1234567890-=', 	'=-0987654321`', 	'~!@#$%^&*()_+', 	'+_)(*&^%$#@!~',
                'qwertyuiop[]\\', 	'\\][poiuytrewq', 	'QWERTYUIOP{}|',	'|}{POIUYTREWQ',
                'asdfghjkl;\'', 	'\';lkjhgfdsa', 	'ASDFGHJKL:"', 		'":LKJHGFDSA',
                'zxcvbnm,./', 		'/.,mnbvcxz', 		'ZXCVBNM<>?', 		'?><MNBVCXZ'
            ];

            const getPattern = function(str, casesensitive) {
                //정규식 생성전에 예약어를 escape 시킨다.
                const reserves = ['\\', '^', '$', '.', '[', ']', '{', '}', '*', '+', '?', '(', ')', '|'];
                reserves.forEach((reserve) => {
                    let pattern = new RegExp('\\' + reserve, 'g');
                    if (pattern.test(str)) {
                        str = str.replace(pattern, '\\' + reserve);
                    }
                });

                let pattern = null;
                if (casesensitive == false) {
                    pattern = new RegExp(str, 'i');
                } else {
                    pattern = new RegExp(str);
                }

                return pattern;
            }

            if (passwd.match(/^.{10,20}$/g) == null) {
                msg = "비밀번호는 10자 이상 ~ 20자 이하로 영문 대문자, 영문 소문자, 숫자, 특수기호중 2가지 이상조합이 필요합니다.";
                return {code : false, msg: msg};
            }

            let valid_count = 0;
            if (passwd.match(/[a-z]/) != null) {
                valid_count++;
            }
            if (passwd.match(/[A-Z]/) != null) {
                valid_count++;
            }
            if (passwd.match(/[0-9]/) != null) {
                valid_count++;
            }
            if (passwd.match(/\W/) != null) {
                valid_count++;
            }

            if(valid_count < 2) {
                return {code : false, msg: "비밀번호는 10자 이상 ~ 20자 이하로 영문 대문자, 영문 소문자, 숫자, 특수기호중 2가지 이상조합이 필요합니다."};
            }

            for (let i = 0 ; i < passwd.length ; i++) {
                if (passwd.charAt(i+1) != '' && passwd.charAt(i+2) != '') {
                    if (passwd.charCodeAt(i) == passwd.charCodeAt(i+1) && passwd.charCodeAt(i+1) == passwd.charCodeAt(i+2)) {	//동일문자 3회 반복
                       return {code : false, msg: "동일문자 3회 이상, 키보드상 연속문자열 4자 이상 사용이 불가합니다."};
                    }
                    let str = passwd.charAt(i)+''+passwd.charAt(i+1)+''+passwd.charAt(i+2);

                    let pattern = getPattern(str, false);

                    for (let j = 0 ; j < straights.length ; j++) {
                        if (pattern.exec(straights[j]) != null) {
                           return {code : false, msg: "연속된 숫자/문자 3자 이상 사용할 수 없습니다."};
                        }
                    }

                    //아이디와 3자 이상 중복 불가
                    if (pattern.exec(userId) != null) {
                        return {code : false, msg: "사용자 ID와 연속 3문자 이상 중복하여 사용할 수 없습니다."};
                    }
                }
            }

            for (let i = 0 ; i < passwd.length ; i++) {
                if (passwd.charAt(i+1) != '' && passwd.charAt(i+2) != '' && passwd.charAt(i+3) != '') {
                    let str = passwd.charAt(i)+''+passwd.charAt(i+1)+''+passwd.charAt(i+2) +''+ passwd.charAt(i+3);

                    let pattern = getPattern(str);

                    for (let j = 0 ; j < keypads.length ; j++) {
                        if (pattern.exec(keypads[j]) != null) {
                            return {code : false, msg: "동일문자 3회 이상, 키보드상 연속문자열 4자 이상 사용이 불가합니다."};
                        }
                    }
                }
            }
            return {code : true, msg: "사용 가능한 비밀번호입니다."};
        },

        /** 
         * 주민번호 체크
        */
        isJumin : function(str) {
            if (!str) return false;
            let jumin = str.getNumber();
            if (jumin.match(/[0-9]{2}[01]{1}[0-9]{1}[0123]{1}[0-9]{1}[1234]{1}[0-9]{6}$/) == null) {
                return false;
            }

            // 생년월일 체크
            let birthYY = (parseInt(jumin.charAt(6)) == (1 ||2)) ? '19' : '20';
                birthYY +=jumin.substr(0, 2);
            let birthMM = jumin.substr(2, 2) - 1;
            let birthDD = jumin.substr(4, 2);
            let birthDay= new Date(birthYY, birthMM, birthDD);
            if (birthDay.getYear() % 100 != jumin.substr(0,2) || birthDay.getMonth() != birthMM || birthDay.getDate() != birthDD) {
                return false;
            }
            let sum = 0;
            let num = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
            let last= parseInt(jumin.charAt(12));
            for(let i = 0; i < 12; i++) {
                sum += parseInt(jumin.charAt(i)) * num[i];
            }

            return ((11 - sum % 11) % 10 == last) ? true : false;
        },

        /**
         * 외국인 등록번호 체크
         */
        isForeign : function(str) {
            if (!str) return false;
            let jumin = str.getNumber();
            if (jumin.match(/[0-9]{2}[01]{1}[0-9]{1}[0123]{1}[0-9]{1}[5678]{1}[0-9]{1}[02468]{1}[0-9]{2}[6789]{1}[0-9]{1}$/) == null) {
                return false;
            }
        
            // 생년월일 체크
            let yy = (parseInt(jumin.charAt(6)) == (5 || 6)) ? '19' : '20';
                yy +=jumin.substr(0, 2);
            let mm = jumin.substr(2, 2) - 1;
            let dd = jumin.substr(4, 2);
            let DT = new Date(yy, mm, dd);
        
            if (DT.getYear() % 100 != jumin.substr(0,2) || DT.getMonth() != mm || DT.getDate() != dd) {
                return false;
            }        
            if ((parseInt(jumin.charAt(7)) * 10 + parseInt(jumin.charAt(8))) % 2 != 0) {
                return false;
            }
        
            let sum = 0;
            let num = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
            let last= parseInt(jumin.charAt(12));        
            for(let i = 0; i < 12; i++) {
                sum += parseInt(jumin.charAt(i)) * num[i];
            }
        
            return (((11 - sum % 11) % 10) + 2 == last) ? true : false;
        },

        /**
         * 사업자번호 체크
         */
        isBiznum : function(str) {
            if (!str) return false;
            let biznum = str.getNumber();
            if (biznum.match(/[0-9]{3}[0-9]{2}[0-9]{5}$/) == null) {
                return false;
            }

            let sum = parseInt(biznum.charAt(0));
            let num = [0, 3, 7, 1, 3, 7, 1, 3];
            for(let i = 1; i < 8; i++) {
                sum += (parseInt(biznum.charAt(i)) * num[i]) % 10;
            }        
            sum += Math.floor(parseInt(parseInt(biznum.charAt(8))) * 5 / 10);
            sum += (parseInt(biznum.charAt(8)) * 5) % 10 + parseInt(biznum.charAt(9));
        
            return (sum % 10 == 0) ? true : false;
        },

        /**
         * 법인 등록번호 체크
         */
        isCorpnum : function(str) {
            if (!str) return false;
            let corpnum = str.getNumber();
            if (corpnum.match(/[0-9]{6}[0-9]{7}$/) == null) {
                return false;
            }
        
            let sum = 0;
            let num = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
            let last = parseInt(corpnum.charAt(12));
            for(let i = 0; i < 12; i++) {
                sum += parseInt(corpnum.charAt(i)) * num[i];
            }
        
            return ((10 - sum % 10) % 10 == last) ? true : false;
        },
        
        /**
         * input 입력 validate
         */
        inputCheck : function(inpValidateObj, element) {
        	let {type, maxLength, maxBytes, dispLengthEl, dispByteEl, inputWrapEl} = inpValidateObj;
        	let retValue = element.value;
        	
    		if(type == 'num'){
    			if(/[^0-9\n]/g.test(retValue)){
    				retValue = retValue.replace(/[^0-9\n]/g,'');
    			}
    		}else if(type == 'numEng'){
    			if(/[^A-Za-z0-9\n]/g.test(retValue)){
    				retValue = retValue.replace(/[^A-Za-z0-9\n]/g,'');
    			}
    		}else if(type == 'korEng'){
    			if(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55]/.test(retValue)){
    				retValue = retValue.replace(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55]/g, "");
    			}
    		}else if(type == 'str'){
    			if(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s!\.\^~(),_\"#\/\*\+-;\?:@\[\]{}'&\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55]/.test(retValue)){
    				retValue = retValue.replace(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s!\.\^~(),_\"#\/\*\+-;\?:@\[\]{}'&\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55]/g, "");
    			}
    		}else if(type == 'strSpc'){
    			if(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s!\.\^~(),_\"#\/\*\+-;\?:@\[\]{}'&\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55\u2661\u2665\u2606\u2605]/.test(retValue)){
    				retValue = retValue.replace(/^\s+|[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s!\.\^~(),_\"#\/\*\+-;\?:@\[\]{}'&\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55\u2661\u2665\u2606\u2605]/g, "");
    			}
    		}else if(type == 'vendGoodsNo') {
    			// 영문, 숫자, ~!@#$%^&*()_-=+,./<>?
    			if(/[^A-Za-z0-9\~\!\@\#\$\%\^\&\*\(\)\_\-\=\+\,\.\//\<\>\?\n]/g.test(retValue)){
    				retValue = retValue.replace(/[^A-Za-z0-9\~\!\@\#\$\%\^\&\*\(\)\_\-\=\+\,\.\//\<\>\?\n]/g, "");
    			}
    		}else if(type == 'phone') {
    			if(/[^0-9-]/g.test(retValue)){
    				retValue = retValue.replace(/[^0-9-]/g, "");
    			}
    		}else if(type == 'skuCode') {
    			// 영문, 숫자, -./
    			if(/[^A-Za-z0-9\-\.\//\n]/g.test(retValue)){
    				retValue = retValue.replace(/[^A-Za-z0-9\-\.\//\n]/g, "");
    			}
    		}
    		
    		if(maxLength){
    			maxLength = +maxLength;
    			//최대 길이제한
    			if(retValue.length > maxLength){
    				retValue = retValue.slice(0, maxLength);
    			}
    		}else if(maxBytes){
    			//최대 bytes제한 
    			maxBytes = +maxBytes;
    			let text = retValue;
    			let textlength = 0;
    			let resultText ="";
    			for(let i = 0; i < text.length; i++){
    				textlength += (text.charCodeAt(i) > 128)?3:1;
    				
    				if(textlength <= maxBytes){
    					resultText += text.substring(i, i+1);
    				}else{
    					break;
    				}
    			}
    			if(textlength > maxBytes){
    				retValue = resultText;
    			}
    		}
    		
    		if(element.value != retValue){
    			element.value = retValue;
    		}
    		
    		if(dispLengthEl){
    			
    			if(inputWrapEl) {
    				element.closest(inputWrapEl).querySelector(dispLengthEl).textContent = element.value.length;
    			} else {
        			document.querySelector(dispLengthEl).textContent = element.value.length;
    			}
    		}
    		
    		if(dispByteEl){
    			let textlength = 0;
    			for(let i = 0; i < element.value.length; i++){
    				textlength += (element.value.charCodeAt(i) > 128)?3:1;
    			}
    			if(inputWrapEl) {
    				element.closest(inputWrapEl).querySelector(dispByteEl).textContent = textlength;
    			} else {
        			document.querySelector(dispByteEl).textContent = textlength;
    			}
    		}
        }
    };

    Base.extends(Base.Validation, Validator);

}) (window, __DOMAIN_NAME||'');