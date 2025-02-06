/**
 * Author: James Wright @ Devma
 * Date: January 6th 2025
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/search', 'N/ui/serverWidget'],
    function(search, serverWidget){

        function getList(deploymentId){
            var title = deploymentId === 13620 ? 'Populate Time Entries - Processing Status' : 'Populate FX Rate - Processing Status';
            var list = serverWidget.createList({title: title});
            list.addColumn({
                id: "startdate",
                type: serverWidget.FieldType.DATE,
                label: "Start Date",
                align: serverWidget.LayoutJustification.LEFT
            });
            list.addColumn({
                id: "enddate",
                type: serverWidget.FieldType.DATE,
                label: "End Date",
                align: serverWidget.LayoutJustification.LEFT
            });
            list.addColumn({
                id: "status",
                type: serverWidget.FieldType.TEXT,
                label: "Start Date",
                align: serverWidget.LayoutJustification.LEFT
            });
            list.addColumn({
                id: "stage",
                type: serverWidget.FieldType.TEXT,
                label: "Stage",
                align: serverWidget.LayoutJustification.LEFT
            });
            list.addColumn({
                id: "complete",
                type: serverWidget.FieldType.PERCENT,
                label: "Percent Complete",
                align: serverWidget.LayoutJustification.RIGHT
            });
            return list;
        }

        function getData(deploymentId){
            var scheduledscriptinstanceSearchObj = search.create({
                type: "scheduledscriptinstance",
                filters:
                    [
                        ["datecreated","on","today"],
                        "AND",
                        ["scriptdeployment.internalid","anyof",deploymentId]
                    ],
                columns:
                    [
                        search.createColumn({name: "startdate", label: "Start Date", sort: search.Sort.ASC}),
                        search.createColumn({name: "enddate", label: "End Date"}),
                        search.createColumn({name: "queue", label: "Queue"}),
                        search.createColumn({name: "status", label: "Status"}),
                        search.createColumn({name: "mapreducestage", label: "Map/Reduce Stage"}),
                        search.createColumn({name: "percentcomplete", label: "Percent Complete"}),
                        search.createColumn({name: "queueposition", label: "Queue Position"})
                    ]
            });
            var data = [];
            scheduledscriptinstanceSearchObj.run().each(function(result){
                var start = result.getValue({name: "startdate"});
                var end = result.getValue({name: "enddate"});
                var status = result.getValue({name: "status"});
                var stage = result.getValue({name: "mapreducestage"});
                var complete = result.getValue({name: "percentcomplete"});
                data.push({start: start, end: end, status: status, stage: stage, complete: complete});
                return true;
            });

            log.debug({title: "Data", details: JSON.stringify(data)});
            return data;
        }

        function setData(list, data) {
            for (var i = 0; i < data.length; i++) {
                list.addRow({
                    row: {
                        startdate: data[i].start,
                        enddate: data[i].end,
                        status: data[i].status,
                        stage: data[i].stage,
                        complete: data[i].complete
                    }
                });
            }
        }
        function showStatus(context){
            if(context.request.method !== 'GET'){
                return;
            }

            const deploymentId = +context.request.parameters.deploymentId;
            log.debug({title: "Deployment Id", details: "deployement Id: " + deploymentId + " | typeof: " + typeof  deploymentId});
            var list = getList(deploymentId);
            var data = getData(deploymentId);
            setData(list, data);
            context.response.writePage(list);
        }

        return{
            onRequest: showStatus
        };

    }
);