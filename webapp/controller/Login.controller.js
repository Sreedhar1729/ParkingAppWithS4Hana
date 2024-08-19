sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageBox"
    ],
    function (BaseController, MessageBox) {
        "use strict";

        return BaseController.extend("com.app.parkapplication.controller.Login", {
            onInit: function () {
            },
            onLOgin: async function () {
                this.oD ??= await this.loadFragment({
                    name: "com.app.parkapplication.fragments.log"
                })
                this.oD.open();
            },
            LoginConfirm: function () {
                var oUserName = this.byId("UserNameval").getValue();
                var oPass = this.byId("passwordval").getValue();
                if (oUserName === 'Admin' && oPass === 'Admin') {
                    this.getOwnerComponent().getRouter().navTo("RouteHome");
                } else if (oUserName === 'Vendor' && oPass === 'Vendor') {
                    this.getOwnerComponent().getRouter().navTo("RouteVendor");
                }
                else {
                    MessageBox.error("Please Enter Valid Details!!");
                }
            },
            LoginCancel: function () {
                this.byId("UserNameval").setValue();
                this.byId("passwordval").setValue();
                this.oD.close();
            }
        });
    }
);
