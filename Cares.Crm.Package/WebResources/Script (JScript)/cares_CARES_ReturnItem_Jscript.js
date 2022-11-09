if (typeof (Cares_CaresReturnItem) == "undefined") { Cares_CaresReturnItem = { __namespace: true }; }

Cares_CaresReturnItem =
    {
    /**
     * This function performs delete vlaidation on return items
     * @param {any} FirstPrimaryItemId
     */
    CustumReturnItemPrimaryDelete: function (FirstPrimaryItemId) {
        if (confirm("Are you sure, Do you want to delete selected records?")) {
            debugger;
            var subgridDeleteMVCURL = Cares_CaresReturnItem.GetConfigurationforReturn("MVCUrl");

            if (subgridDeleteMVCURL !== null) {
                var odataUri = subgridDeleteMVCURL + "Return/DeleteReturnReturnItems?ReturnItemsId=" + FirstPrimaryItemId;

                var returnVal = Cares_CaresReturnItem.retrieveCustomMVCforReturn(odataUri);
                if (returnVal != null && returnVal == "") {
                    Xrm.Utility.alertDialog("Return item successfully deleted.");
                    Xrm.Page.ui.close();
                }
                else {
                    alert("Associated view delete is throwing exception : <br/>" + returnVal);
                }
            }
        }
        return false;
    },
    /**
     * This function performs the delete on return item associated records
     * @param {any} gridControl
     * @param {any} records
     */
    CustumReturnItemAssociatedViewDelete: function (gridControl, records) {
        if (confirm("Are you sure, Do you want to delete selected records?")) {
            debugger;
            var subgridDeleteMVCURL = Cares_CaresReturnItem.GetConfigurationforReturn("MVCUrl");

            if (subgridDeleteMVCURL !== null) {
                var dataToPost = [];

                for (var i = 0; i < records.length; i++) {
                    dataToPost[i] = records[i].Id;
                }

                //var dataToPost = JSON.stringify(operationCollection);

                var odataUri = subgridDeleteMVCURL + "Return/DeleteReturnReturnItems?ReturnItemsId=" + dataToPost;

                var returnVal = Cares_CaresReturnItem.retrieveCustomMVCforReturn(odataUri);
                if (returnVal != null && returnVal == "") {
                    Xrm.Utility.alertDialog("Return item successfully deleted.");
                    gridControl.refresh();
                }
                else {
                    alert("Associated view delete is throwing exception : <br/>" + returnVal);
                }
            }
        }
        return false;

    },
    /**
     * It retrieves the multiple records from MVC
     * @param {any} odataUri
     */
    retrieveCustomMVCforReturn: function (odataUri) {
        var returnValue = null;
        //Asynchronous AJAX function to Retrieve a CRM record using OData
        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            datatype: "json",
            cache: false,
            async: false,
            url: odataUri,
            beforeSend: function (XMLHttpRequest) {
                //Specifying this header ensures that the results will be returned as JSON. 
                XMLHttpRequest.setRequestHeader("Accept", "application/json");
            },
            success: function (data, textStatus, XmlHttpRequest) {
                debugger;
                returnValue = data;
            },
            error: function (XmlHttpRequest, textStatus, errorThrown) {
                debugger;
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
            }
        });

        return returnValue;
    },
    /**
     * This function gets the configuration for returns
     * @param {any} key
     */
    GetConfigurationforReturn: function (key) {
        debugger;
        try {
            var returnValue = Cares_CaresReturnItem.retrieveMultipleCustomforReturn("cares_caresconfigurationSet",
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
     * This function retrieves the multiples records for return
     * @param {any} odataSetName
     * @param {any} filter
     */
    retrieveMultipleCustomforReturn: function (odataSetName, filter) {
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
        var service = Cares_CaresReturnItem.GetRequestObjectforReturn();

        if (service != null) {
            service.open("GET", odataUri, false);
            service.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            service.setRequestHeader("Accept", "application/json, text/javascript, */*");
            service.send(null);
            var retrieved = JSON.parse(service.responseText).d;

            if (retrieved != null && retrieved.results.length > 0) {
                returnValue = retrieved.results;
            }
            else if (retrieved != null) {
                returnValue = retrieved;
            }
        }
        return returnValue;
    },
    /**
     * It gets XMLHttp object
     * */
    GetRequestObjectforReturn: function () {
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
     * It handles the error
     * @param {any} error
     */
    errorHandler: function (error) {
        alert(error.message);
    }

    };
