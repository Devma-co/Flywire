/**
 * Author: James Wright @ Devma
 * Date: December 11th
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/query', 'N/record', 'N/runtime'],
    function(query, record, runtime){

        function getFormattedDate(d){
            const date = new Date(d);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return day + '-' + month + '-' + year;
        }

        function getInput(){
            const currentScript = runtime.getCurrentScript();
            const startDate = currentScript.getParameter({name: "custscript_param_pte_start"});
            const endDate = currentScript.getParameter({name: "custscript_param_pte_end"});
            const filterStart = getFormattedDate(startDate);
            const filterEnd = getFormattedDate(endDate);
            const sql = `select 
                pcc.id as pccId, 
                pcc.custrecordfw_prj_employee as pccEmployee, 
                tb.id as tbId
                from customrecordfw_prj_cost_calc pcc
                join TimeBill tb on pcc.custrecordfw_prj_employee = tb.employee
                where pcc.custrecordfw_prj_cost_app_status = 2
                and tb.supervisorapproval = 'T'
                and pcc.custrecordfw_prj_eff_start_date <= TO_DATE( '${filterEnd} 00:00:00', 'DD-MM-YYYY HH24:MI:SS' )
                and pcc.custrecordfw_prj_eff_end_date >= TO_DATE( '${filterStart} 00:00:00', 'DD-MM-YYYY HH24:MI:SS' )
                and tb.tranDate >= TO_DATE( '${filterStart} 00:00:00', 'DD-MM-YYYY HH24:MI:SS' ) and tb.tranDate <= TO_DATE( '${filterEnd} 00:00:00', 'DD-MM-YYYY HH24:MI:SS' )`;
            const pagedResults = query.runSuiteQLPaged({
                query: sql,
                pageSize: 1000
            });
            let results = [];
            for(let i=0; i<pagedResults.pageRanges.length; i++){
                let currentPage = pagedResults.fetch({index: i});
                let resultSet = currentPage.data.results;
                for(let ri=0; ri<resultSet.length; ri++) {
                    let row = resultSet[ri];
                    const pccId = +row.values[0];
                    const tbId = +row.values[2];
                    results.push({pccId: pccId, tbId: tbId});
                }
            }

            return results;
        }

        function mapProcessing(context){
            const data = JSON.parse(context.value);
            const projectCostingCalcRec = record.load({
                type: "customrecordfw_prj_cost_calc",
                id: data.pccId,
                isDynamic: false
            });
            const rate = +projectCostingCalcRec.getValue({fieldId: "custrecordprj_hourly_rate"});
            const sbcRate = +projectCostingCalcRec.getValue({fieldId: "custrecordfw_prj_hourly_rate_sbc"});
            log.debug({title: "Map - rates", details:  "pccId: " + data.pccId + " | rate: " + rate + " | sbcRate: " + sbcRate + " | time entry Id: " + data.tbId});

            record.submitFields({
                type: 'timebill',
                id: data.tbId,
                values: {
                    custcolfw_hourly_rate: rate,
                    custcolfw_hourly_rate_sbc: sbcRate
                }
            });
        }

        return{
            getInputData: getInput,
            map: mapProcessing
        };

    }
);