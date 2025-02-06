/**
 * Author: James Wright @ Devma
 * Date: December 10th
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/currency', 'N/runtime', 'N/format'],
    function(search, record, currency, runtime, format){

        function getInput(){
            const currentScript = runtime.getCurrentScript();
            const fxDate = currentScript.getParameter({name: "custscript_param_pfx_fxdate"});
            //const dateToFormat = new Date(fxDate);
            //const formattedDate = format.format({value: dateToFormat, type: format.Type.DATE});
            const filters =  [
                ['custrecordfw_prj_cost_app_status', 'is', '2'],
                'AND',
                ['custrecordfw_prj_eff_start_date', 'onorbefore', fxDate],
                'AND',
                ['custrecordfw_prj_eff_end_date', 'onorafter', fxDate]
            ];
            const columns = ['custrecordfw_prj_employee', 'custrecordfw_prj_currency'];
            return search.create({
                type: "customrecordfw_prj_cost_calc",
                filters: filters,
                columns: columns
            });
        }

        function mapProcessing(context){
            const currentScript = runtime.getCurrentScript();
            const parameterDate = currentScript.getParameter({name: "custscript_param_pfx_fxdate"});
            const fxDate = new Date(parameterDate);
            //log.debug({title: "Map - fxDate", details: fxDate});
            const data = JSON.parse(context.value);
            //log.debug({title: "Map - context", details: JSON.stringify(data)});
            const recId = data.id;
            const currencyId = data.values.custrecordfw_prj_currency.text;
            const fxRate = currency.exchangeRate({ source: currencyId, target: 'USD', date: fxDate });
            const date = new Date();
            const formattedDate = format.format({value: date, type: format.Type.DATE});
            const dateUpdated = format.parse({value: formattedDate, type: format.Type.DATE});
            record.submitFields({
                type: 'customrecordfw_prj_cost_calc',
                id: recId,
                values: {
                    custrecordfw_prj_fx_rate: fxRate,
                    custrecordfw_fx_rate_update: dateUpdated
                }
            });
            log.debug({title: "Map - updated rec Id", details: recId});
        }

        return{
            getInputData: getInput,
            map: mapProcessing
        };

    }
);