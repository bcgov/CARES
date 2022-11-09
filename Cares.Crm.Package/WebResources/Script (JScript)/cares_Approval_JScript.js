if (typeof(Cares_Approval) === "undefined") { Cares_Approval = { __namespace: true }; }
Cares_Approval = {
    currentProgram: null,
    Approval_program: null,
    /**
     * This method sets required fields on form load
     * */
    SetFieldsRequiredLevelonLoad: function() {
        if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
            var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;

            //var program = retrieveRecordCustom(_id, "cares_programSet");
            //if (program != null && program != undefined) {
            //    Cares_Approval.CheckFieldValueAndSetRequiredLevel(program);
            //}
            SDK.REST.retrieveRecord(
                _id,
                "cares_program",
                null,
                null,
                function(_program) {
                    var formType = Xrm.Page.ui.getFormType();
                    Cares_Approval.SetRequiredLevelonFields(_program);
                    Cares_Approval.CalulatingExpiryDateRemaingDays();

                    if (formType === 1) {
                        Cares_Approval.SetEndDateValueAccordingtoExpiryRule(_program, true);
                        Cares_Approval.CalculateEndDateFromAgeOut(_program);
                    } else {
                        Cares_Approval.SetEndDateValueAccordingtoExpiryRule(_program, false);

                        if (formType == 2 && Xrm.Page.getAttribute("statecode").getValue() == 0 && _program.statecode.Value == 0) {
                            if (Cares_Approval.ifRoleIsPDCAdminMCFD() == true && (_program.cares_name === 'AM' || _program.cares_name === 'CS')) {
                                Xrm.Page.getControl("cares_programid").setDisabled(false);
                                currentProgram = _program;
                            }
                        }

                    }
                    Approval_program = _program;
                },
                Cares_Approval.errorHandler
            );
        }
        Cares_Approval.ValidateifUserHasSAPProcessingTeam();
        Xrm.Page.RefreshSubGridFromMVC = Cares_Approval.RefreshSubGridFromMVC;

        var tab = Xrm.Page.ui.tabs.get("tab_7");
        var section = tab.sections.get("tab_7_section_1");

        if (Cares_Approval.ifRoleIsPDCAdminOrAdmin() == true) {

            tab.setVisible(true);
        } else {
            tab.setVisible(false);
        }
    },
    /**
     * This function checks the total number of approval letters on load to determine whether to disable the add button or not. Sub grids are
     * loaded async so we have to set a timeout. Ideally this would be done through Ribbon Workbench
     */
    ApprovalLetterCreated: function () {
        var addButton = null;

        var interval = setInterval(function () {
            var count = Xrm.Page.getControl("ApprovalLettersSubGrid").getGrid().getTotalRecordCount();
            addButton = parent.document.getElementById("ApprovalLettersSubGrid_addImageButton");
            if (count > 0 && addButton != null) {
                addButton.style.display = 'none';
                clearInterval(interval);
            }
        }, 2000)
    },

    /**
     * This method changes the document title on load, only executes if sap number exists
     * */
    SetDocumentTitleOnLoad: function() {
        if (Xrm.Page.getAttribute("cares_sapnumber") !== null && Xrm.Page.getAttribute("cares_sapnumber").getValue() !== null &&
            Xrm.Page.getAttribute("cares_sapnumber").getValue() !== undefined) {
            top.window.document.title = "SAP #: " + Xrm.Page.getAttribute("cares_sapnumber").getValue();
        }
    },

    /**
     * This method opens a report with the corresponding SAP number
     * */
    OpenReportOnClick: function () {
        var sapNum = Xrm.Page.getAttribute("cares_sapnumber").getValue();
        var currentUrl = window.location.href;
        var reportProdUrl = "https://citz.reporting.dynamics.app.im.gov.bc.ca/Reports_DYNAMICSPRD16/report/ClientSupplyList?SAPNumber=";
        var reportDevUrl = "https://reporting.dynamics.app.im.gov.bc.ca/Reports_DYNAMICSTST16/report/ClientSupplyListDEV?SAPNumber=";
        if (sapNum !== null) {
            if (currentUrl.match(/cares-dev/gi) || currentUrl.match(/cares-test/gi)) {
                window.open(reportDevUrl + sapNum, "_blank").focus();
            } else if (currentUrl.match(/citz.dynamics.app.im.gov.bc.ca/gi)) {
                window.open(reportProdUrl + sapNum, "_blank").focus();
            } else {
                alert("Supply List is not supported in this environment.");
            }
        } else {
            alert("Report cannot be generated for approvals without an SAP number.");
        }   
    },

    /**
     * This method validates programId on change
     * */
    SetFieldsRequiredLevelonChange: function() {
        if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
            var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;

            SDK.REST.retrieveRecord(
                _id,
                "cares_program",
                null,
                null,
                function(_program) {
                    Cares_Approval.SetRequiredLevelonFields(_program);
                    Cares_Approval.SetEndDateValueAccordingtoExpiryRule(_program, true);
                    Cares_Approval.CalculateEndDateFromAgeOut(_program);
                    Cares_Approval.CalulatingExpiryDateRemaingDays();
                    // Program Change //
                    var formType = Xrm.Page.ui.getFormType();
                    if (formType == 2) {
                        Xrm.Page.getControl("cares_programid").clearNotification("1110");
                        if (_program.statecode.Value != 0) {
                            Xrm.Page.getControl("cares_programid").setNotification("The new program should be active.", '1110');
                            return;
                        }
                        if (!_program.cares_name.includes('AM') && !_program.cares_name.includes('CS')) {
                            Xrm.Page.getControl("cares_programid").setNotification("The new program should have AM or CS shortname.", '1110');
                            return;
                        }
                        if (!_program.cares_MCFD) {
                            Xrm.Page.getControl("cares_programid").setNotification("The new program should have MCFD check true.", '1110');
                            return;
                        }
                        if (currentProgram.cares_RenewalRule.Value != _program.cares_RenewalRule.Value) {
                            Xrm.Page.getControl("cares_programid").setNotification("The renewal rule for current and newly selected program is different", '1110');
                            return;
                        }
                        if (currentProgram.cares_ExpiryRule.Value != _program.cares_ExpiryRule.Value) {
                            Xrm.Page.getControl("cares_programid").setNotification("The expiry rule for current and newly selected program is different", '1110');
                            return;
                        }

                    }
                    // Program Change //
                },
                Cares_Approval.errorHandler
            );
        }
    },
    /**
     * This method sets the required level of end date ,sin and file-number
     * @param {any} _program
     */
    SetRequiredLevelonFields: function(_program) {
        if ((_program.cares_EndDate !== null && _program.cares_EndDate !== undefined &&
                _program.cares_EndDate === true) || (_program.cares_ExpiryRule !== null && _program.cares_ExpiryRule.Value === 750760000)) {
            Xrm.Page.getAttribute("cares_enddate").setRequiredLevel("required");
        } else {
            Xrm.Page.getAttribute("cares_enddate").setRequiredLevel("none");
        }
        if (_program.cares_PHN !== null && _program.cares_PHN !== undefined &&
            _program.cares_PHN === true) {
            Xrm.Page.getAttribute("cares_phnsin").setRequiredLevel("required");
        } else {
            Xrm.Page.getAttribute("cares_phnsin").setRequiredLevel("none");
        }
        if (_program.cares_FileNumber !== null && _program.cares_FileNumber !== undefined &&
            _program.cares_FileNumber === true) {
            Xrm.Page.getAttribute("cares_filenumber").setRequiredLevel("required");
        } else {
            Xrm.Page.getAttribute("cares_filenumber").setRequiredLevel("none");
        }
    },
    /**
     * Sets end date based on expiry rule
     * @param {any} _program
     * @param {any} IsSetEndDateNull
     */
    SetEndDateValueAccordingtoExpiryRule: function(_program, IsSetEndDateNull) {
        if (_program.cares_ExpiryRule !== null && _program.cares_ExpiryRule.Value === 750760002) {
            Xrm.Page.getAttribute("cares_enddate").setRequiredLevel("none");
            Xrm.Page.getAttribute("cares_enddate").setValue(null);
            Xrm.Page.getControl("cares_enddate").setVisible(false);
        } else {
            Xrm.Page.getControl("cares_enddate").setVisible(true);
            if (IsSetEndDateNull === true) {
                Xrm.Page.getAttribute("cares_enddate").setValue(null);
            }
            if (Cares_Approval.CheckDatesToEnable() == false && Xrm.Page.getAttribute("statecode").getValue() == 0) {
                Xrm.Page.getControl("cares_enddate").setDisabled(false);
            }
        }
    },
    /**
     * Calculates the end date from ageout rule
     * @param {any} _program
     */
    CalculateEndDateFromAgeOut: function(_program) {
        Xrm.Page.getControl("cares_enddate").clearNotification("8001");
        if (_program.cares_ExpiryRule !== null && _program.cares_ExpiryRule !== undefined &&
            _program.cares_ExpiryRule.Value === 750760001 && _program.cares_AgeOutYear !== null && _program.cares_AgeOutYear !== undefined) {
            if (Xrm.Page.getAttribute("cares_contactid") !== null && Xrm.Page.getAttribute("cares_contactid").getValue() !== null &&
                Xrm.Page.getAttribute("cares_contactid").getValue() !== undefined) {
                var _ContactId = Xrm.Page.getAttribute("cares_contactid").getValue()[0].id;
                var _Contact = retrieveRecordCustom(_ContactId, "ContactSet");
                if (_Contact !== null && _Contact !== undefined) {
                    try {
                        var dateofBirth = Cares_Approval.HandleoDataDate(_Contact.BirthDate);
                        var BirthDateYear = dateofBirth === null ? 0 : dateofBirth.getFullYear();

                        var BirthDateMonth = dateofBirth === null ? 0 : dateofBirth.getMonth() + 1;

                        var BirthDateDay = dateofBirth === null ? 0 : dateofBirth.getDate();

                        var EndDateYear = BirthDateYear + _program.cares_AgeOutYear;

                        if (BirthDateYear > 0 && BirthDateMonth > 0 && BirthDateDay > 0) {
                            if (BirthDateMonth == 2 && BirthDateDay == 29) {
                                if ((EndDateYear % 4 == 0 && EndDateYear % 100 != 0) || EndDateYear % 400 == 0) {} else {
                                    BirthDateDay = 28;
                                }
                            }
                            var newDate = EndDateYear + '/' + BirthDateMonth + '/' + BirthDateDay;
                            var endDate = new Date(EndDateYear, BirthDateMonth - 1, BirthDateDay, 0, 0, 0);
                            Xrm.Page.getAttribute("cares_enddate").setValue(endDate);
                            Xrm.Page.getControl("cares_enddate").setDisabled(true);
                            var todayDate = new Date();
                            if (todayDate >= endDate) {
                                alert("The Contacts Birth Date is greater than the Age Out value for the selected Program");
                                Xrm.Page.getControl("cares_enddate").setNotification("The Contacts Birth Date is greater than the Age Out value for the selected Program", "8001");
                            }
                        }
                    } catch (ex) { alert(ex.message); }
                }
            }
            //End Date Should be Read only if Expiry Rule is Aging Out
            Xrm.Page.getControl("cares_enddate").setDisabled(true);
        }
    },
    /**
     * Mark all fields readonly
     * */
    MarkAllFieldsReadOnly: function() {
        Xrm.Page.ui.controls.forEach(function(control, index) {
            try {
                control.setDisabled(true);
            } catch (e) {
                alert(e.message);
            }
        });
    },
    /**
     * Validates form field on save
     * @param {any} context
     */
    ValidateFormonSave: function(context) {
        try {
            var formType = Xrm.Page.ui.getFormType();
            if (formType === 1) {
                var expiryDate = new Date(Xrm.Page.getAttribute("cares_enddate").getValue());
                var todayDate = new Date();
                if (expiryDate < todayDate) {
                    context.getEventArgs().preventDefault();
                }
            }
        } catch (ex) {
            alert(ex.message);
        }

        Cares_Approval.DisableFormFieldsOnSave();
    },
    /**
     * Disbales form fields on save
     * @param {any} context
     */
    DisableFormFieldsOnSave: function(context) {
        //Cares_Approval.SetDirtyFieldsSubmitNever();
        //Xrm.Page.data.refresh(false);
        var formType = Xrm.Page.ui.getFormType();
        Xrm.Page.ui.clearFormNotification("9002");
        if (Xrm.Page.getAttribute("cares_enddate") !== null &&
            Xrm.Page.getAttribute("cares_enddate").getValue() !== null) {
            if (formType === 1) {
                var todayDate = new Date();
                var endDate = new Date(Xrm.Page.getAttribute("cares_enddate").getValue());
                if (endDate < todayDate) {
                    //Cares_Approval.MarkAllFieldsReadOnly();
                    Xrm.Page.ui.setFormNotification("PROGRAM HAS EXPIRED ALREADY, YOU CAN NOT SAVE THIS APPROVAL.",
                        "ERROR",
                        "9002");
                    context.getEventArgs().preventDefault();
                    return;
                }
            }
        }

        if (Xrm.Page.getAttribute("cares_contactid") !== null &&
            Xrm.Page.getAttribute("cares_contactid").getValue() !== null && Xrm.Page.getAttribute("cares_programid") !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== null) {
            Xrm.Page.getControl("cares_contactid").setDisabled(true);
            Xrm.Page.getControl("cares_programid").setDisabled(true);
        }
    },
    /**
     * Disables field on load of form
     * */
    DisableFormFieldsOnLoad: function() {

        var formType = Xrm.Page.ui.getFormType();
        if (formType === 2) {
            if (Xrm.Page.getAttribute("cares_contactid") !== null &&
                Xrm.Page.getAttribute("cares_contactid").getValue() !== null &&
                Xrm.Page.getAttribute("cares_programid") !== null &&
                Xrm.Page.getAttribute("cares_programid").getValue() !== null) {
                Xrm.Page.getControl("cares_contactid").setDisabled(true);
                Xrm.Page.getControl("cares_programid").setDisabled(true);
            }
        }


    },
    /**
     * Disables field for PDC clerk
     * */
    DisableFieldsForPDCClerk: function() {
        if (Cares_Approval.CheckDatesToEnable() == true) {
            Xrm.Page.getControl("cares_startdate").setDisabled(true);
            Xrm.Page.getControl("cares_enddate").setDisabled(true);
        }
    },
    /**
     * Checks date to enable
     * */
    CheckDatesToEnable: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType === 2) {
            var ownerValue = Xrm.Page.getAttribute("ownerid").getValue();
            var userRoles = Xrm.Page.context.getUserRoles();
            if (userRoles != null && userRoles != undefined && ownerValue != null && ownerValue != undefined) {
                for (var i = 0; i < userRoles.length; i++) {
                    var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                    if (role != null) {
                        if (role.Name.indexOf("PDC Clerk") > -1 && ownerValue[0].name == "MCFD") {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },
    /**
     * Set dirty field on submit
     * */
    SetDirtyFieldsSubmitNever: function() {
        var attributes = Xrm.Page.data.entity.attributes.get();
        for (var i in attributes) {
            if (attributes[i].getIsDirty()) {
                attributes[i].setSubmitMode("always");
            } else {
                attributes[i].setSubmitMode("never");
            }
        }
    },
    /**
     * Handles date in javascript
     * @param {any} dateValue
     */
    HandleoDataDate: function(dateValue) {
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
        } catch (Exception) { alert(Exception.message); }
        return returnDate;
    },
    /**
     * Claculates remaining days
     * */
    CalulatingExpiryDateRemaingDays: function() {
        var formType = Xrm.Page.ui.getFormType();
        Xrm.Page.ui.clearFormNotification("9000");
        Xrm.Page.ui.clearFormNotification("9001");
        Xrm.Page.ui.clearFormNotification("9002");
        Xrm.Page.ui.clearFormNotification("9101");
        var one_day = 1000 * 60 * 60 * 24; // Convert both dates to milliseconds

        if (Xrm.Page.getAttribute("cares_enddate") !== null &&
            Xrm.Page.getAttribute("cares_enddate").getValue() !== null) {
            var todayDateTime = new Date();
            var todayDate = new Date(todayDateTime.getFullYear(), todayDateTime.getMonth(), todayDateTime.getDate(), 0, 0, 0);

            if (formType === 1) {

                //todayDate = new Date();
                var endDateTime = new Date(Xrm.Page.getAttribute("cares_enddate").getValue());

                var endDate = new Date(endDateTime.setFullYear(), endDateTime.setMonth(), endDateTime.setDate(), 0, 0, 0);

                if (endDate < todayDate) {
                    Xrm.Page.ui.setFormNotification("PROGRAM HAS EXPIRED ALREADY, YOU CAN NOT SAVE THIS APPROVAL.",
                        "ERROR",
                        "9002");
                }
            } else {
                //var expiryDate = new Date(Xrm.Page.getAttribute("cares_enddate").getValue()).getTime();
                //todayDate = new Date().getTime();
                //var remainingDays = expiryDate - todayDate;
                //remainingDays = Math.round(remainingDays / one_day);

                ////Check if Approval Expires in 90 days then display message
                //if (remainingDays >= 0 && remainingDays < 90) {
                //    Xrm.Page.ui.setFormNotification("PROGRAM EXPIRES in " + remainingDays + " days!!", "INFO", "9000");
                //}
                ////check if Approval is expired then display message
                //else if (remainingDays < 0) {
                //    Xrm.Page.ui.setFormNotification("PROGRAM HAS EXPIRED ALREADY !!", "ERROR", "9001");
                //}
                var expiryDateTime = Xrm.Page.getAttribute("cares_enddate").getValue();
                var expiryDate = new Date(expiryDateTime.getFullYear(), expiryDateTime.getMonth(), expiryDateTime.getDate(), 0, 0, 0);
                var remainingDays = Math.round((expiryDate - todayDate) / one_day);

                //Getting Program Renewal rule value
                if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
                    Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
                    var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;
                    var returnValue = retrieveRecordCustom(_id, "cares_programSet");
                    if (returnValue !== null && returnValue !== undefined) {
                        if (returnValue.cares_RenewalRule !== null &&
                            returnValue.cares_RenewalRule !== undefined &&
                            returnValue.cares_RenewalRule.Value === 750760000) { //checking if renewal rule is Birthday
                            remainingDays = Math.round(remainingDays - 1);
                        }
                    }
                }

                var stateCode = Xrm.Page.getControl("header_statecode").getAttribute().getValue();

                //Check if Approval Expires in 90 days then display message
                if (remainingDays > 0 && remainingDays <= 90 && stateCode === 0) {
                    Xrm.Page.ui.setFormNotification("PROGRAM EXPIRES in " + remainingDays + " days!!", "INFO", "9000");
                }
                if (remainingDays === 0 && stateCode === 0) {
                    Xrm.Page.ui.setFormNotification("PROGRAM EXPIRES Today!!", "INFO", "9101");
                }
                //check if Approval is expired then display message
                else if (remainingDays < 0 || stateCode === 1) {
                    Xrm.Page.ui.setFormNotification("PROGRAM HAS EXPIRED ALREADY !!", "ERROR", "9001");
                }
            }
        }
    },

    //CHeck User Teams for SAP Processing flag
    ValidateifUserHasSAPProcessingTeam: function() {
        var currentUser = Xrm.Page.context.getUserId();
        var teamId = GetConfiguration("SAPProcessingTeamId");
        if (teamId !== null) {
            var teams = retrieveMultipleCustom("TeamMembershipSet", "?$filter=SystemUserId eq guid'" + currentUser + "' and TeamId eq guid'" + teamId + "'");
            if (teams !== null && teams.length > 0 && Xrm.Page.getAttribute("statecode").getValue() == 0) {
                Xrm.Page.getControl("cares_sapnumber").setDisabled(false);
            } else {
                Xrm.Page.getControl("cares_sapnumber").setDisabled(true);
            }
        }
    },
    /**performs end date validation */
    EndDateValidation: function() {
        //Xrm.Page.ui.clearFormNotification("9000");
        //Xrm.Page.ui.clearFormNotification("9001");
        //Xrm.Page.ui.clearFormNotification("9002");
        //Xrm.Page.getControl("cares_enddate").clearNotification("801");
        //Xrm.Page.getControl("cares_enddate").clearNotification("802");
        if (Xrm.Page.getAttribute("cares_enddate") !== null && Xrm.Page.getAttribute("cares_enddate").getValue() !== null &&
            Xrm.Page.getAttribute("cares_enddate").getValue() !== undefined) {
            var endDate = new Date(Xrm.Page.getAttribute("cares_enddate").getValue());
            var todayDate = new Date();
            if (todayDate >= endDate) {
                alert("End Date should be greater than today date");
                Xrm.Page.getAttribute("cares_enddate").setValue(null);
                //Xrm.Page.getControl("cares_enddate").setNotification("End Date should be greater than today date", "801");
            } else if (Xrm.Page.getAttribute("cares_startdate") !== null && Xrm.Page.getAttribute("cares_startdate").getValue() !== null &&
                Xrm.Page.getAttribute("cares_startdate").getValue() !== undefined) {
                var Startdate = new Date(Xrm.Page.getAttribute("cares_startdate").getValue());
                if (Startdate >= endDate) {
                    alert("End Date should be greater than Start date");
                    Xrm.Page.getAttribute("cares_enddate").setValue(null);
                    //Xrm.Page.getControl("cares_enddate").setNotification("End Date should be greater than Start date", "802");
                }
            }
        }
    },
    /**performs start date validation */
    StartDateValidation: function() {
        if (Xrm.Page.getAttribute("cares_startdate") !== null && Xrm.Page.getAttribute("cares_startdate").getValue() !== null &&
            Xrm.Page.getAttribute("cares_startdate").getValue() !== undefined) {
            var Startdate = new Date(Xrm.Page.getAttribute("cares_startdate").getValue());
            var todayDate = new Date();
            //if (todayDate >= Startdate) {
            //    alert("Start Date should be greater than today date");
            //    Xrm.Page.getAttribute("cares_startdate").setValue(null);
            //}
            if (Xrm.Page.getAttribute("cares_enddate") !== null && Xrm.Page.getAttribute("cares_enddate").getValue() !== null &&
                Xrm.Page.getAttribute("cares_enddate").getValue() !== undefined) {
                var endDate = new Date(Xrm.Page.getAttribute("cares_enddate").getValue());
                if (Startdate >= endDate) {
                    alert("Start Date should be less than End date");
                    Xrm.Page.getAttribute("cares_startdate").setValue(null);
                    return false;
                }
            }
        }
        return true;
    },
    /**
     * enables buttons based on renewal rule
     * @param {any} ignoreRenewalRule
     */
    EnableButtonByProgramMcfdAndUserRole: function(ignoreRenewalRule) {
        var formType = Xrm.Page.ui.getFormType();
        // If it is not an Update form, disable the ribbon button.
        if (formType == 1 && ignoreRenewalRule == false) {
            if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
                Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
                var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;
                var userRoles = Xrm.Page.context.getUserRoles();
                var returnValue = retrieveRecordCustom(_id, "cares_programSet");
                if (returnValue !== null && returnValue !== undefined) {
                    if (ignoreRenewalRule == false &&
                        (returnValue.cares_RenewalRule !== null &&
                            returnValue.cares_RenewalRule !== undefined &&
                            returnValue.cares_RenewalRule.Value === 750760003 // Label: None
                        )
                    ) {
                        return true;
                    }
                }
            }
        } else if (formType != 2) // Update form (see https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/clientapi/reference/formcontext-ui/getformtype for the full list of form type)
        {
            return false;
        }

        if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
            var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;
            var userRoles = Xrm.Page.context.getUserRoles();
            var returnValue = retrieveRecordCustom(_id, "cares_programSet");
            if (returnValue !== null && returnValue !== undefined) {
                if (ignoreRenewalRule == false &&
                    (returnValue.cares_RenewalRule !== null &&
                        returnValue.cares_RenewalRule !== undefined &&
                        returnValue.cares_RenewalRule.Value === 750760003 // Label: None
                    )
                ) {
                    return true;
                } else if (ignoreRenewalRule == true ||
                    (returnValue.cares_RenewalRule !== null &&
                        returnValue.cares_RenewalRule !== undefined &&
                        returnValue.cares_RenewalRule.Value === 750760003 // Label: None
                    )
                ) {
                    if (returnValue.cares_MCFD !== null &&
                        returnValue.cares_MCFD !== undefined) {
                        if (returnValue.cares_MCFD == true) { // label: Yes
                            if (userRoles != null && userRoles != undefined) {
                                for (var i = 0; i < userRoles.length; i++) {
                                    var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                                    if (role != null) {
                                        if (role.Name.indexOf("PDC Admin") > -1)
                                            return true;
                                        else if (role.Name.indexOf("MCFD") > -1)
                                            return true;
                                    }
                                }
                            }
                        } else { // label: No
                            if (userRoles != null && userRoles != undefined) {
                                for (var i = 0; i < userRoles.length; i++) {
                                    var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                                    if (role != null) {
                                        if (role.Name.indexOf("PDC Admin") > -1)
                                            return true;
                                        else if (role.Name.indexOf("PDC Clerk") > -1)
                                            return true;
                                    }
                                }
                            }
                        }
                    }

                }
            }
        }
        return false;
    },
    /**
     * Enables/Disables the manual renewal button
     * */
    EnableDisableManualRenewalButton: function() {
        return Cares_Approval.EnableButtonByProgramMcfdAndUserRole(false);
    },
    /**
     * Performs substitution of approval items
     * @param {any} selectedControl
     * @param {any} selectedControlItem
     * @param {any} selectedControlItemRefrence
     */
    CallOnSubstituteApprovalItem: function(selectedControl, selectedControlItem, selectedControlItemRefrence) {
        if (Xrm.Page.getControl("Items") !== null) {
            var grid = Xrm.Page.getControl("Items");
            var selectedRow = grid.getGrid().getSelectedRows();
            if (selectedRow.getLength() === 0) {
                alert("An Approval Item record must be selected for the substitute process");
            } else if (selectedRow.getLength() > 1) {
                alert("Select one approval item at a time to substitute.");
            } else {
                var id = selectedRow.get(0).getData().getEntity().getEntityReference().id;
                var approvalItem = retrieveRecordCustom(id, "cares_approvalitemSet");
                if (approvalItem !== null && approvalItem !== undefined) {
                    //if (approvalItem.cares_Quantity !== null && approvalItem.cares_Quantity > 0) {
                    //    alert("You can not substitute selected item.");
                    //}
                    //else if (approvalItem.cares_PerUnit !== null && approvalItem.cares_PerUnit.Value !== null && approvalItem.cares_PerUnit.Value > 0) {
                    //    alert("You can not substitute selected item.");
                    //}
                    if (approvalItem.cares_GroupId !== null && approvalItem.cares_GroupId.Id !== null) {
                        alert("You can not substitute selected item because this item accosiated with a group.");
                    } else {
                        var dialogParameter = 'dialogWidth:1100px; dialogHeight:300px;';

                        //Getting ApproralItem Substitute page URL
                        var approvalItemURL = GetConfiguration("MVCUrl");
                        if (approvalItemURL !== null) {
                            approvalItemURL += "Approval/SubstituteProduct/?id=" + id + "&userId=" + Xrm.Page.context.getUserId() + "&productDesc=" + approvalItem.cares_name;
                            //window.showModalDialog(approvalItemURL, "_self", dialogParameter);
                            window.open(approvalItemURL, null, "height=300px,width=1100px,scrollbars=yes");

                            //Code for after close the custom page

                        }
                    }
                } else {
                    alert("No record found against selected item.");
                }
            }
        }

    },
    /**
     * Disables field on group grid
     * @param {any} context
     */
    DisableGroupGridFields: function(context) {
        if (Xrm.Page.getAttribute("statecode").getValue() == 1) {
            context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
                attr.controls.forEach(function(c) {
                    c.setDisabled(true);
                })
            });
        } else {
            context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
                if (attr.getName() === "cares_permonth" || attr.getName() === "cares_total" || attr.getName() === "cares_balance" || attr.getName() === "cares_peryear") {
                    attr.controls.forEach(function(c) {
                        c.setDisabled(true);
                    })
                }
            });
        }
    },
    /**
     * Disables field on approval item
     * @param {any} context
     */
    DisableApprovalItemsGridFields: function(context) {
        if (Xrm.Page.getAttribute("statecode").getValue() == 1) {
            context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
                attr.controls.forEach(function(c) {
                    c.setDisabled(true);
                })
            });
        } else {
            context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
                if (attr.getName() === "cares_productid" || attr.getName() === "cares_permonth" || attr.getName() === "cares_balance" || attr.getName() === "cares_total" || attr.getName() === "cares_peryear") {
                    attr.controls.forEach(function(c) {
                        c.setDisabled(true);
                    })
                }
            });
        }
    },
    /**
     * Hides group icons
     * */
    HideAddNewGroupIcon: function() {
        return Cares_Approval.IsUserHasRightsonApprovalItemandGroup();
    },
    /**
     * Hides substitute button
     * */
    HideSubstituteButton: function() {
        return Cares_Approval.EnableButtonByProgramMcfdAndUserRole(true);
    },

    // [Obsolete]
    IsUserHasRightsonApprovalItemandGroup: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType == 1) // Create form (see https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/clientapi/reference/formcontext-ui/getformtype for the full list of form type)
        {
            return false;
        } else {
            if (Xrm.Page.getAttribute("cares_programid") != null) {
                var recordOwnerId = Xrm.Page.getAttribute("ownerid").getValue()[0];

                //Get Login user Roles
                var userRoles = Xrm.Page.context.getUserRoles();

                if (userRoles != null && userRoles != undefined) {
                    var IsPDCClerk = Cares_Approval.IsLoginUserhasPDCClerkRole(userRoles);

                    var IsMCFDorPDCAdminRole = false;

                    if (recordOwnerId.entityType == "team") {
                        if (recordOwnerId.name.indexOf("MCFD") > -1) {
                            IsMCFDorPDCAdminRole = true;
                        }
                    } else {
                        var recordOwner = retrieveMultipleCustom("SystemUserRolesSet", "?$filter=SystemUserId eq guid'" + recordOwnerId.id + "'");
                        if (recordOwner !== null && recordOwner.length > 0) {
                            IsMCFDorPDCAdminRole = Cares_Approval.IsUserHasMCFDorPDCAdminRole(recordOwner);
                        }
                    }

                    if (IsPDCClerk == true && IsMCFDorPDCAdminRole == true)
                        return false;
                    else
                        return true;
                }
            }
        }
        return false;
    },
    /**
     * checks user role
     * @param {any} userRoles
     */
    IsLoginUserhasPDCClerkRole: function(userRoles) {
        for (var i = 0; i < userRoles.length; i++) {
            var role = retrieveRecordCustom(userRoles[i], "RoleSet");
            if (role != null) {
                if (role.Name.indexOf("PDC Clerk") > -1)
                    return true;
            }
        }
        return false;
    },
    /**
     * Check readonly role
     * */
    IsLoginUserhasReadOnlyRole: function() {
        //Get Login user Roles
        var userRoles = Xrm.Page.context.getUserRoles();

        if (userRoles != null && userRoles != undefined) {
            for (var i = 0; i < userRoles.length; i++) {
                var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                if (role != null) {
                    if (role.Name.indexOf("Read Only") > -1)
                        return true;
                }
            }
        }
        return false;
    },
    /**
     * checks PDC/Admin role
     * @param {any} recordOwner
     */
    IsUserHasMCFDorPDCAdminRole: function(recordOwner) {
        for (var i = 0; i < recordOwner.length; i++) {
            var role = retrieveRecordCustom(recordOwner[i].RoleId, "RoleSet");
            if (role != null) {
                //if (role.Name.indexOf("PDC Admin") > -1)
                //    return true;
                //else 
                if (role.Name.indexOf("MCFD") > -1)
                    return true;
            } else if (role == null) {
                return true;
            }
        }
        return false;
    },
    /**
     * Checks MCFD Admin role
     * */
    MCFDorPDCAdminRole: function() {
        var userRoles = Xrm.Page.context.getUserRoles();
        if (userRoles != null && userRoles != undefined) {
            for (var i = 0; i < userRoles.length; i++) {
                var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                if (role != null) {
                    if (role.Name.indexOf("PDC Admin") > -1)
                        return true;
                    else if (role.Name.indexOf("MCFD") > -1)
                        return true;
                } else if (role == null) {
                    return true;
                }
            }
        }
        return false;
    },

    //Set the product web page url for the product search Iframe
    SetProductSearchUrl: function() {
        var hasAccess = Cares_Approval.IsUserHasRightsonApprovalItemandGroup();
        var formType = Xrm.Page.ui.getFormType();
        if (hasAccess == false) {
            Xrm.Page.ui.tabs.get("tab_ProductSearch").sections.get("sec_ProductSearch").setVisible(false);
        } else if (Cares_Approval.IsLoginUserhasReadOnlyRole() == true && Cares_Approval.MCFDorPDCAdminRole() == false) {
            Xrm.Page.ui.tabs.get("tab_ProductSearch").sections.get("sec_ProductSearch").setVisible(false);
        } else if (formType == 2) {
            Xrm.Page.ui.tabs.get("tab_ProductSearch").sections.get("sec_ProductSearch").setVisible(true);
            var approvalId = Xrm.Page.data.entity.getId();
            var productListUrl = GetConfiguration("MVCUrl");
            if (productListUrl !== null) {
                productListUrl += "Approval/Index/?id=";
                productListUrl += approvalId + "&userId=" + Xrm.Page.context.getUserId();
                Xrm.Page.getControl("IFRAME_ProductSearch").setSrc(productListUrl);
            }
        } else {
            Xrm.Page.ui.tabs.get("tab_ProductSearch").sections.get("sec_ProductSearch").setVisible(false);
        }
    },
    /**
     * performs function on start date change 
     * */
    CallOnStartDateChange: function() {
        var createdOn = Xrm.Page.getAttribute("createdon").getValue();
        var lastrenewal = Xrm.Page.getAttribute("cares_lastrenewaldate").getValue();

        if (Cares_Approval.StartDateValidation() == false || Cares_Approval.IsValidStartDateForOrders() == false) {
            return;
        }

        /*
        var approvalId = Xrm.Page.data.entity.getId();

        var orders = retrieveMultipleCustom("cares_caresorderSet", "?$filter=cares_ApprovalId/Id eq guid'" + approvalId + "'");
        if (null !== orders && undefined !== orders
            && orders.length > 0) {
            return;
        }
        */

        if (Xrm.Page.getAttribute("cares_startdate") != null && Xrm.Page.getAttribute("cares_startdate").getValue() != null) {
            if (Cares_Approval.EnableDisableManualRenewalButton() == true)
                Xrm.Page.getAttribute("cares_approvalstartdate").setValue(Xrm.Page.getAttribute("cares_startdate").getValue());
            else if (Xrm.Page.ui.getFormType() == 1)
            // Previous logic before making changes as per issue DYN-1105
            //Xrm.Page.getAttribute("cares_approvalstartdate").setValue(new Date());
            { // changes made as per DYN-1105 
                if (createdOn != null && createdOn != undefined) {
                    Xrm.Page.getAttribute("cares_approvalstartdate").setValue(createdOn);
                } // changes made as per DYN-1105
                else {
                    Xrm.Page.getAttribute("cares_approvalstartdate").setValue(new Date());
                }
            } else if (Xrm.Page.ui.getFormType() == 0) {
                Xrm.Page.getAttribute("cares_approvalstartdate").setValue(new Date());
            } else if (Xrm.Page.ui.getFormType() == 2) {
                if (lastrenewal != null && lastrenewal != undefined) {
                    if (Approval_program != null && Approval_program != undefined) {
                        if (Approval_program.cares_RenewalRule.Value == 750760001) {
                            Xrm.Page.getAttribute("cares_approvalstartdate").setValue(Cares_Approval.CalculateRenewalDateFromStartDate(Xrm.Page.getAttribute("cares_startdate").getValue()));
                        } else if (Approval_program.cares_RenewalRule.Value == 750760000) {
                            var _ContactId = Xrm.Page.getAttribute("cares_contactid").getValue()[0].id;
                            var _Contact = retrieveRecordCustom(_ContactId, "ContactSet");
                            if (_Contact !== null && _Contact !== undefined) {
                                Xrm.Page.getAttribute("cares_approvalstartdate").setValue(Cares_Approval.CalculateRenewalDateFromStartDate(Cares_Approval.HandleoDataDate(_Contact.BirthDate)));
                            }
                        }
                    }
                } else {
                    Xrm.Page.getAttribute("cares_approvalstartdate").setValue(createdOn);
                }
            }
        } else {
            Xrm.Page.getAttribute("cares_approvalstartdate").setValue(null);
        }
    },
    /**
     * performs the renewal date fnctionality
     * @param {any} startdate
     */
    CalculateRenewalDateFromStartDate: function(startdate) {
        var dateNow = new Date();

        if (startdate != null && startdate != undefined) {

            var month = startdate.getMonth();
            var day = startdate.getDate();
            var year = dateNow.getFullYear();
            var day_l = day;
            if (month == 1) {
                if (day == 29) {
                    if (!Cares_Approval.isLeapYear(new Date(year + 1, month, day))) {
                        day_l = 28;
                    }
                }
            }

            var d_date = new Date(year + 1, month, day_l);

            if (d_date > dateNow) {
                if (month == 1) {
                    if (day == 29) {
                        if (!Cares_Approval.isLeapYear(new Date(year, month, day))) {
                            if (new Date(year, month, 28) > dateNow) {
                                return new Date(year - 1, month, 28);
                            }
                            return new Date(year, month, 28);
                        }
                    }
                }
                if (new Date(year, month, day) > dateNow) {
                    return new Date(year - 1, month, day);
                }
                return new Date(year, month, day);
            } else {
                return d_date;
            }
        }
        /*
        var dateNow = new Date();
        if (startdate != null && startdate != undefined) {
            var d_date = new Date(startdate.setFullYear(dateNow.getFullYear() + 1));
            if (d_date > dateNow) {
                return d_date.setFullYear(dateNow.getFullYear());
            }
            else {
               return d_date;
            }
        }
        */
    },
    /**
     * perofrms the functionality on approval item change
     * @param {any} context
     */
    CallOnApprovalItemChange: function(context) {
        var qty = null;
        var perUnit = null;
        var expiryDate = null;
        context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
            try {
                if (attr.getName() === "cares_quantity") {
                    if (attr.getValue() != null) {
                        qty = attr.getValue();
                    }
                } else if (attr.getName() === "cares_perunit") {
                    if (attr.getValue() != null) {
                        perUnit = attr.getValue();
                    }
                } else if (attr.getName() === "cares_expirydate") {
                    if (attr.getValue() != null) {
                        expiryDate = attr.getValue();
                    }
                }
            } catch (ex) {}
        });

        if (qty == null || perUnit == null || isNaN(qty) === true || isNaN(perUnit) === true) {
            return;
        } else if (parseInt(qty) > 0) {
            var item = new Object();
            item.cares_Quantity = qty;
            item.cares_PerUnit = { Value: perUnit };
            //item.cares_ExpiryDate = expiryDate;
            Cares_Approval.CallApprovalItemEntityUpdate(context.getFormContext().getData().getEntity().getId(), item, context.getFormContext().getData().getEntity().getEntityName());
            return;
        }

    },
    /**
     * Performs the approval item update
     * @param {any} id
     * @param {any} entity
     * @param {any} entityName
     */
    CallApprovalItemEntityUpdate: function(id, entity, entityName) {
        SDK.REST.updateRecord(id, entity, entityName,
            function() {
                Cares_Approval.CallAllotmentCalculation(id, "ApprovalItemAllotmentCalculation");
            },
            Cares_Approval.errorHandler
        );
    },
    /**
     * It triggers on group item change
     * @param {any} context
     */
    CallOnGroupItemChange: function(context) {
        var qty = null;
        var perUnit = null;
        var expiryDate = null;
        context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
            try {
                if (attr.getName() === "cares_quantity") {
                    if (attr.getValue() != null) {
                        qty = attr.getValue();
                    }
                } else if (attr.getName() === "cares_perunit") {
                    if (attr.getValue() != null) {
                        perUnit = attr.getValue();
                    }
                } else if (attr.getName() === "cares_expirydate") {
                    if (attr.getValue() != null) {
                        expiryDate = attr.getValue();
                    }
                }
            } catch (ex) {}
        });

        if (qty == null || perUnit == null || isNaN(qty) === true || isNaN(perUnit) === true) {
            return;
        } else if (parseInt(qty) > 0) {
            var group = new Object();
            group.cares_Quantity = qty;
            group.cares_PerUnit = { Value: perUnit };
            //group.cares_ExpiryDate = expiryDate;
            Cares_Approval.CallGroupEntityUpdate(context.getFormContext().getData().getEntity().getId(), group, context.getFormContext().getData().getEntity().getEntityName());
            return;
        }

    },
    /**
     * Calls group entity update
     * @param {any} id
     * @param {any} entity
     * @param {any} entityName
     */
    CallGroupEntityUpdate: function(id, entity, entityName) {
        SDK.REST.updateRecord(id, entity, entityName,
            function() {
                Cares_Approval.CallAllotmentCalculation(id, "GroupAllotmentCalculation");
            },
            Cares_Approval.errorHandler
        );
    },
    /**
     * It calculates the allotment
     * @param {any} itemGuid
     * @param {any} functionName
     */
    CallAllotmentCalculation: function(itemGuid, functionName) {
        var productListUrl = GetConfiguration("MVCUrl");
        if (productListUrl !== null) {
            var odataUri = productListUrl + "Approval/" + functionName + "?itemId=" + itemGuid + "&userId=" + Xrm.Page.context.getUserId();
            var returnVal = retrieveCustomMVC(odataUri);
            if (returnVal != null) {
                if (functionName == "GroupAllotmentCalculation") {
                    Xrm.Page.getControl("Groups").refresh();
                } else if (functionName == "ApprovalItemAllotmentCalculation") {
                    Xrm.Page.getControl("Items").refresh();
                }
            }
        }
    },
    /**
     * perofrms manual reset of approval
     * */
    CallonApprovalManualReset: function() {
        var productListUrl = GetConfiguration("MVCUrl");
        if (productListUrl !== null) {
            var odataUri = productListUrl + "Approval/ApprovalManualReset?approvalId=" + Xrm.Page.data.entity.getId();
            var returnVal = retrieveCustomMVC(odataUri);
            if (returnVal != null) {

            }

        }
    },
    /**
     * Checks renewal rule
     * */
    IsRenewalRuleNone: function() {
        if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {
            var _id = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;

            SDK.REST.retrieveRecord(
                _id,
                "cares_program",
                null,
                null,
                function(_program) {
                    if (_program.cares_RenewalRule !== null && _program.cares_RenewalRule !== undefined &&
                        _program.cares_RenewalRule.Value === 750760003) {
                        isNone = true;
                    }

                },
                Cares_Approval.errorHandler
            );
        }
        return isNone;
    },
    /**
     * It peroforms reset functionality for approval
     * */
    Reset: function() {
        Xrm.Utility.confirmDialog("You are about to RESET this approval and all the allotment balance. Do you wish to continue?",
            function() {
                Xrm.Page.getAttribute("cares_startdate").setValue(null);
                Xrm.Page.getAttribute("cares_enddate").setValue(null);
                Xrm.Page.getAttribute("cares_lastordercreateddate").setValue(null);
                Xrm.Page.getAttribute("cares_isreset").setValue(true);
            },
            function() {}
        );
    },
    /**
     * This function runs on group expiry date 
     * @param {any} context
     */
    CallOnGroupExpiryDate: function(context) {
        var expiryDateField = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate");
        var expiryDate = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate").getValue();
        var expiryDateControl = expiryDateField.controls.get(0);
        var groupId = context.getFormContext().getData().getEntity().getId();
        var approvalEndDate = Xrm.Page.getAttribute("cares_enddate").getValue();
        var approvalAllotmentEndDate = Xrm.Page.getAttribute("cares_approvalenddate").getValue();
        Cares_Approval.ValidateGroupExpiryDate(expiryDateField, expiryDate, expiryDateControl, groupId, approvalEndDate, approvalAllotmentEndDate);
    },
    /**
     * This function runs on item expiry date
     * @param {any} context
     */
    CallOnApprovalItemExpiryDate: function(context) {
        var expiryDateField = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate");
        var expiryDate = context.getFormContext().getData().getEntity().attributes.getByName("cares_expirydate").getValue();
        var expiryDateControl = expiryDateField.controls.get(0);
        var approvalitemId = context.getFormContext().getData().getEntity().getId();
        var approvalEndDate = Xrm.Page.getAttribute("cares_enddate").getValue();
        var approvalAllotmentEndDate = Xrm.Page.getAttribute("cares_approvalenddate").getValue();
        Cares_Approval.ValidateApprovalItemExpiryDate(expiryDateField, expiryDate, expiryDateControl, approvalitemId, approvalEndDate, approvalAllotmentEndDate);
    },
    /**
     * It validates the group expiry
     * @param {any} expiryDateField
     * @param {any} expiryDate
     * @param {any} expiryDateControl
     * @param {any} groupId
     * @param {any} approvalEndDate
     * @param {any} approvalAllotmentEndDate
     */
    ValidateGroupExpiryDate: function(expiryDateField, expiryDate, expiryDateControl, groupId, approvalEndDate, approvalAllotmentEndDate) {
        var todayDate = new Date();

        expiryDateControl.clearNotification("601");

        if (expiryDateField === null || expiryDate === null || expiryDate === undefined) {
            //Update Expiry and Call Allotment
            var group = new Object();
            group.cares_ExpiryDate = expiryDate;
            Cares_Approval.CallGroupEntityUpdate(groupId, group, "cares_approvalitemgroup");
            return;
        } else if (Cares_Approval.EnableDisableManualRenewalButton() == true && expiryDate > approvalEndDate && approvalEndDate != null && approvalEndDate != undefined) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "601");
            return;
        } else if (expiryDate > approvalEndDate && approvalEndDate != null && approvalEndDate != undefined) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "601");
            return;
        } else if (todayDate > expiryDate) {
            expiryDateControl.setNotification("Expiry Date must be greater than today.", "601");
            return;
        } else {
            var groupRecord = retrieveRecordCustom(groupId, "cares_approvalitemgroupSet");
            if (groupRecord !== null && groupRecord !== undefined) {
                if (groupRecord.cares_AllotmentExpiryDate !== null && groupRecord.cares_AllotmentExpiryDate !== undefined) {
                    var groupAllotmentExpiryDate = Cares_Approval.HandleoDataDate(groupRecord.cares_AllotmentExpiryDate);

                    if ((expiryDate < approvalAllotmentEndDate && expiryDate < groupAllotmentExpiryDate) || expiryDate < groupAllotmentExpiryDate) {
                        //Update Expiry and Call Allotment
                        var group = new Object();
                        group.cares_ExpiryDate = expiryDate;
                        group.cares_AllotmentExpiryDate = expiryDate;
                        Cares_Approval.CallGroupEntityUpdate(groupId, group, "cares_approvalitemgroup");
                        return;
                    }
                }
            }
        }

        //Update Expiry and Call Allotment
        var group = new Object();
        group.cares_ExpiryDate = expiryDate;
        Cares_Approval.CallGroupEntityUpdate(groupId, group, "cares_approvalitemgroup");
        return;
    },
    /**
     * It validates the approval item expiry
     * @param {any} expiryDateField
     * @param {any} expiryDate
     * @param {any} expiryDateControl
     * @param {any} approvalitemId
     * @param {any} approvalEndDate
     * @param {any} approvalAllotmentEndDate
     */
    ValidateApprovalItemExpiryDate: function(expiryDateField, expiryDate, expiryDateControl, approvalitemId, approvalEndDate, approvalAllotmentEndDate) {
        var todayDate = new Date();

        expiryDateControl.clearNotification("602");

        if (expiryDateField === null || expiryDate === null || expiryDate === undefined) {
            //Update Expiry and Call Allotment
            var item = new Object();
            item.cares_ExpiryDate = expiryDate;
            Cares_Approval.CallApprovalItemEntityUpdate(approvalitemId, item, "cares_approvalitem");
            return;
        } else if (Cares_Approval.EnableDisableManualRenewalButton() == true && expiryDate > approvalEndDate && approvalEndDate != null && approvalEndDate != undefined) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "602");
            return;
        } else if (expiryDate > approvalEndDate && approvalEndDate != null && approvalEndDate != undefined) {
            expiryDateControl.setNotification("Expiry Date must be less than the Approval End Date.", "602");
            return;
        } else if (todayDate > expiryDate) {
            expiryDateControl.setNotification("Expiry Date must be greater than today.", "602");
            return;
        } else {
            var approvalItemRecord = retrieveRecordCustom(approvalitemId, "cares_approvalitemSet");
            if (approvalItemRecord !== null && approvalItemRecord !== undefined) {
                if (approvalItemRecord.cares_AllotmentExpiryDate !== null && approvalItemRecord.cares_AllotmentExpiryDate !== undefined) {
                    var approvalItemAllotmentExpiryDate = Cares_Approval.HandleoDataDate(approvalItemRecord.cares_AllotmentExpiryDate);

                    if ((expiryDate < approvalAllotmentEndDate && expiryDate < approvalItemAllotmentExpiryDate) || expiryDate < approvalItemAllotmentExpiryDate) {
                        //Update Expiry and Call Allotment
                        var item = new Object();
                        item.cares_ExpiryDate = expiryDate;
                        item.cares_AllotmentExpiryDate = expiryDate;
                        Cares_Approval.CallApprovalItemEntityUpdate(approvalitemId, item, "cares_approvalitem");
                        return;
                    }
                }
            }
        }

        //Update Expiry and Call Allotment
        var item = new Object();
        item.cares_ExpiryDate = expiryDate;
        Cares_Approval.CallApprovalItemEntityUpdate(approvalitemId, item, "cares_approvalitem");
        return;
    },
    /**
     * It validates the date for orders
     * */
    IsValidEndDateForOrders: function() {
        var formType = Xrm.Page.ui.getFormType();
        if (formType == 2) {
            var isValid = false;
            var approvalId = Xrm.Page.data.entity.getId();


            if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
                Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {

                var programId = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;;


                var oldEndDate = null;
                var approval = retrieveRecordCustom(approvalId, "cares_approvalSet");
                if (null !== approval && undefined !== approval &&
                    null !== approval.cares_EndDate && undefined !== approval.cares_EndDate) {
                    oldEndDate = Cares_Approval.HandleoDataDate(approval.cares_EndDate);
                }

                isValid = Cares_Approval.IsValidDateRenewRuleNotNone("End Date", "cares_enddate", programId, approvalId, oldEndDate, "9020");

                if (isValid) {

                    isValid = Cares_Approval.IsValidDateRenewRuleNone("End Date", "cares_enddate", programId, approvalId, oldEndDate, "9020");
                }
            }
        }
    },
    /**
     * It validates the date for orders
     * */
    IsValidStartDateForOrders: function() {
        var formType = Xrm.Page.ui.getFormType();
        var isValid = false;
        if (formType == 2) {

            var approvalId = Xrm.Page.data.entity.getId();
            var currentStartDate = Xrm.Page.getAttribute("cares_startdate").getValue();

            if (Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
                Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {

                var programId = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;

                var oldStartDate = null;
                var approval = retrieveRecordCustom(approvalId, "cares_approvalSet");
                if (null !== approval && undefined !== approval &&
                    null !== approval.cares_StartDate && undefined !== approval.cares_StartDate) {
                    oldStartDate = Cares_Approval.HandleoDataDate(approval.cares_StartDate);
                }

                isValid = Cares_Approval.IsValidDateRenewRuleNotNone("Start Date", "cares_startdate", programId, approvalId, oldStartDate, "9030");

                if (isValid) {

                    isValid = Cares_Approval.IsValidDateRenewRuleNone("Start Date", "cares_startdate", programId, approvalId, oldStartDate, "9030");
                    return isValid;
                } else {
                    return isValid;
                }
            }
        }
        return true;
    },
    /**
     * It validates the date on renewal
     * @param {any} fieldlabel
     * @param {any} fieldname
     * @param {any} programId
     * @param {any} approvalId
     * @param {any} oldDate
     * @param {any} notificationCode
     */
    IsValidDateRenewRuleNone: function(fieldlabel, fieldname, programId, approvalId, oldDate, notificationCode) {

        Xrm.Page.ui.clearFormNotification(notificationCode);
        var isValid = true;

        var orderDateValue = Xrm.Page.getAttribute("cares_lastordercreateddate").getValue();

        if (null !== programId && undefined !== programId && null !== approvalId && undefined !== approvalId) {
            var program = retrieveRecordCustom(programId, "cares_programSet");
            if (null !== program && undefined != program && null !== program.cares_RenewalRule && undefined !== program.cares_RenewalRule && program.cares_RenewalRule.Value === 750760003) {
                if (null !== orderDateValue && undefined !== orderDateValue) {
                    isValid = false;
                    Xrm.Page.ui.setFormNotification(fieldlabel + " cannot be updated if an Order record exists for the Approval", "ERROR", notificationCode);
                    Xrm.Page.getAttribute(fieldname).setValue(oldDate);
                }
            }
        }
        return isValid;
        /*
        
        Xrm.Page.ui.clearFormNotification(notificationCode);
        var isValid = true;
        var newDateValue = Xrm.Page.getAttribute("cares_startdate").getValue();
        if (null !== programId && undefined !== programId
            && null !== approvalId && undefined !== approvalId) {
            var program = retrieveRecordCustom(programId, "cares_programSet");
            if (null !== program && undefined != program
                && null !== program.cares_RenewalRule && undefined !== program.cares_RenewalRule
                && program.cares_RenewalRule.Value === 750760003) {
                var orders = retrieveMultipleCustom("cares_caresorderSet", "?$filter=cares_ApprovalId/Id eq guid'" + approvalId + "'");
                if (null !== newDateValue && undefined !== newDateValue
                    && null !== orders && undefined !== orders
                    && orders.length > 0) {
                    for (var i = 0; i < orders.length; i++) {

                        if (Cares_Approval.HandleoDataDate(orders[i].CreatedOn) >= newDateValue) {
                            if (isValid) {
                                isValid = false;
                                Xrm.Page.ui.setFormNotification(fieldlabel + " cannot be updated if an Order record exists for the Approval", "ERROR", notificationCode);
                                Xrm.Page.getAttribute(fieldname).setValue(oldDate);
                            }
                        }
                    }

                }
            }
        }
        return isValid;
        */
    },
    /**
     * It validates the renewal rule
     * @param {any} fieldlabel
     * @param {any} fieldname
     * @param {any} programId
     * @param {any} approvalId
     * @param {any} oldDate
     * @param {any} notificationCode
     */
    IsValidDateRenewRuleNotNone: function(fieldlabel, fieldname, programId, approvalId, oldDate, notificationCode) {
        Xrm.Page.ui.clearFormNotification(notificationCode); //9020
        var isValid = true;
        if (null !== programId && undefined !== programId &&
            null !== approvalId && undefined !== approvalId) {
            var program = retrieveRecordCustom(programId, "cares_programSet");
            if (null !== program && undefined != program &&
                null !== program.cares_RenewalRule && undefined !== program.cares_RenewalRule &&
                program.cares_RenewalRule.Value !== 750760003) {
                var orders = retrieveMultipleCustom("cares_caresorderSet", "?$filter=cares_ApprovalId/Id eq guid'" + approvalId + "'");
                if (null !== orders && undefined !== orders &&
                    orders.length > 0) {
                    Xrm.Page.ui.setFormNotification(fieldlabel + " cannot be updated if an Order record exists for the Approval", "ERROR", notificationCode);
                    Xrm.Page.getAttribute(fieldname).setValue(oldDate);
                    isValid = false;
                }
            }
            return isValid
        }
        return isValid;
    },
    /**
     * It checks the order count per month
     * */
    CheckOrder1PerMonth: function() {
        Xrm.Page.ui.clearFormNotification("9800");
        var approvalId = Xrm.Page.data.entity.getId();


        if (Xrm.Page.ui.getFormType() == 2 &&
            Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined
        ) {
            var programId = Xrm.Page.getAttribute("cares_programid").getValue();

            var _program = retrieveRecordCustom(programId[0].id, "cares_programSet");

            if (null != _program && undefined != _program &&
                null != _program.cares_1OrderperMonth && undefined != _program.cares_1OrderperMonth &&
                true == _program.cares_1OrderperMonth) {

                var date = new Date();

                var _LastOrderDate = Xrm.Page.getAttribute("cares_lastorderdate").getValue();

                if (null != _LastOrderDate && undefined != _LastOrderDate && date.getMonth() == _LastOrderDate.getMonth() &&
                    date.getFullYear() == _LastOrderDate.getFullYear()) {
                    var _LastOrderDateStr = _LastOrderDate.getMonth() + 1 + "/" + _LastOrderDate.getDate() + "/" + _LastOrderDate.getFullYear();
                    Xrm.Page.ui.setFormNotification("Alert! Order already placed this month on " + _LastOrderDateStr, "WARNING", "9004");
                }
                /*
                var orders = retrieveMultipleCustom("cares_caresorderSet", "?$select=*&$filter=cares_ApprovalId/Id eq guid'" + approvalId + "' and (statuscode/Value eq 2 or statuscode/Value eq 750760004)");
     
                var programId_ = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;
     
                var program_ = retrieveRecordCustom(programId_, "cares_programSet");
     
                var hasOrder = false;
     
                if (program_.cares_1OrderperMonth == 1) {
                    var icount = 0;
                    var _LastOrderDate = Xrm.Page.getAttribute("cares_lastorderdate").getValue();
     
                    while (icount < orders.length) {
                        
                        var _OrderDate = null;
                        _OrderDate = new Date(parseInt(orders[icount].cares_OrderDate.substr(6)));
     
                        if (_OrderDate.getMonth() == _LastOrderDate.getMonth()
                            && _OrderDate.getFullYear() == _LastOrderDate.getFullYear()) {
                            var _LastOrderDateStr
                                = _LastOrderDate.getMonth() + 1 + "/" + _LastOrderDate.getDate() + "/" + _LastOrderDate.getFullYear();
                            hasOrder = true;
                            break;
                        }
                        icount++;
                       
     
                    }
                    if (hasOrder) {
                        
                        Xrm.Page.ui.setFormNotification("Alert! Order already placed this month on " + _LastOrderDateStr, "WARNING", "9004");
                    }
                }
                */
            }
        }
    },
    /**
     * It checks the order count per period
     * */
    CheckOrderCountPerPeriod: function() {
        Xrm.Page.ui.clearFormNotification("9800");
        var approvalId = Xrm.Page.data.entity.getId();
        var monthCount = 0;
        var isOneOrderInPeriod = false;
        var today = new Date();


        if (Xrm.Page.ui.getFormType() == 2 &&
            Xrm.Page.getAttribute("cares_programid") !== null && Xrm.Page.getAttribute("cares_programid").getValue() !== null &&
            Xrm.Page.getAttribute("cares_programid").getValue() !== undefined) {

            var orders = retrieveMultipleCustom("cares_caresorderSet", "?$filter=cares_ApprovalId/Id eq guid'" + approvalId + "' and statuscode/Value eq 2");

            if (null !== orders && undefined !== orders &&
                orders.length > 0) {
                var programId = Xrm.Page.getAttribute("cares_programid").getValue()[0].id;

                var program = retrieveRecordCustom(programId, "cares_programSet");


                if (null !== program && undefined != program &&
                    null !== program.cares_PerOrderMaximumValue && undefined !== program.cares_PerOrderMaximumValue) {

                    switch (program.cares_PerOrderMaximumValue.Value) {
                        case 750760000:
                            monthCount = 1;
                            var i = 0;
                            do {
                                if (null != orders[i] && undefined != orders[i] &&
                                    null != orders[i].CreatedOn && undefined != orders[i].CreatedOn) {
                                    var createdOn = Cares_Approval.HandleoDataDate(orders[i].CreatedOn);
                                    if ((today.getMonth() - (createdOn.getMonth())) == 0 &&
                                        today.getFullYear() == createdOn.getFullYear()) {
                                        isOneOrderInPeriod = true;
                                    }
                                }
                                i++;
                            } while (!isOneOrderInPeriod && i < orders.length);
                            break;
                        case 750760001:
                            monthCount = 3;
                            var i = 0;
                            do {
                                if (null != orders[i] && undefined != orders[i] &&
                                    null != orders[i].CreatedOn && undefined != orders[i].CreatedOn) {
                                    var createdOn = Cares_Approval.HandleoDataDate(orders[i].CreatedOn);
                                    if ((today.getMonth() - (createdOn.getMonth())) < 3 &&
                                        today.getFullYear() == createdOn.getFullYear()) {
                                        isOneOrderInPeriod = true;
                                    }
                                }
                                i++;
                            } while (!isOneOrderInPeriod && i < orders.length);
                            break;
                        case 750760002:
                            monthCount = 6;
                            var i = 0;
                            do {
                                if (null != orders[i] && undefined != orders[i] &&
                                    null != orders[i].CreatedOn && undefined != orders[i].CreatedOn) {
                                    var createdOn = Cares_Approval.HandleoDataDate(orders[i].CreatedOn);
                                    if ((today.getMonth() - (createdOn.getMonth())) < 6 &&
                                        today.getFullYear() == createdOn.getFullYear()) {
                                        isOneOrderInPeriod = true;
                                    }
                                }
                                i++;
                            } while (!isOneOrderInPeriod && i < orders.length);
                            break;
                        case 750760003:
                            monthCount = 12;
                            var i = 0;
                            do {
                                if (null != orders[i] && undefined != orders[i] &&
                                    null != orders[i].CreatedOn && undefined != orders[i].CreatedOn) {
                                    var createdOn = Cares_Approval.HandleoDataDate(orders[i].CreatedOn);
                                    if (today.getFullYear() - createdOn.getFullYear() < 12) {
                                        isOneOrderInPeriod = true;
                                    }
                                }
                                i++;
                            } while (!isOneOrderInPeriod && i < orders.length);
                            break;
                    }


                }

            }

            if (monthCount > 0 && isOneOrderInPeriod) {
                Xrm.Page.ui.setFormNotification("Warning: An order has already been placed within the last " + monthCount + " months", "WARNING", "9800");
            }

        }

    },
    /**
     * Refreshes the sub-grid
     * */
    RefreshSubGridFromMVC: function() {
        Xrm.Page.getControl("Items").refresh();
    },
    /**
     * Validates the item quantity
     * @param {any} context
     */
    CallOnApprovalItemQtyChange: function(context) {
        var qty = null;
        context.getFormContext().getData().getEntity().attributes.forEach(function(attr) {
            try {
                if (attr.getName() === "cares_quantity") {
                    if (attr.getValue() != null) {
                        qty = attr.getValue();
                    }

                }
            } catch (ex) {}
        });

        if (qty == null || perUnit == null || isNaN(qty) === true || isNaN(perUnit) === true) {
            return;
        } else if (parseInt(qty) > 0) {
            var item = new Object();
            item.cares_Quantity = qty;
            item.cares_PerUnit = { Value: perUnit };
            //item.cares_ExpiryDate = expiryDate;
            Cares_Approval.CallApprovalItemEntityUpdate(context.getFormContext().getData().getEntity().getId(), item, context.getFormContext().getData().getEntity().getEntityName());
            return;
        }

    },
    /**
     * It enables/disables the deactivate button
     * @param {any} selectedCtrl
     */
    DisableEnableDeactivateBtn: function(selectedCtrl) {
        var query = selectedCtrl.get_viewTitle();
        if (query == "Approval - Inactive Items" || query == "Group - Inactive Items" || query == "Inactive Groups") {
            return false;
        } else
            return true;
    },
    /**
     * It enables/disables the activate button
     * @param {any} selectedCtrl
     */
    DisableEnableActivateBtn: function(selectedCtrl) {
        var query = selectedCtrl.get_viewTitle();
        if (query != "Inactive Groups") {
            return false;
        } else
            return true;
    },
    /**
     * This function checks the PDC admin and MCFD role
     * */
    ifRoleIsPDCAdminMCFD: function() {
        var userRoles = Xrm.Page.context.getUserRoles();
        if (userRoles != null && userRoles != undefined) {
            for (var i = 0; i < userRoles.length; i++) {
                var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                if (role != null) {
                    if (role.Name.indexOf("PDC Admin") > -1 || role.Name.indexOf("MCFD") > -1)
                        return true;
                }
            }
        }
        return false;
    },
    /**
     * This function checks the PDC admin role
     * */
    ifRoleIsPDCAdminOrAdmin: function() {
        var userRoles = Xrm.Page.context.getUserRoles();
        if (userRoles != null && userRoles != undefined) {
            for (var i = 0; i < userRoles.length; i++) {
                var role = retrieveRecordCustom(userRoles[i], "RoleSet");
                if (role != null) {
                    if (role.Name.indexOf("PDC Admin") > -1 || role.Name.indexOf("System Administrator") > -1)
                        return true;
                }
            }
        }
        return false;
    },
    /**
     * It checks the leap year
     * @param {any} year
     */
    isLeapYear: function(year) {
        return new Date(year, 1, 29).getDate() === 29;
    },
    /**
     * It handles the error
     * @param {any} error
     */
    errorHandler: function(error) {
        alert(error.message);
    },
};