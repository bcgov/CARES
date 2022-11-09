if (typeof (Cares_Program) === "undefined") { Cares_Program = { __namespace: true }; }

Cares_Program = {
    /**
     * This function performs the validation on program save
     * @param {any} context
     */
    ProgramFormValidationOnSave: function (context) {
        debugger;
        var programId = Xrm.Page.data.entity.getId();
        var returnEndDateResult = null;
        if ((Xrm.Page.getAttribute("cares_enddate") !== null && Xrm.Page.getAttribute("cares_enddate").getValue() !== null
            && Xrm.Page.getAttribute("cares_enddate").getValue() === true) || (Xrm.Page.getAttribute("cares_expiryrule") !== null && Xrm.Page.getAttribute("cares_expiryrule").getValue() !== null
            && Xrm.Page.getAttribute("cares_expiryrule").getValue() === 750760000)) {
            returnEndDateResult = retrieveMultipleCustom("cares_approvalSet", "?$filter=cares_EndDate eq null and cares_ProgramId/Id eq guid'" + programId + "'");
            if (returnEndDateResult !== null && returnEndDateResult.length > 0) {
                alert("Please select End Date in all associated Approvals");
                context.getEventArgs().preventDefault();
            }
        }
        else if (Xrm.Page.getAttribute("cares_filenumber") !== null && Xrm.Page.getAttribute("cares_filenumber").getValue() !== null
            && Xrm.Page.getAttribute("cares_filenumber").getValue() === true) {
            returnEndDateResult = retrieveMultipleCustom("cares_approvalSet", "?$filter=cares_FileNumber eq null or cares_FileNumber eq '' and cares_ProgramId/Id eq guid'" + programId + "'");
            if (returnEndDateResult !== null && returnEndDateResult.length > 0) {
                alert("Please enter File Number in all associated Approvals");
                context.getEventArgs().preventDefault();
            }
        }
        else if (Xrm.Page.getAttribute("cares_phn") !== null && Xrm.Page.getAttribute("cares_phn").getValue() !== null
            && Xrm.Page.getAttribute("cares_phn").getValue() === true) {
            returnEndDateResult = retrieveMultipleCustom("cares_approvalSet", "?$filter=cares_PHNSIN eq null or cares_PHNSIN eq '' and cares_ProgramId/Id eq guid'" + programId + "'");
            if (returnEndDateResult !== null && returnEndDateResult.length > 0) {
                alert("Please enter PHNSIN in all associated Approvals");
                context.getEventArgs().preventDefault();
            }
        }
    },
    /**
     * It handles the error exception
     * @param {any} error
     */
    errorHandler: function (error) {
        writeMessage(error.message);
    },
};
