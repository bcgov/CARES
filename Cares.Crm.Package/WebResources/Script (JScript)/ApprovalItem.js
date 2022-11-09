if (typeof (ApprovalItem) === "undefined") { ApprovalItem = { __namespace: true }; }

ApprovalItem = {
    /** This method has been discarded
     * */
    onLoad: function() {
        //alert(1);
    },
    /**
     * This method checks the expiry date and compares with current date
     * @param {any} context
     */
    isValidExpiryDateVSToday: function (context)
    {
        debugger;
        Xrm.Page.ui.clearFormNotification("9010");
        if (Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined)
        {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate <= today)
            {
                Xrm.Page.ui.setFormNotification("Expiry Date must be greater than today.",
                    "ERROR",
                    "9010");
                Xrm.Page.getAttribute("cares_expirydate").setValue(null);
                
            }
        }

    },

    /**
     * This method checks the expiry date
     * 
     * */
    isValidExpiryDate_CGI37: function () {
        debugger;
        Xrm.Page.ui.clearFormNotification("9011");
        //CGI-37
        if (Xrm.Page.getAttribute("cares_approval") !== null && Xrm.Page.getAttribute("cares_approval").getValue() !== null
            && Xrm.Page.getAttribute("cares_approval").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined) {

            var _id = Xrm.Page.getAttribute("cares_approval").getValue()[0].id;
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();

            var _approval = retrieveRecordCustom(_id, "cares_approvalSet");
            if (_approval !== null && _approval !== undefined
                && _approval.cares_ProgramId !== null && _approval.cares_ProgramId !== undefined
                && null !== _approval.cares_ProgramId.Id && undefined !== _approval.cares_ProgramId.Id
                && _approval.cares_EndDate !== null && _approval.cares_EndDate !== undefined)

            {
                //CGI-37
                var _idProgram = _approval.cares_ProgramId.Id;
                var returnValue = retrieveRecordCustom(_idProgram, "cares_programSet");
                if (returnValue !== null && returnValue !== undefined) {
                    //IF RENEWAL RULE IS NONE
                    if (returnValue.cares_RenewalRule !== null && returnValue.cares_RenewalRule !== undefined &&
                        returnValue.cares_RenewalRule.Value === 750760003
                        && expiryDate.setHours(0, 0, 0, 0) >= ApprovalItem.HandleoDataDate(_approval.cares_EndDate).setHours(0, 0, 0, 0)) {
                        Xrm.Page.ui.setFormNotification("Expiry Date must be less than the Approval End Date.",
                            "ERROR",
                            "9011");
                        Xrm.Page.getAttribute("cares_expirydate").setValue(null);
                        
                    }
                }                

            }
                      
        }

    }, 


    /*This method also validates the expiry date
     * */
    isValidExpiryDate_CGI45: function () {
        debugger;
        //CGI-45
        if (Xrm.Page.getAttribute("cares_approval") !== null && Xrm.Page.getAttribute("cares_approval").getValue() !== null
            && Xrm.Page.getAttribute("cares_approval").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_expirydate") !== null && Xrm.Page.getAttribute("cares_expirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_expirydate").getValue() !== undefined
            && Xrm.Page.getAttribute("cares_allotmentexpirydate") !== null && Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue() !== null
            && Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue() !== undefined) {

            var _id = Xrm.Page.getAttribute("cares_approval").getValue()[0].id;
            var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue(); 
            var allotmentExpirydate = Xrm.Page.getAttribute("cares_allotmentexpirydate").getValue();

            var _approval = retrieveRecordCustom(_id, "cares_approvalSet");

            if (_approval !== null && _approval !== undefined
                && undefined !== _approval.cares_ApprovalEndDate
                && null !== _approval.cares_ApprovalEndDate )
            {

                if (expiryDate.setHours(0, 0, 0, 0) < ApprovalItem.HandleoDataDate(_approval.cares_ApprovalEndDate).setHours(0, 0, 0, 0)
                    && expiryDate.setHours(0, 0, 0, 0) < allotmentExpirydate.setHours(0, 0, 0, 0) )
                {

                    Xrm.Page.getAttribute("cares_allotmentexpirydate").setValue(expiryDate);

                }

            }
            
        }

    },
    /**
     * This method validates the expiry date on group change event
     * */
    OnChangeGroupExpiryDate: function () {
        debugger;
        var expiryDateField = Xrm.Page.getAttribute("cares_expirydate");
        var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
        var expiryDateControl = Xrm.Page.getControl("cares_expirydate");
        var groupId = Xrm.Page.data.entity.getId();
        var approvalEndDate = null;
        var approvalAllotmentEndDate = null;

        var approval = retrieveRecordCustom(Xrm.Page.getAttribute("cares_approvalid").getValue()[0].id, "cares_approvalSet");
        if (approval !== null && approval !== undefined) {
            if (approval.cares_EndDate !== null && approval.cares_EndDate !== undefined) {
                approvalEndDate = ApprovalItem.HandleoDataDate(approval.cares_EndDate);
            }
            if (approval.cares_ApprovalEndDate !== null && approval.cares_ApprovalEndDate !== undefined) {
                approvalAllotmentEndDate = ApprovalItem.HandleoDataDate(approval.cares_ApprovalEndDate);
            }
        }
        Cares_Approval.ValidateGroupExpiryDate(expiryDateField, expiryDate, expiryDateControl, groupId, approvalEndDate, approvalAllotmentEndDate);
    },
    /**
     * This method validate the item expiry date
     * */
    OnChangeApprovalItemExpiryDate: function () {
        debugger;
        var expiryDateField = Xrm.Page.getAttribute("cares_expirydate");
        var expiryDate = Xrm.Page.getAttribute("cares_expirydate").getValue();
        var expiryDateControl = Xrm.Page.getControl("cares_expirydate");
        var approvalitemId = Xrm.Page.data.entity.getId();
        var approvalEndDate = null;
        var approvalAllotmentEndDate = null;

        var approval = retrieveRecordCustom(Xrm.Page.getAttribute("cares_approval").getValue()[0].id, "cares_approvalSet");
        if (approval !== null && approval !== undefined) {
            if (approval.cares_EndDate !== null && approval.cares_EndDate !== undefined) {
                approvalEndDate = ApprovalItem.HandleoDataDate(approval.cares_EndDate);
            }
            if (approval.cares_ApprovalEndDate !== null && approval.cares_ApprovalEndDate !== undefined) {
                approvalAllotmentEndDate = ApprovalItem.HandleoDataDate(approval.cares_ApprovalEndDate);
            }
        }
        Cares_Approval.ValidateApprovalItemExpiryDate(expiryDateField, expiryDate, expiryDateControl, approvalitemId, approvalEndDate, approvalAllotmentEndDate);
    },
    /**
     * This method is used for conversion of dates in Javascript
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
}
