/**
 * This function performs the phone number formatting
 * @param {any} fieldName
 */
function FormatPhoneNumber(fieldName) {
    debugger;
    Xrm.Page.getControl(fieldName).clearNotification("101");
    var oField = Xrm.Page.getAttribute(fieldName);
    var sAllNumeric = oField;
    if (typeof (oField) != "undefined" && oField.getValue() != null && oField.getValue().length > 0) {
        sAllNumeric = oField.getValue().replace(/[^0-9]/g, "");
        switch (sAllNumeric.length) {
        case 10:
            //sFormattedPhoneNumber = "(" + sAllNumeric.substr(0, 3) + ") " + sAllNumeric.substr(3, 3) + "-" + sAllNumeric.substr(6, 4);
            sFormattedPhoneNumber = sAllNumeric.substr(0, 3) + "-" + sAllNumeric.substr(3, 3) + "-" + sAllNumeric.substr(6, 4);
            oField.setValue(sFormattedPhoneNumber);
            break;
        default:
            Xrm.Page.getControl(fieldName).setNotification("Phone must contain 10 numbers.", "101");
            oField.setValue(null);
            break;
        }

    }

}