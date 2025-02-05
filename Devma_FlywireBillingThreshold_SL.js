/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * DEVELOPER:   Nazish
 * DESCRIPTION: Suitelet to calculate and update the "Amount Pending Billing (Stored)" field and "Last Updated" field.
 */

var SL_SUBLIST='custpage_custom_line';

define(['N/search', 'N/record', 'N/log', 'N/ui/serverWidget', 'N/runtime'], 
function(search, record, log, serverWidget, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            createForm(context);
        } else {
            processBillingThreshold(context);
        }
    }

    function createForm(context) {
      var scriptObj = runtime.getCurrentScript(); 
       
             var pendingBillingSS = search.load({
                    	    id: 'customsearch29199'
                    	});
            var ssType = pendingBillingSS.searchType;
            var ssFilters = pendingBillingSS.filters;
            var columns = pendingBillingSS.columns;
            var request = context.request;
            	var subs=request.parameters.subs;
                var curr=request.parameters.curr;
      
        var form = serverWidget.createForm({
            title: 'Update Amount Pending Billing'
        });
       form.clientScriptModulePath = "SuiteScripts/Devma_FlywireBillingThreshold_CS.js";

        var subsidiaryField = form.addField({
            id: 'custpage_subsidiary',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary',
            source: 'subsidiary'
        });

        var currencyField = form.addField({
            id: 'custpage_currency',
            type: serverWidget.FieldType.SELECT,
            label: 'Currency',
            source: 'currency'
        });
      if(subs != null && subs != '')
			subsidiaryField.defaultValue = subs;
        if(curr != null && curr != '')
			currencyField.defaultValue = curr;
      
       var sublist = form.addSublist({ 
        			  id: SL_SUBLIST,
        			  type: serverWidget.SublistType.LIST,
        			  label: 'ZAB Subscriptions' 
        		  }); 
		        sublist.addField({id: 'custpage_name',label: 'Name',type: serverWidget.FieldType.TEXT});
	  			sublist.addField({id: 'custpage_subs',label: 'Subsidiary',type: serverWidget.FieldType.TEXT});
                sublist.addField({id: 'custpage_line_currency',label: 'Currency',type: serverWidget.FieldType.TEXT});
      	        sublist.addField({id: 'custpage_round_sum_amt',label: 'Round to Hundredths of Sum of Amount',type: serverWidget.FieldType.CURRENCY});
      var hiddenIDFld = sublist.addField({id: 'custpage_internalid_hidden',label: 'Internal ID',type: serverWidget.FieldType.TEXT});
				 hiddenIDFld.updateDisplayType({
		  				displayType : serverWidget.FieldDisplayType.HIDDEN
		  				});
       var fils = [];
               
      			if(curr != null && curr != '')
      				{
      				fils.push({
      		            name: 'custrecordzab_s_currency',
      		            operator: 'anyof',
      		            values: [curr]
      		            });
      				}
					if(subs != null && subs != '')
      				{
      				fils.push({
      		            name: 'custrecordzab_s_subsidiary',
      		            operator: 'anyof',
      		            values: [subs]
      		            });
      				}
       var resultFilters = ssFilters.concat(fils);
      var savedSearchResult = getSearchResults(ssType, resultFilters, columns)
       if(savedSearchResult)
              {
            	 log.debug('savedSearchResult',savedSearchResult.length);
            	  for(var c = 0; c < savedSearchResult.length; c++){
					   var cols = savedSearchResult[c].columns;
            		  var recId  = savedSearchResult[c].getValue(cols[0]);
            		  var name  = savedSearchResult[c].getValue(cols[1]);
					   var subsidairy  = savedSearchResult[c].getText(cols[2]);
					    var currency  = savedSearchResult[c].getText(cols[3]);
                      var amt  = savedSearchResult[c].getValue(cols[4]);
                    
                    if(recId != null && recId !=  '')
							sublist.setSublistValue({id: 'custpage_internalid_hidden',line: c,value: recId});
                    if(name != null && name !=  '')
							sublist.setSublistValue({id: 'custpage_name',line: c,value: name});
                    if(subsidairy != null && subsidairy !=  '')
							sublist.setSublistValue({id: 'custpage_subs',line: c,value: subsidairy});
                    if(currency != null && currency !=  '')
							sublist.setSublistValue({id: 'custpage_line_currency',line: c,value: currency});
                    if(amt != null && amt !=  '')
							sublist.setSublistValue({id: 'custpage_round_sum_amt',line: c,value: amt});

                  }
              }

     

        form.addSubmitButton({ label: 'Process' });
        context.response.writePage(form);
    }

    function processBillingThreshold(context) {
        var request = context.request;
        var subsidiaryId = request.parameters.custpage_subsidiary;
        var currencyId = request.parameters.custpage_currency;
      var lineCount = context.request.getLineCount({ group: SL_SUBLIST });
     for(var i=0; i<lineCount; i++)
      {
         var internalId = context.request.getSublistValue({group: SL_SUBLIST,name: 'custpage_internalid_hidden',line: i});
         var amount = context.request.getSublistValue({group: SL_SUBLIST,name: 'custpage_round_sum_amt',line: i});
        record.submitFields({
 				type:'customrecordzab_subscription',
 				id: internalId,
 				values: {
 				custrecordfw_s_amt_pending_billing: amount,
                  custrecordfw_s_last_update_apb: new Date()
 				},
				 options: {
 				enableSourcing: false,
 				ignoreMandatoryFields : true
 				}
				});
                  
      }
       

        //context.response.write('<p>Amount Pending Billing updated successfully </p>');
      context.response.write('<p>Amount Pending Billing updated successfully</p><form action="javascript:history.back()"><input type="submit" value="Go Back"></form>');

    }

    function getAmountPendingBilling(subsidiaryId, currencyId) {
        var billingSearch = search.create({
            id: 'customsearch29199',
            filters: [
                ['custrecordzab_s_subsidiary', 'anyof', subsidiaryId],
                'AND',
                ['custrecordzab_s_currency', 'anyof', currencyId]
            ]
        });

        return billingSearch.run().getRange({ start: 0, end: 1000 });
    }

    function updateCustomRecord(amount, currencyId) {
        var thresholds = {
            '1': 20, // USD
            '2': 16, // GBP
            '3': 18, // EUR
            '4': 27, // SGD
            '5': 3016, // JPY
            '6': 27, // CAD
            '7': 30, // AUD
            '8': 33, // NZD
            '9': 357 // MXN
        };

        var threshold = thresholds[currencyId] || 0;
        if (amount < threshold) {
            log.audit('Threshold not met', 'Amount: ' + amount + ', Threshold: ' + threshold);
            return;
        }

        record.submitFields({
            type: 'customrecordzab_subscription',
            id: '1', // Replace with appropriate record ID or dynamic retrieval
            values: {
                custrecordfw_s_amt_pending_billing: amount,
                custrecordfw_s_last_update_apb: new Date()
            }
        });
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
});
