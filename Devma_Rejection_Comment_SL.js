/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/record', 'N/log','N/redirect'],
	function (serverWidget, record, log, redirect, workflow) {

	function OpenRejectionPopUp(context) {

      	var ctx = context.request; //get context
		var request = context.request;
		if (context.request.method === "GET") {

			// Get parameters
			var recId = request.parameters.custparam_recordid;
					var recType = request.parameters.custparam_recordtype;
					log.debug("onRequest", "recId: " + recId + "recType: " + recType);

			//Create Suitelet Form
			var form = serverWidget.createForm({
				title : 'Rejection Comment Form',
				hideNavBar : false
			});

			var pageId = form.addField({id: 'custpage_id', type: serverWidget.FieldType.TEXT, label: 'ID:'});
			pageId.updateDisplayType({
			    displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			pageId.defaultValue = recId;

			var pageType = form.addField({id: 'custpage_recordtype', type: serverWidget.FieldType.TEXT, label: 'Record Type:'});
			pageType.updateDisplayType({
			    displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			pageType.defaultValue = recType;

			var pageRejectionReason = form.addField({id: 'custpage_rejection_reason', type: serverWidget.FieldType.TEXTAREA, label: 'Rejection Comment ::'});
			pageRejectionReason.isMandatory = true;

			form.addSubmitButton({id: 'custpage_submit', label: 'Submit'});

			context.response.writePage(form);

		}else{

			//Create Suitelet Form
			var formPost = serverWidget.createForm({
				title : 'Rejection Comment Form',
				hideNavBar : false
			});

			var recId = ctx.parameters.custpage_id;
		    var rectype = ctx.parameters.custpage_recordtype;
        	var rejectionReason = ctx.parameters.custpage_rejection_reason;
        
           if( rectype == 'customrecordzab_subscription'){
      		var fldId = record.submitFields({
			    type: rectype,
			    id: parseInt(recId),
			    values: {
			        custrecordfw_rejection_comments: rejectionReason,
                  custrecordfw_s_approval_status: '4'
			    },
			    options: {
			        enableSourcing: false,
			        ignoreMandatoryFields : true
			    }
			});
           }else{
              
           var fldId = record.submitFields({
			    type: rectype,
			    id: parseInt(recId),
			    values: {
			        custrecordfw_si_rejection_comments: rejectionReason,
                    custrecordfw_si_approval_status: '4'
			    },
			    options: {
			        enableSourcing: false,
			        ignoreMandatoryFields : true
			    }
			});  
           }

      		//context.response.write('<script>window.close();parent.location.reload();</script>');
          redirect.toRecord({ type: rectype, id: recId });
		}

	}

	return {
		onRequest: OpenRejectionPopUp
	};

});

			