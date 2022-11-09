/*
	Dependencies: 'cares_jqueryrestdataoperationfunctions' webresource
*/

if (typeof (Cares_CaresProduct) == "undefined") { Cares_CaresProduct = { __namespace: true }; }

Cares_CaresProduct =
    {
    /**
     * This function checks the enable rule for products
     * */
        EnableRuleForProductManualRefresh: function () {
            //Get Login user Roles
        var userRoles = Xrm.Page.context.getUserRoles();
        debugger;
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
     * This function refreshes the product catalog
     * */
        RefreshCatalog: function () {
            debugger;
            var productManualRefreshStatusEntRecord = GetCARESConfigurationRecord("ProductManualRefreshStatus");
            var productManualRefreshStatus = productManualRefreshStatusEntRecord[0].cares_Value;
            var productManualRefreshStatusGuid = productManualRefreshStatusEntRecord[0].cares_caresconfigurationId;
			if(productManualRefreshStatus == 'InProgress')
			{
				alert("'Refresh Catalog' process is in progress.");
				
			}
			else if(productManualRefreshStatus != 'Requested')
            {
                Cares_CaresProduct.UpdateProductManualRefreshStatusToRequested(productManualRefreshStatusGuid);
			}
            else{
				alert("'Refresh Catalog' request has already been submitted.");
			}
        },
    /**
     * This function updates the products refresh status
     * @param {any} id
     */
        UpdateProductManualRefreshStatusToRequested: function (id) {
            //Update Expiry and Call Allotment
            var item = new Object();
            item.cares_Value = 'Requested';
            SDK.REST.updateRecord(id, item, 'cares_caresconfiguration',
                function () {
                    alert("'Refresh Catalog' request has been submitted successfully. You will receive a notitication email when the process is completed.");
                },
                Cares_CaresProduct.errorHandler
            );
        },
        /**
         * This function handles the error exception
         * @param {any} error
         */
        errorHandler: function (error) {
            alert(error.message);
        },

    };
