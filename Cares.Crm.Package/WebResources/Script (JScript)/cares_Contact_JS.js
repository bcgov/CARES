/**
 * This function performs the address validations
 * */
function ChangeAddressCompositeFields() {
    if (Xrm.Page.getControl("address1_composite_compositionLinkControl_address1_stateorprovince") != null)
        Xrm.Page.getControl("address1_composite_compositionLinkControl_address1_stateorprovince").setDisabled(true);

    if (Xrm.Page.getControl("address1_composite_compositionLinkControl_address1_country") != null)
        Xrm.Page.getControl("address1_composite_compositionLinkControl_address1_country").setDisabled(true);
}
/**
 * This function performs birth date validation
 * @param {any} fieldName
 */
function birthDateValidation(fieldName) {
    Xrm.Page.getControl(fieldName).clearNotification("101");
    var oField = Xrm.Page.getAttribute(fieldName);

    if (typeof (oField) != "undefined" && oField != null && oField.getValue() != null  && oField.getValue() != "undefined") {
        var bDate = new Date(oField.getValue());
        var todayDate = new Date();
        if (todayDate <= bDate) {
            //alert("Date of Birth cannot be in the future");
            Xrm.Page.getControl(fieldName).setNotification("Date of Birth cannot be in the future.", "101");
            oField.setValue(null);
        }
    }
}
