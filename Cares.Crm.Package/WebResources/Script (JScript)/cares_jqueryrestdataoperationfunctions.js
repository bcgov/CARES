// <snippetJQueryRESTDataOperations.Functions>

//GetGlobalContext function exists in ClientGlobalContext.js.aspx so the
//host HTML page must have a reference to ClientGlobalContext.js.aspx.
var context = Xrm.Page.context;

//Retrieve the server url, which differs on-premise from on-line and 
//shouldn't be hard-coded.
var serverUrl = context.getClientUrl();
if (serverUrl.match(/\/$/)) {
    serverUrl = serverUrl.substring(0, serverUrl.length - 1);
}
//The XRM OData end-point
var ODATA_ENDPOINT = "/XRMServices/2011/OrganizationData.svc/";
var RESULT_DATA = [];
///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     Create a new record
///</summary>
/// <param name="entityObject" type="Object" required="true">
///1: entity - a loose-type object representing an OData entity. any fields
///                 on this object must be camel-cased and named exactly as they 
///                 appear in entity metadata
///</param>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function createRecord(entityObject, odataSetName, successCallback, errorCallback) {
    //entityObject is required
    if (!entityObject) {
        alert("entityObject is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName);
    //Parse the entity object into JSON
    var jsonEntity = window.JSON.stringify(entityObject);

    //Asynchronous AJAX function to Create a CRM record using OData
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        data: jsonEntity,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.             
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                successCallback(data.d, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     retrieve an existing record
///</summary>
/// <param name="id" type="guid" required="true">
///1: id -     the guid (primarykey) of the record to be retrieved
///</param>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function retrieveRecord(id, odataSetName, successCallback, errorCallback) {

    //id is required
    if (!id) {
        alert("record id is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')");
    //Asynchronous AJAX function to Retrieve a CRM record using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.             
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                successCallback(data.d, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     Retrieve multiple records
///</summary>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="filter" type="string">
///1: filter - a string representing the filter that is appended to the odatasetname
///                 of the OData URI.     
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function retrieveMultiple(odataSetName, filter, successCallback, errorCallback) {

    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }

    //Build the URI
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "()");
    //var odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "()";
    //If a filter is supplied, append it to the OData URI
    if (filter) {
        odataUri += filter;
    }

    //Asynchronous AJAX function to Retrieve CRM records using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.             
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                if (data && data.d && data.d.results) {
                    successCallback(data.d.results, textStatus, XmlHttpRequest);
                }
                else if (data && data.d) {
                    successCallback(data.d, textStatus, XmlHttpRequest);
                }
                else {
                    successCallback(data, textStatus, XmlHttpRequest);
                }
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     update an existing record
///</summary>
/// <param name="id" type="guid" required="true">
///1: id -     the guid (primarykey) of the record to be retrieved
///</param>
/// <param name="entityObject" type="Object" required="true">
///1: entity - a loose-type object representing an OData entity. any fields
///                 on this object must be camel-cased and named exactly as they 
///                 appear in entity metadata
///</param>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function updateRecord(id, entityObject, odataSetName, successCallback, errorCallback) {

    //id is required
    if (!id) {
        alert("record id is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    //var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')");
    var odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')";
    //Parse the entity object into JSON
    var jsonEntity = window.JSON.stringify(entityObject);

    //Asynchronous AJAX function to Update a CRM record using OData
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        data: jsonEntity,
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.             
            XMLHttpRequest.setRequestHeader("Accept", "application/json");

            //Specify the HTTP method MERGE to update just the changes you are submitting.             
            XMLHttpRequest.setRequestHeader("X-HTTP-Method", "MERGE");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            //The MERGE does not return any data at all, so we'll add the id 
            //onto the data object so it can be leveraged in a Callback. When data 
            //is used in the callback function, the field will be named generically, "id"
            data = new Object();
            data.id = id;
            if (successCallback) {
                successCallback(data, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     delete an existing record
///</summary>
/// <param name="id" type="guid" required="true">
///1: id -     the guid (primarykey) of the record to be retrieved
///</param>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function deleteRecord(id, odataSetName, successCallback, errorCallback) {
    //id is required
    if (!id) {
        alert("record id is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')");
    //Asynchronous AJAX function to Delete a CRM record using OData
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.                 
            XMLHttpRequest.setRequestHeader("Accept", "application/json");

            //Specify the HTTP method DELETE to perform a delete operation.                 
            XMLHttpRequest.setRequestHeader("X-HTTP-Method", "DELETE");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                successCallback(data.d, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

///<summary>
///A function that will display the error results of an AJAX operation
///</summary>
function errorHandler(xmlHttpRequest, textStatus, errorThrow) {
    alert("Error : " + textStatus + ": " + xmlHttpRequest.statusText);
}

/// 
/// Added function by Jandost
/// on 25-Dec-2011
/// To call RetrieveMultiple function SYNCHRONOUSLY
///
function retrieveMultipleSynchronous(odataSetName, filter, successCallback, errorCallback) {
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    //Build the URI
    var odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "()";

    //If a filter is supplied, append it to the OData URI
    if (filter) {
        odataUri += filter;
    }

    //Asynchronous AJAX function to Retrieve CRM records using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.    
            XMLHttpRequest.open("GET", odataUri, false);
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                if (data && data.d && data.d.results) {
                    successCallback(data.d.results, textStatus, XmlHttpRequest);
                }
                else if (data && data.d) {
                    successCallback(data.d, textStatus, XmlHttpRequest);
                }
                else {
                    successCallback(data, textStatus, XmlHttpRequest);
                }
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

/// 
/// on 19-Feb-2017
/// To call RetrieveMultiple function SYNCHRONOUSLY
/// When Result Fetch Then CRM only give 50 record by default
/// If you Need more then 50 records then use this method
///Before Calling this method you need to set varibale
///RESULT_DATA = []; From calling location bcz if you don't set then records will be Replicate.

function retrieveMultipleSynchronousCustom(odataSetName, filter, successCallback, errorCallback, recordNextUri) {
    //odataSetName is required, i.e. "AccountSet"

    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    //Build the URI
    var odataUri;
    if (recordNextUri) {
        //If record more then 50 then use exsiting URI
        odataUri = recordNextUri;
    }
    else {

        odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "()";
    }

    //If a filter is supplied, append it to the OData URI
    if (filter) {
        odataUri += filter;
    }

    //Asynchronous AJAX function to Retrieve CRM records using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.    
            XMLHttpRequest.open("GET", odataUri, false);
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                if (data && data.d && data.d.results) {

                    AddResultToArray(data.d.results);
                    if (data.d.__next != null) {//check if next record exist
                        var url = data.d.__next;
                        retrieveMultipleSynchronousCustom(odataSetName, null, successCallback, errorCallback, url);
                    }
                    else {
                        successCallback(RESULT_DATA, textStatus, XmlHttpRequest);
                    }
                }
                else if (data && data.d) {
                    successCallback(data.d, textStatus, XmlHttpRequest);
                }
                else {
                    successCallback(data, textStatus, XmlHttpRequest);
                }
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

function AddResultToArray(records) {
    for (var i = 0; i < records.length; i++) {
        RESULT_DATA.push(records[i]);
    }
}

function retrieveMultipleCustom(odataSetName, filter) {
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
    var service = GetRequestObject();

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
}

function GetRequestObject() {
    if (window.XMLHttpRequest) {
        return new window.XMLHttpRequest;
    } else {
        try {
            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
        } catch (ex) {
            return null;
        } // End catch
    } // End if
}

/// 
/// Added function by Jandost
/// on 25-Dec-2011
/// To call RetrieveMultiple function SYNCHRONOUSLY
///
function retrieveMultipleCustom_v8(odataSetName, filter) {
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }

    var returnValue = null;
    //Build the URI
    //var odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "()";
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "()");

    //If a filter is supplied, append it to the OData URI
    if (filter) {
        odataUri += filter;
    }

    //Asynchronous AJAX function to Retrieve CRM records using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        async: false,
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.
            //Modified by Furqan Safdar 
            //To support different jQuery versions 1.4.x and above 1.5, since JSVF is using 1.7.2
            if (typeof XMLHttpRequest.open !== 'undefined') {
                XMLHttpRequest.open("GET", odataUri, false);
            }
            else {
                var jqXHR = jQuery.ajaxSettings.xhr();
                if (jqXHR instanceof window.XMLHttpRequest) {
                    jqXHR.open("GET", odataUri, false);
                }
            }
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (data && data.d && data.d.results) {
                returnValue = data.d.results;
            }
            else if (data && data.d) {
                returnValue = data.d;
            }
            else {
                returnValue = data;
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {

            // if (errorCallback)
            //     errorCallback(XmlHttpRequest, textStatus, errorThrown);
            // else
            //     errorHandler(XmlHttpRequest, textStatus, errorThrown);
            alert("Failure: status = " + textStatus + " || errorThrown = " + errorThrown + " || XmlHttpRequest = " + XmlHttpRequest);
        }
    });

    return returnValue;
}

///<summary>
///Uses jQuery's AJAX object to call the Microsoft Dynamics CRM OData endpoint to
///     retrieve an existing record
///</summary>
/// <param name="id" type="guid" required="true">
///1: id -     the guid (primarykey) of the record to be retrieved
///</param>
/// <param name="odataSetName" type="string" required="true">
///1: set -    a string representing an OData Set. OData provides uri access
///                 to any CRM entity collection. examples: AccountSet, ContactSet,
///                 OpportunitySet. 
///</param>
/// <param name="successCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon success
///                 of the ajax invocation.
///</param>
/// <param name="errorCallback" type="function" >
///1: callback-a function that can be supplied as a callback upon error
///                 of the ajax invocation.
///</param>
function retrieveRecordCustom(id, odataSetName) {
    //id is required
    if (!id) {
        alert("record id is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }
    var returnValue = null;
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')");
    //Asynchronous AJAX function to Retrieve a CRM record using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        async: false,
        url: odataUri,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON. 
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (data && data.d && data.d.results) {
                returnValue = data.d.results;
            }
            else if (data && data.d) {
                returnValue = data.d;
            }
            else {
                returnValue = data;
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });

    return returnValue;
}

///Function to get Configuration value by Key
function GetConfiguration(key) {
    try {
        var returnValue = retrieveMultipleCustom("cares_caresconfigurationSet",
            "?$select=cares_Value&$filter=cares_key eq '" + key + "'");
        if (returnValue != null && returnValue.length > 0) {
            return returnValue[0].cares_Value;
        }
        alert("Unable to find key(" + key + ") value in the configuration.");
    } catch (ex) {
        alert(ex.message);
    }
    return null;
}

///Function to get key & value by key from the CARES CONFIGURATION entity.
function GetCARESConfigurationRecord(key) {
    try {
        var returnValue = retrieveMultipleCustom("cares_caresconfigurationSet",
            "?$select=cares_Value,cares_caresconfigurationId&$filter=cares_key eq '" + key + "'"); //,cares_caresconfigurationid
        if (returnValue != null && returnValue.length > 0) {
            return returnValue;
        }
        alert("Unable to find key(" + key + ") value in the configuration.");
    } catch (ex) {
        alert(ex.message);
    }
    return null;
}

function retrieveCustomMVC(odataUri) {
    var returnValue = null;
    //Asynchronous AJAX function to Retrieve a CRM record using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        cache: false,
        async: false,
        url: odataUri,
        crossOrigin: true,
        crossDomain: true,
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
}

/// 
/// Added function by Kursat
/// on 03-April-2012
/// To call Create function SYNCHRONOUSLY
///

function createRecordSynchronous(entityObject, odataSetName, successCallback, errorCallback) {

    //entityObject is required
    if (!entityObject) {
        alert("entityObject is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }

    //Build the URI
    // var odataUri = serverUrl + ODATA_ENDPOINT + "/" + odataSetName;
    var odataUri = context.prependOrgName(ODATA_ENDPOINT + "/" + odataSetName);
    //Parse the entity object into JSON
    var jsonEntity = window.JSON.stringify(entityObject);

    //Asynchronous AJAX function to Create a CRM record using OData
    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: odataUri,
        data: jsonEntity,
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.                
            XMLHttpRequest.open("POST", odataUri, false);
            XMLHttpRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                successCallback(data.d, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

//This empty method is just to load this JS file in case other JS files depend on it.
function init0() {

}