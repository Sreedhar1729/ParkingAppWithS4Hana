sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("com.app.parkapplication.controller.slot", {

        onInit: function () {
            // Call loadParkingLots to fetch and display data when the view is initialized
            this.loadParkingLots();
        },

        loadParkingLots: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oParkingLotContainer = this.byId("parkingLotContainer");

            oModel.read("/PARKINGSLOTSSet", {
                success: function (oData) {
                    var availableCount = 0;
                    var reservedCount = 0;
                    var unavailableCount = 0;

                    // Clear existing items
                    oParkingLotContainer.removeAllItems();

                    oData.results.forEach(function (oPlot) {
                        // Update the count based on the availability status
                        switch (oPlot.Status) {
                            case "Available":
                                availableCount++;
                                break;
                            case "Reserved":
                                reservedCount++;
                                break;
                            case "Not Available":
                                unavailableCount++;
                                break;
                            default:
                                // Handle any unexpected status
                        }

                        // Create a new VBox for each parking lot item
                        var oBox = new sap.m.VBox({
                            width: "150px",
                            height: "150px",
                            alignItems: "Center",
                            justifyContent: "Center",
                            items: [
                                new sap.m.VBox({
                                    items: [
                                        new sap.m.Text({
                                            text: "Lot No:"
                                        }).addStyleClass("whiteText"),
                                        new sap.m.Text({
                                            text: oPlot.Slotno
                                        }).addStyleClass("whiteText")
                                    ]
                                }),
                                new sap.m.VBox({
                                    items: [
                                        new sap.m.Text({
                                            text: "Delivery:"
                                        }).addStyleClass("whiteText"),
                                        new sap.m.Text({
                                            text: oPlot.Delivery
                                        }).addStyleClass("whiteText")
                                    ]
                                }),
                                new sap.m.VBox({
                                    items: [
                                        new sap.m.Text({
                                            text: "Status:"
                                        }).addStyleClass("whiteText"),
                                        new sap.m.Text({
                                            text: oPlot.Status
                                        }).addStyleClass("whiteText")
                                    ]
                                })
                            ]
                        }).addStyleClass("slotBox").addStyleClass("animatedBackground").addStyleClass(this._getBackgroundClass(oPlot.Status));

                        oParkingLotContainer.addItem(oBox);
                    }.bind(this));

                    // Update the counts in the view
                    this.byId("availableCount").setText("(" + availableCount + ")");
                    this.byId("reservedCount").setText("(" + reservedCount + ")");
                    this.byId("unavailableCount").setText("(" + unavailableCount + ")");
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Error fetching parking lot details.");
                }
            });
        },

        // Helper function to get the background class based on availability
        _getBackgroundClass: function (availability) {
            switch (availability) {
                case "Available":
                    return "greenBackground";
                case "Reserved":
                    return "orangeBackground";
                case "Not Available":
                    return "redBackground";
                default:
                    return ""; // No background class if availability is unknown
            }
        }
    });
});
