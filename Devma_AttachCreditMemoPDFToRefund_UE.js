/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/file', 'N/render', 'N/search', 'N/log'], function (record, file, render, search, log) {

    function afterSubmit(context) {
      try {
        // Ensure the script runs only on Customer Refund transactions
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.COPY) {
          return;
        }
  
        // Load the Customer Refund record
        var customerRefund = context.newRecord;
  
        // Get the applied Credit Memo details
        var lineCount = customerRefund.getLineCount({ sublistId: 'apply' });
        for (var i = 0; i < lineCount; i++) {
          var isApplied = customerRefund.getSublistValue({
            sublistId: 'apply',
            fieldId: 'apply',
            line: i
          });
          log.debug('isApplied', isApplied)
  
          if (isApplied) {
            var creditMemoId = customerRefund.getSublistValue({
              sublistId: 'apply',
              fieldId: 'internalid',
              line: i
            });
            log.debug('creditMemoId', creditMemoId)
            // Load the Credit Memo record
            var creditMemo = record.load({
              type: record.Type.CREDIT_MEMO,
              id: creditMemoId
            });
  
            // Check if Subscription Type matches the required IDs
            var subscriptionType = creditMemo.getValue({ fieldId: 'custbodyfw_subscription_type' });
            var refnum = creditMemo.getValue({ fieldId: 'tranid' });
            log.debug('subscriptionType', subscriptionType)
           // if (subscriptionType == '6' || subscriptionType == '7' || subscriptionType == '8' || subscriptionType == '9' || subscriptionType == '10' || subscriptionType == '18' || subscriptionType == '24') {            
              log.debug('inside condi', '')
              // Generate the PDF for the Credit Memo
              var pdfFile = render.transaction({
                entityId: Number(creditMemoId),
                printMode: render.PrintMode.PDF
              });
              log.debug('pdfFile', pdfFile)
  
              var savedFile = file.create({
                name: 'CreditMemo_' + refnum + '.pdf',
                fileType: file.Type.PDF,
                contents: pdfFile.getContents(),
                folder: 433711
              });
              var fileId = savedFile.save(); // Save the file and retrieve its ID
  
              // Attach the PDF to the Customer Refund
              record.attach({
                record: {
                  type: 'file',
                  id: fileId
                },
                to: {
                  type: record.Type.CUSTOMER_REFUND,
                  id: customerRefund.id
                }
              });
  
              log.audit('PDF Attached', 'Credit Memo PDF attached to Customer Refund');
            }
         // }
        }
      } catch (e) {
        log.error('Error in afterSubmit', e.message);
      }
    }
  
    return {
      afterSubmit: afterSubmit
    };
  });