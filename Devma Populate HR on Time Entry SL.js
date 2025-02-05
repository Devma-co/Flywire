/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Title:   Populate Hourly Rate on Time Entries
 * ID:      Devma_PopulateTimeEntries_SL
 * Version: 1.0
 * Author:  Nazish
 * Purpose: Suitelet to update Hourly Rate (USD) and Hourly Rate (USD) with SBC on Time Entries based on PCC record data.
 * Updated: James Wright January 6th 2025
 */

define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/log', 'N/http', 'N/task', 'N/redirect'],
    function(serverWidget, record, search, log, http, task, redirect) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({ title: 'Populate Time Entries' });
            var startDateField = form.addField({ id: 'custpage_start_date', type: serverWidget.FieldType.DATE, label: 'Start Date' });
            var endDateField = form.addField({ id: 'custpage_end_date', type: serverWidget.FieldType.DATE, label: 'End Date' });
            form.addSubmitButton({ label: 'Submit' });
            context.response.writePage(form);
        } else {
            var startDate = context.request.parameters.custpage_start_date;
            var endDate = context.request.parameters.custpage_end_date;

            var taskObj = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                deploymentId: "customdeploy_devma_mr_set_time_entries",
                scriptId: "customscript_devma_mr_set_time_entries",
                params: {
                    custscript_param_pte_start: startDate,
                    custscript_param_pte_end: endDate
                }
            });
            taskObj.submit();

            redirect.toSuitelet({
                scriptId: "customscript_devma_processing_status",
                deploymentId: "customdeploy_devma_processing_status",
                isExternal: false,
                parameters: {
                    deploymentId: 13620
                }
            });
        }
    }

    return { onRequest: onRequest };
});