sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    
], function(Controller, JSONModel, Filter, FilterOperator,BarcodeScanner) {
    "use strict";

    return Controller.extend("com.app.parkapplication.controller.Chart", {

        onInit: function() {
            this._setParkingLotModel();
            this._setParkignVehModel(); // Call the function to initialize the ParkignVeh model
        },

        _setParkingLotModel: function() {
            var oModel = this.getOwnerComponent().getModel();
            var that = this;

            oModel.read("/PARKINGSLOTSSet", {
                success: function(oData) {
                    var aItems = oData.results;
                    var NotavailableCount = aItems.filter(item => item.Status === "Not Available").length;
                    var AvailableCount = aItems.filter(item => item.Status === "Available").length;
                    var reserveCount = aItems.filter(item => item.Status === "Reserved").length;

                    var aChartData = {
                        Items: [{
                                Status: "Available",
                                Count: AvailableCount
                            },
                            {
                                Status: "Not Available",
                                Count: NotavailableCount
                            },
                            {
                                Status: "Reserved",
                                Count: reserveCount
                            }
                        ]
                    };

                    var oParkingLotModel = new JSONModel();
                    oParkingLotModel.setData(aChartData);
                    that.getView().setModel(oParkingLotModel, "ParkingLotModel");
                },
                error: function(oError) {
                    console.error("Error reading ParkingLot:", oError);
                }
            });
        },

        _setParkignVehModel: function() {
            var oModel = this.getOwnerComponent().getModel(); // Assuming you have correctly defined your OData model
            var that = this;

            oModel.read("/ASSIGNEDSLOTSSet", {
                success: function(oData) {
                    var aItems = oData.results; // Assuming 'results' contains your actual data

                    // Process the data as needed (similar to _processHistoryData function)
                    var oProcessedData = that._processParkignVehData(aItems);

                    // Create a JSON model and set the processed data
                    var oParkignVehModel = new JSONModel();
                    oParkignVehModel.setData(oProcessedData);
                    that.getView().setModel(oParkignVehModel, "HistoryModel");
                },
                error: function(oError) {
                    console.error("Error reading ParkignVeh:", oError);
                }
            });
        },
_processParkignVehData: function(aItems) {
    var oData = {};

    aItems.forEach(function(item) {
        var enterDateTimeString = item.enterDate + " " + item.enterTime;
        var enterDateTime = new Date(enterDateTimeString);

        // Format date part
        var year = enterDateTime.getFullYear();
        var month = (enterDateTime.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
        var day = enterDateTime.getDate().toString().padStart(2, '0');
        var formattedDate = `${year}-${month}-${day}`;

        // Format time part (hourly interval)
        var hour = enterDateTime.getHours();
        var formattedTime = `${hour}:00-${hour + 1}:00`; // Example: "9:00-10:00"

        // Initialize data object for formatted date
        if (!oData[formattedDate]) {
            oData[formattedDate] = {
                date: formattedDate,
                timeSlots: {}
            };
        }

        // Initialize data object for formatted time slot
        if (!oData[formattedDate].timeSlots[formattedTime]) {
            oData[formattedDate].timeSlots[formattedTime] = {
                timeSlot: formattedTime,
                inwardCount: 0,
                outwardCount: 0,
                totalEntries: 0
            };
        }

        // Count entries based on direction (inbound or outbound)
        if (item.Delivery === 'Inbound') {
            oData[formattedDate].timeSlots[formattedTime].inwardCount++;
        } else {
            oData[formattedDate].timeSlots[formattedTime].outwardCount++;
        }

        // Update total entries count
        oData[formattedDate].timeSlots[formattedTime].totalEntries++;
    });

    // Convert data into a format suitable for the chart
    var chartData = [];
    for (var date in oData) {
        for (var timeSlot in oData[date].timeSlots) {
            chartData.push({
                date: date,
                timeSlot: timeSlot,
                inwardCount: oData[date].timeSlots[timeSlot].inwardCount,
                outwardCount: oData[date].timeSlots[timeSlot].outwardCount,
                totalEntries: oData[date].timeSlots[timeSlot].totalEntries
            });
        }
    }

    return {
        Items: chartData
    };
},

        
        myOnClickHandler: function(oEvent) {
            // Handle click event if needed
        },

        handleRenderComplete: function(oEvent) {
            // Handle render complete event if needed
        },
        
        onFileUpload: function(oEvent) {
            var that = this;
            var oFile = oEvent.getParameter("files")[0];
            var oFormData = new FormData();
            oFormData.append("image", oFile);

            // Replace with your backend service URL
            var sUploadUrl = "/api/upload"; // Backend service endpoint for file upload

            $.ajax({
                url: sUploadUrl,
                type: "POST",
                data: oFormData,
                processData: false,
                contentType: false,
                success: function(oResponse) {
                    // Assuming oResponse.text contains the extracted text from OCR
                    that.getView().byId("textArea").setValue(oResponse.text);
                    sap.m.MessageBox.success("Text extracted successfully.");
                },
                error: function(oError) {
                    sap.m.MessageBox.error("Error uploading file: " + oError.responseText);
                }
            });
        }
        
    });
});
