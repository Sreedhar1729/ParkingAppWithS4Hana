sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ndc/BarcodeScanner",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox",

],
    function (Controller, ODataModel, Filter, FilterOperator, Token, Fragment, JSONModel, BarcodeScanner, DateFormat, MessageBox) {
        "use strict";

        return Controller.extend("com.app.parkapplication.controller.Home", {

            onInit: function () {
                this.applyFilters();
                const oView = this.getView(),
                    oMulti1 = this.oView.byId("_IDGenMultiInput1");
                // const oMulti11 = this.oView.byId("iddytrucknumber"),
                //     oMulti12 = this.oView.byId("iddyslotnumber"),
                //     oMulti13 = this.oView.byId("iddrivermul");
                // var oModel = new sap.ui.model.odata.v2.ODataModel("sap/opu/odata/sap/ZSD_PARKINGLOT_APPLICATION_SRV/");
                // this.getView().setModel(oModel);
                let validae = function (arg) {
                    if (true) {
                        var text = arg.text;
                        return new sap.m.Token({ key: text, text: text });
                    }
                }
                oMulti1.addValidator(validae);
                // oMulti11.addValidator(validae);
                // oMulti12.addValidator(validae);
                // oMulti13.addValidator(validae);
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
            /**Dateformatter */
            formatDate: function (sDate) {
                if (/^\d{8}$/.test(sDate)) {
                    var year = sDate.substring(0, 4);
                    var month = sDate.substring(4, 6);
                    var day = sDate.substring(6, 8);

                    var oDate = new Date(year, month - 1, day);

                    var oDateFormat = DateFormat.getDateInstance({
                        pattern: "yyyy-MM-dd"
                    });

                    return oDateFormat.format(oDate);
                } else {
                    return "Invalid Date";
                }
            },
            /*For ToolMenuCollapse */
            onCollapseExpandPress() {
                const oSideNavigation = this.byId("idSidenavigation"),
                    bExpanded = oSideNavigation.getExpanded();
                oSideNavigation.setExpanded(!bExpanded);
            },
            applyFilters: function () {
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
                oBinding.refresh(); // Ensure binding is refreshed

                // Optional: Log the filtered items in the ComboBox for debugging
                var aItems = oSelect.getItems();
                console.log("Items after filter:", aItems.map(item => item.getText()));
            },

            onTruckTypeSelect: function () {
                // Call the function to apply filters whenever the checkbox state changes
                this.applyFilters();
            },
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
            onCreate: function () {
                // Getting values
                var slotno = this.byId("idslotcreatingidval").getValue();
                var del = this.byId("inwards21").getSelectedKey();
                var status = this.byId("idslotcreatingavialableval").getValue();
                var oModel = this.getView().getModel();
                var that = this;

                // Create a filter to check if the slot number already exists
                var oFilter = new sap.ui.model.Filter("Slotno", sap.ui.model.FilterOperator.EQ, slotno);

                // Check whether slot number already exists
                oModel.read("/PARKINGSLOTSSet", {
                    filters: [oFilter],
                    success: function (odata) {
                        if (odata && odata.results.length > 0) {
                            // Slot number already exists
                            MessageBox.error("Slot number already exists!");
                            that.onClears();
                        } else {
                            // Creating a new entry in the OData model
                            oModel.create("/PARKINGSLOTSSet", { Slotno: slotno, Status: status, Delivery: del }, {
                                success: function () {
                                    sap.m.MessageToast.show("Successfully Created!");
                                    that.byId("idparkingslottable").getBinding("items").refresh(); // Refresh the table binding
                                    that.onClears(); // Clear the form or inputs
                                },
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error: " + oError.message); // Display error message
                                }
                            });
                        }
                    },
                    error: function (oError) {
                        sap.m.MessageBox.error("Error checking slot existence: " + oError.message); // Display error message for the read operation
                    }
                });
            },

            /**Deleting the Parkingslots */
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
            },
            /**Naviagation to Charts View */
            onCS: async function () {
                this.getOwnerComponent().getRouter().navTo("Routechart");
            },
            /**Navigation to Charts Visualization */
            showSlots: function () {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteLot");
            },
            /** Bell text */
            onBell: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                // create popover
                if (!this._pPopover) {
                    this._pPopover = this.loadFragment({
                        name: "com.app.parkapplication.fragments.Notify"
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        oPopover.bindElement("");
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },
            /** Maps Loading */
            mapsload: async function () {
                // Load the fragment if it is not already loaded
                this.oMap ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.Maps"
                });
                var oHtml = this.byId("mapHtml");
                var mapUrl = "https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=hyderabad+(My%20Business%20Name)&amp;t=&amp;z=19&amp;ie=UTF8&amp;iwloc=B&amp;output=embed";
                oHtml.setContent('<div style="width: 100%;"><iframe width="100%" height="600" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' + mapUrl + '"></iframe></div>');
                this.oMap.open();
            },
            /**Maps close */
            onCloseDialog44: function () {
                this.oMap.close();

            },
            /**Toggle Mode */
            onToggleDarkMode: function () {
                var isDarkMode = document.body.classList.toggle('dark-mode');
                localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            },

            _applyTheme: function () {
                var currentTheme = localStorage.getItem('theme') || 'light';
                if (currentTheme === 'dark') {
                    document.body.classList.add('dark-mode');
                }
            },
            /** Notification fragment close */
            onnotifyClose: function () {
                this.byId("myPopover").close();
            },
            /**printing form */
            oOpenDial: async function () {
                this.oDialog22 ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.Print"
                })
                this.oDialog22.open();
            },
            closeReceiptDailog: function () {
                this.oDialog22.close();
            },
            /**reservation popup */
            onAdd: async function () {
                this.oDialog ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.Reservation"
                });
                this.oDialog.open();
            },
            onCloseDialog: function () {
                //checking whether dialog is open or not
                if (this.oDialog.isOpen()) {
                    this.oDialog.close()
                }
            },
            /** Reservation Confirm */
            onConfirm: function () {
                var osele = this.getView().byId("idreservependingtable").getSelectedItem();
                if (!osele) {
                    sap.m.MessageBox.error("Please Select at least one!!!");
                    return;
                }
                var osel = this.getView().byId("idreservependingtable").getSelectedItem().getBindingContext().getObject();
                var currentDate = new Date();

                // Extract date components
                var exitDate1 = currentDate.getFullYear() + '-' +
                    ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' +
                    ('0' + currentDate.getDate()).slice(-2);

                // Extract time components
                var exitTime1 = ('0' + currentDate.getHours()).slice(-2) + ':' +
                    ('0' + currentDate.getMinutes()).slice(-2) + ':' +
                    ('0' + currentDate.getSeconds()).slice(-2);
                const oSample = new sap.ui.model.json.JSONModel({
                    Rstatus: true,
                    Rcdate: exitDate1,
                    Rctime: exitTime1,
                    Reserveno: osel.Reserveno
                });
                // json model constructing
                var number = osel.Drivermobile; // Assuming osel.driverMob contains the recipient's phone number
                var ss = '+91' + number;
                const accountSid = 'ACb224f5ef242a9b70012285792ef40e8a';
                const authToken = '825aa6f260cb55938c47a748ae6cdba0';

                // Function to send SMS using Twili
                debugger
                const toNumber = ss; // Replace with recipient's phone number
                const fromNumber = '+18149043908'; // Replace with your Twilio phone number
                const messageBody = `Your reservation for parking slot ${osel.parkinglot_id} for truck ${osel.truckNo} has been confirmed!`; // Message content

                // Twilio API endpoint for sending messages
                const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

                // Payload for the POST request
                const payload = {
                    To: toNumber,
                    From: fromNumber,
                    Body: messageBody
                };

                // Send POST request to Twilio API using jQuery.ajax
                $.ajax({
                    url: url,
                    type: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                    },
                    data: payload,
                    success: function (data) {
                        console.log('SMS sent successfully:', data);
                        sap.m.MessageToast.show('SMS sent successfully!');
                    },
                    error: function (xhr, status, error) {
                        console.error('Error sending SMS:', error);
                        sap.m.MessageToast.show('Failed to send SMS: ' + error);
                    }
                });

                var text = "Your reservation is confirmed!!!";
                var baseUrl = "https://wa.me/";
                var encodedPhoneNumber = encodeURIComponent(number);
                var encodedText = encodeURIComponent(text);
                var finalUrl = baseUrl + encodedPhoneNumber + "?text=" + encodedText;
                sap.m.URLHelper.redirect(finalUrl, true);
                this.getView().setModel(oSample, "oSample");
                const opayload = this.getView().getModel("oSample").getData(),
                    oModel = this.getView().getModel();
                try {
                    oModel.update("/ReservedSlotsSet('" + opayload.Reserveno + "')", opayload, {
                        success: function () {
                            this.getView().byId("idreservependingtable").getBinding("items").refresh();
                            this.getView().byId("idReserveParkingtable").getBinding("items").refresh();
                            sap.m.MessageBox.Success("Reservation Confirmed/Approved !!!");
                        }.bind(this),
                        error: function (oError) {
                            sap.m.MessageBox.error("Reservation not approved!!" + oError.message);
                        }.bind(this)
                    })
                } catch (error) {
                    sap.m.MessageBox.error("Reservation not Confirmed!!!");
                }
            },
            /**Reserve Paring Refresh */
            onRefresh: function () {
                this.getView().byId("idreservependingtable").getBinding("items").refresh(true);
            },
            /**Parking vehicles History Screenshot */
            tablecapture: function () {
                var bodyElement = this.getView().byId("idparkinghis").getDomRef();
                html2canvas(bodyElement).then(function (canvas) {
                    var image = canvas.toDataURL('image/png');
                    var downloadLink = document.createElement('a');
                    downloadLink.href = image;
                    downloadLink.download = 'tablescreenshot.png';
                    downloadLink.style.display = 'none';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                });
            },
            /**Parking vehicles History Full Screenshot */
            screencapture: function () {
                var oView = this.getView();
                var oElement = oView.byId("idparkinghis");
                var oDomRef = oElement.getDomRef();
                domtoimage.toPng(oDomRef).then(function (dataUrl) {
                    var downloadLink = document.createElement('a');
                    downloadLink.href = dataUrl;
                    downloadLink.download = 'fullscreenshot.png';
                    downloadLink.style.display = 'none';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                })
                    .catch(function (error) {
                        console.error('Error:', error);
                    });
            },
            /**Parking vehicles History PDF */
            downloadpdf12: function () {
                var oView = this.getView();
                var oElement = oView.byId("idparkinghis");

                var oDomRef = oElement.getDomRef();
                /*var elementToCapture = document.getElementById('');*/
                domtoimage.toPng(oDomRef).then(function (dataUrl) {
                    var doc = new jsPDF({
                        orientation: 'landscape',
                    });
                    doc.addImage(dataUrl, 'PNG', 25, 25, 250, 150);
                    doc.save('specificTableView.pdf'); // Save with a different name if needed
                })
                    .catch(function (error) {
                        console.error('Error:', error);
                    });
            },
            /*onSearch for filtering the values for History Table*/
            onSearch: async function (oEvent) {
                debugger;
                var sQuery = oEvent.getSource().getValue().trim(); // Trim any leading/trailing whitespace
                var oList = this.byId("idparkinghis"); // Your list or table ID
                var oBinding = oList.getBinding("items");
                var oModel = this.getView().getModel(); // Assuming the model is bound to the view
                var sPath = "/ASSIGNEDSLOTSSet"; // Your EntitySet path
                /* Check if the binding is available*/
                if (!oBinding) {
                    console.error("Binding not found on the list");
                    return;
                }
                var oOutside = new Filter("Outside", FilterOperator.EQ, true);

                /* If no search query, fetch all data and reset the table */
                if (sQuery === "") {
                    try {
                        /*Fetch the data from the OData service*/
                        var aAllData = await new Promise((resolve, reject) => {
                            oModel.read(sPath, {
                                filters: [oOutside],
                                success: function (oData) {
                                    resolve(oData.results);
                                },
                                error: function (oError) {
                                    console.error("Failed to fetch all data:", oError);
                                    reject(oError);
                                }
                            });
                        });

                        /* Create a new JSON model with all the data */
                        var oAllDataModel = new sap.ui.model.json.JSONModel(aAllData);

                        /*Bind the all data model to the list*/
                        oList.setModel(oAllDataModel);
                        oList.bindItems({
                            path: "/",
                            template: oList.getBindingInfo("items").template
                        });

                        /*Reapply XML filters if they exist*/
                        var aFilters = oList.getBinding("items").aFilters || [];
                        if (aFilters.length > 0) {
                            oBinding.filter(aFilters);
                        }

                    } catch (error) {
                        console.error("Error fetching all data:", error);
                    }
                    return;
                }

                /* If there is a search query, perform the manual filtering*/
                try {
                    var aContexts = oBinding.getContexts();
                    var aItems = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });
                    /* Filter the data based on the query*/
                    var aFilteredItems = aItems.filter(function (oItem) {
                        return oItem.Truckno && oItem.Truckno.includes(sQuery) ||
                            oItem.Slotno && oItem.Slotno.includes(sQuery) ||
                            oItem.Drivername && oItem.Drivername.includes(sQuery) ||
                            oItem.Vendorname && oItem.Vendorname.includes(sQuery) ||
                            oItem.Outside && oItem.Outside.toString().includes(sQuery);
                    });

                    /*Create a new JSON model with the filtered data*/
                    var oFilteredModel = new sap.ui.model.json.JSONModel(aFilteredItems);
                    /*Bind the filtered model to the list*/
                    oList.setModel(oFilteredModel);
                    oList.bindItems({
                        path: "/",
                        template: oList.getBindingInfo("items").template
                    });

                } catch (error) {
                    console.error("Error filtering data:", error);
                }
            },

            /**Sorting All Tables */
            onSort: function (tableId) {
                var oTable;
                let fullId = tableId.getSource().getParent().getParent().getId();
                let id = fullId.split('--').pop();
                console.log(id);
                console.log("Trying to sort table with ID:", tableId);
                switch (id) {
                    case "idreservependingtable":
                        oTable = this.byId("idreservependingtable");
                        break;
                    case "idReserveParkingtable":
                        oTable = this.byId("idReserveParkingtable");
                        break;
                    case "idParkingvehiclestable":
                        oTable = this.byId("idParkingvehiclestable");
                        break;
                    default:
                        sap.m.MessageToast.show("Invalid table ID.");
                        return;
                }
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    var oSorter = new sap.ui.model.Sorter('parkinglot_id', true); // Replace with your sorting property
                    oBinding.sort(oSorter);
                } else {
                    sap.m.MessageToast.show("Table binding not found. Cannot apply sorting.");
                }
            },
            /** Scanning the Barcode */
            onScanner: function (oEvent) {
                BarcodeScanner.scan(
                    function (mResult) {
                        if (mResult && mResult.text) {
                            var scannedText = mResult.text;
                            sap.m.MessageBox.show("We got barcode: " + scannedText);
                            // Assuming you have an input field with ID "idMat" to display the scanned text
                            this.getView().byId("idMat").setValue(scannedText);
                            this.onSearching();
                            // this.onSearching();
                            var otable = this.getView().byId("idParkingvehiclestable").getBinding("items");
                            otable.refresh(true);

                        } else {
                            sap.m.MessageBox.error("Barcode scan failed or no result.");
                        }
                    }.bind(this), // Bind 'this' context to access the view
                    function (oError) {
                        sap.m.MessageBox.error("Barcode scanning failed: " + oError);
                    }
                );
            },

            /**Searching Truck in Assignes slots */
            onSearching: async function (oEvent) {
                // var otno = this.byId("idMat").getValue();
                // var oagg = this.byId("idParkingvehiclestable").getBinding("items");
                // if (otno) {
                //     var ofilter = new Filter("Truckno", FilterOperator.EQ, otno);
                //     oagg.filter(ofilter);
                // } else {
                //     oagg.filter([]);
                // }

                var sQuery = this.byId("idMat").getValue().trim();
                var oList = this.byId("idParkingvehiclestable"); // Your list or table ID
                var oBinding = oList.getBinding("items");
                var oInside = new Filter("Inside", FilterOperator.EQ, true);
                // Check if the binding is available
                if (!oBinding) {
                    console.error("Binding not found on the list");
                    return;
                }

                // If no search query, fetch all data and reset the table
                if (sQuery === "") {
                    try {
                        var oModel = this.getView().getModel(); // Assuming the model is bound to the view
                        var sPath = "/ASSIGNEDSLOTSSet"; // Your EntitySet path

                        // Fetch the data from the OData service
                        var aAllData = await new Promise((resolve, reject) => {
                            oModel.read(sPath, {
                                filters: [oInside],
                                success: function (oData) {
                                    resolve(oData.results);
                                },
                                error: function (oError) {
                                    console.error("Failed to fetch all data:", oError);
                                    reject(oError);
                                }
                            });
                        });

                        // Create a new JSON model with all the data
                        var oAllDataModel = new sap.ui.model.json.JSONModel(aAllData);

                        // Bind the all data model to the list
                        oList.setModel(oAllDataModel);
                        oList.bindItems({
                            path: "/",
                            template: oList.getBindingInfo("items").template
                        });
                    } catch (error) {
                        console.error("Error fetching all data:", error);
                    }
                    return;
                }

                // If there is a search query, perform the manual filtering
                try {
                    var aContexts = oBinding.getContexts();
                    var aItems = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    // Filter the data based on the query
                    var aFilteredItems = aItems.filter(function (oItem) {
                        return oItem.Truckno && oItem.Truckno.includes(sQuery) ||
                            oItem.Inside && oItem.Inside.toString().includes(sQuery);
                    });
                    // Create a new JSON model with the filtered data
                    var oFilteredModel = new sap.ui.model.json.JSONModel(aFilteredItems);
                    // Bind the filtered model to the list
                    oList.setModel(oFilteredModel);
                    oList.bindItems({
                        path: "/",
                        template: oList.getBindingInfo("items").template
                    });
                } catch (error) {
                    console.error("Error filtering data:", error);
                }
            },
            //clear input
            onClearsinput: function () {
                this.byId("idMat").setValue("");
                this.onSearching();
            },
            // on Search Filtering values in Parking vehicle
            onSearchParking: async function (oEvent) {
                var sQuery = oEvent.getSource().getValue().trim();
                var oList = this.byId("idParkingvehiclestable"); // Your list or table ID
                var oBinding = oList.getBinding("items");
                var oInside = new Filter("Inside", FilterOperator.EQ, true);
                // Check if the binding is available
                if (!oBinding) {
                    console.error("Binding not found on the list");
                    return;
                }

                // If no search query, fetch all data and reset the table
                if (sQuery === "") {
                    try {
                        var oModel = this.getView().getModel(); // Assuming the model is bound to the view
                        var sPath = "/ASSIGNEDSLOTSSet"; // Your EntitySet path

                        // Fetch the data from the OData service
                        var aAllData = await new Promise((resolve, reject) => {
                            oModel.read(sPath, {
                                filters: [oInside],
                                success: function (oData) {
                                    resolve(oData.results);
                                },
                                error: function (oError) {
                                    console.error("Failed to fetch all data:", oError);
                                    reject(oError);
                                }
                            });
                        });

                        // Create a new JSON model with all the data
                        var oAllDataModel = new sap.ui.model.json.JSONModel(aAllData);

                        // Bind the all data model to the list
                        oList.setModel(oAllDataModel);
                        oList.bindItems({
                            path: "/",
                            template: oList.getBindingInfo("items").template
                        });
                    } catch (error) {
                        console.error("Error fetching all data:", error);
                    }
                    return;
                }

                // If there is a search query, perform the manual filtering
                try {
                    var aContexts = oBinding.getContexts();
                    var aItems = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    // Filter the data based on the query
                    var aFilteredItems = aItems.filter(function (oItem) {
                        return oItem.Truckno && oItem.Truckno.includes(sQuery) ||
                            oItem.Slotno && oItem.Slotno.includes(sQuery) ||
                            oItem.Drivername && oItem.Drivername.includes(sQuery) ||
                            oItem.Vendorname && oItem.Vendorname.includes(sQuery) ||
                            oItem.Inside && oItem.Inside.toString().includes(sQuery);
                    });
                    // Create a new JSON model with the filtered data
                    var oFilteredModel = new sap.ui.model.json.JSONModel(aFilteredItems);
                    // Bind the filtered model to the list
                    oList.setModel(oFilteredModel);
                    oList.bindItems({
                        path: "/",
                        template: oList.getBindingInfo("items").template
                    });
                } catch (error) {
                    console.error("Error filtering data:", error);
                }

            },
            /** Vehicle left  */
            onLeft: function () {
                var oView = this.getView();
                var oTable = oView.byId("idParkingvehiclestable");
                var oSelectedItem = oTable.getSelectedItem();
                if (!oSelectedItem) {
                    sap.m.MessageBox.error("Please select a vehicle to remove.");
                    return;
                } else if (oSelectedItem.length > 1) {
                    sap.m.MessageBox.error("Please Select only one value");
                } else {
                    var osel = oSelectedItem.getBindingContext().getObject();
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

                    // const formattedTime = getCurrentTime();

                    // Create JSON models for leftModel and oParkingslot
                    var leftModel = new sap.ui.model.json.JSONModel({
                        Inside: false,
                        Outside: true,
                        Assignedno: osel.Assignedno,
                        Exdate: exitDate1,
                        Extime: exitTime1,
                        Slotno: osel.Slotno
                    });
                    oView.setModel(leftModel, "leftModel");

                    var oParkingslot = new sap.ui.model.json.JSONModel({
                        Slotno: osel.Slotno,
                        Status: "Available"
                    });
                    oView.setModel(oParkingslot, "oParkingslot");

                    var oModel = oView.getModel();
                    var that = this;
                    // Update ParkingLot to mark slot as available
                    oModel.update("/PARKINGSLOTSSet('" + osel.Slotno + "')", oParkingslot.getData(), {
                        success: function () {
                            oModel.refresh(true);
                            that.byId("idparkingslottable").getBinding("items").refresh(true);
                            that.onBellText();
                            that.getView().byId("_IDGenComboBox2").getBinding("items").refresh();
                            // Update ParkignVeh to mark vehicle as unassigned
                            oModel.update("/ASSIGNEDSLOTSSet('" + osel.Assignedno + "')", leftModel.getData(), {
                                success: function () {
                                    that.byId("idParkingvehiclestable").getBinding("items").refresh(); // Refresh table binding
                                    that.byId("idparkingslottable").getBinding("items").refresh(true);
                                    that.onBellText();
                                    that.getView().byId("_IDGenComboBox2").getBinding("items").refresh();
                                    sap.m.MessageToast.show("Vehicle left from the parking area.");
                                    oModel.refresh(true);
                                    // Speak message
                                    var text = osel.Truckno + " vehicle is left from parking";
                                    var utterance = new SpeechSynthesisUtterance(text);
                                    speechSynthesis.speak(utterance);

                                    oModel.refresh(true); // Refresh the model after updates
                                }.bind(this),
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error updating ParkignVeh: " + oError.message);
                                    console.error("Error updating ParkignVeh:", oError);
                                }
                            });
                        }.bind(this),
                        error: function (oError) {
                            sap.m.MessageBox.error("Error updating ParkingLot: " + oError.message);
                            console.error("Error updating ParkingLot:", oError);
                        }
                    });
                }
            },
            /**Assigned Vehicles PDF!! */
            downloadpdf1: function () {
                var oModel = this.getView().getModel();
                var ofilter = new sap.ui.model.Filter("Inside", FilterOperator.EQ, true);
                oModel.read("/ASSIGNEDSLOTSSet", {
                    filters: [ofilter],
                    success: function (oData) {
                        console.log("Data read successfully:", oData);

                        var rows = [];


                        oData.results.forEach(function (item) {
                            var enterDate = item.Endate;
                            var formattedDate = "";

                            if (enterDate instanceof Date) {
                                // Extract date only in YYYY-MM-DD format
                                formattedDate = enterDate.toISOString().split('T')[0];
                            }
                            rows.push([
                                item.Truckno || "",
                                item.Drivername || "",
                                item.Slotno || "",
                                formattedDate || "",
                                item.Vendorname || "",

                            ]);
                        });


                        // Generate PDF document
                        var docDefinition = {
                            content: [
                                {
                                    style: "header",
                                    alignment: "center",
                                    text: "Parking Vehicle Details Report"
                                },
                                {
                                    table: {
                                        headerRows: 1,
                                        widths: ["*", "*", "*", "*", "*"],
                                        body: [
                                            ["Truck Number", "Driver Name", "Parking Lot", "Enter Date", "Vendor Name"],
                                            ...rows
                                        ]
                                    }
                                }
                            ]
                        };
                        var pdfDocGenerator = pdfMake.createPdf(docDefinition);
                        pdfDocGenerator.download("ParkingVehicleDetails.pdf");
                    },
                    error: function (oError) {
                        console.error("Error reading data:", oError);
                        sap.m.MessageBox.error("Failed to fetch data.");
                    }
                });
            },
            /**Edit press in Assigned Vehicles */
            onEditPress: function (oEvent) {
                var oSel = this.byId("idParkingvehiclestable").getSelectedItem();
                if (!oSel) {
                    sap.m.MessageBox.error("Please Select at least one Value!!");
                    return;
                }

                var oButton = oEvent.getSource();
                var sButtonText = oButton.getText();
                var oContext = oSel.getBindingContext();
                var oObject = oContext.getObject();
                var sServiceType = oObject.Delivery; // Get the delivery service type of the selected item

                // Get the cells and control references
                var aCells = oSel.getCells();
                var oComboBox = aCells[3].getItems()[1]; // Assuming ComboBox is at index 1
                var oInput = aCells[3].getItems()[0]; // Assuming Input is at index 0
                var oModel = this.getView().getModel();

                if (sButtonText === "Edit") {
                    // Switch to submit mode
                    oButton.setText("Submit");
                    this.byId("ijhhjs").setVisible(true);

                    // Filter the ComboBox items based on the service type
                    this._filterAvailableSlotsByServiceType(oComboBox, sServiceType);

                    // Toggle visibility of controls in the selected row
                    aCells.forEach(function (oCell) {
                        var aItems = oCell.getItems ? oCell.getItems() : [];
                        aItems.forEach(function (oItem) {
                            if (oItem instanceof sap.m.Text) {
                                oItem.setVisible(false); // Hide text items
                            } else if (oItem instanceof sap.m.Input) {
                                oItem.setVisible(false); // Hide input field
                            } else if (oItem instanceof sap.m.ComboBox) {
                                oItem.setVisible(true); // Show combo box
                            }
                        });
                    });

                } else {
                    // Switch back to edit mode
                    oButton.setText("Edit");
                    this.byId("ijhhjs").setVisible(false);

                    // Toggle visibility of controls in the selected row
                    aCells.forEach(function (oCell) {
                        var aItems = oCell.getItems ? oCell.getItems() : [];
                        aItems.forEach(function (oItem) {
                            if (oItem instanceof sap.m.Text) {
                                oItem.setVisible(true); // Show text items
                            } else if (oItem instanceof sap.m.ComboBox) {
                                oItem.setVisible(false); // Hide combo box
                            } else if (oItem instanceof sap.m.Input) {
                                oItem.setVisible(true); // Show input field
                            }
                        });
                    });

                    // Get values to update
                    var oldSlotValue = oInput.getValue(); // Get Text value from Input
                    var newSlotKey = oComboBox.getSelectedKey(); // Get ComboBox selected key
                    if(!newSlotKey){
                        MessageBox.error("SLot value should be filled")
                    }else{
                    var oID = oObject.Slotno; // Assuming id is directly from the selected object
                    var that = this;

                    // Update the Assigned Slots
                    oModel.update("/ASSIGNEDSLOTSSet('" + oObject.Assignedno + "')", { Slotno: newSlotKey }, {
                        success: function () {
                            oModel.refresh(true);
                            that.getView().byId("idParkingvehiclestable").getBinding("items").refresh(true);

                            // Update the status of the old slot
                            oModel.update("/PARKINGSLOTSSet('" + oldSlotValue + "')", { Status: 'Available' }, {
                                success: function () {
                                    sap.m.MessageToast.show("Successfully updated the old slot status");
                                    oModel.refresh(true);
                                    that.oRefreshButton();
                                    that.getView().byId("idparkingslottable").getBinding("items").refresh(true);

                                    // Update the status of the new slot
                                    oModel.update("/PARKINGSLOTSSet('" + newSlotKey + "')", { Status: 'Not Available', Delivery: sServiceType }, {
                                        success: function () {
                                            sap.m.MessageToast.show("Successfully updated the new slot status");
                                            oModel.refresh(true);
                                            that.getView().byId("idparkingslottable").getBinding("items").refresh(true);
                                        },
                                        error: function (oError) {
                                            sap.m.MessageBox.error("Error updating new slot status: " + oError.message);
                                        }
                                    });
                                },
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error updating old slot status: " + oError.message);
                                }
                            });
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error("Error updating assigned slot: " + oError.message);
                        }
                    });
                }
            }
            },

            // Filter ComboBox items based on the service type
            _filterAvailableSlotsByServiceType: function (oComboBox, sServiceType) {
                var oModel = this.getView().getModel();
                var aFilters = [
                    new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "Available"),
                    new sap.ui.model.Filter("Delivery", sap.ui.model.FilterOperator.EQ, sServiceType)
                ];

                oComboBox.bindAggregation("items", {
                    path: "/PARKINGSLOTSSet",
                    template: new sap.ui.core.Item({
                        key: "{Slotno}",
                        text: "{Slotno}"
                    }),
                    filters: aFilters
                });
            }
            ,
            onCancelB: function (oEvent) {
                // Reset the button text to "Edit"
                this.byId("kkjsieed").setText("Edit");

                // Hide the additional action buttons or controls
                this.byId("ijhhjs").setVisible(false);

                // Get the selected item
                var oSel = this.byId("idParkingvehiclestable").getSelectedItem();
                if (!oSel) {
                    sap.m.MessageToast.show("Please select a slot to cancel.");
                    return;
                }

                // Get the binding context and object
                const oObject = oSel.getBindingContext().getObject();

                // Refresh button and other components as needed
                this.oRefreshButton();
                this.onBellText();

                // Get the cells and control references
                var aCells = oSel.getCells();
                var oInput = aCells[3].getItems()[0]; // Assuming Input is at index 0
                var oComboBox = aCells[3].getItems()[1]; // Assuming ComboBox is at index 1

                // Set visibility for the controls
                oInput.setVisible(true); // Show Input field
                oComboBox.setVisible(false); // Hide ComboBox
                //oComboBox.setEditable(false); // Ensure ComboBox is not editable

                // Update any additional data or state as needed
                // Example: Reset ComboBox selection if required
                oComboBox.setSelectedKey(""); // Clear selected key
            }
            ,
            /**Parking Slots Search Clear */
            onClearFilterPress: function () {
                const oView = this.getView(),
                    oParkingno = oView.byId("_IDGenMultiInput1").setValue();
                // oParkingSlotFilter = oView.byId("inward").setValue();
            },
            /**Filters in ParkingLot */
            // for filters
            onGoPress: function (oEvent) {
                const oview = this.getView(),
                    // oParkingSlotFilter = oview.byId("inward"),
                    oParkingno = oview.byId("_IDGenMultiInput1"),
                    oavailable = oview.byId("idavailablestausforselect"),
                    // sParkingSlotNumber = oParkingSlotFilter.getSelectedKey(),
                    savailable = oavailable.getSelectedKey(),
                    sParkingno = oParkingno.getTokens(),
                    oTable = oview.byId("idparkingslottable"),
                    aFilters = [];
                // sParkingSlotNumber ? aFilters.push(new Filter("inward", FilterOperator.EQ, sParkingSlotNumber)) : "";
                savailable ? aFilters.push(new Filter("Status", FilterOperator.EQ, savailable)) : "";
                // sParkingno ? aFilters.push(new Filter("id", FilterOperator.EQ, sParkingno)) : "";
                sParkingno.filter((ele) => {
                    ele ? aFilters.push(new Filter("Slotno", FilterOperator.EQ, ele.getKey())) : " ";
                })
                oTable.getBinding("items").filter(aFilters);
            },

            /**Parkingslots refresh */
            onree: function () {
                this.getView().byId("idVbox").refresh(true);
                this.getView().byId("idparkingslottable").getBinding("items").refresh(true);
            },
            onAssignPress: async function () {
                var oTruckNo = this.getView().byId("input1").getValue();
                var oDriverName = this.getView().byId("input5").getValue();
                var oMobile = this.getView().byId("input6").getValue();
                var oVendor = this.getView().byId("idvalue7").getValue();
                var oVendorMob = this.getView().byId("idvalue8").getValue();
                var oinbound = this.getView().byId("_IDOutboundCheckBox").getSelected() ? 'Outbound' : 'Inbound';
                var oParkingLotId = this.getView().byId("_IDGenComboBox2").getSelectedKey();
                const formattedTime = this.getCurrentTime();
                const formattedDate = this.formatDateToShort(new Date());
                // Function to get current time in hh:mm:ss
                function getCurrentTime() {
                    const now = new Date();
                    const hours = now.getHours().toString().padStart(2, '0');
                    const minutes = now.getMinutes().toString().padStart(2, '0');
                    const seconds = now.getSeconds().toString().padStart(2, '0');
                    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
                    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
                }
                // const formattedTime = getCurrentTime();
                // Payload for creating ParkignVeh entity
                if (oTruckNo === '' || oDriverName === '' || oMobile === '' || oVendor === '' || oinbound === '' || oParkingLotId === '') {
                    sap.m.MessageBox.error("Please enter all required fields!!!!!");
                }

                else {
                    const opayload = {
                        Truckno: oTruckNo,
                        Drivername: oDriverName,
                        Drivermobile: oMobile,
                        Slotno: oParkingLotId,
                        Endate: formattedDate,
                        Entime: formattedTime,
                        Exdate: "",
                        Extime: "",
                        Vendorname: oVendor,
                        Delivery: oinbound,
                        Inside: true,
                        Outside: false
                    };
                    const oModel = this.getView().getModel();
                    const ofilter1 = new sap.ui.model.Filter("Truckno", sap.ui.model.FilterOperator.EQ, oTruckNo);
                    const ofilter2 = new sap.ui.model.Filter("Inside", sap.ui.model.FilterOperator.EQ, true);
                    var that = this;
                    oModel.read("/ASSIGNEDSLOTSSet", {
                        filters: [ofilter1, ofilter2], success: async function (odata) {
                            if (!odata || odata.results.length === 0 || odata === null) {
                                var ss = '+91' + oMobile;
                                const accountSid = 'ACb224f5ef242a9b70012285792ef40e8a';
                                const authToken = '825aa6f260cb55938c47a748ae6cdba0';

                                // Function to send SMS using Twili
                                debugger
                                const toNumber = ss; // Replace with recipient's phone number
                                const fromNumber = '+18149043908'; // Replace with your Twilio phone number
                                const messageBody = `Your reservation for parking slot ${oParkingLotId} for truck ${oTruckNo} has been confirmed!`; // Message content

                                // Twilio API endpoint for sending messages
                                const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

                                // Payload for the POST request
                                const payload = {
                                    To: toNumber,
                                    From: fromNumber,
                                    Body: messageBody
                                };

                                // Send POST request to Twilio API using jQuery.ajax
                                $.ajax({
                                    url: url,
                                    type: 'POST',
                                    headers: {
                                        'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                                    },
                                    data: payload,
                                    success: function (data) {
                                        console.log('SMS sent successfully:', data);
                                        sap.m.MessageToast.show('SMS sent successfully!');
                                    },
                                    error: function (xhr, status, error) {
                                        console.error('Error sending SMS:', error);
                                        sap.m.MessageToast.show('Failed to send SMS: ' + error);
                                    }
                                });

                                // Create ParkignVeh entity
                                await that.createData(oModel, opayload, "/ASSIGNEDSLOTSSet")
                                    .then(() => {
                                        // Update ParkingLot to mark slot as unavailable
                                        const oParkingslotpayload = {
                                            Slotno: oParkingLotId,
                                            Status: "Not Available" // Corrected spelling to 'available'
                                        };
                                        that.getView().byId("idParkingvehiclestable").getBinding("items").refresh(true);
                                        oModel.refresh(true)
                                        that.onBellText();
                                        that.getView().byId("parkingLotSelect").getBinding("items").refresh();
                                        return that.updateData(oModel, oParkingslotpayload, "/ParkingLot('" + oParkingLotId + "')");
                                        oModel.refresh(true);
                                    })
                                    .then(() => {
                                        // Refresh table items and clear input fields on success
                                        that.getView().byId("idParkingvehiclestable").getBinding("items").refresh(true);
                                        oModel.refresh(true);
                                        that.oRefreshButton();
                                        that.onBellText();
                                        sap.m.MessageToast.show("Vehicle assigned to parking slot successfully!");
                                        oModel.refresh(true);
                                        that.getView().byId("_IDGenComboBox2").getBinding("items").refresh();
                                        that.clearInputFields();
                                        that.onBellText();
                                        oModel.refresh(true);
                                    })
                                    .catch((error) => {
                                        // sap.m.MessageBox.error("Failed to assign vehicle to parking slot: " + error.message);
                                    });

                                await that.oOpenDial();

                                that._generateBarcode(oTruckNo)
                                that.byId("textprint11").setText(oTruckNo);
                                console.log(oTruckNo);
                                that.byId("textprint5").setText(oParkingLotId);
                                console.log(oParkingLotId);
                                that.byId("textprint234").setText(oDriverName);
                                console.log(oDriverName)
                                that.byId("textprint33").setText(oMobile);
                                var adata = new Date();
                                that.byId("dfvtextprint1").setText(adata);
                                that.byId("dfvtextprint13").setText(formattedTime);
                                console.log(oMobile)
                                if (oinbound === false) {
                                    that.byId("textprint443").setText("Outbound");
                                } else {
                                    that.byId("textprint443").setText("Inbound");
                                }
                            } else {
                                sap.m.MessageBox.error("Truck is already assigned");
                            }
                        }
                    })
                }


            },
            createData: function (oModel, opayload, sPath) {
                return new Promise((resolve, reject) => {
                    oModel.create(sPath, opayload, {
                        success: function (oSuccessData) {
                            resolve(oSuccessData);
                            oModel.refresh(true);
                        },
                        error: function (oErrorData) {
                            reject(oErrorData);
                        }
                    });
                });


            },
            updateData: function (oModel, opayload, sPath) {
                return new Promise((resolve, reject) => {
                    oModel.update(sPath, opayload, {
                        success: function (oSuccessData) {
                            resolve(oSuccessData);
                            oModel.refresh(true);
                        },
                        error: function (oErrorData) {
                            reject(oErrorData);
                        }
                    });
                });


            },

            clearInputFields: function () {
                this.getView().byId("idTruckInput").setValue("");
                this.getView().byId("idDriverNameInputs").setValue("");
                this.getView().byId("idDriverMobileInputs").setValue("");
                this.getView().byId("idinputvendor").setValue("");
                oModel.refresh(true);
            },
            /**Unassign press */
            onUnassignPress: function () {
                this.getView().byId("idTruckInput").setValue("");
                this.getView().byId("idDriverNameInputs").setValue("");
                this.getView().byId("idDriverMobileInputs").setValue("");
                this.getView().byId("idinputvendor").setValue("");
                // oModel.refresh(true);

            },
            // truck Number validation
            TruckLiveChange: async function (oEvent) {
                // Step 1: Retrieve the value from input field
                var oTruckNoInput = oEvent.getSource(); // Assuming this is the input field control
                var oTruckNo = oTruckNoInput.getValue();

                // Step 2: Define the regular expression pattern
                var truckNumberRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/;
                if (oTruckNo.match(truckNumberRegex)) {
                    oTruckNoInput.setValueState("Success");
                } else if (oTruckNo.trim === '') {
                    oTruckNoInput.setValueState("None");
                }
                else {
                    oTruckNoInput.setValueState("Error")

                }
            },
            /**Driver Name Validations */
            DriverNameChange: async function (oEvent) {
                var oDriverInput = oEvent.getSource();
                var oDriveValue = oDriverInput.getValue();
                var namereg = /^[A-Za-z]+(?:[\s-][A-Za-z]+)*$/;
                if (oDriveValue.match(namereg)) {
                    oDriverInput.setValueState("Success");
                } else if (oDriveValue.trim === '') {
                    oDriverInput.setValueState("None");
                } else {
                    oDriverInput.setValueState('Error')
                }
            },
            // for mobile number validation 
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
            // Vendor Name validations
            VendorVal: async function (oEvent) {
                var oInput = oEvent.getSource();
                var oval = oInput.getValue();
                var namereg = /^[a-zA-Z]+(?:[\s-][a-zA-Z]+)*$/;
                if (oval.match(namereg)) {
                    oInput.setValueState("Success");
                } else if (oval.trim === '') {
                    oInput.setValueState("None");
                } else {
                    oInput.setValueState('Error')
                }
            },

            // Filters in reservation table
            onGoFilter: function (ele) {
                const otruckFilter = this.getView().byId("iddytrucknumber").getTokens();
                const oparkingslot = this.getView().byId("iddyslotnumber").getTokens();
                const oDriverName = this.getView().byId("iddrivermul").getTokens();
                var aFilter = [];
                otruckFilter.filter((ele) => {
                    ele ? aFilter.push(new Filter("Truckno", FilterOperator.EQ, ele.getKey())) : " ";
                });
                oparkingslot.filter((ele) => {
                    ele ? aFilter.push(new Filter("Slotno", FilterOperator.EQ, ele.getKey())) : " ";
                });
                oDriverName.filter((ele) => {
                    ele ? aFilter.push(new Filter("Drivername", FilterOperator.EQ, ele.getKey())) : " ";
                });
                // update the table based on filters
                const oTable = this.byId("idReserveParkingtable");
                var oBinding = oTable.getBinding("items");
                oBinding.filter(aFilter);
                oBinding.attachChange(function () {
                    // Log the count of items in the table after filtering
                    console.log("Filtered Items Count:", oBinding.getLength());
                });
            },
            /**Deletions in Reserve Parking table */
            onDeletes1: function () {
                var osel = this.byId("idReserveParkingtable").getSelectedItem();
                var temp = osel.getBindingContext().getObject();
                if (osel.length === 0) {
                    sap.m.MessageBox.error("Please select at least one Record!!");
                    // return;
                } else {
                    var sPath = osel.getBindingContext().getPath();
                    var oModel = osel.getModel();
                    var that = this;
                    oModel.remove(sPath, {
                        success: function () {
                            console.log("Item deleted successfully.");
                            sap.m.MessageToast.show("successfully Deleted!!!")
                            oModel.refresh(true);
                            oModel.update("/PARKINGSLOTSSet('" + temp.Slotno + "')", { Status: 'Available' }, {
                                success: function () {
                                    sap.m.MessageToast.show("Successfully updated!!!");
                                    oModel.refresh();
                                    that.onBellText();
                                    that.byId("idparkingslottable").getBinding("items").refresh(true);
                                }, error: function (oError) {
                                    sap.m.MessageBox.error("Error occurs!!");
                                }
                            })
                        },
                        error: function (oError) {
                            console.error("Error deleting item:", oError);
                        }
                    })

                }
            },
            /**Edit button in reserve parking confirmation table */
            // editing code
            editbutton: function (oEvent) {
                var oSel = this.byId("idReserveParkingtable").getSelectedItem();
                if (!oSel) {
                    sap.m.MessageToast.show("Please select a slot to edit.");
                    return;
                }

                var oButton = oEvent.getSource();
                var sButtonText = oButton.getText();
                var oContext = oSel.getBindingContext();
                var oObject = oContext.getObject();
                var sServiceType = oObject.Delivery; // Get the delivery service type of the selected item

                // Get the cells and control references
                var aCells = oSel.getCells();
                var oComboBox = aCells[4].getItems()[1]; // Assuming ComboBox is at index 1
                var oInput = aCells[4].getItems()[0]; // Assuming Input is at index 0
                var oModel = this.getView().getModel();

                if (sButtonText === "Edit") {
                    // Switch to submit mode
                    oButton.setText("Submit");
                    this.byId("jdjhajkjajkjhgh").setVisible(true);

                    // Filter the ComboBox items based on the service type
                    this._filterAvailableSlotsByServiceType(oComboBox, sServiceType);

                    // Toggle visibility of controls in the selected row
                    aCells.forEach(function (oCell) {
                        var aItems = oCell.getItems ? oCell.getItems() : [];
                        aItems.forEach(function (oItem) {
                            if (oItem instanceof sap.m.Text) {
                                oItem.setVisible(false); // Hide text items
                            } else if (oItem instanceof sap.m.Input) {
                                oItem.setVisible(false); // Show input or combo box
                            }
                            else if (oItem instanceof sap.m.ComboBox) {
                                oItem.setVisible(true); // Show input or combo box
                            }
                        });
                    });

                } else {
                    // Switch back to edit mode
                    oButton.setText("Edit");
                    this.byId("jdjhajkjajkjhgh").setVisible(false);

                    // Toggle visibility of controls in the selected row
                    aCells.forEach(function (oCell) {
                        var aItems = oCell.getItems ? oCell.getItems() : [];
                        aItems.forEach(function (oItem) {
                            if (oItem instanceof sap.m.Text) {
                                oItem.setVisible(false); // Show text items
                            } else if (oItem instanceof sap.m.ComboBox) {
                                oItem.setVisible(false); // Hide combo box
                            } else if (oItem instanceof sap.m.Input) {
                                oItem.setVisible(true); // Show input field
                            }
                        });
                    });

                    // Get values to update
                    var oldSlotValue = oInput.getValue(); // Get Text value from Input
                    var newSlotKey = oComboBox.getSelectedKey(); // Get ComboBox selected key
                    if(!newSlotKey){
                        MessageBox.error("SLot value should be filled")
                    }else{
                    var oID = oObject.Reserveno; // Assuming id is directly
                    var that = this;
                    // Update the Reserved Slots
                    oModel.update("/ReservedSlotsSet('" + oID + "')", { Slotno: newSlotKey }, {
                        success: function () {
                            oModel.refresh(true);
                            that.getView().byId("idReserveParkingtable").getBinding("items").refresh(true);

                            // Update the status of the old slot
                            oModel.update("/PARKINGSLOTSSet('" + oldSlotValue + "')", { Status: 'Available' }, {
                                success: function () {
                                    sap.m.MessageToast.show("Successfully updated the old slot status");
                                    oModel.refresh(true);
                                    that.onBellText();
                                    that.getView().byId("idparkingslottable").getBinding("items").refresh(true);

                                    // Update the status of the new slot
                                    oModel.update("/PARKINGSLOTSSet('" + newSlotKey + "')", { Status: 'Reserved' }, {
                                        success: function () {
                                            sap.m.MessageToast.show("Successfully updated the new slot status");
                                            oModel.refresh(true);
                                            that.getView().byId("idparkingslottable").getBinding("items").refresh(true);
                                        },
                                        error: function (oError) {
                                            sap.m.MessageBox.error("Error updating new slot status: " + oError.message);
                                        }
                                    });
                                },
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error updating old slot status: " + oError.message);
                                }
                            });
                        },
                        error: function (oError) {
                            sap.m.MessageBox.error("Error updating reserved slot: " + oError.message);
                        }
                    });
                }
            }
            },

            // Filter ComboBox items based on the service type
            _filterAvailableSlotsByServiceType: function (oComboBox, sServiceType) {
                var oModel = this.getView().getModel();
                var aFilters = [
                    new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "Available"),
                    new sap.ui.model.Filter("Delivery", sap.ui.model.FilterOperator.EQ, sServiceType)
                ];

                oComboBox.bindAggregation("items", {
                    path: "/PARKINGSLOTSSet",
                    template: new sap.ui.core.Item({
                        key: "{Slotno}",
                        text: "{Slotno}"
                    }),
                    filters: aFilters
                });
            },
            onBeforeRendering: function () {
                debugger
                this.onBellText();
                this.applyFilters();
                this.byId("idreservependingtable").getBinding("items");
            },
            onAfterRendering: function () {
                this.onBellText();
                this.applyFilters();
            },
            onBellText: function () {
                var oModel = this.getView().getModel();
                var that = this;
                oModel.read("/NOTIFICATIONSSet", {
                    success: function (odata) {
                        var otemp = odata.results.length;
                        // that.getView().byId("idnotification").setText(otemp);
                        that.getView().byId("_IDGenBadgeCustomData1").setValue(otemp);

                    }, error: function (oError) {

                    }

                })
            },
            /**Reserve parking confirmation vehicles print */
            downloadpdf: function () {
                var oModel = this.getView().getModel();

                oModel.read("/ReservedSlotsSet", {
                    success: function (oData) {
                        console.log("Data read successfully:", oData);

                        // Process the data
                        var rows = [];

                        oData.results.forEach(function (item) {
                            rows.push([
                                item.Truckno || "",
                                item.Drivername || "",
                                item.Drivermobile || "",
                                item.Rstatus ? "true" : "false",
                                item.Slotno || "",
                                item.Rcdate || "",
                                item.Vendorname || "",
                            ]);
                        });

                        // Generate PDF document
                        var docDefinition = {
                            content: [
                                {
                                    style: "header",
                                    alignment: "center",
                                    text: "Reserved Parking Details Report"
                                },
                                {
                                    table: {
                                        headerRows: 1,
                                        widths: ["*", "*", "*", "*", "*", "*", "*"],
                                        body: [
                                            ["Truck Number", "Driver Name", "Driver Mobile", "Reservation Status", "Parking Lot ID", "Confirmation Date", "Vendor Name"],
                                            ...rows
                                        ]
                                    }
                                }
                            ]
                        };

                        // Generate and download PDF
                        if (typeof pdfMake !== 'undefined') {
                            var pdfDocGenerator = pdfMake.createPdf(docDefinition);
                            pdfDocGenerator.download("ReservedParkingDetails.pdf");
                        } else {
                            console.error('pdfMake is not defined');
                            MessageBox.error("PDF generation library is not available.");
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data:", oError);
                        MessageBox.error("Failed to fetch data.");
                    }
                });
            },
            /** Reservation Creation */
            onCreateReserveDialog: function () {
                //getting  values from the input fields
                var oTruckNo = this.getView().byId("idTruckNumberInput").getValue();
                var oDriverName = this.getView().byId("idDriverNameInput").getValue();
                var oDriverMob = this.getView().byId("idDrivernewMobile").getValue();
                var ovendorName = this.getView().byId("idvessbane").getValue();
                var oinbound = this.getView().byId("inwards21").getSelectedKey();
                var oparkingid = this.getView().byId("parkingLotSelect122").getSelectedKey();

                if (!oTruckNo || !oDriverMob || !oDriverName || !ovendorName || !oinbound || !oparkingid) {
                    MessageBox.error("enter All values!!");
                } else {

                    // getting date
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
                    // constructing json Model
                    const ReserveModel = new sap.ui.model.json.JSONModel({
                        Truckno: oTruckNo,
                        Drivername: oDriverName,
                        Drivermobile: oDriverMob,
                        Rsdate: exitDate1,
                        Rstime: exitTime1,
                        Rcdate: exitDate1,
                        Rctime: exitTime1,
                        Vendorname: ovendorName,
                        Rstatus: true,
                        Delivery: oinbound,
                        Slotno: oparkingid
                    });
                    var that = this;
                    const oModel = this.getView().getModel();
                    oModel.create("/ReservedSlotsSet", ReserveModel.getData(), {
                        success: function (odata) {
                            sap.m.MessageToast.show("successfully created!!!");
                            oModel.refresh(true);
                            that.byId("idReserveParkingtable").getBinding("items").refresh(true);
                            oModel.update("/PARKINGSLOTSSet('" + oparkingid + "')", { Status: 'Reserved' }, {
                                success: function (odata) {
                                    sap.m.MessageToast.show("parking lot status change!!");
                                    that.byId("idDialogCreate").close();
                                    that.byId("idparkingslottable").getBinding("items").refresh(true);
                                    oModel.refresh(true);
                                }, error: function (oError) {
                                    sap.m.MessageBox.error(oError);
                                }
                            })
                        }, error: function (oError) {
                            sap.m.MessageBox.error(oError);
                        }
                    })
                }
            },
            /**Reservation Close Dialog */
            onCloseDialog: function () {
                //checking whether dialog is open or not
                if (this.oDialog.isOpen()) {
                    this.oDialog.close()
                }
            },
            onprint121: function () {
                // Retrieve the DOM element
                var oview = this.getView();
                var oElement = oview.byId("idSimpleForm");
                var oDomRef = oElement.getDomRef();
                // var bodyElement = this.getView().byId("idSimpleForm").getDomRef();

                // if (!bodyElement) {
                //     console.error("Element not found or not yet rendered");
                //     return;
                // }

                var that = this;

                // Capture the element as a PNG image
                domtoimage.toPng(oDomRef)
                    .then(function (dataUrl) {
                        // Create a link element to download the image
                        var downloadLink = document.createElement('a');
                        downloadLink.href = dataUrl;
                        downloadLink.download = 'AllocatedForm.png';
                        downloadLink.style.display = 'none';

                        // Append the link to the DOM, click it to start the download, then remove it
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);

                        // Optionally close dialog and refresh
                        that.closeReceiptDailog();
                        that.onBeforeRendering();
                    })
                    .catch(function (error) {
                        console.error('Error capturing image:', error);
                    });
            },


            formatDateToShort: function (date) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based, so add 1
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            },
            getCurrentTime: function () {
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            },
            /**Refreshing drop down */

            onRefreshDrop: function () {
                this.byId("_IDGenComboBox2").getBinding("items").refresh();
            }, oRefreshButton: function () {
                var oModel = this.getView().getModel();
                oModel.refresh(true);
            },

            /**Bar code Generator in Print */

            _generateBarcode: function (barcodeValue) {
                var oHtmlControl = this.byId("barcodeContainer");
                if (oHtmlControl) {
                    oHtmlControl.setContent('<svg id="barcode" ></svg>');
                    setTimeout(function () {
                        JsBarcode("#barcode", barcodeValue, {
                            displayValue: false // Hide the value
                        });
                    }, 0);
                } else {
                    console.error("HTML control not found or not initialized.");
                }
            },

            onAddLoan: function () {
                var osam = this.byId("idReserveParkingtable").getSelectedItem();
                if (!osam) {
                    sap.m.MessageBox.error("Please Select alteast one Row!!!");
                    return
                }
                var oData = this.byId("idReserveParkingtable").getSelectedItem().getBindingContext().getObject();

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
                if (oData.inbound === true) {
                    oData.inbound = 'inbound';
                } else {
                    oData.inbound = 'Outbound';
                }

                const oAddLoanModel = new sap.ui.model.json.JSONModel({
                    Truckno: oData.Truckno,
                    Drivername: oData.Drivername,
                    Drivermobile: oData.Drivermobile,
                    Endate: exitDate1,
                    Entime: exitTime1,
                    Extime: "",
                    Exdate: "",
                    Vendorname: oData.Vendorname,
                    Inside: true,
                    Outside: false,
                    Delivery: oData.inbound,
                    Slotno: oData.Slotno

                });
                this.getView().setModel(oAddLoanModel, "oAddLoanModel");
                // var temp = oAddLoanModel.getData().id;
                // console.log(temp);
                const accountSid = 'ACb224f5ef242a9b70012285792ef40e8a';
                const authToken = '825aa6f260cb55938c47a748ae6cdba0';

                // Function to send SMS using Twili
                const onum = '+91' + oData.driverMob;
                debugger
                const toNumber = onum // Replace with recipient's phone number
                const fromNumber = '+18149043908'; // Replace with your Twilio phone number
                const messageBody = `Hello, ${oData.vendorName} your reservation for ${oData.parkinglot_id} for truck ${oData.truckNo} is Approved!! !`; // Message content

                // Twilio API endpoint for sending messages
                const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

                // Payload for the POST request
                const payload = {
                    To: toNumber,
                    From: fromNumber,
                    Body: messageBody
                };

                $.ajax({
                    url: url,
                    type: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                    },
                    data: payload,
                    success: function (data) {
                        console.log('SMS sent successfully:', data);

                        sap.m.MessageToast.show('SMS sent successfully!');
                    },
                    error: function (xhr, status, error) {
                        console.error('Error sending SMS:', error);

                        sap.m.MessageToast.show('Failed to send SMS: ' + error);
                    }
                });


                const oModel = this.getView().getModel();
                var that = this;
                oModel.create("/ASSIGNEDSLOTSSet", oAddLoanModel.getData(), {
                    success: function (odata) {
                        console.log("succes");
                        oModel.refresh(true);
                        that.byId("idParkingvehiclestable").getBinding("items").refresh(true);
                        oModel.update("/PARKINGSLOTSSet('" + oAddLoanModel.getData().Slotno + "')", { Status: "Not Available" }, {
                            success: function (odata) {
                                console.log(odata);
                                oModel.refresh(true)
                                that.onBellText();
                                that.getView().byId("idparkingslottable").getBinding("items").refresh();

                                // oModel.refresh(true);
                                oModel.remove("/ReservedSlotsSet('" + oData.Reserveno + "')", {
                                    success: function (odata) {
                                        console.log("success")
                                        debugger
                                        that.onBellText();
                                        sap.m.MessageToast.show("successfully ParkingSlot Assigned to Truck!!");
                                        that.getView().byId("idReserveParkingtable").getBinding("items").refresh(true);
                                        oModel.refresh(true);
                                    }, error: function (oError) {
                                        console.log(oError);
                                    }
                                });
                            }, error: function (oError) {
                                console.log(oError);
                            }
                        });
                    }, error: function (oError) {
                        console.log(oError);
                    }
                })
            },
            /**Navigation to Vendor Page */
            onVendor: function () {
                this.getOwnerComponent().getRouter().navTo("RouteVendor");
            },

            /**Status Color fomatter for ParkingSLots */
            statusColorFormatter: function (sStatus) {
                console.log("Formatter called with status:", sStatus);
                switch (sStatus) {
                    case "Not Available":
                        return "Error"; // Red
                    case "Available":
                        return "Success"; // Green
                    case "Reserved":
                        return "Warning"; // Orange
                    default:
                        return "None"; // Default color
                }
            },
            /**Removing the Notification Item from Notifications Table */
            onItemClose: function (oEvent) {
                var oItem = oEvent.getSource();
                //     oList = oItem.getParent();

                // oList.removeItem(oItem);
                // var oModel = this.getView().getModel();
                // var that = this;
                // oModel.read("/NOTIFICATIONSSet", {
                //     success: function (odata) {
                //         var otemp = odata.results.length;
                //         otemp = otemp - 1;
                //         // that.getView().byId("idnotification").setText(otemp);
                //         that.getView().byId("_IDGenBadgeCustomData1").setValue(otemp);

                //     }, error: function (oError) {

                //     }
                // });

                var t = oItem.getBindingContext().getPath();
                var that = this;
                var oModel = this.getView().getModel();
                oModel.remove(t, {
                    success: function () {
                        that.oRefreshButton();
                        that.onBeforeRendering();
                        that.onAfterRendering();
                        sap.m.MessageToast.show("Item Closed: ");
                    }, error: function () {
                        sap.m.MessageBox.error("Item Closed: ");
                    }
                })

            },
            /**Cancel the Reservations */
            onCLS: function () {
                // Reset the button text to "Edit"
                this.byId("idactionbuttons12").setText("Edit");

                // Hide the additional action buttons or controls
                this.byId("jdjhajkjajkjhgh").setVisible(false);

                // Get the selected item
                var oSel = this.byId("idReserveParkingtable").getSelectedItem();
                if (!oSel) {
                    sap.m.MessageToast.show("Please select a slot to close.");
                    return;
                }

                // Get the binding context and object
                const oObject = oSel.getBindingContext().getObject();

                // Refresh button and other components as needed
                this.oRefreshButton();
                this.onBellText();

                // Get the cells and control references
                var aCells = oSel.getCells();
                var oInput = aCells[4].getItems()[0]; // Assuming Input is at index 0
                var oComboBox = aCells[4].getItems()[1]; // Assuming ComboBox is at index 1

                // Set visibility for the controls
                oInput.setVisible(true); // Show Input field
                oComboBox.setVisible(false); // Hide ComboBox
                //oComboBox.setEditable(false); // Ensure ComboBox is not editable

                // Update any additional data or state as needed
                // Example: Reset ComboBox selection if required
                oComboBox.setSelectedKey(""); // Clear selected key
            }
            ,
            /**IN Reservation Slot change based on Delivery Type */
            onDeliveryChange1: function (oEvent) {
                // Get selected key
                var sSelectedKey = oEvent.getSource().getSelectedKey();
                console.log("Selected Delivery Type:", sSelectedKey);

                // Create filters
                var aFilters = [];
                if (sSelectedKey) {
                    aFilters.push(new Filter('Delivery', FilterOperator.EQ, sSelectedKey));
                }
                aFilters.push(new Filter('Status', FilterOperator.EQ, 'Available'));

                // Get the Select control
                var oParkingSlotSelect = this.byId("parkingLotSelect122");
                if (!oParkingSlotSelect) {
                    console.error("Parking Slot Select control not found.");
                    return;
                }

                // Get the binding of the Select control
                var oBinding = oParkingSlotSelect.getBinding("items");
                if (!oBinding) {
                    console.error("Binding not found for Parking Slot Select.");
                    return;
                }

                // Apply filters
                oBinding.filter(aFilters);

                // Optional: Log filtered items
                oBinding.getContexts().forEach(function (context) {
                    console.log("Filtered Item:", context.getObject());
                });
            },
            /**SLot edit Fragments */
            OnEditss1: async function () {
                var olist = this.byId("idparkingslottable").getSelectedItem();
                if (olist) {
                    var oObject = olist.getBindingContext().getObject();
                    if (oObject.Status === 'Reserved' || oObject.Status === 'Not Available') {
                        MessageBox.error("This Slot is Already Assigned!!");
                    } else {
                        this.oDialog33 ??= await this.loadFragment({
                            name: "com.app.parkapplication.fragments.Delivery"
                        })
                        this.oDialog33.open();
                        this.byId("idSlotnumbervalue").setText(oObject.Slotno);
                        // this.byId("idDeliveryeditvalue").setValue(oObject.Delivery);
                        this.byId("idStatusslotchange").setText(oObject.Status);
                    }
                }
                else {
                    MessageBox.error("Select One Row for Editing the Delivery Type");
                }
            },
            /**Slot assignment in Reservation Pending Table */
            onSort111: function (oEvent) {
                var oSelect = this.getView().byId("idreservependingtable").getSelectedItem();

                if (oSelect) {
                    var oButton = oEvent.getSource();
                    var sButtonText = oButton.getText();
                    var oModel = this.getView().getModel();
                    var that = this;

                    if (sButtonText === "Edit") {
                        // Switch to submit mode
                        oButton.setText("Submit");
                        this.byId("idrefres").setVisible(true);

                        var obj = oSelect.getBindingContext().getObject();
                        var odel = obj.Delivery;

                        // Toggle visibility of items in the selected cell
                        var aCells = oSelect.getCells();
                        var oText = aCells[6].getItems()[0]; // Assuming Text is at index 0
                        var oComboBox = aCells[6].getItems()[1]; // Assuming ComboBox is at index 1

                        oText.setVisible(false); // Hide Text
                        oComboBox.setVisible(true); // Show ComboBox
                        oComboBox.setEditable(true); // Ensure ComboBox is editable

                        // Filter ComboBox items if needed
                        this._filterComboBoxItems(oComboBox, odel);

                    } else {
                        // Switch back to edit mode
                        oButton.setText("Edit");
                        this.byId("idrefres").setVisible(false);

                        var obj = oSelect.getBindingContext().getObject();
                        var t = obj.Reserveno;
                        var oc = oSelect.getCells()[6].getItems()[1].getSelectedKey(); // Get selected key from ComboBox
                        if(!oc){
                            MessageBox.error("SLot value should be filled")
                        }
                        else{
                        var aCells = oSelect.getCells();
                        var oText = aCells[6].getItems()[0];
                        var oComboBox = aCells[6].getItems()[1];

                        oText.setVisible(true); // Show Text
                        oComboBox.setVisible(false); // Hide ComboBox
                        oComboBox.setEditable(false); // Ensure ComboBox is not editable

                        // Update the model with the new slot number
                        oModel.update("/ReservedSlotsSet('" + t + "')", { Slotno: oc }, {
                            success: function () {
                                // Update parking slot status
                                oModel.update("/PARKINGSLOTSSet('" + oc + "')", { Status: 'Reserved' }, {
                                    success: function () {
                                        // Refresh model and UI
                                        oModel.refresh(true);
                                        that.oRefreshButton();
                                        that.onBellText();
                                        that.getView().byId("idparkingslottable").getBinding("items").refresh(true);
                                        sap.m.MessageToast.show("Update successful.");
                                    },
                                    error: function (oError) {
                                        sap.m.MessageBox.error("Error updating parking slot status: " + oError.message);
                                    }
                                });
                            },
                            error: function (oError) {
                                sap.m.MessageBox.error("Error updating reserved slot: " + oError.message);
                            }
                        });
                    }
                }
                } else {
                    // Show error message if no row is selected
                    sap.m.MessageBox.error("Please select at least one row for assigning a slot!");
                }
            
            },

            // Filter ComboBox items based on some criteria
            _filterComboBoxItems: function (oComboBox, sDeliveryType) {
                var oModel = this.getView().getModel();
                var aFilters = [
                    new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "Available"),
                    new sap.ui.model.Filter("Delivery", sap.ui.model.FilterOperator.EQ, sDeliveryType)
                ];

                oComboBox.bindAggregation("items", {
                    path: "/PARKINGSLOTSSet",
                    template: new sap.ui.core.Item({
                        key: "{Slotno}",
                        text: "{Slotno}"
                    }),
                    filters: aFilters
                });
            },
            onCancel111: function () {
                // Reset the button text to "Edit"
                this.byId("idsorter").setText("Edit");

                // Hide the refresh button or any other controls
                this.byId("idrefres").setVisible(false);

                // Get the selected item from the table
                var oSelect = this.getView().byId("idreservependingtable").getSelectedItem();

                // Check if a row is selected
                if (oSelect) {
                    // Get the binding context and object of the selected item
                    const oObject = oSelect.getBindingContext().getObject();
                    // Refresh any buttons or controls as needed
                    this.oRefreshButton();
                    this.onBellText();

                    // Toggle visibility of controls in the selected row
                    var aCells = oSelect.getCells();
                    var oText = aCells[6].getItems()[0]; // Assuming Text is at index 0
                    var oComboBox = aCells[6].getItems()[1]; // Assuming ComboBox is at index 1

                    oText.setVisible(true); // Show Text
                    oComboBox.setVisible(false); // Hide ComboBox
                } else {
                    // Show an error message if no row is selected
                    sap.m.MessageBox.error("Please select a row to cancel the edit.");
                }
            },
            /**Edit Delivery Type */
            onEditCancel: function () {
                this.oDialog33.close();
                this.byId("idSlotnumbervalue").setText();
                this.byId("idStatusslotchange").setText();
            },

            /**Live Search For Reservation with Cofirm Status Table */
            onSearch65: async function (oEvent) {
                var sQuery = oEvent.getSource().getValue().trim(); // Trim any leading/trailing whitespace
                var oList = this.byId("idReserveParkingtable"); // Your list or table ID
                var oBinding = oList.getBinding("items");
                var oModel = this.getView().getModel(); // Assuming the model is bound to the view
                var sPath = "/ReservedSlotsSet"; // Your EntitySet path
                /* Check if the binding is available*/
                if (!oBinding) {
                    console.error("Binding not found on the list");
                    return;
                }
                var oOutside = new Filter("Rstatus", FilterOperator.EQ, true);

                /* If no search query, fetch all data and reset the table */
                if (sQuery === "") {
                    try {
                        /*Fetch the data from the OData service*/
                        var aAllData = await new Promise((resolve, reject) => {
                            oModel.read(sPath, {
                                filters: [oOutside],
                                success: function (oData) {
                                    resolve(oData.results);
                                },
                                error: function (oError) {
                                    console.error("Failed to fetch all data:", oError);
                                    reject(oError);
                                }
                            });
                        });

                        /* Create a new JSON model with all the data */
                        var oAllDataModel = new sap.ui.model.json.JSONModel(aAllData);

                        /*Bind the all data model to the list*/
                        oList.setModel(oAllDataModel);
                        oList.bindItems({
                            path: "/",
                            template: oList.getBindingInfo("items").template
                        });

                        /*Reapply XML filters if they exist*/
                        var aFilters = oList.getBinding("items").aFilters || [];
                        if (aFilters.length > 0) {
                            oBinding.filter(aFilters);
                        }

                    } catch (error) {
                        console.error("Error fetching all data:", error);
                    }
                    return;
                }

                /* If there is a search query, perform the manual filtering*/
                try {
                    var aContexts = oBinding.getContexts();
                    var aItems = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });
                    /* Filter the data based on the query*/
                    var aFilteredItems = aItems.filter(function (oItem) {
                        return oItem.Truckno && oItem.Truckno.includes(sQuery) ||
                            oItem.Slotno && oItem.Slotno.includes(sQuery) ||
                            oItem.Drivername && oItem.Drivername.includes(sQuery) ||
                            oItem.Vendorname && oItem.Vendorname.includes(sQuery) ||
                            oItem.Rstatus && oItem.Rstatus.toString().includes(sQuery);
                    });

                    /*Create a new JSON model with the filtered data*/
                    var oFilteredModel = new sap.ui.model.json.JSONModel(aFilteredItems);
                    /*Bind the filtered model to the list*/
                    oList.setModel(oFilteredModel);
                    oList.bindItems({
                        path: "/",
                        template: oList.getBindingInfo("items").template
                    });

                } catch (error) {
                    console.error("Error filtering data:", error);
                }
            },
            /**Slot Delivery Update */
            onSaves: function () {
                var t = this.byId("idSlotnumbervalue").getText();
                var del = this.byId("inwards2111").getSelectedKey();
                var oModel = this.getView().getModel();
                var that = this;
                oModel.update("/PARKINGSLOTSSet('" + t + "')", { Delivery: del }, {
                    success: function (odata) {
                        sap.m.MessageToast.show("Successfully Updated!");
                        that.byId("idparkingslottable").getBinding("items").refresh(); // Refresh the table binding
                        that.onEditCancel();
                    }, error: function (oError) {
                        MessageBox.error("Error Occurs!!");
                    }
                })

            },

            /**Based on Delivery SLot */
            onServiceTypeChange: function (oEvent) {
                // debugger
                // var oSel = this.byId("idReserveParkingtable").getSelectedItem();
                // var sServiceType = oSel.getCells()[6].getText();
                // var oSlotsComboBox = this.getView().byId("parkingLotSelect1js");

                // // Create filters for service type and available status
                // var aFilters = [
                //     new Filter({
                //         path: "Delivery",
                //         operator: FilterOperator.EQ,
                //         value1: sServiceType
                //     }),
                //     new Filter({
                //         path: "Status",
                //         operator: FilterOperator.EQ,
                //         value1: "Available"
                //     })
                // ];
            }

        });
    });
