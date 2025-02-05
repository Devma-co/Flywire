/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 * @Description This script is used to add reason on approval
 */
define(['N/record', 'N/runtime', 'N/redirect','N/workflow'],

    function (record, runtime, redirect, workflow) {

        function onAction(scriptContext) {
            try {
                var newRecordObj = scriptContext.newRecord;
                var recordType = newRecordObj.type;
                var recordId = newRecordObj.id;
            
                log.debug('scriptContext.type- ' + scriptContext.type, 'recordId = ' + recordId + ' | recordType = ' + recordType + '#Mode- ' + scriptContext.type);

                redirect.toSuitelet({ scriptId: 'customscript_devma_rejection_comment_sl', deploymentId: 'customdeploy_devma_rejection_comment_sl', parameters: { 'custparam_recordid': recordId, 'custparam_recordtype': recordType } });

              
            }
            catch (error) {
                log.audit('Catch', 'msg: ' + error);
            }
        }

        return {
            onAction: onAction
        };
    });