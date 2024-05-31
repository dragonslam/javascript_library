(function($w, $) {
	"use strict";
	
	if (!!!$ ) return;
	if (!!!$w) return;
	if (!!!$w['__ROOT']) return;
	
	let Base	= $w['__ROOT'],
		Appl	= Base.namespace('__ROOT.sellerTool.brandAnalytics'),
		Module	= Base.module(Appl);
	
	Appl.configuration = {
		isStatusSave: true,
		defaultLogo	: '/img/brand_analytics/no_logo.png',
		tranUrl		: '/api/brandAnalytics',
		ajaxOptions	: {
			type	: 'post',
			dataType: 'json',
			useMask	: true,
			async	: true,
			cache	: false
		},
		cacheOptions: {
			type	: 'session',
			format	: 's'
		},
		chartOptions : {
			chart	 : { zoomType:'xy'   },
			credits	 : { enabled :false  },
			exporting: { enabled :false  },
			lang	 : { thousandsSep:','},
			legend	 : {
				align: 'center',
				borderColor: '#ccc',
				verticalAlign: 'top',
				backgroundColor: ($w['Highcharts'] && Highcharts.theme && Highcharts.theme.background2) || 'white',
				floating: true,
				shadow: false
			},
			tooltip	 : { shared:true, borderColor:'#999999' }
		},
		tooltipOptions : {
			position: {
				my: 'left top',
				at: 'left top+12',
				collision: 'none'
			}
		},
		dateUnit : {
			D : {name:'일단위', text:'일', batchName:'dailyJobLatestDate'},
			W : {name:'주단위', text:'주', batchName:'weeklyJobLatestDate'},
			M : {name:'월단위', text:'월', batchName:'monthlyJobLatestDate'}
		},
		excel : {
			duration : 3000
		}
	};
	Appl.init	= function(options) {
		Base.logging(this, 'init()');
		let This = this;
		
		This.setting(options||{});
		This.cache= $w['oCache']( $.extend({prifix:This.classPrifix, span:30, format:'m'}, Base.clone(Appl.configuration.cacheOptions)) );
		Module.init();

		return this;
	};
	Appl.isInit = function() {
		return Module['isInit'];
	};
	Appl.setting= function(options) {
		Base.logging(this,'setting()');
		Base.tracking('Module.setting()-> AS-IS', Module.options);
		Module.options= $.extend(Module.options||{}, options||{});
		Base.tracking('Module.setting()-> TO-BE', Module.options);
		return this;
	};
	Appl.getSetting= function() {
		Base.logging(this,'getSetting()');		
		return Module.options;
	};
	Appl.setFilterDate = function(){
		Base.logging(this,'setFilterDate()');
		Module.setFilterDate.apply(Module, arguments);
		return this;
	};
	Appl.getFilterParam = function(param){
		Base.logging(this,'getFilterParam()');
		return $.extend(Module.getFilterParam(), (param||{}));
	};
	Appl.ajax = function(caller, apiUrl, params, callback, isAsync, isCache, isMask) {
		if (!caller || !apiUrl) return;
		
		// 케쉬 사용 적용.
		let This = this,
			isUseCache= (typeof isCache === 'boolean') ? isCache : false,	
			sCacheName= apiUrl +'#'+ serializeQuerystring(params);
		if (isUseCache && This.cache.isStatus(sCacheName)) {
			Base.logging(caller,'ajax-cache('+ apiUrl +')', true);
			let data = JSON.parse(This.cache.get(sCacheName));
			if (callback) {
				callback.call(caller, data);
			}
		}
		else {
			Base.logging(caller,'ajax-call('+ apiUrl +')');
			Base.ajax($.extend(Base.clone(Appl.configuration.ajaxOptions), {
				 caller	: caller
				,url	: Appl.configuration.tranUrl +'/'+ (apiUrl||'')
				,data	: params||{}
				,async	: typeof isAsync=='boolean' ? isAsync : Appl.configuration.ajaxOptions.async
				,useMask: typeof isMask =='boolean' ? isMask  : Appl.configuration.ajaxOptions.useMask
				,success: function(data, flag, req) {
					if (data && data['code'] === '000') {
						This.cache.set(sCacheName, req['responseText']||'');
					} else {
						This.cache.remove(sCacheName);
					}
					if (callback) {
						callback.apply(caller, arguments);
					}
				}
			}));
		}
	};
	Appl.ajaxShowLoading = function() {
		if(!$('#ajax_loading').hasClass('active')) {
			$('#ajax_loading').addClass('active');
			$('#ajax_masking').show();
		}
	};
	Appl.ajaxHideLoading = function() {
		if ($('#ajax_loading').hasClass('active')) {
			$w.setTimeout(function() {
				$('#ajax_loading').removeClass('active');
				$('#ajax_masking').hide();
			}, 100);
		}
	};
	Appl.showAlert = function(title, message, callback) {
		if(!$('#ar-pop_alert').hasClass('active')) {
			$('#ar-pop_alert').find('h2.skip').text(title||'시스템 오류');
			$('#ar-pop_alert').find('div.inner p').html(message||'데이터 적재가 완료되지 않았습니다.<br>잠시 후 다시 시도해주세요.');
			$('#ar-pop_alert').find('.btn_type_01').unbind('click').bind('click', function(e) {
				Appl.hideAlert(callback||0);
			});
			$('#ar-pop_alert').find('.btn_close').unbind('click').bind('click', function(e) {
				Appl.hideAlert(callback||0);
			});
			$('#ar-pop_alert').addClass('active');
			$('#proc_masking').show();
		}
	};
	Appl.hideAlert = function(callback) {
		if ($('#ar-pop_alert').hasClass('active')) {
			$w.setTimeout(function() {
				$('#ar-pop_alert').removeClass('active');
				$('#proc_masking').hide();
				if (callback) {
					callback.call(Appl);
				}
			}, 100);
		}
	};
	Appl.showNotice = function(title, message, callback) {
		if (!message) return;
		if (!$('#ar-emergency_notice').hasClass('active')) {
			let rNum = message.split('\n').length,
				sMsg = message.replaceAll('\n', '<br/>'),
				sCnt = '',
				sCss = '',
				iHig = 20;
			if (rNum > 7 || sMsg.indexOf('<div') > 0) {
				sCss = 'popup_emergency_notice_01';
				sCnt = '<h3 class="title">'+ title +'</h3><p>'+ sMsg +'</p>';
			}
			else {
				iHig = 40;
				sCss = 'popup_emergency_notice_02';
				sCnt = '<p class="text">'+ sMsg +'</p>';
			}
			$('#ar-emergency_notice').find('.inner').empty().html(sCnt);
			$('#ar-emergency_notice').find('.pop_bottom_btn').prepend(
					'<div style="padding:5px;"><input type="checkbox"> 하루동안 긴급알림 팝업 보지 않기</div>');
			$('#ar-emergency_notice').find('.pop_bottom_btn button').unbind('click').bind('click', function(e) {
				Appl.hideNotice(callback||0);
			});
			$('#ar-emergency_notice').addClass(sCss);
			$('#ar-emergency_notice').addClass('active');
			$('#ar-emergency_notice').height($('#ar-emergency_notice').height() + iHig);
			$('#proc_masking').show();
		}
	};
	Appl.hideNotice = function(callback) {
		if ($('#ar-emergency_notice').hasClass('active')) {
			$w.setTimeout(function() {
				let isCheck = $('#ar-emergency_notice').find('.pop_bottom_btn input:checkbox').is(':checked');
				$('#ar-emergency_notice').removeClass('popup_emergency_notice_01');
				$('#ar-emergency_notice').removeClass('popup_emergency_notice_02');
				$('#ar-emergency_notice').removeClass('active');
				$('#proc_masking').hide();
				if (callback) {
					callback.call(Appl, isCheck);
				}
			}, 100);
		}
	};
	Appl.readNotice = function(noticeNo, isCheck) {
		let This	= this,
			sCacheNm= 'NoticeNewPostRead',
			oNtCache= $w['oCache']({prifix:This.classPrifix, type:'local', span:30, format:'d'}),
			oNtData = oNtCache.isStatus(sCacheNm) ? JSON.parse(oNtCache.get(sCacheNm)) : {},
			isRead	= false;
			
		if (!!isCheck) {
			isRead = !!(oNtData['ntc_'+noticeNo]||0);
		}
		else {
			oNtData['ntc_'+noticeNo] = (oNtData['ntc_'+noticeNo]||0) + 1;
		}
		oNtCache.set(sCacheNm, JSON.stringify(oNtData));
		
		return isRead;
	};
	Appl.excel = function(caller, apiUrl, params) {
		if (!caller || !apiUrl) return;
		Base.logging(caller,'excel('+ apiUrl +')');

		let tranUrl = Appl.configuration.tranUrl +'/'+ (apiUrl||''),
			queryUrl= serializeQuerystring(params);

		$($w['location']).attr('href', tranUrl +'?'+ queryUrl);
	};
	Appl.excelExport = function(caller, fileName, seetName, genetator, callback) {
		if (!caller) return;
		Base.logging(caller,'excelExport()');
		
		if ($w['excelExport']) {
			Appl.ajaxShowLoading();
			
			let excelTableId = 'tblExportData',
				excelTableObj= $('#'+excelTableId);
			if (excelTableObj && excelTableObj.length) {
				if (genetator) {
					excelTableObj.find('thead').empty();
					excelTableObj.find('tbody').empty();
					genetator.call(caller, excelTableObj);
				}
				let oNow = (new Date()),
					oLink= document.createElement('a');
				
				oLink.download = 'Excel_'+ (fileName||'excelExport') +'.xls';
				oLink.href = 'data:,'+ excelExport(excelTableId).parseToXLS((seetName||fileName||'seet')).getRawXLS(); 
				oLink.click();
				
				excelTableObj.find('thead').empty();
				excelTableObj.find('tbody').empty();
			}
			if (callback) {
				callback.call(caller);
			}
			Appl.ajaxHideLoading();
		}
	};

	Appl.operationGrid = function(oGrid, settings, options) {
		if (!oGrid) {
			throw new Exception('need grid element.');
		}
		if (!settings|| !settings['gridDataFields']) {
			throw new Exception('need grid settings.');
		}
		if (!options || !options['columns']) {
			throw new Exception('need grid options.');
		}

		let sGridId = Base.getPageID() +'@'+ settings['gridId'],
			oStatus = {}, oColumns= [];
		
		// 그리드 컬럼 정렬 상태 적용.
		if (Appl['statusManager']) {
			oStatus = Appl['statusManager'].getReportStatus(sGridId);
			oColumns= oStatus ? (oStatus['columns']||false):false;
			if (oColumns) {
				let uColumns = [];
				for(let i = 0; i < oColumns.length; i++) {
					for(let x = 0; x < options['columns'].length; x++) {
						let item = options['columns'][x];
						if (oColumns[i] === item['datafield']) {
							uColumns.push(item); break;
						}
					}
				}
				options['columns'] = uColumns;
			}
		}

		/** jqxGrid **/
		oGrid.jqxGridWrapper({settings:settings, options:options});
		
		if (Appl['statusManager']) {
			oGrid.on('columnreordered', function() {
				Base.tracking('Grid.columnReordered()', this, arguments);
				let oColumns= [],
					oRecords= $(this).jqxGrid('columns')['records'];
				
				for(let i = 0; i < oRecords.length; i++) {
					let oItem = oRecords[i];
					oColumns.push(oItem['datafield']);
				}
				// 그리드 컬럼 정렬 상태 저장.
				Appl['statusManager'].setReportStatus(sGridId, $.extend( (oStatus||{}), {
					'name'	 :Base.pageInfo['pNm'],
					'columns':oColumns
				} ));
			});
		}
		return oStatus;
	};
	Appl.renderGridColumns = function(oGrid, oColumns, options) {
		if (!oGrid) return;
		if (oColumns) {
			for (var obj in oColumns) {
				oGrid.jqxGrid((!!oColumns[obj] ? 'showcolumn' : 'hidecolumn'), obj);
			}
		}
		if (options) {
			if (Appl['statusManager']) {
				var sGridId = Base.getPageID() +'@'+ oGrid.attr('id'),
					oStatus = $.extend( (Appl['statusManager'].getReportStatus(sGridId)||{}), options );				
				Appl['statusManager'].setReportStatus(sGridId, oStatus);
			}
		}
		return oStatus;
	};

	Appl.renderGrid = function(oGrid, params, callback, isMask, contentType) {
		Base.logging(this,'renderGrid()');
		if (!oGrid || !oGrid.length) return;
		if ($w['getGridDataFromUrl']) {
			$('#wrap .filter_dimmed').show();
			$w['getGridDataFromUrl'].call($w
				, Appl.configuration.tranUrl
				, $.extend(params||{},
				  	$.extend({
				  		method	: Module.options.gridCmd,
						start	: 0,
						limit	: $w['pageCount']||100,
						isPaging: 'Y'
					}, Module.getFilterParam())
				  )
				, function(data) {
					$('#wrap .filter_dimmed').hide();
					if (typeof callback == 'function') {
						callback(data);
					}
				}
				, (contentType || 'euc-kr')
			);
		}
		return this;
	};
	// 그리드 목록 데이터 적용.
	Appl.replaceRowData = function(obj, row) {
		Base.logging(this,'replaceRowData()');
		if (!row) return '';
		if (null == obj || 'object' != typeof obj) return row;
		if (obj instanceof Object) {
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) {
					if (typeof obj[attr] == 'number') {
						row = row.replaceAll('{{'+ attr +'}}', String(obj[attr]||0).toComma())	
					} else {
						row = row.replaceAll('{{'+ attr +'}}', (obj[attr]||''))
					}
				}
			}
		}
		return row;
	};
	/** 페이징 UI 적용. */
	Appl.renderPageNavigation = function(oCaller, oPage, oData, callback) {
		Base.logging(this, 'renderPageNavigation()');
		if (!oCaller || !oPage || !oData || !callback) return;

		oPage.empty().html($('#tmplPageNavigation').render({}));
		let oPageable = oData['pageable']||{};
		if (oData['totalPages'] && oData['totalPages'] > 0 && oPageable['paged'] === true) {
			oPage.find('.page').html(
			    String('<strong aria-label="현재페이지">{0}</strong><span class="skip">전체 페이지</span>{1}').format(
			        (oPageable['pageNumber']+1),
                    (oData['totalPages']||1).toComma()
                )
            );
			oPage.find('.previous').prop('disabled', (oPageable['pageNumber'] === 0))
                .data('pageNumber', oPageable['pageNumber'])
                .unbind('click')
				.bind('click', function() {
                    let That = $(this);
                    if(!That.prop('disabled')) {
                        That.prop('disabled', true);
                        callback.call(oCaller, That.data('pageNumber'));
                    }
                    return false;
				});
			oPage.find('.next').prop('disabled', (oPageable['pageNumber'] >= (oData['totalPages']-1)))
                .data('pageNumber',oPageable['pageNumber'])
                .unbind('click')
				.bind('click', function() {
					let That = $(this);
					if(!That.prop('disabled')) {
                        That.prop('disabled', true);
                        callback.call(oCaller, That.data('pageNumber')+2);
                    }
                    return false;
				});
		}
		else {
			oPage.find('.page').html('<strong aria-label="현재페이지">1</strong><span class="skip">전체 페이지</span>1');
			oPage.find('.previous').prop('disabled', true);
			oPage.find('.next').prop('disabled', true);
		}
	};
	/** 상위 렝커 페이징 UI 적용. */
	Appl.renderRankerPageNavigation = function(oPanel, totalCnt) {
		Base.logging(this, 'renderRankerPageNavigation()');
		let oSlider	  = oPanel.find('.c_tab_menu .inner'),
			oPage	  = oPanel.find('.pagination .navigator'),
			oPageSize = 5,
			oTotalPage= parseInt(totalCnt/oPageSize) + (totalCnt%oPageSize > 0 ? 1:0);
			
		// 텝 사이즈 변경. 
		Appl.winResizeTrigger = function() {
			let iWidth	= oPanel.find('.c_tab_menu').width(),
				iPage	= oPanel.find('.pagination .navigator').data('pageNumber');
			oSlider.find('ul').css({'position':'relative', 'width': iWidth * 4 + 10 + (oTotalPage * 5)});
			oSlider.find('li').css({'width': iWidth / oPageSize - 8});
			oSlider.find('ul').css({'left' : iWidth * (iPage-1) *-1});
		};
		$($w).bind('resize', function(){
			Appl.winResizeTrigger();
		});
		Appl.winResizeTrigger();
		
		// 페이징 구현.
		oPage.data('pageNumber', 1);
		if (oTotalPage > 1) {
			//oPage.find('.previous').prop('disabled', true);
			oPage.find('.previous').show().unbind('click').bind('click', function() {
				Base.logging(Appl, 'renderRankerPageNavigation().previous()');
				let That	= $(this).parent(),
					oSlider	= oPanel.find('.c_tab_menu ul'),
					iWidth 	= oPanel.find('.c_tab_menu').width() / oPageSize,
					iPage	= That.data('pageNumber'),
					iPadding= 0,
					iMargin = 0;

				if (oTotalPage > 1 && iPage > 1) {
					iPage--;
					iPadding= (iPage-1) * 10;
					iMargin = iWidth * ((iPage-1) * oPageSize) + iPadding;
					That.data('pageNumber', iPage);
					oSlider.animate({'left':iMargin * -1});
				}
                return false;
			});
			//oPage.find('.next').prop('disabled', true);
			oPage.find('.next').show().unbind('click').bind('click', function() {
				Base.logging(Appl, 'renderRankerPageNavigation().next()');
				let That	= $(this).parent(),
					oSlider	= oPanel.find('.c_tab_menu ul'),
					iWidth 	= oPanel.find('.c_tab_menu').width() / oPageSize,
					iPage	= That.data('pageNumber'),
					iPadding= 0,
					iMargin = 0;

				if (oTotalPage > 1 && iPage < oTotalPage) {
					iPage++;
					iPadding= (iPage-1) * 10;
					iMargin = iWidth * ((iPage-1) * oPageSize) + iPadding;
					That.data('pageNumber', iPage);
					oSlider.animate({'left':iMargin * -1});
				}
				return false;
			});
		}
		else {
			oPage.find('.previous').hide().unbind('click');
			oPage.find('.next').hide().unbind('click');
		}			
	};
	/** 셀러별 판매실적 상위 렝커 표시. */
	Appl.setSellerRankerPanel = function(oCaller, oPanel, oParams, callback, isLink) {
		Base.logging(this, 'setSellerRankerPanel()');
		Appl.winResizeTrigger = !1;
		if (!oCaller || !oPanel || !oParams || !callback) return;		
		if (!oParams['isLoadSellerRanker']) {
			isLink = (typeof isLink == 'boolean') ? isLink : true;			
			oPanel.find('.c_tab_menu').hide();			
			// 셀러별 판매실적 상위 랭커 읽기.
			Appl.ajax(oCaller, 'common/sellerTotalAmountRanker', oParams, function(data, flag, req) {
				Base.tracking('load sellerTotalAmountRanker.', oCaller, arguments);
				if (data && data['code'] === '000' && data['dataList'] && data['dataList'].length) {
					oParams['isLoadSellerRanker'] = true;
					oParams['data'] = data;

					oPanel.find('.c_tab_menu').show();
					Appl.setSellerRankerPanel(oCaller, oPanel, oParams, callback, isLink);
				}
				else {
					oPanel.find('.c_tab_menu .inner ul').empty();
					if (callback) callback.call(oCaller);
				}
			}, false, true);
		}
		else {
			let oSlider	= oPanel.find('.c_tab_menu .inner'),
				oData	= oParams['data'],
				oList	= oParams['data']['dataList'],
				strHtml	= '';
			
			if (oParams['isComparative'] == 'Y') {
				for(let i = 0; i < oList.length; i++) {
					let amountVal	= String(oList[i]['totalAmount']).parseInt(),
						amountSign	= '원';
					/*
					if (amountVal > 0) {
						let oCurc = amountVal.toCurrencyCal();
						amountVal = oCurc['value'];
						amountSign= oCurc['unit'];
					} */
					oList[i]['sellerName'] 	= (oList[i]['sellerName']||oList[i]['nickname']||oList[i]['sellerNo']);
					oList[i]['amountVal']	= amountVal.toComma();
					oList[i]['amountSign']	= amountSign;
					oList[i]['rateUnit']	= oParams['dateUnit'];
					oList[i]['rateView']	=(oList[i]['showComparison']===true?'style="display:;"':'style="display:none;"');
					oList[i]['rateVal']		= oList[i]['comparativeRate'].toFixed(2);
					oList[i]['rateSign']	=(oList[i]['comparativeRate']>0 ? '+':'');
					oList[i]['rateClass']	=(oList[i]['comparativeRate']>0 ? 'stat_up':'stat_down');					
				}
				strHtml = $('#tmplSalesRankerSellerComparativeItem').render(oList);				
				oSlider.find('ul').html(strHtml);
			} 
			else {
				for(let i = 0; i < oList.length; i++) {
					oList[i]['sellerName'] 	= (oList[i]['sellerName']||oList[i]['nickname']||oList[i]['sellerNo']);
					oList[i]['totalAmount'] = String(oList[i]['totalAmount']).toComma();
				}
				strHtml = $('#tmplSalesRankerSellerItem').render(oList);
				oSlider.find('ul').html(strHtml);
			}
			
			// 셀러 텝 선택.
			if (isLink) {
				oSlider.find('ul>li:eq(0)').addClass('active').find('a').attr('aria-selected', true);
				oSlider.find('ul>li').bind('click', function() {
					let That = $(this);
					if (That.hasClass('active')) {
						return false;
					}
					if (oSlider.find('ul>li.active').length) {
						oSlider.find('ul>li.active').removeClass('active').attr('aria-selected', false);
					}
					That.addClass('active').attr('aria-selected', true);
					Base.logging(oCaller, 'setSellerRankerPanel().click('+ That.data('sellerNo') +', '+ That.data('sellerKey') +')');

					if (callback) callback.call(oCaller, {sellerNo:That.data('sellerNo'), sellerKey:That.data('sellerKey'), sellerNm:That.data('sellerNm')});
				});
				
				if (callback) callback.call(oCaller, {sellerNo:oList[0]['sellerNo'], sellerKey:oList[0]['sellerKey'], sellerNm:oList[0]['sellerName']}, oData);
			}
			else {
				if (callback) callback.call(oCaller, {}, oData);	
			}
			
			// 상위 렝커 페이징 UI 적용.
			Appl.renderRankerPageNavigation(oPanel, oList.length);
		}
	};
	/** 셀러별 주문 전환률 상위 렝커 표시. */
	Appl.setConvertRankerPanel = function(oCaller, oPanel, oParams, callback) {
		Base.logging(this, 'setConvertRankerPanel()');
		Appl.winResizeTrigger = !1;
		if (!oCaller || !oPanel || !oParams || !callback) return;
		if (!oParams['isLoadConvertRanker']) {
			oPanel.find('.c_tab_menu').hide();
			// 셀러별 주문 전환률 상위 렝커 읽기.
			Appl.ajax(oCaller, 'common/sellerSalesConversionRanker', oParams, function(data, flag, req) {
				Base.tracking('load sellerSalesConversionRanker.', oCaller, arguments);
				if (data && data['code'] === '000' && data['dataList']) {
					oParams['isLoadConvertRanker'] = true;
					oParams['data'] = data;
					
					let oVal = data['dataList'][0];
					if (oVal && callback) callback.call(oCaller, {sellerNo:oVal['sellerNo'], sellerKey:oVal['sellerKey'], sellerNm:oVal['sellerName']}, data);
					Appl.setConvertRankerPanel(oCaller, oPanel, oParams, callback);
				}
				else {
					oPanel.find('.c_tab_menu .inner ul').empty();
					if (callback) callback.call(oCaller);
				}
			}, false, true);
		}
		else {
			let oList = oParams['data']['dataList'];
			for(let i = 0; i < oList.length; i++) {
				let rate = oList[i]['conversionComparativeRate'];
				oList[i]['conversionRate']= (rate>0?'+':'') + rate.toFixed(2);
				oList[i]['rateSignClass'] = (rate>0)?' stat_up' : ' stat_down';
				oList[i]['rateSignTag']	  = (oParams['dateUnit']==='W')?'WoW':'MoM';
				oList[i]['rateDisplay']	  = (oList[i]['showComparison'] === true)?'':'none';
				oList[i]['sellerName'] 	  = (oList[i]['sellerName']||oList[i]['nickname']||oList[i]['sellerNo']);
				oList[i]['payCount'] 	  = String(oList[i]['payCount']).toComma();
				oList[i]['pageViewCount'] = String(oList[i]['pageViewCount']).toComma();	
			}
			let oSlider	= oPanel.find('.c_tab_menu .inner');
			let strHtml	= $('#tmplConvertRankerSellerItem').render(oList);
			oPanel.find('.c_tab_menu').show();//.height(106);
			oSlider.find('ul').html(strHtml);
			oSlider.find('ul>li:eq(0)').addClass('active').find('a').attr('aria-selected', true);

			// 셀러 텝 선택.
			oSlider.find('ul>li').bind('click', function() {
				let That = $(this);
				if (That.hasClass('active')) {
					return false;
				}
				if (oSlider.find('ul>li.active').length) {
					oSlider.find('ul>li.active').removeClass('active').attr('aria-selected', false);
				}
				That.addClass('active').attr('aria-selected', true);
				Base.logging(oCaller, 'setConvertRankerPanel().click('+ That.data('sellerNo') +', '+ That.data('sellerKey') +')');

				if (callback) callback.call(oCaller, {sellerNo:That.data('sellerNo'), sellerKey:That.data('sellerKey'), sellerNm:That.data('sellerNm')});
			});
			
			// 상위 렝커 페이징 UI 적용.
			Appl.renderRankerPageNavigation(oPanel, oList.length);
		}
	};

	/** 셀러별 상세 유입경로 표시. */
	Appl.setInflowRankerPanel = function(oCaller, oPanel, oParams, callback) {
		Base.logging(this, 'setInflowRankerPanel()');
		Appl.winResizeTrigger = !1;
		if (!oCaller || !oPanel || !oParams || !callback) return;
		if (!oParams['isLoadInflowRanker']) {
			oPanel.find('.c_tab_menu').hide();
			// 셀러별 주문 전환률 상위 렝커 읽기.
			Appl.ajax(oCaller, 'common/sellerInflowPageViewRanker', oParams, function(data, flag, req) {
				Base.tracking('load sellerInflowPageViewRanker.', oCaller, arguments);
				if (data && data['code'] === '000' && data['dataList'] && data['dataList'].length) {
					oParams['isLoadInflowRanker'] = true;
					oParams['data'] = data;

					let oVal = data['dataList'][0];
					if (oVal && callback) callback.call(oCaller, {sellerNo:oVal['sellerNo'], sellerKey:oVal['sellerKey'], sellerNm:oVal['sellerName']}, data);
					Appl.setInflowRankerPanel(oCaller, oPanel, oParams, callback);
				}
				else {
					oPanel.find('.c_tab_menu .inner ul').empty();
					if (callback) callback.call(oCaller);
				}
			}, false, true);
		}
		else {
			let oList = oParams['data']['dataList'];
			for(let i = 0; i < oList.length; i++) {
				let rate = oList[i]['comparativeRate']||0;
				oList[i]['comparativeRate']=(rate>0?'+':'') + rate.toFixed(2);
				oList[i]['rateSignClass'] = (rate>0)?' stat_up' : ' stat_down';
				oList[i]['rateSignTag']	  = (oParams['dateUnit']==='W')?'WoW':'MoM';
				oList[i]['rateDisplay']	  = (oList[i]['showComparison'] === true)?'':'none';
				oList[i]['sellerName'] 	  = (oList[i]['sellerName']||oList[i]['nickname']||oList[i]['sellerNo']);
				oList[i]['conversionRate']   = String(oList[i]['comparativeRate']).toComma();
				oList[i]['totalPageviewCnt'] = String(oList[i]['totalPageviewCnt']).toComma();
			}
			let oSlider	= oPanel.find('.c_tab_menu .inner');
			let strHtml	= $('#tmplConvertRankerSellerItem').render(oList);
			oPanel.find('.c_tab_menu').show();//.height(106);
			oSlider.find('ul').html(strHtml);
			oSlider.find('ul>li:eq(0)').addClass('active').find('a').attr('aria-selected', true);
			
			// 셀러 텝 선택.
			oSlider.find('ul>li').bind('click', function() {
				let That = $(this);
				if (That.hasClass('active')) {
					return false;
				}
				if (oSlider.find('ul>li.active').length) {
					oSlider.find('ul>li.active').removeClass('active').attr('aria-selected', false);
				}
				That.addClass('active').attr('aria-selected', true);
				Base.logging(oCaller, 'setInflowRankerPanel().click('+ That.data('sellerNo') +', '+ That.data('sellerKey') +')');

				if (callback) callback.call(oCaller, {sellerNo:That.data('sellerNo'), sellerKey:That.data('sellerKey'), sellerNm:That.data('sellerNm')});
			});

			// 상위 렝커 페이징 UI 적용.
			Appl.renderRankerPageNavigation(oPanel, oList.length);
		}
	};
	/** 판매 카테고리 조회. */
	Appl.getSellerSalesCategory = function(oCaller, oParams, callback) {
		Base.logging(this, 'getSellerSalesCategory()');
		if (!oCaller || !oParams || !callback) return;
		let tran = 'Large';
		if ((oParams['largeCategoryNo'] && oParams['largeCategoryNo'] != '') || (oParams['cartType'] && oParams['cartType'] == 'M')) {
			tran = 'Middle';
		}
		$.extend(oParams, {brandNo: $U.uBNo});
		Appl.ajax(oCaller, 'common/sellerSales'+tran+'Category', oParams, function(data, flag, req) {
			Base.tracking('load sellerSalesCategory.', oCaller, arguments);
			if (callback) {
				callback.call(oCaller, data);
			}
		}, false, true, false);
	};
	
	
	// Analytics base module.
	Module.options	= {
		 pageType	: ''
		,menuType	: ''
        ,dateUnit   : ''
		,dateFormat : 'yyyymmdd'
		,dateMinimum: '20190101'
		,dateFilter	: {
			dateUnit: 'M',
			useAuto : true,	 // 검색 조건 변경시 바로 '조회' 버튼을 선택하여 검색 진행.
			disable : false, // 일자 선택 컨트롤 비활성화 여부
			fixStart: false, // 시작일 컨트롤 비활성화 여부 및 종료일에 연동	
			fixEnd	: false, // 종료일 컨트롤 비활성화 여부 및 시작일에 연동
			useUnit : {'D':true, 'W':true, 'M':true}, // 일자 유형 사용 여부
			minDate	: {'D':-730, 'W':-730, 'M': -24}, // -2Y. D:일단위, W:일단위, M:월단위 설정.
			maxDate	: {'D':   0, 'W':   0, 'M':   0},
			startDt : {'D': -13, 'W':  -6, 'M':   0}, // 시작시 설정 일자 설정. D:일단위, W:일단위, M:월단위 설정.
			endDt   : {'D':   0, 'W':   0, 'M':   0},
			fixDate	: {'D':   0, 'W':   0, 'M':   0}, // 일자선택 연동 시 기준. D:일단위, W:일단위, M:월단위 설정.
			validDay: {'D':  13, 'W':   6, 'M':  31}, // 일 단위로 설정.
			validMsg: {
				'D' : '최대 14일 데이터 조회 가능합니다.',
				'W' : '최대 1주 데이터 조회 가능합니다.',
				'M' : '최대 1개월 데이터 조회 가능합니다.'
			}
        }
		,gridCmd	: ''
		,onSearch		: undefined
		,onSearchStart	: undefined
		,onSearchEnd	: undefined
	};
	Module.init= function() {
		Base.logging(this, 'init()');
		
		let This = this,
			opts = This.options;
		This.cache= $w['oCache']( $.extend({prifix:This.classPrifix, span:30, format:'m'}, Base.clone(Appl.configuration.cacheOptions)) );
		This.cont = {
			 oContainer 	: $('#wrap')
			,oNavigation	: $('#wrap .gnb .navi .navi_box')
			,oLocationBox	: $('#main .location_box')
			,oCompanyData 	: $('#main .container .company_data_info')
			,oFilter 		: $('#main .container .date_inquiry_form')
		};
		
		if (!This.cont.oContainer || !This.cont.oContainer.length) {
			throw new Exception('Init faild SellerTool analytics.');
		}		
		This.isNavi  	= false;
		This.isFilter	= false;
		This.oDateParam	= {};
		
		This.initUI()
			.initNavigation()
			.initFilter();
		This.isInit  = (This.isNavi && $('#main').css('display') != 'none');
		
		// ////////////////////////////////////////////////////////
		// 모든 Ajax 호출시 확인.
		Base.Process.ajax.setProccessObserver({
			doAjaxProcessStart	: This.ajaxShowLoading,	// 시작시 로딩 프로그래스 시작. 
			doAjaxProcessEnd	: This.ajaxHideLoading	// 종료시 로딩 프로그래스 닫기.
		});
		// ////////////////////////////////////////////////////////
		
		
		// ////////////////////////////////////////////////////////
		// 사용 권한을 체크.  
		This.initProcessCheck();
		// 긴급 공지 표시. 
		This.initNoticePopup();
		// 신규 게시글 확인. 
		This.initNoticeNewPost();
		// ////////////////////////////////////////////////////////
		
		Base.logging(This, 'initialize completed.');
		return This;
	};
	Module.initUI= function() {
		Base.logging(this, 'initUI()');
		
		let This = this,
			oCon = This.cont.oContainer;
		
		if (!((Base.pageInfo['pId']==='SalesReport' && Base.pageInfo['sId']==='SalesSummary') ||
			   Base.pageInfo['pId']==='Registration'|| 
			   Base.pageInfo['pId']==='Board'
		 )){
			// Scroll시 상단에 Filter영역 고정.
			$($w).bind('scroll', function(event){			
				if ($(this).scrollTop() > 0) {
					if(!oCon.hasClass('layout_fixed')) {
						oCon.addClass('layout_fixed');	
						oCon.find('.company_data_info').parent().addClass('fixed');
					}
				}
				else {
					if (oCon.hasClass('layout_fixed')) {
						oCon.removeClass('layout_fixed');
						oCon.find('.company_data_info').parent().removeClass('fixed');
					}
				}
			});
		}
		
		oCon.find('.gnb_toggle').bind('click', function () {
			if (oCon.hasClass('gnb_close')) {
				oCon.removeClass('gnb_close');
			} else {
				oCon.addClass('gnb_close');
			}
			// Left Menu 숨김으로 인한 화면 크기 변경에 따른 추가 작업.
			if (Appl['winResizeTrigger']) {
				Appl['winResizeTrigger']();
			}
			return false;
		});
		
		oCon.find('.btn_help').click(function() {
			let That = $(this);
			oCon.find('.pop_tooltip').removeClass('active');
			That.closest('.content_box').css('z-index','2');
			That.closest('.content_box_col').css('z-index','2');
			That.next().addClass('active');
			return false;
		});

		oCon.find('.pop_tooltip .btn_close').click(function() {
			let That = $(this);
			That.parent().removeClass('active');
			That.closest('.content_box').css('z-index','1');
			That.closest('.content_box_col').css('z-index','1');
			return false;
		});
		
		// 브랜드 로고 이미지 처리. 이미지 로딩 오류 발생 시 Empty Image 적용.
		oCon.find('img.thumb').bind('error', function() {
			let That = $(this);
			if((That.attr('isEmptyImg')||'')!='Y') {
				That.attr('isEmptyImg', 'Y')
					.attr('src', Appl.configuration['defaultLogo']);
			}
		});
		
		// Excel File Download Button Link Setting.
		oCon.find('.btn_excel').each(function() {
			$(this).attr('href', 'javascript:void(0);');
		});

		return This;
	};
	Module.initNavigation = function() {
		Base.logging(this, 'initNavigation()');
		
		let This = this,
			oMenu= This.cont.oNavigation;
		
		if (oMenu && oMenu.length) {
			oMenu.find('li > a').bind('click', function() {
				let That = $(this).parent();
				if (That.parent().find('ul').length) {
					if (That.hasClass('active')) {
						That.removeClass('active');
					} else {
						That.addClass('active');
					}
				}
			});
			oMenu.parent().parent().find('div.btn_manual>a').bind('click', function() {
				let That= $(this);
				let file= '';//'/data1/upload/seller_insights/20210324/20210324154523_BA Manual 20210324.pdf';
				let seq = '20210323';
				let req = new XMLHttpRequest();
				req.open('POST', '/api/marketing/download', true);
				req.responseType = 'blob';
				req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				req.onload = function (e) {
					let blob = req.response;
					let link = document.createElement('a');
					link.href = $w.URL.createObjectURL(blob);
					link.download = 'AnalyticsManual.pdf';
					link.click();
				};
				req.send('fileUrl='+ file +'&dataId='+ seq);
				return false;
			});
			if (Base.pageInfo['pId']) {
				let oPage= Base.pageInfo,
					oPID = oMenu.find('li[menu-id="'+ oPage['pId'] +'"]'),
					oSID = oMenu.find('li[menu-id="'+ oPage['sId'] +'"]');
				if (oPID.length) {
					oPID.addClass('active');
				}
				if (oSID.length) {
					if (oSID.attr('memu-depth') === '3') {
						oSID.find('a').addClass('active');
						oSID.parent().parent().addClass('active');
					}
					else {
						oSID.addClass('active');
					}
				}
			}
			This.isNavi = true;	
		}
		
		return This;
	};
	Module.initFilter = function() {
		Base.logging(this, 'initFilter()');
		
		let This	= this,
			opts	= This.options,
			oFilter = This.cont.oFilter;
		if (oFilter && oFilter.length) {
			oFilter.find('select[name="dateUnit"]').bind('change', function(e) {
				let That = $(this);
				This.setFilter(That.val());
				This.setFilterMsg(That.val());
				This.setFilterDateMsg();
				// 자동 검색 처리.
				if (opts['dateFilter'] && opts['dateFilter']['useAuto'] === true) {
					$w.setTimeout(This.search.call(This), 100);
				}
			});
			oFilter.find('input[type="text"]').bind('change', function(e) {
				This.setFilterDateMsg();
			});
			oFilter.find('button[type="submit"]').bind('click', function() {
				Base.logging(This, 'searchFilter()');
				let That = $(this);
				if (That.prop('disabled')) {
					return false;
				}
				That.prop('disabled', true);
				This.search(function() {
					$w.setTimeout(function() {
						That.prop('disabled', false);
					}, 500);
				});
			});
			
			This.isFilter= true;
		}
		
		return This;
	};
	Module.initProcessCheck = function() {
		Base.logging(this, 'initProcessCheck()');
		let This = this;
		if (Base.pageInfo['pId'] == 'Registration' || Base.pageInfo['pId'] == 'CampaignReport' || !!Base['isHelper']) return; 
		Base.ajax($.extend(Base.clone(Appl.configuration.ajaxOptions), {
			 caller	: This
			,type	: 'GET'
			,async	: false
			,url	: Appl.configuration.tranUrl +'/registration/authorized'
			,success: function(data, flag, req) {
				if (data && data['code'] === '000' && data['result'] != null) {
					let o = data['result']||{};
					let nm= (Base.pageInfo['pId'] == 'Registration')
					if (!!!o['authorized']) {
						Appl.showAlert(
							 '권한 승인 절차 진행중'
							,'담당MD에게 연락해 주세요.'
							,function() {
								location.href = '/RegistrationWaiting.tmall';
							}
						);
					}
					if (!!!o['offerSeller']) {
						if (Base.pageInfo['pId'] == 'SalesReport') {
							Appl.showAlert(
								 '권한 승인 절차 진행중'
								,'정보제공 동의를 요청한 셀러가 수락하지 않아서<br/>"공식셀러 종합분석" 리포트를 조회하실 수 없습니다.<br/><br/>셀러에게 동의 수락을 독려해 주세요.'
								,function() {
									location.href = '/RegistrationSetting.tmall';
								}
							);
						}
					}
				}
			}
		}));
	};
	Module.initNoticePopup = function() {
		Base.logging(this, 'initNoticePopup()');
		let This	= this,
			sCacheNm= 'NoticePopup_',
			oNtCache= $w['oCache']({prifix:This.classPrifix, type:'local', span:1, format:'d'}),
			oParam	= {
				'isPopup'	: 'Y',
				'startDate'	: (new Date()).format('yyyymmddHHmi'),
				'endDate'	: (new Date()).format('yyyymmddHHmi')
			};		
		Base.ajax($.extend(Base.clone(Appl.configuration.ajaxOptions), {
			 caller	: This
			,type	: 'POST'
			,url	: Appl.configuration.tranUrl +'/notice/lists'
			,data	: oParam
			,success: function(data, flag, req) {
				if (data && data['dataList'] && data['dataList'].length) {
					let oData = (data['dataList']||[])[0],
						sCont = (oData['contant']||'').replaceAll('\n', '<br/>');
					
					sCacheNm = sCacheNm+oData['noticeNo'];
					if(!oNtCache.isStatus(sCacheNm)) {
						Appl.showNotice(
							 (oData['title']||'')
							,(oData['contant']||'')
							,function(isCheck) {
								 if (isCheck) {
									 oNtCache.set(sCacheNm, 'Y');
								 }
							}
						);
					}
				}
			}
		}));
	};
	Module.initNoticeNewPost = function() {
		Base.logging(this, 'initNoticeNewPost()');
		let This	= this,
			oNavi	= This.cont.oContainer.find('.navi'),
			sNpCache= 'NoticeNewPostData',
			oNpCache= $w['oCache']({prifix:This.classPrifix, type:'cache', span:10, format:'m'});
		if (!oNavi || !oNavi.find('.btn_notice .icon_new').length) {
			return;
		}
		let fnCheckNewPost = function(data) {
			let isNew = false;
			let oList = data['dataList']||[];
			for(let i = 0; i < oList.length; i++) {
				let item = oList[i];
				if (!Appl.readNotice(item['noticeNo'], true)) {
					isNew = true;
					break;
				}
			}
			if (isNew) {
				oNavi.find('.btn_notice .icon_new').show();
			}
		};
		if (oNpCache.isStatus(sNpCache)) {
			fnCheckNewPost(JSON.parse(oNpCache.get(sNpCache)));
		}
		else {
			let oParam	= {
					'page'		:  1,
					'isPopup'	: 'N',
					'dateUnit'	: 'D',
					'startDate'	: (new Date()).addDay(-7).format('yyyymmddHHmi'),
					'endDate'	: (new Date()).format('yyyymmddHHmi')
				};
			Base.ajax($.extend(Base.clone(Appl.configuration.ajaxOptions), {
				 caller	: This
				,type	: 'POST'
				,url	: Appl.configuration.tranUrl +'/notice/lists'
				,data	: oParam
				,success: function(data, flag, req) {
					if (data && data['dataList'] && data['dataList'].length) {
						oNpCache.set(sNpCache, req['responseText']||'');
						fnCheckNewPost(data);
					}
				}
			}));
		}
	};
	Module.showApprovalDialog = function() {
		Base.logging(this, 'showApprovalDialog()');
		let This	= this,
			oDialog	= $('#ar-approval-Layer');
		if (oDialog && oDialog.length) {
			Base.ajax($.extend(Base.clone(Appl.configuration.ajaxOptions), {
				 caller	: This
				,type	: 'GET'
				,url	: Appl.configuration.tranUrl +'/registration/official-seller'
				,data	: {offset:0, size:10}
				,success: function(data, flag, req) {
					if (data && data['code'] === '000' && data['dataList'] != null) {
						let oList = data['dataList']||{};						
						if (oList && oList.length) {
							let html = new StringBuilder();
							for(let i = 0; i < oList.length; i++) {
								let item = oList[i];
								html.append('<li>')
									.append('<span class="no">'+ String(i+1).digits(2) +'</span>')
									.append('<span class="name">셀러명<em class="point">'+ item['businessName'] +'</em></span>')
									.append('<span class="date">')
									.append('	<span class="tit">정보제공 동의 요청 기간</span>')
									.append('	<em class="point">')
										.append( (item['applyBeginDay']).toDate().format('yyyy-mm-dd') )
										.append( ' ~ ' )
										.append( (item['applyEndDay']).toDate().format('yyyy-mm-dd') )
									.append(	'</em>') 
									.append('</span></li>');
							}							
							oDialog.find('.stit em').text(data['totalCount']||oList.length);
							oDialog.find('.list').empty().html(html.toString(''));
							oDialog.addClass('active');
							$('#proc_masking').show();
						}
					}
				}
			}));
		}
	};
	
	Module.ajaxShowLoading = function(param) {
		let oParam = param||{};
		if (oParam['useMask']) {
			Appl.ajaxShowLoading();
		}
	};
	Module.ajaxHideLoading = function() {
		Appl.ajaxHideLoading();
	};
	
	// 검색 진행 
	Module.search = function(callback, isParameterCheck) {
		Base.logging(this, 'search()');
		
		let This	= this,
			opts	= This.options,
			oFilter = This.cont.oFilter,
			params	= This.getFilterParam();
		if (params) {			
			// 이전 검색 조건과 동일한지 확인.
			if ((isParameterCheck||false)) {
				if ((This.oDateParam['dateUnit']||'') === params['dateUnit']  &&
					(This.oDateParam['startDate']||'')=== params['startDate'] &&
					(This.oDateParam['endDate']||'')  === params['endDate']
				) {
					return;
				}
			}
			
			// 검색 기준일 저장.
			This.oDateParam = params;
			
			// 검색일자 기준 표시.
			This.setFilterDateMsg();
			
			// 전체거래액 || 주문전환률 출력.
			if (This.options['pageType'] === 'SalesReport' && This.options['menuType'] !== 'SellerStatus') {			
				This.setHeaderTotalInfo(params);
			}
			
			if (opts.onSearch) {
				opts.onSearch(params);
			}
		}
		if (callback) {
			callback.call(This);
		}
	};
	Module.getFilterParam = function() {
		Base.logging(this, 'getFilterParam()');
		
		let This	= this,
			oFilter = This.cont.oFilter,
			opts	= This.options;
		
		if (oFilter.length && oFilter.find('select[name="dateUnit"]').length) {
			let dateUnit = oFilter.find('select[name="dateUnit"]').val();
			
			if (This.isValidFilter()) {
				let fSdt = oFilter.find('input[filter-type='+ dateUnit +'][name=startDt]').val(),
					fEdt = oFilter.find('input[filter-type='+ dateUnit +'][name=endDt]').val(),
					oSdt = undefined, oEdt = undefined,
					bSdt = undefined, bEdt = undefined;
				if (dateUnit !== 'M' && (!String(fSdt).isDate() || !String(fEdt).isDate())) {
					throw new Exception('Type Validation Exception.');
				}
				if (dateUnit === 'M') {
					if (fSdt.length === 10) {
						oSdt = String(fSdt).toDate();
						oEdt = String(fEdt).toDate();
					} else {
						oSdt = String(fSdt+'-01').toDate();
						oEdt = String(fEdt+'-01').toDate().addMonth(1).addDay(-1);	
					}
				} else {
					oSdt = fSdt.toDate();
					oEdt = fEdt.toDate();
				}
				let cDay = oSdt.calculator(oEdt) / (24*60*60*1000) - 1;
				if (dateUnit === 'M') {
					cDay = Math.round(cDay/30, 0);
					bSdt = oSdt.addMonth(cDay);
					bEdt = bSdt.addMonth((cDay*-1)).addDay(-1);
				} else {
					bSdt = oSdt.addDay(cDay);
					bEdt = oEdt.addDay(cDay);
				}
				let params ={
					 'dateUnit'	: dateUnit
					,'startDate': oSdt.format(opts.dateFormat)
					,'endDate'	: oEdt.format(opts.dateFormat)
					//,'bfStartDt': bSdt.format(opts.dateFormat)
					//,'bfEndDt'	: bEdt.format(opts.dateFormat)
				};
				if (!!Base['isHelper']) {
					params = $.extend(params, (Base['val']()||{}));
				}
				return params;
			} else {
				return undefined;	
			}
		}
		else {
			if (Base.pageInfo['latestFinishedBatch'] && Base.pageInfo['latestFinishedBatch']['dailyJobLatestDate']) {
				let params = {
					dateUnit : 'D',
					endDate	 : Base.pageInfo['latestFinishedBatch']['dailyJobLatestDate'],
					startDate: Base.pageInfo['latestFinishedBatch']['dailyJobLatestDate'].toDate().addDay(-89).format('yyyymmdd')
				};
				if (!!Base['isHelper']) {
					params = $.extend(params, (Base['val']()||{}));
				}
				return params;
			}
			else {
				return {};
			}
		}		
	};
	// 달력 검색조건 셋팅
	Module.setFilter = function(type, isInit) {
		Base.logging(this, 'setFilter('+type+', '+ (isInit||false) +')');

		let This		= this,
			oFilter 	= This.cont.oFilter,
            dateUnit	= This.options.dateUnit = type||This.options.dateFilter.dateUnit, // default dateUnit : M
            useDateUnit	= This.options.dateFilter['useUnit'] ||!1,
            isInitFilter= typeof isInit == 'boolean' ? isInit :!1,
            isDisable	= This.options.dateFilter['disable'] ||!1,
			isFixStd 	= This.options.dateFilter['fixStart']||!1,
			isFixEnd 	= This.options.dateFilter['fixEnd']  ||!1

		oFilter.find('input[type="text"]').hide();
		oFilter.find('select>option[value="' + dateUnit + '"]').prop('selected', true);
		
		if (isInitFilter) {
			if (useDateUnit) {
				// 사용하지 않는 날자 유형 제거.
				if (useDateUnit['D'] === false) oFilter.find('select>option[value="D"]').remove();
				if (useDateUnit['W'] === false) oFilter.find('select>option[value="W"]').remove();
				if (useDateUnit['M'] === false) oFilter.find('select>option[value="M"]').remove();
			}
			if (isDisable) {
				oFilter.find('input[filter-type=D]').prop('disabled', true);
				oFilter.find('input[filter-type=W]').prop('disabled', true);
				oFilter.find('input[filter-type=M]').prop('disabled', true);
			}
			else {
				oFilter[(isFixStd || isFixEnd ? 'hide':'show')].call(oFilter.find('.section_bar'));
				if (isFixStd) {
					oFilter.find('input[name=startDt]').prop('disabled', true).hide();
				}
				else {
					oFilter.find('input[name=startDt]').prop('disabled', false);
				}
				if (isFixEnd) {
					oFilter.find('input[name=endDt]').prop('disabled', true).hide();
				}
				else {
					oFilter.find('input[name=endDt]').prop('disabled', false);
				}
			}
		}
		if (!isFixStd) {
			oFilter.find('input[name=startDt][filter-type="'+ dateUnit +'"]').show();
		}
		if (!isFixEnd) {
			oFilter.find('input[name=endDt][filter-type="'+ dateUnit +'"]').show();
		}
	};
	Module.setFilterMsg = function(type) {
        Base.logging(this, 'setFilterMsg(' + type + ')');

		let This	= this,
            dateUnit= type||'M',
			oFilter = This.cont.oFilter,
            oValidMsg=This.options.dateFilter['validMsg']||{};

        let filterMsg = oValidMsg[dateUnit]||'';
		if (filterMsg !== '') {
			oFilter.find('.date_box p').text(filterMsg);
		}
		return filterMsg;
	};	
	// 달력 기본날짜 셋팅
	Module.setFilterDate = function(options) {
		Base.logging(this, 'setFilterDate()');
		let This = this,
			opts = options || {};

		This.options.pageType   = opts['pageType']  || This.options.pageType    || '';
		This.options.menuType   = opts['menuType']  || This.options.menuType    || '';

		if (!This.options.pageType || !This.options.menuType) {
			throw Exception('IllegalArgumentException - pageType||menuType  is empty');
		}

		if (Base.pageInfo['latestFinishedBatch']) {
			// BA_데이터 적재 실패로 인한 빈값일 경우, 안내창제공
			// https://jira.11stcorp.com/browse/S2-2553
			This.doCheckBatchDate();
			
			// Filter UI 세팅 진행.				
			This.setFilterDateUI(Base.pageInfo['latestFinishedBatch']);
			This.setFilter(This.options.dateUnit, true);
			This.setFilterDateMsg();

			if (typeof opts['callback'] == 'function') {
				$w.setTimeout(function() {
					opts['callback']();
				}, 1);
			}
			if (This.options.onSearch) {
				$w.setTimeout(function() {
					This.search();
				}, 1);
			}
		}
		else {
			// 배치 실행일 정보 읽어 필터 설정.
			Appl.ajax(This, 'common/initialize', {}, function(data, status, res) {
				Base.tracking('load initialize data.', This, arguments);
				if (data && data['code'] === '000') {
					let result = data['result'];
					Base.pageInfo['latestFinishedBatch'] = result['latestFinishedBatchV1']||{};
					This.setFilterDate(opts);
				}
				else {
					alert('초기화 오류 발생.\n\n- 관리자에게 문의해 주세요.');
				}
			}, false, false);
		}
	};
	Module.setFilterDateUI = function(oBatchDate) {
		Base.logging(this, 'setFilterDateUI()');
		if (!oBatchDate) return;

		let This 	 = this,
			oDateEnv = Appl.configuration.dateUnit,
			oFilter	 = This.cont.oFilter,
			sDateUnit= This.cont.oFilter.find('select').val(),
			oNow	 = (new Date()),
			sNowDate = oNow.format('yyyymmdd'),
			pageType = This.options.pageType,
			menuType = This.options.menuType,
			sMinimum = This.options['dateMinimum']||'20190101',
			oMinDate = This.options.dateFilter['minDate'] ||{},
			oMaxDate = This.options.dateFilter['maxDate'] ||{},
			oFixDate = This.options.dateFilter['fixDate'] ||{},
			oStdDate = This.options.dateFilter['startDt'] ||{},
			oEndDate = This.options.dateFilter['endDt']   ||{},
			oValidDay= This.options.dateFilter['validDay']||{},
			isAutoSch= This.options.dateFilter['useAuto'] ||!1,
			isDisable= This.options.dateFilter['disable'] ||!1,
			isCustom = This.options.dateFilter['custom']  ||!1,
			isFixStd = This.options.dateFilter['fixStart']||!1,
			isFixEnd = This.options.dateFilter['fixEnd']  ||!1
		;
		
		// 배치 실행일자 반영.
		const	oDateDaily	= (oBatchDate[oDateEnv.D.batchName] || sNowDate).toDate(),
				oDateWeekly	= (oBatchDate[oDateEnv.W.batchName] || sNowDate).toDate(),
				oDateMonthly= (oBatchDate[oDateEnv.M.batchName] || sNowDate).toDate(),
				oDateMinimum= (sMinimum).toDate();
		// 달력 시작일. 최소 일자.
		let _getDateMinimum = function(o) {
			let chk = oDateMinimum.calculator(o);
			Base.logging(this, 'setFilterDateUI()._getDateMinimum() : '+ oDateMinimum.format('yyyymmdd') +' - '+ o.format('yyyymmdd') +'='+ chk);
			return oDateMinimum.calculator(o) < 0 ? o : oDateMinimum;
		};
		
		// 일간 데이터 셋팅
		let dateDay	    = oDateDaily.addDay(0),
            pickerOptD  = {
                dateFormat: 'yy-mm-dd',
                minDate : _getDateMinimum( (oMinDate['D'] ? dateDay.addDay(oMinDate['D']) : dateDay.addYear(-1)) ),
                maxDate : (oMaxDate['D'] ? dateDay.addDay(oMaxDate['D']) : dateDay.addDay(0))
            };
        oFilter.find('input[filter-type=D][name=startDt]').val(dateDay.addDay((oStdDate['D'] ? oStdDate['D'] : -13)).format('yyyy-mm-dd'));
        oFilter.find('input[filter-type=D][name=endDt]').val(dateDay.addDay((oEndDate['D'] ? oEndDate['D'] : -0)).format('yyyy-mm-dd'));
        oFilter.find('input[filter-type=D][name=startDt]').datepicker($.extend({
			onClose: function( selectedDate ) {
				if (isFixEnd) {
					let selDate = selectedDate.toDate().addDay( (oFixDate['D'] ? oFixDate['D']:30) );
					if (!isCustom) {
						oFilter.find('input[filter-type=D][name=endDt]').val(selDate.format('yyyy-mm-dd'));
					}
				}
				// 자동 검색 처리.
				if (isAutoSch) { $w.setTimeout(This.search.call(This, false, true), 10); }
			}
		}, pickerOptD));
		oFilter.find('input[filter-type=D][name=endDt]').datepicker($.extend({
			onClose: function( selectedDate ) {
				if (isFixStd) {
					let selDate = selectedDate.toDate().addDay( -(oFixDate['D'] ? oFixDate['D']:30) );
					if (!isCustom) {
						oFilter.find('input[filter-type=D][name=startDt]').val(selDate.format('yyyy-mm-dd'));
					}
				}
				// 자동 검색 처리.
				if (isAutoSch) { $w.setTimeout(This.search.call(This, false, true), 10); }
			}
		}, pickerOptD));


		// 주간 데이터 셋팅
		let dateWeek    = oDateWeekly.addDay(-oDateWeekly.getDay()), // 월요일로 설정. 
            pickerOptW  = {
                dateFormat: 'yy-mm-dd',
                minDate : _getDateMinimum( (oMinDate['W'] ? dateWeek.addDay(oMinDate['W']) : dateWeek.addYear(-1)) ),
                maxDate : (oMaxDate['W'] ? dateWeek.addDay(oMaxDate['W']) : dateWeek.addDay(0))
		    };
        oFilter.find('input[filter-type=W][name=startDt]').val(dateWeek.addDay((oStdDate['W'] ? oStdDate['W']: -6)).format('yyyy-mm-dd'));
        oFilter.find('input[filter-type=W][name=endDt]').val(dateWeek.addDay((oEndDate['W'] ? oEndDate['W']  : -0)).format('yyyy-mm-dd'));
		oFilter.find('input[filter-type=W][name=startDt]').datepicker($.extend({
			onClose: function( selectedDate ) {
				let selDate = selectedDate.toDate();
				if (isFixEnd) {
					selDate = selDate.addDay( (oFixDate['W'] ? oFixDate['W']:6) );
				}
				else {
					selDate = selDate.addDay( (oStdDate['W'] ? (oStdDate['W']*-1):6) );
				}
				if (!isCustom) {
					oFilter.find('input[filter-type=W][name=endDt]').val(selDate.format('yyyy-mm-dd'));
				}
				// 자동 검색 처리.
				if (isAutoSch) { $w.setTimeout(This.search.call(This, false, true), 10); }
			},
			beforeShowDay: function(selectedDate){
				return [(selectedDate.getDay() === 1)];
			}
		}, pickerOptW));
		oFilter.find('input[filter-type=W][name=endDt]').datepicker($.extend({
			onClose: function( selectedDate ) {
				let selDate = selectedDate.toDate();
				if (isFixStd) {
					selDate = selDate.addDay( -(oFixDate['W'] ? oFixDate['W']:6) );
				}
				else {
					selDate = selDate.addDay( (oStdDate['W'] ? oStdDate['W']:-6) );
				}
				if (!isCustom) {
					oFilter.find('input[filter-type=W][name=startDt]').val(selDate.format('yyyy-mm-dd'));
				}
				// 자동 검색 처리.
				if (isAutoSch) { $w.setTimeout(This.search.call(This, false, true), 10); }
			},
			beforeShowDay: function(selectedDate){
				return [(selectedDate.getDay() === 0)];
			}
		}, pickerOptW));

		// 월간 데이터 셋팅
		let dateYear    = ($P['pId'] == 'CampaignReport' && $P['sId'] == 'PreplanningPerformance') ? oNow : oDateMonthly.addDay(-oDateMonthly.getDate()+1),
            maxMonth    = (dateYear.format('yyyymm')+'01').toDate().addMonth((oMaxDate['M'] ? oMaxDate['M'] : 0)),
			minMonth    = (dateYear.format('yyyymm')+'20').toDate().addMonth((oMinDate['M'] ? oMinDate['M'] : -12)),
			selectTarget= undefined,
			pickerOptM  = {
				Button: false,
				MonthFormat: 'yy-mm',
				MinMonth: _getDateMinimum( minMonth ),
				MaxMonth: maxMonth,
				OnBeforeMenuOpen: function(e){
					selectTarget = (e||event).target;
				},
				OnAfterMenuClose : function() {
					if (selectTarget && $(selectTarget).length) {
						let That = $(selectTarget),
							sVal = (That.val()+'-01').toDate();
						if (!isCustom) {
							if (That.attr('name') === 'startDt') {
								if (isFixEnd) {
									sVal = sVal.addMonth( (oFixDate['M'] ? oFixDate['M']:0) );
								}
								oFilter.find('input[filter-type=M][name=endDt]').val(sVal.format('yyyy-mm'));	
							}
							else {
								if (isFixStd) {
									sVal = sVal.addMonth( -(oFixDate['M'] ? oFixDate['M']:0) );
								}
								oFilter.find('input[filter-type=M][name=startDt]').val(sVal.format('yyyy-mm'));	
							}
						}
						// 자동 검색 처리.
						if (isAutoSch) { $w.setTimeout(This.search.call(This, false, true), 10); }
					}
				}
			};
		oFilter.find('input[filter-type=M][name=startDt]').val(maxMonth.addMonth((oStdDate['M'] ? oStdDate['M'] : 0)).format('yyyy-mm'));
		oFilter.find('input[filter-type=M][name=endDt]').val(maxMonth.addMonth((oEndDate['M'] ? oEndDate['M'] : 0)).format('yyyy-mm'));
		oFilter.find('input[filter-type=M][name=startDt]').MonthPicker(pickerOptM);
		oFilter.find('input[filter-type=M][name=endDt]').MonthPicker(pickerOptM);
		oFilter.find('input[filter-type=M]').bind('click', function() {
			let That = $(this),
				width= 370,
				left = That.offset()['left'];
			if ($($w).width() < left + width) {
				left = $($w).width() - width;
			}
			$('.month-picker').css({'width':width+'px', 'left': left+'px'});
		});
		
		// 상태 저장된 일자 사용.
		if (Appl['statusManager']) {
			Appl['statusManager'].applyDate(pageType, oFilter);
		}
		
        $('#ui-datepicker-div').hide();
	};
	Module.setFilterDateMsg = function() {
		Base.logging(this, 'setFilterDateMsg()');
		if(!Base.pageInfo['latestFinishedBatch']) return;
		let This = this,
			oDateEnv= Appl.configuration.dateUnit,
			oFilter = This.cont.oFilter,
			oNow 	= (new Date()),
			sNowDate= oNow.format('yyyymmdd'),
			menuType= This.options.menuType;

		// 배치 실행일자 반영.
		const	oBatchDate	= Base.pageInfo['latestFinishedBatch'],
				oDateDaily	= (oBatchDate[oDateEnv.D.batchName]||sNowDate).toDate(),
				oDateWeekly	= (oBatchDate[oDateEnv.W.batchName]||sNowDate).toDate(),
				oDateMonthly= (oBatchDate[oDateEnv.M.batchName]||sNowDate).toDate(),
				sDateUnit	= oFilter.find('select[name="dateUnit"]').val(),
				sDateSDT	= oFilter.find('input[filter-type='+ sDateUnit +'][name=startDt]').val(),
				sDateEDT	= oFilter.find('input[filter-type='+ sDateUnit +'][name=endDt]').val();

		let dateMsg = '';
		if (sDateUnit === 'D') {
			let oSDT = sDateSDT.toDate();
			let oEDT = sDateEDT.toDate();
			dateMsg = String('({0} ~ {1} 조회. 업데이트일 : {2})').format(
				oSDT.format('yyyy년 mm월 dd일'), oEDT.format('yyyy년 mm월 dd일'), oDateDaily.addDay(1).format('yyyy-mm-dd')
			);
		}
		else if (sDateUnit === 'W') {
			let oSDT = sDateSDT.toDate();
			let oEDT = sDateEDT.toDate();
			dateMsg = String('({0} ~ {1} 조회. 업데이트일 : {2})').format(
				oSDT.format('yyyy년 mm월 dd일'), oEDT.format('yyyy년 mm월 dd일'), oDateWeekly.addDay(1).format('yyyy-mm-dd')
			);
		}
		else if (sDateUnit === 'M') {
			if (sDateSDT === sDateEDT) {
				let oSDT = String(sDateSDT+'-01').toDate();
				dateMsg = String('( {0} 조회. 업데이트일 : {1})').format(
					oSDT.format('yyyy년 mm월'), oDateMonthly.addDay(1).format('yyyy-mm-dd')
				);	
			}
			else {
				let oSDT = String(sDateSDT+'-01').toDate();
				let oEDT = String(sDateEDT+'-01').toDate();
				dateMsg = String('( {0} ~ {1} 조회. 업데이트일 : {2})').format(
						oSDT.format('yyyy년 mm월'), oEDT.format('yyyy년 mm월 '), oDateMonthly.addDay(1).format('yyyy-mm-dd')
				);
			}
		}

		switch(menuType) {
			case 'SellerStatus':
				break;
			default:
				oFilter.find('.data_criteria_info').text(dateMsg);
				break;
		}
	};
	Module.isValidFilter = function() {
		Base.logging(this, 'isValidFilter()');

		let This     = this,
			oFilter  = This.cont.oFilter,
		    pageType = This.options.pageType || '',
			menuType = This.options.menuType || '',
            dateUnit = This.options.dateUnit || '',
            oValidDay= This.options.dateFilter['validDay']||{'D':13,'W':6,'M':31},
            oValidMsg= This.options.dateFilter['validMsg']||{},
			filterSdt= oFilter.find('input[name=startDt][filter-type="'+ dateUnit +'"]').val() || '',
			filterEdt= oFilter.find('input[name=endDt][filter-type="'+ dateUnit +'"]').val() || '';
	
		if (dateUnit === '' || filterSdt === '' || filterEdt === '') {
			alert('검색 일자를 선택해 주세요.');
			return false;
		}
		if (dateUnit !== 'M' && (!String(filterSdt).isDate() || !String(filterEdt).isDate())) {
			alert('검색 일자가 날짜 유형이 아닙니다.');
			return false;
		}

		//if (Base['supportFilter']) return true;
		
		let oNow = new Date(),
			oSdt = undefined, 
			oEdt = undefined;
		if (dateUnit === 'M') {
			if (filterSdt.length === 10) {
				oSdt = String(filterSdt).toDate();
				oEdt = String(filterEdt).toDate();
			} else {
				oSdt = String(filterSdt+'-01').toDate();
				oEdt = String(filterEdt+'-01').toDate().addMonth(1).addDay(-1);	
			}
		} else {
			oSdt = filterSdt.toDate();
			oEdt = filterEdt.toDate();
		}
		let sDay = oNow.calculator(oSdt) / (24*60*60*1000),
			cDay = oEdt.calculator(oSdt) / (24*60*60*1000);
			
		if (cDay < 0) {
			if (dateUnit === 'W') {
				alert('주간 검색은 월요일부터 조회 가능합니다.\n조회 종료일은 조회 시작일보다 앞설 수 없습니다.');
			} else {
				alert('조회 종료일은 조회 시작일보다 앞설 수 없습니다.');
			}
			return false;
		}

		let validDay = oValidDay[dateUnit],
            validMsg = oValidMsg[dateUnit]||'조회 허용 범위보다 큰 조회 범위 입니다.';
		if (cDay > validDay) {
            alert(validMsg);
            return false;
        }

		return true;
	};
	/**
	 * BA_데이터 적재 실패로 인한 빈값일 경우, 안내창제공
	 * https://jira.11stcorp.com/browse/S2-2553
	 */
	Module.doCheckBatchDate = function(isRun, batchDates) {
		Base.logging(this, 'doCheckBatchDate()');
		Base.tracking('Module.doCheckBatchDate()', Module.oDateParam, batchDates);
		let This	= this,
			oDateEnv= Appl.configuration.dateUnit, 
			oNow	= (new Date()).format('yyyymmdd').toDate(),
			oOpts	= This['options'],
			oFilter	= This['options']['dateFilter'],
			oCheck	= This['oBatchCheck']= This['oBatchCheck']||{},
			oFiBatch= Base.pageInfo['latestFinishedBatch']||{},
			oRpBatch= batchDates||{};
		
		if (oOpts['dataName'] && !oCheck[oOpts['dataName']]) {
			if (!isRun) {
				Appl.ajax(This, 'common/dates', {'dataPackageName':oOpts['dataName']}, function(data, flag, req) {
					This.doCheckBatchDate(true, data);
				}, false, true);
			}
			else {
				let isShowPop = false,
					oChackDate= oNow,
					oAxisDate = '';
				
				for(let attr in oDateEnv) {
					let date = oDateEnv[attr],
						name = oDateEnv[attr]['batchName'];
					
					oFiBatch[name] = (oFiBatch[name] ? oFiBatch[name].toDate().format('yyyymmdd') : oNow.format('yyyymmdd'));
					oRpBatch[name] = (oRpBatch[name] ? oRpBatch[name].toDate().addDay(-1).format('yyyymmdd') : oFiBatch[name]);
					oFiBatch[name] = oRpBatch[name];
					
					if (attr == 'D') oChackDate = oNow;
					if (attr == 'W') oChackDate = oNow.addDay(-oNow.getDay()+1);
					if (attr == 'M') oChackDate = oNow.addDay(-oNow.getDate()+1);
					if (attr == oFilter['dateUnit']) {
						oAxisDate = (oFiBatch[name]).toDate();
						//isShowPop = (oAxisDate.compare(oChackDate.addDay(-1)) < 0);
					}
				}
				if (isShowPop) {
					Appl.showAlert('시스템 장애'
						,'데이터 적재가 완료되지 않았습니다.<br>잠시 후 다시 시도해주세요.'
						,function() {
							oCheck[oOpts['dataName']] = true;
						});
				}
				else {
					oCheck[oOpts['dataName']] = true;
				}	
			}
		}
	};

	/**
	 * 전체거래액 || 주문전환률 출력.|| 페이지뷰합계 출력.
	 */
	Module.setHeaderTotalInfo = function(params) {
		Base.logging(this, 'setHeaderTotalInfo()');
		let This	= this,
			oPanel	= This.cont.oCompanyData.find('.data_info'),
			oParams	= $.extend((params||This.getFilterParam()), {brandNo: $U.uBNo});
		if(!oPanel||!oPanel.length) return;
			oPanel.hide();
			
		let tranTxt = '',
			tranApi = '',
			oRender = '';
		
		if (This.options['menuType'] === 'ConvertCategory' ||
			This.options['menuType'] === 'ConvertProduct'
		) {
			tranTxt = '주문전환율';
			tranApi = 'ownerSalesConversionResult';
			oRender	= 'setHeaderTotalInfoSalesConversionResult';
		}
		else if (This.options['menuType'] === 'InflowCategory') {
			tranTxt = '페이지뷰 합계';
			tranApi = 'ownerInflowPageViewResult';
			oRender	= 'setHeaderTotalInfoInflowPageViewResult';
			oParams['largeCategoryNo'] = '0';
			oParams['middleCategoryNo']= '0';
		}
		else if (This.options['menuType'] === 'InflowProduct') {
			tranTxt = ''
			tranApi = 'ownerInflowPageViewResult';
			oRender	= 'setHeaderTotalInfoProductwResult';
		}
		else {
			tranTxt = '전체거래액';
			tranApi = 'ownerSalesTotalAmount';
			oRender	= 'setHeaderTotalInfoSalesTotalAmount';
		}
		if (!tranApi) return;
		
		// 전체거래액 || 주문전환률 정보 읽기.
		Base.pageInfo[tranApi] = !1;
		Appl.ajax(This, ('common/'+tranApi), oParams, function(data, flag, req) {
			Base.tracking('load setHeaderTotalInfo('+ tranApi +')', This, arguments);
			if (data && data['code'] === '000' && data['result']) {
				Base.pageInfo[tranApi] = data['result']||{};
				This[oRender].call(This, tranTxt, tranApi, params);
			}
		}, false, true);
	};
	Module.setHeaderTotalInfoProductwResult= function(tranTxt, tranApi, oParams) {
		let This	= this,
			oPanel	= This.cont.oCompanyData.find('.data_info'),
			oLogoBox =  This.cont.oCompanyData.find('.logo_box .name').html();
		if (!oPanel||!oPanel.length) return;
		if (Base.pageInfo[tranApi]) {
			let result	= Base.pageInfo[tranApi],
				html	= new StringBuilder();
			//	html.append('<dt>'+oLogoBox+'</dt>');
			html.append('</dd>');
			oPanel.show();
			oPanel.html(html.toString());
		}
	};
	// Header 영역의 전체 거래액 출력.
	Module.setHeaderTotalInfoSalesTotalAmount = function(tranTxt, tranApi, oParams) {
		Base.logging(this, 'setHeaderTotalInfoSalesTotalAmount('+ tranApi +')');
		let This	= this,
			oPanel	= This.cont.oCompanyData.find('.data_info');

		if (!oPanel||!oPanel.length) return;
		if (Base.pageInfo[tranApi]) {
			let result	= Base.pageInfo[tranApi],
				html	= new StringBuilder();
			let amountVal	= String(result['totalAmount']).parseInt(),
				amountSign	= '원';

			/***
			if (amountVal > 0) {
				let oCurc = amountVal.toCurrencyCal();
				amountVal = oCurc['value'];
				amountSign= oCurc['unit'];
			} */
			
			html.append('<dt>'+ tranTxt +'</dt>');
			html.append('<dd>');
			html.append('	<strong><span class="num">'+ amountVal.toComma() +'</span>'+ amountSign +'</strong>');
			if (result['showComparison'] === true) {
				html.append(String('<span class="mom {3}">({0}o{0} : <strong>{1}{2}%</strong>)</span>').format(
					      oParams['dateUnit']
						, result['comparativeRate']>0 ? '+':''
						, result['comparativeRate'].toFixed(2)
						, result['comparativeRate']>0 ? 'stat_up':'stat_down'
				));
			}
			else {
				html.append('<span class="mom">&nbsp;</span>');
			}
			html.append('</dd>');
			oPanel.show();
			oPanel.html(html.toString());
		}
	};
	// Header 영역의 전체 주문전환 실적 출력.
	Module.setHeaderTotalInfoSalesConversionResult = function(tranTxt, tranApi, oParams) {
		Base.logging(this, 'setHeaderTotalInfoSalesConversionResult('+ tranApi +')');
		let This	= this,
			oPanel	= This.cont.oCompanyData.find('.data_info');
	
		if (!oPanel||!oPanel.length) return;
		if (Base.pageInfo[tranApi]) {
			let result	= Base.pageInfo[tranApi],
				html	= new StringBuilder();

			let rate = result['conversionRate']||0,
				sign = (rate > 0 ? '':'');
			html.append('<dt>'+ tranTxt +'</dt>');
			html.append('<dd class="stat_info">');
			html.append('	<strong class="stat_main"><span class="num">'+ sign + rate.toFixed(2) +'</span>%</strong>');
			html.append('	<div class="stat_box">');
			if (result['showComparison'] === true) {
				html.append(String('<span class="mom {3}">({0} : <strong>{1}{2}%p</strong>)</span>').format(
					      (oParams['dateUnit'] == 'M' ? '전월대비증감' : '전주대비증감') 
						, result['conversionComparativeRate']>0 ? '+':''
						, result['conversionComparativeRate'].toFixed(2)
						, result['conversionComparativeRate']>0 ? 'stat_up':'stat_down'
				));
			}
			else {
				html.append('<span class="mom">&nbsp;</span>');
			}
			html.append(String('<span class="stat">PV : <strong>{0}</strong> / 결제건수 : <strong>{1}건</strong></span>').format(
					  (result['pageViewCount']||0).toComma()
					, (result['payCount']||0).toComma()
				));
			html.append('	</div>');
			html.append('</dd>');
			oPanel.show();
			oPanel.html(html.toString());
		}
	};
	// Header 영역의 전체 페이지뷰
	Module.setHeaderTotalInfoInflowPageViewResult = function(tranTxt, tranApi, oParams) {
		Base.logging(this, 'setHeaderTotalInfoInflowPageViewResult('+ tranApi +')');
		let This	= this,
			oPanel	= This.cont.oCompanyData.find('.data_info');

		if (!oPanel||!oPanel.length) return;
		if (Base.pageInfo[tranApi]) {
			let result	= Base.pageInfo[tranApi],
				html	= new StringBuilder();

			html.append('<dt>'+ (tranTxt || '') +'</dt>');
			html.append('<dd>');
			html.append('	<strong><span class="num">'+ (result['totalPageviewCnt'] || 0).toComma() +'</strong>');
			if (result['showComparison'] === true) {
				html.append(String('<span class="mom {3}">({0}o{0} : <strong>{1}{2}%</strong>)</span>').format(
					oParams['dateUnit']
					, result['comparativeRate']>0 ? '+':''
					, result['comparativeRate'].toFixed(2)
					, result['comparativeRate']>0 ? 'stat_up':'stat_down'
				));
			}
			else {
				html.append('<span class="mom">&nbsp;</span>');
			}
			html.append('</dd>');
			oPanel.show();
			oPanel.html(html.toString());
		}
	};

}) (window, jQuery);
