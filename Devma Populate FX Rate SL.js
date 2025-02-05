/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * Title:   Populate FX Rate
 * ID:      Devma_PopulateFxRate_SL
 * Version: 1.0
 * Author:  Nazish
 * Purpose: Suitelet to update the FX rate in the Project Costing Calculations (PCC) custom record based on user input.
 * Updated: James Wright January 6th 2025
 */

define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/currency', 'N/log','N/http', 'N/runtime', 'N/task', 'N/redirect'],
    function(serverWidget, record, search, currency, log, http, runtime, task, redirect) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({ title: 'Populate FX Rate' });
                var fxDateField = form.addField({ id: 'custpage_fx_date', type: serverWidget.FieldType.DATE, label: 'FX Date' });
                form.addSubmitButton({ label: 'Submit' });
                context.response.writePage(form);
            } else {
                var fxDate = context.request.parameters.custpage_fx_date;
                if (!fxDate) {
                    throw new Error('FX Date is required.');
                }
                log.debug('fxDate', fxDate);

                var taskObj = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    deploymentId: "customdeploydevma_mr_populate_fx_rate",
                    scriptId: "customscript_devma_mr_populate_fx_rate",
                    params: {
                        custscript_param_pfx_fxdate: fxDate
                    }
                });
                taskObj.submit();

                redirect.toSuitelet({
                    scriptId: "customscript_devma_processing_status",
                    deploymentId: "customdeploy_devma_processing_status",
                    isExternal: false,
                    parameters: {
                        deploymentId: 13618
                    }
                });
            }
        }

        return { onRequest: onRequest };
        function getSearchResults(rectype, fils, cols) {
            var mySearch = search.create({
                type: rectype,
                columns: cols,
                filters: fils
            });
            var resultsList = [];
            var myPagedData = mySearch.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(function (result) {
                    resultsList.push(result);
                });
            });
            return resultsList;
        }
    }
);