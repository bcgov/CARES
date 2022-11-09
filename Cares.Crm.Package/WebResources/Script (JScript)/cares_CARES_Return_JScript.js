/*
	Dependencies: 'cares_jqueryrestdataoperationfunctions' webresource
*/

if (typeof (Cares_CaresReturn) == "undefined") { Cares_CaresReturn = { __namespace: true }; }

Cares_CaresReturn =
    {
        _orderedItemsTabName: "tab_OrderedItems",
        _orderedItemsSectionName: "section_OrderItems",
        _orderedItemsIframeName: "IFRAME_OrderedItems",
        _caresConfig_MVCUrlKeyName: "MVCUrl",
        /**
         * This function runs on the onLoad of form
         * */
    OnFormLoad: function () {
            top.window.moveTo(0, 0);
            top.window.resizeTo(screen.availWidth, screen.availHeight);
            Cares_CaresReturn.SetReturnNameOnCreate();
            // Cares_CaresReturn.SetOrderedItemsIframeUrl();

            // debugger;
            // window.addEventListener("message", Cares_CaresReturn.ReceiveMessage, false);
            window.top.addEventListener("message", Cares_CaresReturn.ReceiveMessage, false);
            
        },
    /**
     * This function logs the message and performs subgrid refresh
     * @param {any} event
     */
        ReceiveMessage: function (event) {
            console.log('CRM form got a message. Data: ' + event.data);
            if (event.data == 'RefreshReturnItemsGrid') {
                var subgrid = Xrm.Page.ui.controls.get("returnItemsSubGrid");
                subgrid.refresh();
            }
        },

        /*
        * Runs on save for create form0
        * Sets the Return Name to the format : 
        * [approval name] - [Current date(MM/DD/YYYY)]
        */
        SetReturnNameOnCreate: function () {
            console.log("Generating and setting name of the new Return record (Funtion: SetReturnNameOnCreate)...");
            var formType = Xrm.Page.ui.getFormType();
            if (formType == 1) {
                console.log("Generating Return's name on Create form...");
                var returnName = "";
                var _date = new Date();
                var approvalid = Xrm.Page.getAttribute("cares_approvalid");
                var approvalidValue = approvalid.getValue();
                if (null != approvalid
                    && null != approvalidValue
                    && undefined != approvalidValue) {
                    returnName = approvalidValue[0].name;
                }
                var today = new Date(); // generate a new Date object containing the current date and time.
                returnName += " - " + (today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
                Xrm.Page.getAttribute("cares_name").setValue(returnName);
            }
        },
        /**
         * This function checks the login user role
         * */
        IsLoginUserhasReadOnlyRole: function () {
            //Get Login user Roles
            var userRoles = Xrm.Page.context.getUserRoles();

            if (userRoles != null && userRoles != undefined) {
                for (var i = 0; i < userRoles.length; i++) {
                    var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                    if (role != null) {
                        if (role.Name.indexOf("Read Only") > -1)
                            return true;
                    }
                }
            }
            return false;
        },

        //Set the return's Ordered Items MVC Iframe
        SetOrderedItemsIframeUrl: function () {
            console.log("[INFO] Generating and setting name of the new Return record (Funtion: SetOrderedItemsIframeUrl)...");
            // var hasAccess = Cares_Approval.IsUserHasRightsonApprovalItemandGroup();
            var hasAccess = true;
            if (hasAccess == false) {
                console.log("[INFO] Current user has no access to Ordered Items sub-grid.");
                Xrm.Page.ui.tabs.get(Cares_CaresReturn._orderedItemsTabName).sections.get(Cares_CaresReturn._orderedItemsSectionName).setVisible(false);
            }
            else if (Cares_CaresReturn.IsLoginUserhasReadOnlyRole() == true) {
                console.log("[INFO] Current user has Read Only role --> Hide the Ordered Items sub-grid...");
                Xrm.Page.ui.tabs.get(Cares_CaresReturn._orderedItemsTabName).sections.get(Cares_CaresReturn._orderedItemsSectionName).setVisible(false);
            }
            else {
                console.log("[INFO] Current user has access to the Ordered Items sub-grid. Setting the Ordered Items Iframe's URL...");
                Xrm.Page.ui.tabs.get(Cares_CaresReturn._orderedItemsTabName).sections.get(Cares_CaresReturn._orderedItemsSectionName).setVisible(true);
                var returnId = Xrm.Page.data.entity.getId();
                var orderedItemsUrl = GetConfiguration(Cares_CaresReturn._caresConfig_MVCUrlKeyName);
                console.log("[INFO] CARES Configuration - MVCUrl key's value: " + orderedItemsUrl);
                if (orderedItemsUrl !== null) {
                    orderedItemsUrl += "Return/OrderedItems/?returnId=";
                    orderedItemsUrl += returnId + "&currentUserId=" + Xrm.Page.context.getUserId();

                    //todo (leo): disabled dev testing's codes below
                    orderedItemsUrl = "http://localhost:50359/Return/OrderedItems?returnId={936EACD4-C0AB-E811-90F4-005056A3B666}&currentUserId={253F5598-9AA4-E811-90F4-005056A3B666}";

                    Xrm.Page.getControl(Cares_CaresReturn._orderedItemsIframeName).setSrc(orderedItemsUrl);
                    console.log("[INFO] Ordered Items iframe's URL: " + orderedItemsUrl);
                }
                else {
                    console.log("[ERROR] CARES Configuration - MVCUrl key does NOT exist or its value is empty.");
                }
            }
        },

        // Validate the updated value of the Return Qty field (Return form > Return Items section's crm oob editable grid)
        ValidateReturnQtyonChange: function (context) {

            //todo: verify Update ReturnQty based on user's roles ?

            var returnQtyControl, returnQtyNewValue = 0,
                orderItemQty = 0, orderItemReturnAmount = 0;
            context.getFormContext().getData().getEntity().attributes.forEach(function (fieldControl) {
                var fieldControlName = fieldControl.getName();
                if (fieldControlName == 'cares_quantity') { // is Return Qty field of the Return Item.
                    returnQtyControl = fieldControl;
                    returnQtyNewValue = fieldControl.getValue(); // Get the new value that user enters in the Return Qty field
                }
                else if (fieldControlName.indexOf('.cares_qty') > -1) // Qty (Order Item) field.
                {
                    orderItemQty = fieldControl.getValue();
                }
                else if (fieldControlName.indexOf('.cares_returnamount') > -1) // Return Mount (Order Item) field.
                {
                    orderItemReturnAmount = fieldControl.getValue();
                }
            });
            if (returnQtyNewValue == null) returnQtyNewValue = 0;
            if (orderItemQty == null) orderItemQty = 0;
            if (orderItemReturnAmount == null) orderItemReturnAmount = 0;
            if (returnQtyNewValue > orderItemQty - orderItemReturnAmount) {
                Xrm.Utility.alertDialog('You cannot return more than what has been Ordered and not yet Returned.');
                returnQtyControl.setValue(null); 
            }
        },

        //This function is called on 'Modified On' field change event
        onAfterChange: function () {
            console.log('Reloading the Ordered Items grid (onAfterChange)...');
            var webResourceControl = Xrm.Page.getControl("WebResource_OrderedItems");
            debugger;
            var src = webResourceControl.getSrc();
            src = src.replace("id=&", "id=" + Xrm.Page.data.entity.getId() + "&");
            webResourceControl.setSrc(null);
            webResourceControl.setSrc(src);
            console.log('Ordered Items grid RELOADED.');
    },
        /**
         * This function runs on the save of return form
         * */
        callOnSave: function () {
            debugger;
            if (Cares_CaresReturn.IsDirtyFieldsinGrid() == true) {
                alert("Please save Order Item grid with Quantity value then Submit");
                return false;
            }
    },
        /**
         * This function checks the dirty fields on return grid
         * */
        IsDirtyFieldsinGrid: function () {
            var returnValue = false;
            var returnItems = retrieveMultipleCustom("cares_caresreturnitemSet", "?$select=cares_name,cares_Quantity,cares_caresreturnitemId&$filter=statecode/Value eq 0 and cares_ReturnId/Id eq guid'" + Xrm.Page.data.entity.getId() + "'");
            if (returnItems !== null && returnItems[0] !== null) {
                if (returnItems.length > 0) {
                    var grid = Xrm.Page.getControl("returnItemsSubGrid");
                    for (var o = 0; o < returnItems.length; o++) {

                        grid.getGrid().getRows().forEach(function (row) {
                            if (row.getData().getEntity().getId() == returnItems[o].cares_caresreturnitemId) {
                                if (row.getData().getEntity().attributes.getByName("cares_quantity") == null || row.getData().getEntity().attributes.getByName("cares_quantity").getValue() == null) {
                                    returnValue = true;
                                }
                                else if (row.getData().getEntity().attributes.getByName("cares_quantity").getValue() != returnItems[o].cares_quantity) {
                                    Cares_CaresReturn.SaveQtyifValid(row.getData().getEntity().getId(), row.getData().getEntity().getEntityName(), row.getData().getEntity().attributes.getByName("cares_quantity").getValue());

                                }
                            }
                        });
                    }
                }
            }
            return returnValue;
    },
        /**
         * This function checks the quantity 
         * @param {any} id
         * @param {any} entityName
         * @param {any} Qty
         */
        SaveQtyifValid: function (id, entityName, Qty) {
            var item = new Object();
            item.cares_Quantity = Qty;
            SDK.REST.updateRecord(id, item, entityName,
                function () {
                    Xrm.Page.getControl("returnItemsSubGrid").refresh();
                },
                Cares_CaresReturn.errorHandler
            );
        },
        /**
         * This function updates the return status
         * */
        UpdateReturnStatus: function () {

            var UpdateOptionSetCatA1 = Xrm.Page.ui.controls.get("cares_returnreason");

            if (UpdateOptionSetCatA1 != null && UpdateOptionSetCatA1 != undefined) {

                var CatA1 = UpdateOptionSetCatA1.getAttribute().getValue();

                if (Xrm.Page.ui.getFormType() == 1) {
                    UpdateOptionSetCatA1.removeOption(750760014);
                }
                else {
                    if (CatA1 == 750760014) {
                        UpdateOptionSetCatA1.setDisabled(true);
                    }
                    else {
                       UpdateOptionSetCatA1.removeOption(750760014);
                    }

                }
            }

    },
        /**
         * This function handles the error
         * @param {any} error
         */
        errorHandler: function (error) {
            alert(error.message);
        }

    };
