if (typeof(Cares_CaresOrder) == "undefined") { Cares_CaresOrder = { __namespace: true }; }

Cares_CaresOrder = {
    _isPdcAdminOrClerk: null, // using this variable to avoid checking user roles several time.

    /*
     * Runs on form load to hide/show the COPY ORDER ribbon button
     */
    IsPdcAdminOrClerk: function() {
        if (Cares_CaresOrder._isPdcAdminOrClerk == null) {
            Cares_CaresOrder._isPdcAdminOrClerk = false;
            // Display the COPY ORDER button only to PDC Admin and PDC Clerk
            var userRoles = Xrm.Page.context.getUserRoles();
            if (userRoles != null && userRoles != undefined) {
                for (var i = 0; i < userRoles.length; i++) {
                    var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                    if (role != null) {
                        if (role.Name.indexOf("PDC Admin") > -1 || role.Name.indexOf("PDC Clerk") > -1) {
                            Cares_CaresOrder._isPdcAdminOrClerk = true;
                            break;
                        }
                    }
                }
            }
        }
        return Cares_CaresOrder._isPdcAdminOrClerk;
    },

    runOnLoad: function() {
        top.window.moveTo(0, 0);
        top.window.resizeTo(screen.availWidth, screen.availHeight);
        /*
        if (document.all) {
            top.window.resizeTo(screen.availWidth, screen.availHeight);
        } else if (document.layers || document.getElementById) {
            if (top.window.outerHeight < screen.availHeight ||
                top.window.outerWidth < screen.availWidth) {
                top.window.outerHeight = screen.availHeight;
                top.window.outerWidth = screen.availWidth;
            }
        }
        */
    },

    /*
     * Runs on form load to hide/show the COPY ORDER ribbon button
     */
    EnableDisableCopyOrder: function() {
        return Cares_CaresOrder.IsPdcAdminOrClerk()
    },

    /*
     * Runs on form load to hide/show the COPY ORDER ribbon button
     */
    EnableDisableSubmitOrder: function() {
        var returnValue = false;
        var orderStatusReasonValue = Xrm.Page.getAttribute("statuscode").getValue();
        var sapOrderNumber = Xrm.Page.getAttribute("cares_sapordernumber").getValue();
        if ((sapOrderNumber == null || sapOrderNumber == "") // SAP Order Number of the Order is blank.
            &&
            (orderStatusReasonValue == 1 // Draft
                ||
                orderStatusReasonValue == 750760001 // Processing Error)
                ||
                orderStatusReasonValue == 2 // Submitted
            )
        ) {
            returnValue = Cares_CaresOrder.IsPdcAdminOrClerk();
        }
        return returnValue;
    },


    /*
     * Runs on load for create form
     * Sets the Order Date to the current date and time
     */
    SetOrderDateOnCreate: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType == 1) {
            Xrm.Page.getAttribute("cares_orderdate").setValue(Date.now());
        }

        Cares_CaresOrder.EnableDisableOverRideField();
        Cares_CaresOrder.Manage1OrderPerMonthProgram();
        Cares_CaresOrder.CopyOrderWarning();
        if (formType == 1) {
            if (Xrm.Page.getAttribute("cares_approvalid") != null && Xrm.Page.getAttribute("cares_approvalid").getValue() != null)
                if (Xrm.Page.getAttribute("cares_ordernumber") != null && Xrm.Page.getAttribute("cares_ordernumber").getValue() == "To be generated") {
                    Xrm.Page.data.entity.save();
                }
        }

        //Initializing SubGrid Refresh Variable
        Xrm.Page.RefreshSubGridFromMVC = Cares_CaresOrder.RefreshSubGridFromMVC;
    },

    /*
     * Runs on save for create form0
     * Sets the Order Name to the format : 
     * [approval name] - [Current date(MM/DD/YYYY)]
     */
    SetOrderNameOnCreate: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType == 1) {
            var _orderName = "";
            var _date = new Date();

            if (null != Xrm.Page.getAttribute("cares_approvalid") &&
                null != Xrm.Page.getAttribute("cares_approvalid").getValue() &&
                undefined != Xrm.Page.getAttribute("cares_approvalid").getValue()) {
                _orderName = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].name;
            }

            if (null != Xrm.Page.getAttribute("cares_orderdate") &&
                null != Xrm.Page.getAttribute("cares_orderdate").getValue()) {
                _date = Xrm.Page.getAttribute("cares_orderdate").getValue();
            }

            _orderName += " - " + (_date.getMonth() + 1) + "/" + _date.getDate() + "/" + _date.getFullYear();
            Xrm.Page.getAttribute("cares_name").setValue(_orderName);
        }
    },

    /*
     * Runs on change approval
     * Display a warning if the followed condition is met:
     * * One order per month is set to Yes on the linked approval's program
     * * And
     * * The linked approval's last order date is within the same month as the current date 
     * * And
     * * The Order Status Reason is Draft
     */
    Manage1OrderPerMonthProgram: function() {
        debugger;
        //Clear Notification
        Xrm.Page.ui.clearFormNotification("9004");

        //Get order status
        var _orderStatus = Xrm.Page.getAttribute("statuscode").getValue();

        //init _isOneOrderAMonth value
        var _isOneOrderAMonth = false;

        //Init Last order date
        var _LastOrderDate = null

        //if Order Status is Draft Get the order's approval
        if (_orderStatus == 1 &&
            null != Xrm.Page.getAttribute("cares_approvalid") &&
            null != Xrm.Page.getAttribute("cares_approvalid").getValue() &&
            undefined != Xrm.Page.getAttribute("cares_approvalid").getValue()) {
            var _approval = retrieveRecordCustom(Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id, "cares_approvalSet");
            if (null != _approval && undefined != _approval) {
                try {
                    //Get the approval's last date order
                    if (null != _approval.cares_LastOrderDate && undefined != _approval.cares_LastOrderDate) {
                        _LastOrderDate = new Date(parseInt(_approval.cares_LastOrderDate.substr(6)));
                    }

                    //Get Order Date
                    var _OrderDate = null;
                    if (null != Xrm.Page.getAttribute("cares_orderdate") &&
                        null != Xrm.Page.getAttribute("cares_orderdate").getValue()) {
                        _OrderDate = Xrm.Page.getAttribute("cares_orderdate").getValue();
                    }

                    //If the Order Date and the Last Order Date are on the same Month get Program
                    if (null != _LastOrderDate && undefined != _LastOrderDate &&
                        null != _OrderDate && undefined != _OrderDate &&
                        _OrderDate.getFullYear() == _LastOrderDate.getFullYear() &&
                        _OrderDate.getMonth() == _LastOrderDate.getMonth()) {
                        //Get the approval's program
                        if (null != _approval.cares_ProgramId && undefined != _approval.cares_ProgramId &&
                            null != _approval.cares_ProgramId.Id && undefined != _approval.cares_ProgramId.Id) {
                            var _program = retrieveRecordCustom(_approval.cares_ProgramId.Id, "cares_programSet");

                            //Get _isOneOrderAMonth from program and if _isOneOrderAMonth is True display warning
                            if (null != _program && undefined != _program &&
                                null != _program.cares_1OrderperMonth && undefined != _program.cares_1OrderperMonth &&
                                true == _program.cares_1OrderperMonth) {
                                var _LastOrderDateStr = _LastOrderDate.getMonth() + 1 + "/" + _LastOrderDate.getDate() + "/" + _LastOrderDate.getFullYear();
                                Xrm.Page.ui.setFormNotification("Alert! Order already placed this month on " + _LastOrderDateStr, "WARNING", "9004");
                            }
                        }

                    }

                } catch (ex) {}
            }

        }
    },
    /**
     * This function runs on copy button and validates the order data
     * */
    CopyOrderWarning: function() {
        Xrm.Page.ui.clearFormNotification("9009");
        if (Xrm.Page.getAttribute("cares_isshowcopyorderwarning") != null && Xrm.Page.getAttribute("cares_isshowcopyorderwarning").getValue() != null &&
            Xrm.Page.getAttribute("cares_isshowcopyorderwarning").getValue() == true) {
            Xrm.Page.ui.setFormNotification("Warning: Some of the items no longer exist in the approved list and have not been copied over into the order", "WARNING", "9009");
        }
    },
    /**
     * This function sets the search url
     * */
    SetApprovalItemSearchUrl: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType == 1) {
            Xrm.Page.ui.tabs.get("cares_approbalitemsearch").sections.get("sec_ApprovalItems").setVisible(false);
        } else {
            if (Xrm.Page.getAttribute("cares_approvalid") != null && Xrm.Page.getAttribute("cares_approvalid").getValue() != null) {
                Xrm.Page.ui.tabs.get("cares_approbalitemsearch").sections.get("sec_ApprovalItems").setVisible(true);
                var isFormEnable = formType == 2 ? true : false;
                var orderId = Xrm.Page.data.entity.getId();
                var productListUrl = GetConfiguration("MVCUrl");
                if (productListUrl !== null) {
                    productListUrl += "Order/ApprovalItems/?id=";
                    productListUrl += orderId + "&ApprovalId=" + Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id + "&userId=" + Xrm.Page.context.getUserId() + "&isFormEnable=" + isFormEnable;
                    Xrm.Page.getControl("IFRAME_ApprovalItemSearch").setSrc(productListUrl);
                }
            } else {
                Xrm.Page.ui.tabs.get("cares_approbalitemsearch").sections.get("sec_ApprovalItems").setVisible(false);
            }
        }
    },
    /**
     * This function updates the remaing balance of groups
     * @param {any} remainingbalance
     * @param {any} groupId
     * @param {any} orderItemId
     */
    UpdateGroupRemainingBalanceinOrderItems: function(remainingbalance, groupId, orderItemId) {
        try {
            debugger;
            var decimalRemainingbalance = parseFloat(remainingbalance).toFixed(2);
            //get the selected rows - use the getControl method and pass the grid name.
            selectedRow = Xrm.Page.getControl("cares_caresorderitem").getGrid().getRows();

            //loop through rows and get the attribute collection
            selectedRow.forEach(function(row, rowIndex) {
                //get the attribute Collection
                attributeColl = row.getData().getEntity().attributes;

                //loop through attribute Collection and do the calculation and set the 
                attributeColl.forEach(function(att, attIndex) {
                    switch (att.getName()) {
                        case "cares_qty":
                            att.fireOnChange();
                            break;
                    }

                });
            });
        } catch (e) {
            Xrm.Utility.alertDialog(e.message);
        }



        try {
            //var fetchxml = "<fetch version='1.0' output-format='xml - platform' mapping='logical' distinct='false'>" +
            //    "<entity name = 'cares_caresorderitem'><attribute name='cares_caresorderitemid' /><attribute name='cares_name' />" +
            //    "<order attribute='cares_name' descending='false' />" +
            //    "<filter type='and'>" +
            //    "<condition attribute='statecode' operator='eq' value='0' />" +
            //    "<condition attribute='cares_caresorderitemid' operator='ne' value='" + orderItemId + "' />" +
            //    "<condition attribute='cares_orderid' operator='eq' value='" + Xrm.Page.data.entity.getId() + "' />" +
            //    "</filter>" +
            //    "<link-entity name='cares_approvalitem' from='cares_approvalitemid' to='cares_approvalitemid' link-type='inner' alias='ac'>" +
            //    "<filter type='and'>" +
            //    "<condition attribute='cares_groupid' operator='eq' value='" + groupId + "' />" +
            //    "</filter></link-entity></entity></fetch>";

            //Xrm.WebApi.retrieveMultipleRecords("cares_caresorderitems", "?fetchXml=" + fetchxml).then(
            //    function success(result) {
            //        debugger;
            //        if (result != null && result.entities != null && result.entities.length > 0) {
            //            for (var i = 0; i < result.entities.length; i++) {
            //                var item = new Object();
            //                item.cares_RemainingBalance = parseFloat(remainingbalance).toFixed(2);
            //                SDK.REST.updateRecord(result.entities[0].cares_caresorderitemid, item, "cares_caresorderitem",
            //                    function () {
            //                        debugger;
            //                    },
            //                    Cares_CaresOrder.errorHandler
            //                );
            //            }
            //            Xrm.Page.getControl("cares_caresorderitem").refresh();
            //        }
            //    },
            //    function (error) {
            //        Xrm.Utility.alertDialog(error.message, null);
            //        return null;
            //    }
            //);
        } catch (exception) {

            console.log(exception.message);
            throw new Error(exception.message);
        }
    },
    /**
     * This function validates the quantity
     * @param {any} context
     */
    ValidateQtyonChange: function(context) {
        var qtyField = null;
        var qtyFieldAttr = null;
        var inputQty = 0;
        var qty = 0;
        var bal = -1;
        var qtyUnit = 1;
        var groupId = null;
        var orderOverride = Xrm.Page.getAttribute("cares_overrideorder").getValue();
        var orderItemId = context.getFormContext().getData().getEntity().getId();
        var remainingbalance = 0;
        var remainingBalAttribute = context.getFormContext().getData().getEntity().attributes.getByName("cares_remainingbalance");

        var isAdmin = Cares_CaresOrder.IsLoginUserhasPDCAdminRole();

        context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
            try {
                if (attr.getName() === "cares_qty") {
                    qty = parseInt(attr.getValue());
                    inputQty = qty;
                    qtyFieldAttr = attr;
                    attr.controls.forEach(function(c) {
                        qtyField = c;
                        //c.clearNotification("601");
                    })
                } else if (attr.getName().indexOf("cares_balance") > -1) {
                    if (attr.getValue() != null) {
                        bal = parseInt(attr.getValue());
                    }
                } else if (attr.getName().indexOf("cares_groupid") > -1) {
                    if (attr.getValue() != null) {
                        groupId = attr.getValue()[0].id;
                    }
                } else if (attr.getName().indexOf("cares_caresunitquantity") > -1) {
                    if (attr.getValue() != null) {
                        qtyUnit = parseInt(attr.getValue());
                    }
                }
            } catch (ex) {}
        });

        if (isNaN(qty) === true) {
            //return;
            qty = 0;
        }
        //else
        if (groupId === null && qty > bal && !isAdmin) {
            alert("Quantity cannot exceed the allowed maximum of " + bal + " for this product");
            qtyFieldAttr.setValue(null);
            return;
        } else if (groupId === null && qty > bal && isAdmin && orderOverride == false) {
            alert("Quantity cannot exceed the allowed maximum of " + bal + " for this product");
            qtyFieldAttr.setValue(null);
            return;
        }
        //Groups
        else if (groupId != null) {
            var orderItemQty = 0;
            qty = qty * qtyUnit;
            var groupApprovalItems = retrieveMultipleCustom("cares_approvalitemSet", "?$select=cares_name,cares_approvalitemId,cares_product_cares_approvalitem/cares_CaresUnitQuantity&$expand=cares_product_cares_approvalitem&$filter=cares_GroupId/Id eq guid'" + groupId + "' and statecode/Value eq 0");
            if (groupApprovalItems !== null && groupApprovalItems[0] !== null) {
                for (var i = 0; i < groupApprovalItems.length; i++) {
                    var orderItems = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_Qty&$filter=cares_ApprovalItemId/Id eq guid'" + groupApprovalItems[i].cares_approvalitemId + "' and statecode/Value eq 0 and cares_caresorderitemId ne guid'" + orderItemId + "' and cares_OrderId/Id eq guid'" + Xrm.Page.data.entity.getId() + "'");
                    if (orderItems !== null && orderItems[0] !== null) {
                        for (var o = 0; o < orderItems.length; o++) {
                            orderItemQty = orderItemQty + orderItems[o].cares_Qty * groupApprovalItems[i].cares_product_cares_approvalitem.cares_CaresUnitQuantity;
                        }
                    }
                }
                orderItemQty = orderItemQty + qty;
            }

            var group = retrieveRecordCustom(groupId, "cares_approvalitemgroupSet");
            if (group != null) {
                if ((group.cares_Balance === null || orderItemQty > group.cares_Balance)) {
                    alert("Combined Quantity cannot exceed the remaining balance of " + parseInt(group.cares_Balance) + " for this group");
                    qtyFieldAttr.setValue(null);
                    return;
                }
                if (group.cares_Balance === null || orderItemQty > group.cares_Balance) {
                    // Quantity checks are not required if the submitter is PDCAdmin and the Override flag is checked
                    if (!isAdmin || orderOverride === false) {
                        alert("Combined Quantity cannot exceed the remaining balance of " + parseInt(group.cares_Balance) + " for this group");
                        qtyFieldAttr.setValue(null);
                        return;
                    }

                }
                if (group.cares_OrderMax === null || orderItemQty > group.cares_OrderMax) {
                    //if (isAdmin && orderOverride === true) {
                    //    Xrm.Page.ui.setFormNotification("Warning: Qty for this item will result in the order max of " + parseInt(group.cares_OrderMax) + " for this group to be exceeded.",
                    //        "WARNING", group.cares_OrderMax);
                    //}
                    //else {
                    //    alert("Qty for this item will result in the order max of " + parseInt(group.cares_OrderMax) + " for this group to be exceeded.");
                    //    qtyFieldAttr.setValue(null);
                    //}
                    if (!isAdmin || orderOverride === false) {
                        alert("Qty for this item will result in the order max of " + parseInt(group.cares_OrderMax) + " for this group to be exceeded.");
                        qtyFieldAttr.setValue(null);
                        return;
                    }
                } else {
                    Xrm.Page.ui.clearFormNotification(group.cares_OrderMax);
                }
            }

            remainingbalance = bal - orderItemQty;
            remainingbalance = remainingbalance < 0 ? 0 : remainingbalance;
            remainingBalAttribute.setValue(remainingbalance);
        }
        //Items
        else {
            var approval = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_approvalitem_cares_caresorderitem/cares_OrderMax&$expand=cares_approvalitem_cares_caresorderitem&$filter=cares_caresorderitemId eq guid'" + orderItemId + "'");
            if (approval !== null && approval[0] !== null) {
                if ((approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax === null || qty > approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax)) {
                    //if (isAdmin && orderOverride === true) {
                    //    Xrm.Page.ui.setFormNotification
                    //        ("Warning. Qty exceeds the order maximum of "
                    //        + parseInt(approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax) + ".",
                    //        "WARNING", approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax);

                    //}
                    //else {
                    //    alert("Qty exceeds the order maximum of " + parseInt(approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax));
                    //    qtyFieldAttr.setValue(null);
                    //}
                    if (!isAdmin || orderOverride === false) {
                        alert("Qty exceeds the order maximum of " + parseInt(approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax));
                        qtyFieldAttr.setValue(null);
                        return;
                    }
                } else {
                    Xrm.Page.ui.clearFormNotification(approval[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax);
                }
            }
            remainingbalance = bal - qty;
            remainingbalance = remainingbalance < 0 ? 0 : remainingbalance;
            remainingBalAttribute.setValue(remainingbalance);
        }
        Cares_CaresOrder.SaveQtyifValid(context.getFormContext().getData().getEntity().getId(), context.getFormContext().getData().getEntity().getEntityName(), inputQty, remainingbalance);

    },
    /**
     * This function validates the quantity on save
     * @param {any} id
     * @param {any} entityName
     * @param {any} Qty
     * @param {any} remainingbalance
     */
    SaveQtyifValid: function(id, entityName, Qty, remainingbalance) {
        var item = new Object();
        item.cares_Qty = Qty;
        item.cares_RemainingBalance = remainingbalance;
        SDK.REST.updateRecord(id, item, entityName,
            function() {
                Xrm.Page.getControl("cares_caresorderitem").refresh();
            },
            Cares_CaresOrder.errorHandler
        );
    },
    /**
     * This function sets enable rules on form activation
     * @param {any} FirstPrimaryItemId
     */
    EnableRuleforFormActivate: function(FirstPrimaryItemId) {
        if (FirstPrimaryItemId != null) {
            var orderData = retrieveRecordCustom(FirstPrimaryItemId, "cares_caresorderSet");
            if (orderData != null) {
                if (orderData.statuscode.Value != 1) {
                    return false;
                }
            }
        }
        return true;
    },
    /**
     * This function sets the enable rule for delete
     * @param {any} FirstPrimaryItemId
     */
    EnableRuleforFormDelete: function(FirstPrimaryItemId) {
        if (FirstPrimaryItemId != null) {
            var orderData = retrieveRecordCustom(FirstPrimaryItemId, "cares_caresorderSet");
            if (orderData != null) {
                if (orderData.statuscode.Value != 1 && orderData.statuscode.Value != 750760001) {
                    return false;
                }
            }
        }
        return true;
    },
    /**
     * This function enables/disables the override rule
     * */
    EnableDisableOverRideField: function() {
        if (Cares_CaresOrder.IsLoginUserhasPDCAdminRole() == true && Xrm.Page.getAttribute("statecode").getValue() == 0)
            Xrm.Page.getControl("cares_overrideorder").setDisabled(false);
        else
            Xrm.Page.getControl("cares_overrideorder").setDisabled(true);
    },

    /**
     * This function checks the PDC role for login user
     * */
    IsLoginUserhasPDCAdminRole: function() {
        //Get Login user Roles
        var userRoles = Xrm.Page.context.getUserRoles();

        if (userRoles != null && userRoles != undefined) {
            for (var i = 0; i < userRoles.length; i++) {
                var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                if (role != null) {
                    if (role.Name.indexOf("PDC Admin") > -1)
                        return true;
                }
            }
        }
        return false;
    },
    /**
     * This function runs on the copy order button
     * */
    CallonCopyOrder: function() {
        var productListUrl = GetConfiguration("MVCUrl");
        if (productListUrl !== null) {
            var odataUri = productListUrl + "Order/CopyOrder?orderId=" + Xrm.Page.data.entity.getId() + "&userId=" + Xrm.Page.context.getUserId();
            var returnVal = retrieveCustomMVC(odataUri);
            console.log(returnVal, 'here');
            if (returnVal != null) {
                Xrm.Utility.openEntityForm(Xrm.Page.data.entity.getEntityName(), returnVal);
            }
        }
    },
    /**
     * This function submits the order to SAP
     * */
    CallOnSubmitOrder: function() {
        try {
            Xrm.Utility.showProgressIndicator('Order submission in progress');
            this.setTimeout(Cares_CaresOrder.OrderSubmission, 1000);

        } catch (err) {
            Xrm.Utility.closeProgressIndicator();
            alert(err.message);
        }
        if (Xrm.Page.data.entity.getIsDirty() == true) {
            Xrm.Utility.closeProgressIndicator();
            alert("Please save entity data first then Submit");
        } else if (Xrm.Page.getControl("cares_caresorderitem").getGrid().getRows().get().length <= 0) {
            Xrm.Utility.closeProgressIndicator();
            alert("Please add Order Items in grid then Submit");
        } else if (Cares_CaresOrder.IsDirtyFieldsinGrid() == true) {
            Xrm.Utility.closeProgressIndicator();
            alert("Error: Order quantity missing for an item, please enter before submitting.");
        } else {
            var dcItems = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_product_cares_caresorderitem_Product/cares_Discontinued&$expand=cares_product_cares_caresorderitem_Product&$filter=statecode/Value eq 0 and cares_OrderId/Id eq guid'" + Xrm.Page.data.entity.getId() + "'");
            if (dcItems !== null && dcItems[0] !== null) {
                if (dcItems.length > 0) {
                    for (var o = 0; o < dcItems.length; o++) {
                        if (dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued !== null && dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued !== undefined && dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued === true) {
                            Xrm.Utility.closeProgressIndicator();
                            alert("You can not submit this Order because this order contains DC products");
                            return;
                        }
                    }
                }
            }
            var orderOverride = Xrm.Page.getAttribute("cares_overrideorder").getValue();
            var sapOrderNumber = Xrm.Page.getAttribute("cares_sapordernumber").getValue();
            var isAdmin = Cares_CaresOrder.IsLoginUserhasPDCAdminRole();
            if (Xrm.Page.getAttribute("cares_approvalid") != null && Xrm.Page.getAttribute("cares_approvalid").getValue() != null) {
                var approval = retrieveMultipleCustom("cares_approvalSet", "?$select=cares_SAPNumber,cares_cares_program_cares_approval/cares_MCFD&$expand=cares_cares_program_cares_approval&$filter=cares_approvalId eq guid'" + Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id + "'");
                if (approval !== null && approval[0] !== null) {
                    var productListUrl = GetConfiguration("MVCUrl");
                    if (productListUrl !== null) {
                        var orderId = Xrm.Page.data.entity.getId();
                        //productListUrl = "http://localhost:50359/";
                        var submitOrderUrl = productListUrl + "Order/SubmitOrder?orderId=" + orderId + "&sapOrderNumber=" + sapOrderNumber + "&userId=" + Xrm.Page.context.getUserId() + "&sapNumber=" + approval[0].cares_SAPNumber + "&isMCFD=" + approval[0].cares_cares_program_cares_approval.cares_MCFD + "&IsAdminUser=" + isAdmin + "&IsOverride=" + orderOverride;
                        //Calling MVC application to get response
                        var returnVal = retrieveCustomMVC(submitOrderUrl);
                        if (returnVal == null) {
                            Xrm.Utility.closeProgressIndicator();
                            Xrm.Utility.alertDialog("Failed in submitting order to SAP. MVC website may be NOT available.");
                        } else if (returnVal != null && returnVal != "") {
                            Xrm.Utility.alertDialog(returnVal);
                        } else
                            Xrm.Page.ui.close();
                    }
                }
            }
        }
    },
    /*
    CallOnSubmitOrder: function () {
        try {
            debugger;
            Xrm.Utility.showProgressIndicator('Order submission in progress');
            this.setTimeout(Cares_CaresOrder.OrderSubmission, 1000);
            
        }
        catch (err) {
            Xrm.Utility.closeProgressIndicator();
            alert(err.message);
        }
    },
    Close_Form: function () {
        Xrm.Page.ui.close();
    },
    OrderSubmission: function () {
        var thisOrder = Xrm.Page.data.entity.getId();
        var currentOrder = retrieveRecordCustom(thisOrder, "cares_caresorderSet");
        if (currentOrder != null && currentOrder != undefined) {
            if (currentOrder.statecode != null && currentOrder.statecode != undefined) {
                if (currentOrder.statecode.Value == 1) {
                    Xrm.Utility.closeProgressIndicator();
                    alert("You can not submit this order because it has already been submitted.Please refresh the page.");
                    return;
                }
            }
        }

        if (Xrm.Page.data.entity.getIsDirty() == true) {
            alert("Please save entity data first then Submit");
        }
        else if (Xrm.Page.getControl("cares_caresorderitem").getGrid().getRows().get().length <= 0) {
            alert("Please add Order Items in grid then Submit");
        }
        else if (Cares_CaresOrder.IsDirtyFieldsinGrid() == true) {
            alert("Please save Order Item grid with Quantity value then Submit");
        }
        else {
            var dcItems = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_product_cares_caresorderitem_Product/cares_Discontinued&$expand=cares_product_cares_caresorderitem_Product&$filter=statecode/Value eq 0 and cares_OrderId/Id eq guid'" + Xrm.Page.data.entity.getId() + "'");
            if (dcItems !== null && dcItems[0] !== null) {
                if (dcItems.length > 0) {
                    for (var o = 0; o < dcItems.length; o++) {
                        if (dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued !== null && dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued !== undefined && dcItems[o].cares_product_cares_caresorderitem_Product.cares_Discontinued === true) {
                            Xrm.Utility.closeProgressIndicator();
                            alert("You can not submit this Order because this order contains DC products");
                            return;
                        }
                    }
                }
            }
            var orderOverride = Xrm.Page.getAttribute("cares_overrideorder").getValue();
            var sapOrderNumber = Xrm.Page.getAttribute("cares_sapordernumber").getValue();
            var isAdmin = Cares_CaresOrder.IsLoginUserhasPDCAdminRole();
            if (Xrm.Page.getAttribute("cares_approvalid") != null && Xrm.Page.getAttribute("cares_approvalid").getValue() != null) {
                var approval = retrieveMultipleCustom("cares_approvalSet", "?$select=cares_SAPNumber,cares_cares_program_cares_approval/cares_MCFD&$expand=cares_cares_program_cares_approval&$filter=cares_approvalId eq guid'" + Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id + "'");
                if (approval !== null && approval[0] !== null) {
                    var productListUrl = GetConfiguration("MVCUrl");
                    if (productListUrl !== null) {
                        var orderId = Xrm.Page.data.entity.getId();

                        //productListUrl = "http://localhost:50359/";
                        var submitOrderUrl = productListUrl + "Order/SubmitOrder?orderId=" + orderId + "&sapOrderNumber=" + sapOrderNumber + "&userId=" + Xrm.Page.context.getUserId() + "&sapNumber=" + approval[0].cares_SAPNumber + "&isMCFD=" + approval[0].cares_cares_program_cares_approval.cares_MCFD + "&IsAdminUser=" + isAdmin + "&IsOverride=" + orderOverride;
                        //Calling MVC application to get response
                        var returnVal = retrieveCustomMVC(submitOrderUrl);
                        if (returnVal == null) {
                            Xrm.Utility.alertDialog("Failed in submitting order to SAP. MVC website may be NOT available.");
                        }
                        else if (returnVal != null && returnVal != "") {
                            Xrm.Utility.alertDialog(returnVal);
                        }
                        else
                            this.setTimeout(Cares_CaresOrder.Close_Form, 10000);
                        return;
                        // Xrm.Page.ui.close();
                    }
                }
            }
        }
        Xrm.Utility.closeProgressIndicator();
    },
    */
    /**
     * Checks the incorrect fields in grid
     * */
    IsDirtyFieldsinGrid: function() {
        var returnValue = false;
        var orderItems = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_Qty,cares_caresorderitemId&$filter=statecode/Value eq 0 and cares_OrderId/Id eq guid'" + Xrm.Page.data.entity.getId() + "'");
        if (orderItems !== null && orderItems[0] !== null) {
            if (orderItems.length > 0) {
                var grid = Xrm.Page.getControl("cares_caresorderitem");
                for (var o = 0; o < orderItems.length; o++) {
                    ////if (orderItems[o].cares_Qty == null || orderItems[o].cares_Qty == undefined || isNaN(parseInt(orderItems[o].cares_Qty)) == true)
                    ////    returnValue = true;
                    ////else {
                    grid.getGrid().getRows().forEach(function(row) {
                        if (row.getData().getEntity().getId() == orderItems[o].cares_caresorderitemId) {
                            if (row.getData().getEntity().attributes.getByName("cares_qty") == null ||
                                row.getData().getEntity().attributes.getByName("cares_qty").getValue() == null)
                                returnValue = true;
                            else if (row.getData().getEntity().attributes.getByName("cares_qty").getValue() != orderItems[o].cares_Qty) {
                                Cares_CaresOrder.SaveQtyifValid(row.getData().getEntity().getId(), row.getData().getEntity().getEntityName(), row.getData().getEntity().attributes.getByName("cares_qty").getValue());
                                //returnValue = true;
                            }
                        }
                    });
                    ////}
                }
            }
        }
        return returnValue;
    },
    /**
     * It disables the fields on items grid
     * @param {any} context
     */
    DisableGridProductField: function(context) {
        var productField = context.getFormContext().getData().getEntity().attributes.getByName("cares_product").controls.getByIndex(0);
        productField.setDisabled(true);
        var balanceField = context.getFormContext().getData().getEntity().attributes.getByName("cares_balance").controls.getByIndex(0);
        balanceField.setDisabled(true);
        var remainingbalanceField = context.getFormContext().getData().getEntity().attributes.getByName("cares_remainingbalance").controls.getByIndex(0);
        remainingbalanceField.setDisabled(true);
    },
    /**
     * It refreshes the sub-grid after adding items
     * */
    RefreshSubGridFromMVC: function() {
        if (Xrm.Page.getControl("cares_caresorderitem") != null) {
            Xrm.Page.getControl("cares_caresorderitem").refresh();
        }
    },
    /**
     * This function enables delivery date button
     * */
    EnableDeliveryDateButton: function() {
        if (Xrm.Page.getAttribute("cares_sapordernumber") != null && Xrm.Page.getAttribute("cares_sapordernumber").getValue() != null &&
            Xrm.Page.getAttribute("cares_sapordernumber").getValue() != "" && Xrm.Page.getAttribute("cares_sapordernumber").getValue().length > 0) {
            return true;
        }
        return false;
    },
    /**
     * This function fetches delivery date from SAP
     * */
    GetDeliveryDateFromSAP: function() {
        var deliveryDateUrl = GetConfiguration("MVCUrl");
        if (deliveryDateUrl !== null) {
            var odataUri = deliveryDateUrl + "Order/GetDeliveryDate?orderId=" + Xrm.Page.data.entity.getId() + "&userId=" + Xrm.Page.context.getUserId();
            var returnVal = retrieveCustomMVC(odataUri);
            if (returnVal != null && returnVal == "") {
                alert("Delivery date updated successfully.");
            } else {
                alert("Delivery date service encountered an error : <br/>" + returnVal);
            }
        }
    },
    /**
     * This function deletes order items
     * @param {any} FirstPrimaryItemId
     */
    CustumOrderItemPrimaryDelete: function(FirstPrimaryItemId) {
        if (confirm("Are you sure, Do you want to delete selected records?")) {
            debugger;
            var subgridDeleteMVCURL = Cares_CaresOrder.GetConfigurationForOrders("MVCUrl");

            if (subgridDeleteMVCURL !== null) {
                //var dataToPost = JSON.stringify(operationCollection);

                var odataUri = subgridDeleteMVCURL + "Order/DeleteOrderOrderItems?OrderItemsId=" + FirstPrimaryItemId;

                var returnVal = Cares_CaresOrder.retrieveCustomMVCforOrders(odataUri);
                if (returnVal != null && returnVal == "") {
                    Xrm.Utility.alertDialog("Order item successfully deleted.");
                    Xrm.Page.ui.close()
                } else {
                    alert("Associated view delete is throwing exception : <br/>" + returnVal);
                }
            }
            /*
            if (records.length > 1) {

            }
            else {
                Xrm.WebApi.deleteRecord("cares_caresorderitem", records[0].Id).then(
                    function success(result) {
                        // Perform operations on record deletion                        
                    },
                    function (error) {
                        // Handle error conditions
                        Xrm.Utility.alertDialog(error.message, null);
                    });
            }
            */

        }
        return false;

    },
    /**
     * This function performs associated items delete
     * @param {any} gridControl
     * @param {any} records
     */
    CustumOrderItemAssociatedViewDelete: function(gridControl, records) {
        if (confirm("Are you sure, Do you want to delete selected records?")) {
            debugger;
            var subgridDeleteMVCURL = Cares_CaresOrder.GetConfigurationForOrders("MVCUrl");

            if (subgridDeleteMVCURL !== null) {
                var dataToPost = [];

                for (var i = 0; i < records.length; i++) {
                    dataToPost[i] = records[i].Id;
                }

                //var dataToPost = JSON.stringify(operationCollection);

                var odataUri = subgridDeleteMVCURL + "Order/DeleteOrderOrderItems?OrderItemsId=" + dataToPost;

                var returnVal = Cares_CaresOrder.retrieveCustomMVCforOrders(odataUri);
                if (returnVal != null && returnVal == "") {
                    Xrm.Utility.alertDialog("Order item successfully deleted.");
                    gridControl.refresh();
                } else {
                    alert("Associated view delete is throwing exception : <br/>" + returnVal);
                }
            }
            /*
            if (records.length > 1) {

            }
            else {
                Xrm.WebApi.deleteRecord("cares_caresorderitem", records[0].Id).then(
                    function success(result) {
                        // Perform operations on record deletion                        
                    },
                    function (error) {
                        // Handle error conditions
                        Xrm.Utility.alertDialog(error.message, null);
                    });
            }
            */

        }
        return false;

    },
    /**
     * retreives data from MVC url
     * @param {any} odataUri
     */
    retrieveCustomMVCforOrders: function(odataUri) {
        var returnValue = null;
        //Asynchronous AJAX function to Retrieve a CRM record using OData
        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            datatype: "json",
            cache: false,
            async: false,
            url: odataUri,
            beforeSend: function(XMLHttpRequest) {
                //Specifying this header ensures that the results will be returned as JSON. 
                XMLHttpRequest.setRequestHeader("Accept", "application/json");
            },
            success: function(data, textStatus, XmlHttpRequest) {
                debugger;
                returnValue = data;
            },
            error: function(XmlHttpRequest, textStatus, errorThrown) {
                debugger;
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
            }
        });

        return returnValue;
    },
    /**
     * This function gets the configuration for orders
     * @param {any} key
     */
    GetConfigurationForOrders: function(key) {
        debugger;
        try {
            var returnValue = Cares_CaresOrder.retrieveMultipleCustomforOrders("cares_caresconfigurationSet",
                "?$select=cares_Value&$filter=cares_key eq '" + key + "'");
            if (returnValue != null && returnValue.length > 0) {
                return returnValue[0].cares_Value;
            }
            alert("Unable to find key(" + key + ") value in the configuration.");
        } catch (ex) {
            alert(ex.message);
        }
        return null;
    },
    /**
     * This function retrieves multiple records for the order
     * @param {any} odataSetName
     * @param {any} filter
     */
    retrieveMultipleCustomforOrders: function(odataSetName, filter) {
        var context = Xrm.Page.context;
        //Retrieve the server url, which differs on-premise from on-line and 
        //shouldn't be hard-coded.
        var serverUrl = context.getClientUrl();
        if (serverUrl.match(/\/$/)) {
            serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }
        //The XRM OData end-point
        var ODATA_ENDPOINT = "/XRMServices/2011/OrganizationData.svc/";

        if (!odataSetName) {
            alert("odataSetName is required.");
            return;
        }

        var returnValue = null;

        //if (serverUrl.indexOf("https") < 0) {
        //    serverUrl = serverUrl.replace("http", "https");
        //}

        var oDataEndpointUrl = serverUrl + ODATA_ENDPOINT;
        var odataUri = oDataEndpointUrl + "/" + odataSetName;

        if (filter) {
            odataUri += filter;
        }
        var service = Cares_CaresOrder.GetRequestObjectforOrders();

        if (service != null) {
            service.open("GET", odataUri, false);
            service.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            service.setRequestHeader("Accept", "application/json, text/javascript, */*");
            service.send(null);
            var retrieved = JSON.parse(service.responseText).d;

            if (retrieved != null && retrieved.results.length > 0) {
                returnValue = retrieved.results;
            } else if (retrieved != null) {
                returnValue = retrieved;
            }
        }
        return returnValue;
    },
    /**
     * This functions gets the active-x object
     * */
    GetRequestObjectforOrders: function() {
        if (window.XMLHttpRequest) {
            return new window.XMLHttpRequest;
        } else {
            try {
                return new ActiveXObject("MSXML2.XMLHTTP.3.0");
            } catch (ex) {
                return null;
            } // End catch
        } // End if
    },
    /**
     * This function handles the error exceptions
     * @param {any} error
     */
    errorHandler: function(error) {
        writeMessage(error.message);
    },

};