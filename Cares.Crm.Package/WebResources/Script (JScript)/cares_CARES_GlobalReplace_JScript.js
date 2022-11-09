if (typeof (Cares_GlobalReplace) == "undefined") { Cares_GlobalReplace = { __namespace: true }; }

Cares_GlobalReplace =
    {
    /**
     * This method sets the custom view for grid
     * @param {any} gridTypeCode
     * @param {any} gridControl
     */
        ConfigureCustomViewforProgramGrid: function (gridTypeCode, gridControl) {
            debugger;

            if (Xrm.Page.getAttribute("cares_producttoreplace") == null || Xrm.Page.getAttribute("cares_producttoreplace").getValue() == null) {
                alert("Please select Product to Replace.");
                return;
            }
            var entityParentName = "cares_globalreplace";

            // use randomly generated GUID Id for our new view      
            var viewId = "{6fd72744-3676-41d4-8003-ae4cde9ac282}";
            var entityRelatedName = "cares_program";
            var viewDisplayName = "Filtered Program View";

            var subgridName = "subgrid_SelectedPrograms";

            var fetchXml = Cares_GlobalReplace.GetFilteredProgramFetchXML(); //replace this to your own fetch xml

            // build Grid Layout     
            var layoutXml = Cares_GlobalReplace.GetFilteredProgramLayoutXML(); //replace this to your own layout example

            if (fetchXml != null) {
                Cares_GlobalReplace.filterSubgrid(gridTypeCode, gridControl, entityParentName, subgridName, viewId, entityRelatedName, viewDisplayName, fetchXml, layoutXml);
            }
        },

    /**
     * This function adds Existing-Sub-grid
     * @param {any} gridTypeCode
     * @param {any} gridControl
     * @param {any} entityParentName
     * @param {any} subgridName
     * @param {any} viewId
     * @param {any} entityRelatedName
     * @param {any} viewDisplayName
     * @param {any} fetchXML
     * @param {any} layoutXML
     */
        filterSubgrid: function (gridTypeCode, gridControl, entityParentName, subgridName, viewId, entityRelatedName, viewDisplayName, fetchXML, layoutXML) {
            debugger;
            var AGS = window["AGS"] || {};

            AGS.AddExistingSubgrid = function (gridTypeCode, gridControl) {
                debugger;
                try {
                    var crmWindow = Xrm.Internal.isTurboForm() ? parent.window : window;
                    crmWindow.Mscrm.GridRibbonActions.addExistingFromSubGridAssociated(gridTypeCode, gridControl);
                    if (Xrm.Page.data.entity.getEntityName() == entityParentName &&
                        //gridTypeCode == 2 &&
                        typeof gridControl['get_viewTitle'] == 'function') {
                        var lookupExistingFieldName = 'lookup_' + subgridName + "_i";
                        var inlineBehaviour = crmWindow.document.getElementById(lookupExistingFieldName).InlinePresenceLookupUIBehavior;
                        Cares_GlobalReplace.setLookupCustomView(inlineBehaviour, viewId, entityRelatedName, viewDisplayName, fetchXML, layoutXML);
                    }
                }
                catch (err) {
                    var msg = err.message;
                }
            };

            this.AGS = AGS;
            //call this function;
            AGS.AddExistingSubgrid(gridTypeCode, gridControl);
        },
/**
 * This function sets custom lookup for the grid view
 * @param {any} lookupFieldControl
 * @param {any} viewId
 * @param {any} entityRelatedName
 * @param {any} viewDisplayName
 * @param {any} fetchXML
 * @param {any} layoutXML
 */
        setLookupCustomView: function (lookupFieldControl, viewId, entityRelatedName, viewDisplayName, fetchXML, layoutXML) {
            debugger;
            // add the Custom View to the primary contact lookup control      
            lookupFieldControl.AddCustomView(viewId, entityRelatedName, viewDisplayName, fetchXML, layoutXML, true);
        },
/**
 * This function sets the filter for sub grid view
 * */
        GetFilteredProgramFetchXML: function () {
            var fetchXml = "";
            var gender = 3;
            if (Xrm.Page.getAttribute("cares_gender") != null && Xrm.Page.getAttribute("cares_gender").getValue() != null)
                gender = Xrm.Page.getAttribute("cares_gender").getValue();

            var nName = Xrm.Page.getAttribute("cares_producttoreplace").getValue()[0].name;

            //nName = nName.trim();
           // nName = nName.replace(/\s/g, "");
           // nName = nName.replace(new RegExp('\'', 'g'), '');
          //  nName = nName.replace(new RegExp('\"', 'g'), '');

            fetchXml = "<fetch distinct='true' mapping='logical' output-format='xml - platform' version='1.0'>";
            fetchXml = fetchXml + "<entity name='cares_program'>";
            fetchXml = fetchXml + "<attribute name='cares_name' />";
            fetchXml = fetchXml + "<attribute name='createdon' />";
            fetchXml = fetchXml + "<attribute name='cares_fullname' />";
            fetchXml = fetchXml + "<attribute name='cares_renewalrule' />";
            fetchXml = fetchXml + "<attribute name='cares_mcfd' />";
            fetchXml = fetchXml + "<attribute name='cares_expiryrule' />";
            fetchXml = fetchXml + "<attribute name='cares_programid' />";
            fetchXml = fetchXml + "<attribute name='statecode' />";
            fetchXml = fetchXml + "<order descending='false' attribute='cares_name' />";
            fetchXml = fetchXml + "<link-entity name='cares_approval' alias='ae' to='cares_programid' from='cares_programid'>";
            fetchXml = fetchXml + "<filter type='and'>";
            fetchXml = fetchXml + "<condition attribute='statuscode' value='2' operator='ne' /></filter>";
            fetchXml = fetchXml + "<link-entity name='cares_approvalitem' alias='af' to='cares_approvalid' from='cares_approval'>";
            fetchXml = fetchXml + "<filter type='and'>";
            //fetchXml = fetchXml + "<condition attribute='cares_productid' value='" + Xrm.Page.getAttribute("cares_producttoreplace").getValue()[0].id + "' uitype='product' uiname='" + nName + "' operator='eq' />";
            fetchXml = fetchXml + "<condition attribute='cares_productid' value='" + Xrm.Page.getAttribute("cares_producttoreplace").getValue()[0].id + "' uitype='product' operator='eq' />";
            if (gender !== 3) {
                fetchXml = fetchXml + "</filter></link-entity>";
                fetchXml = fetchXml + "<link-entity name='contact' alias='aq' to='cares_contactid' from='contactid'>";
                fetchXml = fetchXml + "<filter type='and'>";
                fetchXml = fetchXml + "<condition attribute='gendercode' value='" + gender + "' operator='eq' />";
            }
            fetchXml = fetchXml + "</filter></link-entity></link-entity></entity></fetch >";

            
            

            return fetchXml;
        },
/**
 * This function sets the layout
 * */
        GetFilteredProgramLayoutXML: function () {
            var layoutXml = "<grid name='resultset' object='10014' jump='cares_name' select='1' icon='1' preview='1'>";
            layoutXml = layoutXml + "<row name='result' id='cares_programid' >";
            layoutXml = layoutXml + "<cell name='cares_name' width='80' />";
            layoutXml = layoutXml + "<cell name='cares_fullname' width='150' />";
            layoutXml = layoutXml + "<cell name='cares_mcfd' width='80' />";
            layoutXml = layoutXml + "<cell name='cares_renewalrule' width='80' />";
            layoutXml = layoutXml + "<cell name='cares_expiryrule' width='80' />";
            layoutXml = layoutXml + "<cell name='statecode' width='80' />";
            layoutXml = layoutXml + "<cell name='createdon' width='80' /></row ></grid>";

            return layoutXml;
        },
/**
 * This function performs the preview functionality on global replace
 * */
        CallOnPreview: function () {
            debugger;
            if (Cares_GlobalReplace.ValidateSearchCriteria() === true) {
                if (Xrm.Page.getAttribute("cares_allprogram").getValue() == false && Xrm.Page.getControl("subgrid_SelectedPrograms") != null) {
                    var gridCount = Xrm.Page.getControl("subgrid_SelectedPrograms").getGrid().getTotalRecordCount();
                    if (gridCount <= 0) {
                        alert("If All Programs = No then at least one Selected Program must be included to complete this action");
                        return;
                    }
                }

                var MVCURL = GetConfiguration("MVCUrl");
                if (MVCURL !== null) {
                    Xrm.Page.data.entity.save();
                    var previewUrl = MVCURL + "Approval/GetGlobalReplacePreview?producttoReplaceId=" + Xrm.Page.getAttribute("cares_producttoreplace").getValue()[0].id + "&newProductId=" + Xrm.Page.getAttribute("cares_replacementproduct").getValue()[0].id + "&gender=" + Xrm.Page.getAttribute("cares_gender").getValue() + "&globalReplaceName=" + Xrm.Page.getAttribute("cares_name").getValue() + "&isSelectAll=" + Xrm.Page.getAttribute("cares_allprogram").getValue() + "&globalReplaceId=" + Xrm.Page.data.entity.getId() + "&userId=" + Xrm.Page.context.getUserId();
                    window.location.href = previewUrl;
                }
            }
        },
/**
 * This function sets the enable rule for preview button
 * */
        EnableRulePreview: function () {
            debugger;
            var stateCode = Xrm.Page.getControl("header_statecode").getAttribute().getValue();
            if (stateCode === 1)
                return false;
            else
                return true;
        },
/**
 * This function runs the substitute functionality
 * */
        CallOnProceed: function () {
            debugger;
            if (Cares_GlobalReplace.ValidateSearchCriteria() === true) {
                if (Xrm.Page.getAttribute("cares_allprogram").getValue() == false && Xrm.Page.getControl("subgrid_SelectedPrograms") != null) {
                    var gridCount = Xrm.Page.getControl("subgrid_SelectedPrograms").getGrid().getTotalRecordCount();
                    if (gridCount <= 0) {
                        alert("If All Programs = No then at least one Selected Program must be included to complete this action");
                        return;
                    }
                }

                Xrm.Utility.confirmDialog("This will execute a substitute for every Approval matching the selected criteria. Do you wish to continue?",
                    function () {
                        debugger;
                        var MVCURL = GetConfiguration("MVCUrl");
                        if (MVCURL !== null) {
                            var odataUri = MVCURL + "Approval/ExecuteGlobalReplace?globalReplaceId=" + Xrm.Page.data.entity.getId() + "&globalReplaceName=" + Xrm.Page.getAttribute("cares_name").getValue() + "&producttoReplaceId=" + Xrm.Page.getAttribute("cares_producttoreplace").getValue()[0].id + "&newProductId=" + Xrm.Page.getAttribute("cares_replacementproduct").getValue()[0].id + "&newProductName=" + Xrm.Page.getAttribute("cares_replacementproduct").getValue()[0].name + "&gender=" + Xrm.Page.getAttribute("cares_gender").getValue() + "&isSelectAll=" + Xrm.Page.getAttribute("cares_allprogram").getValue() + "&userId=" + Xrm.Page.context.getUserId();
                            var returnVal = retrieveCustomMVC(odataUri);
                            if (returnVal == "ExecuteGlobalReplaceDone") {
                                alert("Global Replace execution is done.");
                                Xrm.Utility.openEntityForm(Xrm.Page.data.entity.getEntityName(), Xrm.Page.data.entity.getId());
                            }
                        }
                    },
                    function () { }
                );
            }
        },
/**
 * This function validates the search criteria
 * */
        ValidateSearchCriteria: function () {
            if (Xrm.Page.getAttribute("cares_producttoreplace") == null || Xrm.Page.getAttribute("cares_producttoreplace").getValue() == null) {
                alert("Please select Product to Replace.");
                return false;
            }
            else if (Xrm.Page.getAttribute("cares_replacementproduct") == null || Xrm.Page.getAttribute("cares_replacementproduct").getValue() == null) {
                alert("Please select Replacement Product.");
                return false;
            }
            else if (Xrm.Page.getAttribute("cares_gender") != null && Xrm.Page.getAttribute("cares_gender").getValue() == null) {
                alert("Please select gender");
                return false;
            }
            else if (Xrm.Page.getAttribute("cares_allprogram") != null && Xrm.Page.getAttribute("cares_allprogram").getValue() == null) {
                alert("Please select value of All Program");
                return false;
            }
            else if (Xrm.Page.getAttribute("cares_allprogram").getValue() == true && Xrm.Page.getControl("subgrid_SelectedPrograms") != null) {
                var gridCount = Xrm.Page.getControl("subgrid_SelectedPrograms").getGrid().getTotalRecordCount();
                if (gridCount > 0) {
                    alert("If All Programs = Yes then there should be no Selected Program records added. Please either delete the Selected Programs or change the All Programs value to No.");
                    return false;
                }
            }
            return true;
        },
/**
 * This function validates the record relationship on global replace
 * */
        EnableDisableManyToManyRemove: function () {
            debugger;
            var stateCode = Xrm.Page.getControl("header_statecode").getAttribute().getValue();
            if (stateCode === 1) {
                alert("You can not delete this relationship because Global Replace record is Inactive.");
                return true;
            }
            else
                return false;
        },

    };