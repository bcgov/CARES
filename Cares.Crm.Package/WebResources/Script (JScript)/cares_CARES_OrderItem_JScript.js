if (typeof (Cares_CaresOrderItem) == "undefined") { Cares_CaresOrderItem = { __namespace: true }; }

Cares_CaresOrderItem =
    {

        /*
        * 
        * Sets the Order Name to the name of the approval item 
        * Runs on load create form0 because the approval item is read-only
        */
        SetOrderItemNameOnLoad: function () {
            var formType = Xrm.Page.ui.getFormType();
            if (formType == 1) {
                var _orderItemName = "";

                if (null != Xrm.Page.getAttribute("cares_approvalitemid")
                    && undefined != Xrm.Page.getAttribute("cares_approvalitemid")
                    && null != Xrm.Page.getAttribute("cares_approvalitemid").getValue()
                    && undefined != Xrm.Page.getAttribute("cares_approvalitemid").getValue()) {
                    _orderItemName = Xrm.Page.getAttribute("cares_approvalitemid").getValue()[0].name;
                }

                Xrm.Page.getAttribute("cares_name").setValue(_orderItemName);
            }
        },
    /**
     * This function handles the error exception
     * @param {any} error
     */
        errorHandler: function (error) {
            writeMessage(error.message);
        },
        /**
         * It performs the validation on order items activation
         * @param {any} FirstPrimaryItemId
         * @param {any} PrimaryEntityTypeName
         */
        ValidateOrderItemActivation: function (FirstPrimaryItemId, PrimaryEntityTypeName) {
            debugger;
            if (Xrm.Page.getAttribute("cares_orderid") != null) {
                if (Xrm.Page.getAttribute("cares_orderid").getValue() != null) {
                    var orderId = Xrm.Page.getAttribute("cares_orderid").getValue()[0].id;
                    var orderData = retrieveRecordCustom(orderId, "cares_caresorderSet");
                    if (orderData != null) {
                        if (orderData.statuscode.Value != 1) {
                            alert("You cannot remove or modify this item after the Order has been submitted to SAP");
                            return;
                        }
                    }

                    Mscrm.CommandBarActions.activate(FirstPrimaryItemId, PrimaryEntityTypeName);
                }
            }
        },
        /**
         * This method performs the validation on deactivation of items
         * @param {any} FirstPrimaryItemId
         * @param {any} PrimaryEntityTypeName
         */
        ValidateOrderItemDeactivation: function (FirstPrimaryItemId, PrimaryEntityTypeName) {
            debugger;
            if (Xrm.Page.getAttribute("cares_orderid") != null) {
                if (Xrm.Page.getAttribute("cares_orderid").getValue() != null) {
                    var orderId = Xrm.Page.getAttribute("cares_orderid").getValue()[0].id;
                    var orderData = retrieveRecordCustom(orderId, "cares_caresorderSet");
                    if (orderData != null) {
                        if (orderData.statuscode.Value != 1) {
                            alert("You cannot remove or modify this item after the Order has been submitted to SAP");
                            return;
                        }
                    }

                    Mscrm.CommandBarActions.deactivate(FirstPrimaryItemId, PrimaryEntityTypeName);
                }
            }
        },
        /**
         * This function validates the order item deletion
         * @param {any} FirstPrimaryItemId
         * @param {any} PrimaryEntityTypeName
         */
        ValidateOrderItemDeletion: function (FirstPrimaryItemId, PrimaryEntityTypeName) {
            debugger;
            if (Xrm.Page.getAttribute("cares_orderid") != null) {
                if (Xrm.Page.getAttribute("cares_orderid").getValue() != null) {
                    var orderId = Xrm.Page.getAttribute("cares_orderid").getValue()[0].id;
                    var orderData = retrieveRecordCustom(orderId, "cares_caresorderSet");
                    if (orderData != null) {
                        if (orderData.statuscode.Value != 1) {
                            alert("You cannot remove or modify this item after the Order has been submitted to SAP");
                            return;
                        }
                    }

                    Mscrm.CommandBarActions.deletePrimaryRecord(FirstPrimaryItemId, PrimaryEntityTypeName);
                }
            }
        },
        /**
         * This function validates the quantity */
        ValidateQuantityonChange: function () {
            debugger;
            Xrm.Page.getControl("cares_qty").clearNotification("701");
            Xrm.Page.getControl("cares_qty").clearNotification("702");
            Xrm.Page.ui.clearFormNotification("9002");
            var bal = 0;
            if (Xrm.Page.getAttribute("cares_qty") != null && Xrm.Page.getAttribute("cares_approvalitemid") != null) {
                if (Xrm.Page.getAttribute("cares_qty").getValue() != null && Xrm.Page.getAttribute("cares_approvalitemid").getValue() != null) {
                    var approvalItem = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_approvalitem_cares_caresorderitem/cares_GroupId,cares_approvalitem_cares_caresorderitem/cares_Balance,cares_approvalitem_cares_caresorderitem/cares_OrderMax,cares_cares_caresorder_cares_caresorderitem/cares_OverrideOrder,cares_approvalitem_cares_caresorderitem/cares_ProductId&$expand=cares_approvalitem_cares_caresorderitem,cares_cares_caresorder_cares_caresorderitem&$filter=cares_caresorderitemId eq guid'" + Xrm.Page.data.entity.getId() + "'");
                    if (approvalItem !== null && approvalItem[0] !== null) {
                        if (approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_Balance !== null) {
                            bal = parseInt(approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_Balance.Value);
                        }
                        var qty = parseInt(Xrm.Page.getAttribute("cares_qty").getValue());
                        if (isNaN(qty) === true) {
                            return;
                        }
                        else if (approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_GroupId === null && qty > bal) {
                            Xrm.Page.getControl("cares_qty").setNotification("Error:  Qty exceeds the remaining balance", "701");
                            Xrm.Page.getAttribute("cares_qty").setValue(null);
                        }
                        else if (approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_GroupId !== null) {
                            var group = retrieveRecordCustom(approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_GroupId.Id, "cares_approvalitemgroupSet");
                            if (group != null) {
                                var product = retrieveRecordCustom(approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_ProductId.Id, "ProductSet");
                                if (product != null) {
                                    if (product.cares_CaresUnitQuantity !== null) {
                                        qty = qty * product.cares_CaresUnitQuantity;
                                    }
                                    if ((group.cares_Balance === null || qty > group.cares_Balance)) {
                                        Xrm.Page.getControl("cares_qty").setNotification("Error:  Qty exceeds the remaining balance", "702");
                                        Xrm.Page.getAttribute("cares_qty").setValue(null);
                                        return;
                                    }
                                }

                                //Calculate Total Qty
                                var orderItemQty = 0;
                                var groupApprovalItems = retrieveMultipleCustom("cares_approvalitemSet", "?$select=cares_name,cares_approvalitemId,cares_product_cares_approvalitem/cares_CaresUnitQuantity&$expand=cares_product_cares_approvalitem&$filter=cares_GroupId/Id eq guid'" + approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_GroupId.Id + "' and statecode/Value eq 0");
                                if (groupApprovalItems !== null && groupApprovalItems[0] !== null) {
                                    for (var i = 0; i < groupApprovalItems.length; i++) {
                                        var orderItems = retrieveMultipleCustom("cares_caresorderitemSet", "?$select=cares_name,cares_Qty&$filter=cares_ApprovalItemId/Id eq guid'" + groupApprovalItems[i].cares_approvalitemId + "' and statecode/Value eq 0 and cares_caresorderitemId ne guid'" + Xrm.Page.data.entity.getId() + "'");
                                        if (orderItems !== null && orderItems[0] !== null) {
                                            for (var o = 0; o < orderItems.length; o++) {
                                                orderItemQty = orderItemQty + orderItems[o].cares_Qty * groupApprovalItems[i].cares_product_cares_approvalitem.cares_CaresUnitQuantity;
                                            }
                                        }
                                    }
                                    orderItemQty = orderItemQty + qty;
                                }

                                if ((group.cares_OrderMax === null || orderItemQty > group.cares_OrderMax) && approvalItem[0].cares_cares_caresorder_cares_caresorderitem.cares_OverrideOrder === false) {
                                    Xrm.Page.ui.setFormNotification("Warning: Qty for this item will result in the monthly max for the Group to be exceeded. Override will be required to submit this order",
                                        "WARNING",
                                        "9002");
                                }
                            }
                        }
                        else if ((approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax === null || qty > approvalItem[0].cares_approvalitem_cares_caresorderitem.cares_OrderMax) && approvalItem[0].cares_cares_caresorder_cares_caresorderitem.cares_OverrideOrder === false) {
                            Xrm.Page.ui.setFormNotification("Warning: Qty exceeds the Monthly Maximum. Override will be required to submit this order",
                                "WARNING",
                                "9002");
                        }
                    }
                }
            }
        },
        /**
         * This function checks the status of record
         * */
        isDraftParent: function () {
            if (Xrm.Page.getAttribute("cares_orderid") !== null && Xrm.Page.getAttribute("cares_orderid").getValue() !== null
                && Xrm.Page.getAttribute("cares_orderid").getValue() !== undefined) {

                var _id = Xrm.Page.getAttribute("cares_orderid").getValue()[0].id;

                var _order = retrieveRecordCustom(_id, "cares_caresorderSet");

                if (_order !== null) {
                    if (_order.statuscode.Value === 1) {
                        alert("Parent is Draft");
                        return true;
                    } else {
                        alert("Parent is not Draft");
                        return false;
                    }
                }

            }
        },

    };
