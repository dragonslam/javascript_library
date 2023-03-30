/* common.base.excel.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base = $w[root];
    const Utils= Base.Utils;
    const Fetch= Base.Fetch;

    const Excel = {
        download: async function(obj ={}){
            const Appl = Base.Core.namespace(__DOMAIN_CONF['js_base_name']);
            const createObj = {
                fileName : obj.fileName||"excel",
                sheetName : obj.sheetName,
                rowObj:[]
            }
            Appl.wrapDimedOn();
            if(obj.url){
                await Fetch.post(obj.url, obj.params,{dataType:'json'}).then(async function(result) {
					if(result && !Utils.isEmptyObject(result)){
	                    obj.rowDataArr = result.dataList ? result.dataList : result;
					}
                    createObj.rowObj = getExcelRowArr(obj);
                    await createExcelFile(createObj);
                }).catch(function(e) {
                    alert(e.errorMessage);
                });
            }else{
                createObj.rowObj = getExcelRowArr(obj);
                await createExcelFile(createObj);
            }
            Appl.wrapDimedOff();
        }
    };

    const getExcelRowArr = function (obj){
        const rowObj={
            topDescArr : obj.topDescArr||[],
            headerArr : [],
            dataArr: []
        };

        let columnsArr = obj.grid != undefined ? obj.grid.getExcelColumns() : obj.columns;
        const rowDataArr = obj.rowDataArr;
        if(!Utils.isEmptyObject(columnsArr)){
            if(!Array.isArray(columnsArr[0])){
                columnsArr = [columnsArr];
            }
            const headerLength = columnsArr.length;
            columnsArr.forEach((columns, idx) =>{
                rowObj.headerArr.push(columns);

                if(headerLength-1 == idx){
                    if(!Utils.isEmptyObject(rowDataArr)){
                        rowDataArr.forEach(rowData =>{
                            const valueArr = [];
                            columns.forEach(colObj =>{
                                let value = colObj.defaultValue;
                                if(rowData[colObj.binding || colObj.id] != undefined){
                                    value = rowData[colObj.binding || colObj.id];
                                }
                                if (colObj.type == "C" && !!colObj.combomap) {
                                    value = colObj.combomap[value] || value;
                                }
                                valueArr.push(value);
                            });
                            rowObj.dataArr.push(valueArr);
                        });
                    }
                }
            });
        }
        return rowObj;
    }

    const createExcelFile = async function(obj){
      await import(`${Base.config['js_library_path']}/grid/lib/xlsx.esm-0.19.0.min.js`).then(function(XLSX) {
            const topDescArr = obj.rowObj.topDescArr || [];
            const headerArr = obj.rowObj.headerArr;
            const dataArr = obj.rowObj.dataArr;
            const headerNameArr = headerArr.map(header => header.map(column=>column.header));
            const header = headerArr[headerArr.length-1]||[];

            const workbook = XLSX.utils.book_new();
            const worksheetOption = {};
            const merge =[];

            let worksheet = {};
            let worksheetRef = {};

            if(!Utils.isEmptyObject(topDescArr)){
                const topDescValArr= topDescArr.map(topDesc=> [...Array(header.length||1)].map((val,idx) => {
                        let retVal = "";
                        if (idx==0){
                            if(topDesc.value == undefined){
                                topDesc.value = "";
                            }
                            retVal = topDesc.value;
                        }
                        return retVal;
                    })
                );

                worksheet = XLSX.utils.sheet_add_aoa(null, topDescValArr, worksheetOption);
                worksheetOption.origin = -1;
                worksheetRef = XLSX.utils.decode_range(worksheet['!ref']);
                for(let R = worksheetRef.s.r, topDescCnt=0; R <= worksheetRef.e.r; ++R, topDescCnt++) {
                    for(let C = worksheetRef.s.c; C <= worksheetRef.e.c; ++C) {
                        const key = XLSX.utils.encode_cell({r:R,c:C});
                        if (worksheet[key] && !worksheet[key].customType) {
                            worksheet[key].customType ="topDesc";
                            worksheet[key].customStyle = topDescArr[topDescCnt].style;
                        }
                    }
                    merge.push({
                        s: { r:R, c:worksheetRef.s.c},
                        e: { r:R, c:worksheetRef.e.c}
                    });
                }
            }

            //헤더추가
            if(!Utils.isEmptyObject(headerNameArr)){
                worksheet = XLSX.utils.sheet_add_aoa(worksheet, headerNameArr, worksheetOption);
                worksheetOption.origin = -1;
                worksheetRef = XLSX.utils.decode_range(worksheet['!ref']);

                const mergedColNm = [];
                for(let R = worksheetRef.s.r; R <= worksheetRef.e.r; ++R) {
                    let tmpMergedCell = [];
                    for(let C = worksheetRef.s.c; C <= worksheetRef.e.c; ++C) {
                        const key = XLSX.utils.encode_cell({r: R, c: C});

                        if (worksheet[key] && !worksheet[key].customType) {
                            worksheet[key].customType = "header";
                            const value = worksheet[key].v;

                            //merge(col span)
                            const preKey = XLSX.utils.encode_cell({r: R, c: C-1});
                            if(worksheet[preKey] && worksheet[preKey].v == value){
                                if(!tmpMergedCell.includes(preKey)){
                                    tmpMergedCell.push(preKey);
                                }
                                tmpMergedCell.push(key);
                            }else{
                                if(!Utils.isEmptyObject(tmpMergedCell)){
                                    merge.push( {
                                        s: XLSX.utils.decode_cell(tmpMergedCell[0]),
                                        e: XLSX.utils.decode_cell(tmpMergedCell[tmpMergedCell.length-1])
                                    });
                                    tmpMergedCell.forEach(cell=>{
                                        mergedColNm.push(cell.replace(/[0-9]/g,''));
                                    });
                                    tmpMergedCell = [];
                                }
                            }
                        }
                    }
                }

                //merge(row span)
                for (let C = worksheetRef.s.c; C <= worksheetRef.e.c; ++C) {
                    for(let R = worksheetRef.s.r; R <= worksheetRef.e.r; ++R) {
                        const key = XLSX.utils.encode_cell({r: R, c: C});
                        if (worksheet[key] && worksheet[key].customType == "header") {
                            if(R != worksheetRef.e.r){
                                const colNm = key.replace(/[0-9]/g,'');
                                if(!mergedColNm.includes(colNm)) {
                                    merge.push({
                                        s: { r:R, c:C},
                                        e: { r:worksheetRef.e.r, c:C}
                                    });
                                }
                            }
                            break;
                        }
                    }
                }
            }

            worksheet["!merges"] = merge;

            // row데이터 추가
            if(!Utils.isEmptyObject(dataArr)){
                worksheet = XLSX.utils.sheet_add_aoa(worksheet, dataArr.map(rowData=>rowData.map(data=>{
                    if(data == undefined){
                        data = "";
                    }
                    return data;
                })), worksheetOption);
                worksheetOption.origin = -1;
                worksheetRef = XLSX.utils.decode_range(worksheet['!ref']);
                for(let R = worksheetRef.s.r; R <= worksheetRef.e.r; ++R) {
                    for(let C = worksheetRef.s.c; C <= worksheetRef.e.c; ++C) {
                        const key = XLSX.utils.encode_cell({r:R,c:C});
                        if(worksheet[key] && !worksheet[key].customType){
                            worksheet[key].customType ="rowData";
                        }
                    }
                }
            }

            //스타일
            if(!Utils.isEmptyObject(worksheetRef)){
                for(let R = worksheetRef.s.r; R <= worksheetRef.e.r; ++R) {
                    for (let C = worksheetRef.s.c, colCount=0; C <= worksheetRef.e.c; ++C, ++colCount) {
                        //공통 스타일
                        const key = XLSX.utils.encode_cell({r:R,c:C});
                        if(worksheet[key]){
                            worksheet[key].s = {
                                alignment:{
                                    vertical:"center"
                                },
                                border:{},
                                font:{}
                            };

                            if(worksheet[key]?.customType == "topDesc"){
                                //상단 desc
                                worksheet[key].s.alignment.wrapText= true;
                                const customStyle = worksheet[key].customStyle;
                                if(customStyle){
                                    if(customStyle.align){
                                        worksheet[key].s.alignment.horizontal = customStyle.align;
                                    }
                                    if(customStyle.fontColor){
                                        worksheet[key].s.font.color = { rgb: customStyle.fontColor };
                                    }
                                    if(customStyle.fontBold){
                                        worksheet[key].s.font.bold = customStyle.fontBold;
                                    }
                                    if(customStyle.bgColor){
                                        worksheet[key].s.fill={};
                                        worksheet[key].s.fill.fgColor = {rgb: customStyle.bgColor};
                                    }
                                }

                            }else if(worksheet[key]?.customType == "header"){
                                //헤더스타일
                                worksheet[key].s.alignment.horizontal = "center";
                                worksheet[key].s.font.bold = true;
                                worksheet[key].s.border.top = { style: "thin", color: {rgb: "000000"} }
                                worksheet[key].s.border.bottom = { style: "thin", color: {rgb: "000000"} };
                                worksheet[key].s.border.left = { style: "thin", color: {rgb: "000000"} };
                                worksheet[key].s.border.right = { style: "thin", color: {rgb: "000000"} };

                                worksheet[key].s.fill={};
                                worksheet[key].s.fill.fgColor = {rgb: "eeeeee"};

                            }else if(worksheet[key]?.customType == "rowData"){
                                //셀 데이터 스타일
                                worksheet[key].s.border.top = { style: "thin", color: {rgb: "767676"} }
                                worksheet[key].s.border.bottom = { style: "thin", color: {rgb: "767676"} };
                                worksheet[key].s.border.left = { style: "thin", color: {rgb: "767676"} };
                                worksheet[key].s.border.right = { style: "thin", color: {rgb: "767676"} };
                                worksheet[key].s.alignment.horizontal = header[colCount]?.align||"left";
                            }
                        }
                    }
                }
            }

            //셀 width
            worksheet["!cols"] = header.map(h=> {
                if(h.width){
                    return {"wpx" : h.width, "MDW":8};
                }else{
                    return {"wch" : h.header.length+5, "MDW":8};
                }
            });
            XLSX.utils.book_append_sheet(workbook, worksheet,obj.sheetName||obj.fileName);
            XLSX.writeFile(workbook, obj.fileName + ".xlsx");
        });
    };

    Base.extends(Base.Excel, Excel);

}) (window, __DOMAIN_NAME||'');