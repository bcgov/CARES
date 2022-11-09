if (typeof (Cares_ApprovalItemGroup) === "undefined") { Cares_ApprovalItemGroup = { __namespace: true }; }

Cares_ApprovalItemGroup = {
    /**This method runs on load of form
     * */
    ApprovalItemGroup_OnLoad: function () {
        var formType = Xrm.Page.ui.getFormType();
        if (formType === 1) {
            var currentDate = new Date();
            Xrm.Page.getAttribute("cares_startdate").setValue(currentDate);
        }


    },
    /**This method validates the expiry date
     * */
    ValidateExpiryDate: function () {
        debugger;
        Xrm.Page.ui.clearFormNotification("10011");

        var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
        var approvalId = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id;

        var approval = retrieveRecordCustom(approvalId, "cares_approvalSet");
        var approvalEndDate = Cares_ApprovalItemGroup.HandleoDataDate(approval.cares_EndDate);
        
        if (expiryDate != null && approvalEndDate != null && approvalEndDate != undefined && expiryDate < approvalEndDate && expiryDate < new Date()) {
            Xrm.Page.ui.setFormNotification("GROUP HAS ALREADY BEEN EXPIRED.",
                "WARNING",
                "10011");
            //Xrm.Page.getControl("cares_expirydate").setNotification("Data has been already expired.");
        }
        else {
            if (approvalEndDate == null && expiryDate != null) {
                if (expiryDate < new Date()) {
                    Xrm.Page.ui.setFormNotification("GROUP HAS ALREADY BEEN EXPIRED.",
                        "WARNING",
                        "10011");
                }
                
            }
        }
    },
    /**This method runs on refresh of form
     * */
    RefreshPage: function () {
        debugger;
        //Xrm.Page.data.entity.save();
       // Xrm.Page.data.entity.refresh();
        Xrm.Utility.openEntityForm(Xrm.Page.data.entity.getEntityName(),Xrm.Page.data.entity.getId());
       // Xrm.Page.data.refresh();
    },
    /**
     * This method validates expiry date on save of form
     * @param {any} context
     */
    ApprovalItemGroup_OnSave: function (context) {
        Xrm.Page.ui.clearFormNotification("9005");

        var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
        var approvalId = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id;

        var approval = retrieveRecordCustom(approvalId, "cares_approvalSet");
        var approvalEndDate = Cares_ApprovalItemGroup.HandleoDataDate(approval.cares_EndDate);

        if (approvalEndDate != null && approvalEndDate != undefined && expiryDate > approvalEndDate) {
            Xrm.Page.ui.setFormNotification("EXPIRY DATE NEEDS TO BE LESS THEN OR EQUAL TO APPROVAL END DATE.",
                "ERROR",
                "9005");
            context.getEventArgs().preventDefault();
        }


        //SDK.REST.retrieveRecord(
        //    approvalId,
        //    "cares_approval",
        //    null,
        //    null,
        //    function(approval) {
        //        if (expiryDate > approval.cares_EndDate) {
        //            Xrm.Page.ui.setFormNotification("EXPIRY DATE NEEDS TO BE LESS THEN OR EQUAL TO APPROVAL END DATE.",
        //                "ERROR",
        //                "9005");
        //            context.getEventArgs().preventDefault();
        //            return;
        //        }
        //    },
        //    Cares_ApprovalItemGroup.errorHandler
        //);
        //context.getEventArgs().preventDefault();

    },
    /**
     * This method disables the fields on items and group grid
     * @param {any} context
     */
    DisableGroupApprovalItemsGridFields: function (context) {
        context.getFormContext().getData().getEntity().attributes.forEach(function (attr) {
            if (attr.getName() === "cares_productid" || attr.getName() === "cares_permonth" || attr.getName() === "cares_balance" || attr.getName() === "cares_total") {
                attr.controls.forEach(function (c) {
                    c.setDisabled(true);
                })
            }
        });
    },
    /**
     * This method handles the exceptions
     * @param {any} error
     */
    errorHandler: function (error) {
        writeMessage(error.message);
    },
    /**
     * This method validates the expiry date with current date
     * @param {any} context
     */
    isValidExpiryDateVSToday: function (context) {
        debugger;
        Xrm.Page.ui.clearFormNotification("9006");
        if (Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined) {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate <= today) {
                Xrm.Page.ui.setFormNotification("Expiry Date must be greater than today.",
                    "ERROR",
                    "9006");
                Xrm.Page.getAttribute("cares_expirydate").setValue(null);
            }
        }

    },
    /**This method validates the expiry date based on none expiry rule
     * */
    isValidExpiryDate_NONERule: function () {
        debugger;
        Xrm.Page.ui.clearFormNotification("9007");
        //CARES-147
        if (Xrm.Page.getAttribute("cares_approvalid") !== null && Xrm.Page.getAttribute("cares_approvalid").getValue() !== null
            && Xrm.Page.getAttribute("cares_approvalid").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined) {

            var _id = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id;
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();

            var _approval = retrieveRecordCustom(_id, "cares_approvalSet");
            if (_approval !== null && _approval !== undefined
                && _approval.cares_ProgramId !== null && _approval.cares_ProgramId !== undefined
                && null !== _approval.cares_ProgramId.Id && undefined !== _approval.cares_ProgramId.Id
                && _approval.cares_EndDate !== null && _approval.cares_EndDate !== undefined) {
                //CARES-147
                var _idProgram = _approval.cares_ProgramId.Id;
                var returnValue = retrieveRecordCustom(_idProgram, "cares_programSet");
                if (returnValue !== null && returnValue !== undefined) {
                    //IF RENEWAL RULE IS NONE
                    if (returnValue.cares_RenewalRule !== null && returnValue.cares_RenewalRule !== undefined &&
                        returnValue.cares_RenewalRule.Value === 750760003
                        && expiryDate.setHours(0, 0, 0, 0) >= Cares_ApprovalItemGroup.HandleoDataDate(_approval.cares_EndDate).setHours(0, 0, 0, 0)) {
                        Xrm.Page.ui.setFormNotification("Expiry Date must be less than the Approval End Date.",
                            "ERROR",
                            "9007");
                        Xrm.Page.getAttribute("cares_expirydate").setValue(null);

                    }
                }

            }

        }

    },
    /**
     * This method checks allotment expiry date
     * */
    isValidExpiryDate_AlltmntRule: function () {
        debugger;
        //CARES-156
        if (Xrm.Page.getAttribute("cares_approvalid") !== null && Xrm.Page.getAttribute("cares_approvalid").getValue() !== null
            && Xrm.Page.getAttribute("cares_approvalid").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_allotmentexpirydate") !== null && Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue() !== undefined) {

            var _id = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id;
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
            var allotmentExpirydate = Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue();

            var _approval = retrieveRecordCustom(_id, "cares_approvalSet");

            if (_approval !== null && _approval !== undefined
                && undefined !== _approval.cares_ApprovalEndDate
                && null !== _approval.cares_ApprovalEndDate) {

                if (expiryDate.setHours(0, 0, 0, 0) < Cares_ApprovalItemGroup.HandleoDataDate(_approval.cares_ApprovalEndDate).setHours(0, 0, 0, 0)
                    && expiryDate.setHours(0, 0, 0, 0) < allotmentExpirydate.setHours(0, 0, 0, 0)) {

                    Xrm.Page.getAttribute("cares_allotmentexpirydate").setValue(expiryDate);

                }

            }

        }

    },
    /**
     * This methid checks approval item expiry date
     * @param {any} context
     */
    CallOnApprovalItemExpiryDate: function (context) {
        debugger;
        var expiryDateField = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate");
        var expiryDate = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate").getValue();
        var expiryDateControl = expiryDateField.controls.get(0);
        if (expiryDate == null) {
            expiryDateControl.clearNotification("602");
            return;
        }
        var approvalitemId = context.getFormContext().getData().getEntity().getId();

        var approvalId = Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id;

        var approvalRecord = retrieveRecordCustom(approvalId, "cares_approvalSet");

        var approvalEndDate = null;
        var approvalAllotmentEndDate = null;
        var IsRenewalRuleNone = false;

        if (approvalRecord !== null && approvalRecord !== undefined) {

            if (approvalRecord.cares_ApprovalEndDate !== null && approvalRecord.cares_ApprovalEndDate !== undefined) {
                approvalAllotmentEndDate = Cares_ApprovalItemGroup.HandleoDataDate(approvalRecord.cares_ApprovalEndDate);
            }
            if (approvalRecord.cares_EndDate !== null && approvalRecord.cares_EndDate !== undefined) {
                approvalEndDate = Cares_ApprovalItemGroup.HandleoDataDate(approvalRecord.cares_EndDate);
            }

            var programRecord = retrieveRecordCustom(approvalRecord.cares_ProgramId.Id, "cares_programSet");
            if (programRecord !== null && programRecord !== undefined) {
                if (programRecord.cares_RenewalRule !== null && programRecord.cares_RenewalRule !== undefined &&
                    programRecord.cares_RenewalRule.Value === 750760003) {
                    IsRenewalRuleNone = true;
                }
            }
        }
        Cares_ApprovalItemGroup.ValidateApprovalItemExpiryDate
            (expiryDateField, expiryDate, expiryDateControl, approvalitemId, approvalEndDate, approvalAllotmentEndDate, IsRenewalRuleNone);
    },
    /**
     * This method validates the item expiry date
     * @param {any} expiryDateField
     * @param {any} expiryDate
     * @param {any} expiryDateControl
     * @param {any} approvalitemId
     * @param {any} approvalEndDate
     * @param {any} approvalAllotmentEndDate
     * @param {any} IsRenewalRuleNone
     */
    ValidateApprovalItemExpiryDate: function (expiryDateField, expiryDate, expiryDateControl, approvalitemId, approvalEndDate, approvalAllotmentEndDate, IsRenewalRuleNone) {
        debugger;
        var todayDate = new Date();
        var approvalItemAllotmentExpiryDate = Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue();

        expiryDateControl.clearNotification("602");

        if (IsRenewalRuleNone === true && expiryDate > approvalEndDate) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "602");
            return;
        }
        else if (expiryDate > approvalEndDate && approvalEndDate != null && approvalEndDate != undefined) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "602");
            return;
        }
        else if (todayDate > expiryDate) {
            expiryDateControl.setNotification("Expiry Date must be greater than today.", "602");
            return;
        }
        return;
    },
    /**
     * This function handles the date in javascript
     * @param {any} dateValue
     */
    HandleoDataDate: function (dateValue) {
        var returnDate = null;
        try {
            dateValue = dateValue === null ? "" : dateValue.toString();
            if (dateValue !== "") {
                var digits = dateValue.replace(/[^\d]/g, "");
                returnDate = new Date(parseInt(digits, 10));

                var utcMonth = returnDate.getUTCMonth() + 1;

                var UTCDate = returnDate.getUTCFullYear() + '/' + utcMonth + '/' + returnDate.getUTCDate();
                var returnDate = new Date(UTCDate);
            }
        }
        catch (Exception) { alert(Exception.message); }
        return returnDate;
    },
};