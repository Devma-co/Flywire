/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

 define(['N/record','N/error','N/search','N/currentRecord','N/url','N/format'],
    function(record,error,search,currentRecord,url,format) {
	 function fieldChanged(context) {
	      if(context.fieldId == 'custpage_subsidiary' || context.fieldId == 'custpage_currency') 
           {
	        var rec = context.currentRecord;
	    
             	var subs = rec.getValue({
	            fieldId: 'custpage_subsidiary'
	        });
             var currency = rec.getValue({
	            fieldId: 'custpage_currency'
	        });
	    	
	    	
	    	window.onbeforeunload=null;
	     	var suiteletURL = url.resolveScript({
	       		scriptId: 'customscript_devma_flywirebill_thresh_sl',
	       		deploymentId : 'customdeploy_devma_flywirebill_thresh_sl',
	       	    returnExternalUrl: false
	        });	
			
			if((currency != null && currency != '') || (subs != null && subs != '')){
	       	suiteletURL=suiteletURL+'&subs='+subs+'&curr='+currency;
	       	window.open(suiteletURL,'_self');
	     	}
       else{
	       	window.open(suiteletURL,'_self');
       }
           }
	     



		 }
	
	
	 return{
		 fieldChanged:fieldChanged
	 }
});