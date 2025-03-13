/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

var SPARAM_INDEX = 'custscript_devma_loop_index';



define(['N/runtime', 'N/record', 'N/search', 'N/task', 'N/format'],

    function (runtime, record, search, task, format) {

        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */

        /**
        * Reschedules the current script and returns the ID of the reschedule task
        */
        function rescheduleCurrentScript(paramobj) {
            var scheduledScriptTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT
            });
            scheduledScriptTask.scriptId = runtime.getCurrentScript().id;
            scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
            scheduledScriptTask.params = paramobj;
            scheduledScriptTask.submit();
        }


        function execute(scriptContext) {

            var scriptObj = runtime.getCurrentScript();
            var index = scriptObj.getParameter({ name: SPARAM_INDEX });
            if (index == null || index == '')
                index = 0;
            var ssID = scriptObj.getParameter({ name: 'custscript_devma_saved_search' });
            if (ssID != null && ssID != '') {
                var tranSS = search.load({ id: ssID });
                var ssType = tranSS.searchType;
                var ssFilters = tranSS.filters;
                var ssColumns = tranSS.columns;
                var searchResults = getSearchResults(ssType, ssFilters, ssColumns)
                if (searchResults != null && searchResults != '' && searchResults.length > 0) {
                    log.debug('searchResults', searchResults.length)
                    for (var c = index; c < searchResults.length; c++) {
                        try {
                            var recId = searchResults[c].id
                            var usageRecord = record.delete({
                                type: 'customrecordfw_cc_usage',
                                id: recId,
                            });
                         // break;
                        } catch (e) {
                            log.debug('error', e.message)
                        }
                        if (runtime.getCurrentScript().getRemainingUsage() < 100) {
                            var paramobj = {};
                            paramobj[SPARAM_INDEX] = parseInt(c) + 1;
                            rescheduleCurrentScript(paramobj);
                            break;
                        }
                    }
                }
            }


        }

        return {
            execute: execute //sets the loop again until looping variable = 0
        };


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
    });