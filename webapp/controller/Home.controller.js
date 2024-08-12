sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
],
    function (Controller, ODataModel, Filter, FilterOperator, Token, Fragment, JSONModel) {
        "use strict";

        return Controller.extend("com.app.parkapplication.controller.Home", {
            onInit: function () {

            },
            /* For Page Naviagation Based on Key    */
            onItemSelect: function (oEvent) {
                var itemKey = oEvent.getParameter("item").getKey();
                var navContainer = this.getView().byId("idNavContainer");
                // Navigate to the corresponding page based on the selected key
                switch (itemKey) {
                    case "RouteParkingSlot":
                        navContainer.to(this.getView().createId("root3"));
                        break;
                    case "Home":
                        navContainer.to(this.getView().createId("root2"));
                        break;
                    case "RouteReserve":
                        navContainer.to(this.getView().createId("root4"));
                        break;
                    case "parkingslotAssign":
                        navContainer.to(this.getView().createId("idparkingassign"));
                        break;
                    case "root1":
                        navContainer.to(this.getView().createId("root1"));
                        break;
                    case "LeftVehicles":
                        navContainer.to(this.getView().createId("LeftVehicles"));
                        break;
                    case "waitingforconfirm":
                        navContainer.to(this.getView().createId("reservationpending"));
                        break;
                    case "Doors"://key value
                        navContainer.to(this.getView().createId("root5"));
                        break;
                    case "DoorDock"://key value
                        navContainer.to(this.getView().createId("root6"));
                    default:
                        break;
                }
            },
            /*For ToolMenuCollapse */
            // onCollapseExpandPress() {
            //     const oSideNavigation = this.byId("idSidenavigation"),
            //     bExpanded = oSideNavigation.getExpanded();
            //     oSideNavigation.setExpanded(!bExpanded);
            // },
            onTruckTypeSelect: function (oEvent) {
                var oView = this.getView();
                var oOutbox = oView.byId("_IDOutboundCheckBox");
                var oDlv;

                if (!oOutbox) {
                    console.error("Outbound CheckBox not found.");
                    return;
                }

                // Determine delivery type based on checkbox selection
                oDlv = oOutbox.getSelected() ? 'Outbound' : 'Inbound';
                console.log("Delivery type:", oDlv);

                // Create filters
                var aFilters = [
                    new sap.ui.model.Filter('Delivery', sap.ui.model.FilterOperator.EQ, oDlv),
                    new sap.ui.model.Filter('Status', sap.ui.model.FilterOperator.EQ, 'Available')
                ];
                console.log("Filters:", aFilters);

                // Get the ComboBox and its binding
                var oSelect = oView.byId("_IDGenComboBox2");
                if (!oSelect) {
                    console.error("ComboBox not found.");
                    return;
                }
                var oBinding = oSelect.getBinding("items");
                if (!oBinding) {
                    console.error("ComboBox binding not found.");
                    return;
                }
                // Apply filters to the binding
                oBinding.filter(aFilters);
                // Optional: Log the filtered items in the ComboBox for debugging
                var aItems = oSelect.getItems();
                console.log("Items after filter:", aItems.map(item => item.getText()));
            }
            ,
            /*Parking Slot Fragment Load For creating Fragment */
            onAdd1: async function () {
                this.oDialog1 ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.NewSLotCreate"
                });
                this.oDialog1.open();
            },
            /** For Closing ParkingLot */
            onClears: function () {
                this.byId("idslotcreationDialog").close();
                this.getView().byId("inwards21").setSelectedKey();
                this.getView().byId("idslotcreatingidval").setValue();
            },
            /** New ParkingSlot Creation  */
            onCreate: function () {
                // Getting values
                var slotno = this.byId("idslotcreatingidval").getValue();
                var del = this.byId("inwards21").getSelectedKey();
                var status = this.byId("idslotcreatingavialableval").getValue();
                var oModel = this.getView().getModel();
                var that = this;

                // Creating a new entry in the OData model
                oModel.create("/PARKINGSLOTSSet", { Slotno: slotno, Status: status, Delivery: del }, {
                    success: function (odata) {
                        sap.m.MessageToast.show("Successfully Created!!");
                        that.byId("idparkingslottable").getBinding("items").refresh();
                        that.onClears();
                    },
                    error: function (oError) {
                        sap.m.MessageBox.error("Error: " + oError.message);
                        that.onClears();
                    }
                });
            },
            onDelete: function () {
                var oTable = this.byId("idparkingslottable");
                var osel = oTable.getSelectedItems();
                var that = this;
                osel.forEach(function (oSelectedItem) {
                    var sPath = oSelectedItem.getBindingContext().getPath();

                    var oModel = oSelectedItem.getModel();

                    oModel.remove(sPath, {
                        success: function () {
                            sap.m.MessageToast.show("Item deleted successfully.");
                            that.byId("idparkingslottable").getBinding("items").refresh();
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error("Error deleting item:", oError);
                        }
                    });
                });
            }
        });
    });
