/**
 * This function performs the Postal Code formatting for composite field
 * @param {any} fieldName
 * @param {any} CmpositeFieldName
 */
function FormatPostalCodeComp(fieldName, CmpositeFieldName) {
    debugger;
    var compField = Xrm.Page.getControl(CmpositeFieldName);
    compField.clearNotification("101");
    var oField = Xrm.Page.getAttribute(fieldName);
    
    if (typeof (compField) != "undefined" && compField.getValue() != null && compField.getValue().length > 0)
    {
        var postalRGEX = /\D\d\D\d\D\d/g;
        var sAlphaNumeric = compField.getValue();
        sAlphaNumeric = sAlphaNumeric.replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (!postalRGEX.test(sAlphaNumeric)) {
            compField.setNotification("Postal Code entered does not match Canada Post format.", "101");
            oField.setValue(null);
            return false;
        }
        switch (sAlphaNumeric.length) {
            case 6:
                sFormattedPhoneNumber = sAlphaNumeric.substr(0, 3) + " " + sAlphaNumeric.substr(3, 3);
                oField.setValue(sFormattedPhoneNumber);
                break;
            default:
                compField.setNotification("Postal Code entered does not match Canada Post format.", "101");
                oField.setValue(null);
                break;
        }
    }

}
/**
 * This function performs the Postal Code formatting
 * @param {any} fieldName
 */
function FormatPostalCode(fieldName) {
    debugger;
    Xrm.Page.getControl(fieldName).clearNotification("101");
    var oField = Xrm.Page.getAttribute(fieldName);

    if (typeof (oField) != "undefined" && oField.getValue() != null && oField.getValue().length > 0) {
        var postalRGEX = /\D\d\D\d\D\d/g;
        var sAlphaNumeric = oField.getValue();
        sAlphaNumeric = sAlphaNumeric.replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (!postalRGEX.test(sAlphaNumeric)) {
            Xrm.Page.getControl(fieldName).setNotification("Postal Code entered does not match Canada Post format.", "101");
            oField.setValue(null);
            return false;
        }
        switch (sAlphaNumeric.length) {
            case 6:
                sFormattedPhoneNumber = sAlphaNumeric.substr(0, 3) + " " + sAlphaNumeric.substr(3, 3);
                oField.setValue(sFormattedPhoneNumber);
                break;
            default:
                Xrm.Page.getControl(fieldName).setNotification("Postal Code entered does not match Canada Post format.", "101");
                oField.setValue(null);
                break;

        }
    }

}
