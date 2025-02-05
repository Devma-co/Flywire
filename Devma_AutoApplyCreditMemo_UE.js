/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * COMPANY              DEVELOPER               DESCRIPTION
 * FlyWire              Nazish                  Auto-apply Credit Memos to Invoices created via Zone Advanced Billing
 */

define(['N/search', 'N/record', 'N/format'], function (search, record, format) {

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        const creditMemo = context.newRecord;
        if (creditMemo.type !== 'creditmemo') return;

        const zabCreated = creditMemo.getValue('custbodyzab_created_by_zone_billing');
        const subscriptionType = creditMemo.getValue('custbodyfw_subscription_type');
        log.debug('zabCreated',zabCreated)
        log.debug('subscriptionType',subscriptionType)

        // Ensure the Credit Memo meets conditions
        if (!zabCreated || [6, 7, 8, 9, 10, 18, 24].includes(subscriptionType)) {
            return;
        }
      try{

        const customer = creditMemo.getValue('entity');
        const zabDate1 = creditMemo.getValue('custbodyfw_zab_date');
        const zabSubscription = creditMemo.getValue('custbodyfw_zab_subscription');
          var parsedFromDateStringAsRawDateObject = format.parse({
            value: zabDate1,
            type: format.Type.DATE
        });
        var zabDate = format.format({
            value: parsedFromDateStringAsRawDateObject,
            type: format.Type.DATE
        });
              log.debug('zabDate',zabDate)

              log.debug('zabSubscription',zabSubscription)

        const creditMemoId = creditMemo.id;

        // Search for matching open invoices
        const invoiceSearch = search.create({
            type: 'invoice',
            filters: [
                ['entity', 'anyof', customer],
                'AND', ['custbodyzab_created_by_zone_billing', 'is', 'T'],
                'AND', ['status', 'anyof', 'CustInvc:A'], // Open status
                'AND', ['custbodyfw_zab_date', 'on', zabDate],
                'AND', ['custbodyfw_zab_subscription', 'is', zabSubscription]
            ],
            columns: ['internalid', 'total', 'amountremaining']
        });

        const results = invoiceSearch.run().getRange({ start: 0, end: 1 });
                    log.debug('invoice results',results.length)


        if (results.length > 0) {
            const invoiceId = results[0].getValue('internalid');
                              log.debug('invoiceId',invoiceId)

            applyCreditMemoToInvoice(creditMemoId, invoiceId);
        }
    }catch(e){
      log.debug('error', e)
    }
    }

    function applyCreditMemoToInvoice(creditMemoId, invoiceId) {
        try {
          const creditMemo = record.load({
                type: record.Type.CREDIT_MEMO,
                id: creditMemoId,
                isDynamic: true
            });
             const lineCount = creditMemo.getLineCount({ sublistId: 'apply' });
            if (lineCount === 0) {
                log.debug('No Invoices Found', 'No applicable invoices in the apply sublist.');
                return;
            }

            // Iterate through the apply sublist
            for (let i = 0; i < lineCount; i++) {
                const lineInvoiceId = creditMemo.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: i
                });
               log.debug('lineInvoiceId', lineInvoiceId);

                //Automatically apply to the Invoice
                if (invoiceId == lineInvoiceId) {
                    creditMemo.selectLine({ sublistId: 'apply', line: i });
                    creditMemo.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        value: true
                    });
                    creditMemo.commitLine({ sublistId: 'apply' });
                    break; // Apply only to the first match (modify as needed)
                }
            }

            // Save the Credit Memo
            creditMemo.save();
            log.debug('Success', 'Credit Memo successfully applied to Invoice.');

        } catch (e) {
            log.error('Error Applying Credit Memo', e.toString());
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});