sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
],
    function (Controller) {
        "use strict";

        return Controller.extend("com.app.parkapplication.controller.VendorPage", {
            onInit: function () {
                // var oModel = new sap.ui.model.odata.v2.ODataModel("https://port4004-workspaces-ws-tltdr.us10.trial.applicationstudio.cloud.sap/v2/odata/v4/parking/");
                // this.getView().setModel(oModel);

            },
            onReservePress: async function () {
                this.oDialog ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.vendorRes"
                })
                this.oDialog.open();
            },
            onCloseDialog: function () {

                this.byId("idresevednd").close();
            },
            // confirming Reservation
            onConfirmDialog: function () {
                // getting  values from the form input
                const oTruckNo = this.byId("idventruckno").getValue(),
                    oDriverName = this.byId("idvendrivername").getValue(),
                    oDriverMob = this.byId("idvenddrivermob").getValue(),
                    oVendorName = this.byId("idvednorval").getValue(),
                    oinbound = this.byId("inwards").getSelectedKey(),
                    oparkingid = this.byId("parkingLotSelect121").getSelectedKey();

                // Create a new Date object
                var currentDate = new Date();

                // Extract date components
                var exitDate1 = currentDate.getFullYear() + '-' +
                    ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' +
                    ('0' + currentDate.getDate()).slice(-2);

                // Extract time components
                var exitTime1 = ('0' + currentDate.getHours()).slice(-2) + ':' +
                    ('0' + currentDate.getMinutes()).slice(-2) + ':' +
                    ('0' + currentDate.getSeconds()).slice(-2);
                debugger
                const oModel = this.getOwnerComponent().getModel();
                const oSample = new sap.ui.model.json.JSONModel({
                    Truckno: oTruckNo,
                    Drivername: oDriverName,
                    Drivermobile: oDriverMob,
                    Rsdate: exitDate1,
                    Rstime: exitTime1,
                    Rcdate: "",
                    Rctime: "",
                    Vendorname: oVendorName,
                    Delivery: oinbound,
                    Slotno: oparkingid
                });
                this.getView().setModel(oSample, "oSample")
                var msg = `Reservation request came from ${oVendorName} vendor on ${exitDate1} at ${exitTime1} for parkingslot ${oparkingid}`;
                // json model for notifications
                const oNotification = new sap.ui.model.json.JSONModel({
                    Vendorname: oVendorName,
                    Slotno: oparkingid,
                    Truckno:oTruckNo,
                    Delivery:oinbound,
                    Message:msg
                })
                this.getView().setModel(oNotification, "oNotification")
                var oid = oparkingid.split(' ').join('');
                console.log(oNotification);
                console.log(oNotification.getData());
                debugger
                var that = this;
                oModel.create("/ReservedSlotsSet", oSample.getData(), {
                    success: function (odata) {
                        sap.m.MessageToast.show("Successfully Reserved!!!!!");
                        // .oDialog.close();
                        that.byId("idresevednd").close();
                        console.log("succcessfully Reserved!!!!");
                        oModel.refresh(true);
                        oModel.update("/PARKINGSLOTSSet('" + oid + "')", { Status: 'Reserved' }, {
                            success: function (odata) {
                                // that.getView().byId("idparkingslottable").getBinding("items").refresh();

                                oModel.create("/NOTIFICATIONSSet", oNotification.getData()
                                    , {
                                        success: function (odata) {
                                            sap.m.MessageToast.show("Request Notification sent!!!");
                                        },
                                        error: function (oError) {
                                            sap.m.MessageBox.error("Error!!!");

                                        }
                                    })
                            }, error: function (oError) {
                                sap.m.MessageBox.error("Error !!");
                            }
                        })
                    }, error: function (oError) {
                        sap.m.MessageBox.error("Error !!");
                    }
                })

            },
            onMobileVal: async function (oEvent) {
                var oPhone = oEvent.getSource();
                var oVal1 = oPhone.getValue();

                // regular expression for validating the phone
                var regexpMobile = /^[0-9]{10}$/;
                if (oVal1.trim() === '') {
                    oPhone.setValueState("None"); // Clear any previous state
                } else if (oVal1.match(regexpMobile)) {
                    oPhone.setValueState("Success");
                } else {
                    oPhone.setValueState("Error");
                    // Check if MessageToast is available before showing message
                    if (sap.m.MessageToast) {
                        sap.m.MessageToast.show("Invalid Phone format");
                    } else {
                        console.error("MessageToast is not available.");
                    }
                }
            },
            DriverNameChange: async function (oEvent) {
                var oDriverInput = oEvent.getSource();
                var oDriveValue = oDriverInput.getValue();
                var namereg = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
                if (oDriveValue.match(namereg)) {
                    oDriverInput.setValueState("Success");
                } else if (oDriveValue.trim === '') {
                    oDriverInput.setValueState("None");
                } else {
                    oDriverInput.setValueState('Error')
                }
            },
            TruckLiveChange: async function (oEvent) {
                // Step 1: Retrieve the value from input field
                var oTruckNoInput = oEvent.getSource(); // Assuming this is the input field control
                var oTruckNo = oTruckNoInput.getValue();

                // Step 2: Define the regular expression pattern
                var truckNumberRegex = /^[a-zA-Z0-9]{1,10}$/;
                if (oTruckNo.match(truckNumberRegex)) {
                    oTruckNoInput.setValueState("Success");
                } else if (oTruckNo.trim === '') {
                    oTruckNoInput.setValueState("None");
                }
                else {
                    oTruckNoInput.setValueState("Error")

                }
            },
        });
    });
