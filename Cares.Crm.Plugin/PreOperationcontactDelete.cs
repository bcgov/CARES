using System;
using System.Linq;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{
    /// <summary>
    /// PreOperationcontactDelete Plugin.
    /// </summary>    
    public class PreOperationcontactDelete : PluginBase
    {
        /// <inheritdoc />
        /// <summary>
        /// Initializes a new instance of the <see cref="T:Cares.Crm.Plugin.PreOperationcontactDelete" /> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public PreOperationcontactDelete(string unsecure, string secure)
            : base(typeof(PreOperationcontactDelete))
        {

            // TODO: Implement your custom configuration handling.
        }


        /// <inheritdoc />
        /// <summary>
        /// Main entry point for he business logic that the plug-in is to execute.
        /// </summary>
        /// <param name="localContext">The <see cref="!:LocalPluginContext" /> which contains the
        /// <see cref="T:Microsoft.Xrm.Sdk.IPluginExecutionContext" />,
        /// <see cref="T:Microsoft.Xrm.Sdk.IOrganizationService" />
        /// and <see cref="T:Microsoft.Xrm.Sdk.ITracingService" />
        /// </param>
        /// <remarks>
        /// For improved performance, Microsoft Dynamics 365 caches plug-in instances.
        /// The plug-in's Execute method should be written to be stateless as the constructor
        /// is not called for every invocation of the plug-in. Also, multiple system threads
        /// could execute the plug-in at the same time. All per invocation state information
        /// is stored in the context. This means that you should not use global variables in plug-ins.
        /// </remarks>
        protected override void ExecuteCrmPlugin(LocalPluginContext localContext)
        {
            if (localContext == null)
            {
                throw new InvalidPluginExecutionException("localContext");
            }

            var pluginContext = localContext.PluginExecutionContext;
            var service = localContext.OrganizationService;
            var trace = localContext.TracingService;

            var caresHelper = new CaresHelper();

            trace.Trace("PreOperationcontactDelete Plugin Starts...");
            trace.Trace("Plugin InitiatingUserId : " + pluginContext.InitiatingUserId);
            trace.Trace("Plugin UserId : " + pluginContext.UserId);
            try
            {
                if (pluginContext.InputParameters.Contains("Target") && pluginContext.InputParameters["Target"] is EntityReference &&
                    ((EntityReference)pluginContext.InputParameters["Target"]).LogicalName == "contact")
                {
                    // Only perform this code if this is a create
                    if (pluginContext.MessageName != "Delete")
                    {
                        return;
                    }

                    trace.Trace("Verified that PluginContext.InputParameters[Target] is Entity and Logical Name is Contact and Message is Delete...");
                    var entity = (EntityReference)pluginContext.InputParameters["Target"];
                    trace.Trace("Get Entity from (Entity)PluginContext.InputParameters[Target] and entity ID is : " + entity.Id);

                    if (caresHelper.IsApprovalAssociatedWithContact(entity.Id, service, trace))
                    {
                        throw new InvalidPluginExecutionException("Cannot delete this Contact because one or more Approvals associated with this contact.");
                    }

                    ////Comment this line because we can't use this DLL in Sandbox mode
                    //var caresCrmCredentials = caresHelper.GetCaresCrmCredentialsfromWebResource(pluginContext, service, trace);

                    //trace.Trace("Going to make a Connection using cares.crm.core DLL");
                    //using (var connectionManager = new CrmConnectionManager(caresCrmCredentials.DiscoveryUrl, caresCrmCredentials.OrganizationName, caresCrmCredentials.DomainName,
                    //    caresCrmCredentials.UserName, caresCrmCredentials.Password))
                    //{
                    //    trace.Trace("Connection created from Cares.Crm.Core..");

                    //    var context = connectionManager.CaresCrmServiceContext;

                    //    var contactId = entity.Id;

                    //    var approvals = from a in context.cares_approvalSet
                    //                    where a.cares_ContactId.Id == contactId &&
                    //                          a.statecode == cares_approvalState.Active
                    //                    select a;

                    //    trace.Trace("Got Approvals with count : " + approvals.ToList().Any());
                    //    if (approvals.ToList().Any())
                    //    {
                    //        trace.Trace("Inside Approvals.Any() condition");
                    //        trace.Trace("Approvals associated with this contact.");

                    //        throw new InvalidPluginExecutionException("Cannot delete this Contact because one or more Approvals associated with this contact.");
                    //    }
                    //}

                    trace.Trace("PreOperationcontactDelete Plugin Ends with executing PluginContext.InputParameters[Target] is Entity Condition...");
                }
                else if (pluginContext.InputParameters.Contains("EntityMoniker") && pluginContext.InputParameters["EntityMoniker"] is EntityReference &&
                         ((EntityReference)pluginContext.InputParameters["EntityMoniker"]).LogicalName == "contact")
                {
                    // Only perform this code if this is a SetState
                    if (!pluginContext.MessageName.Contains("SetState"))
                    {
                        return;
                    }

                    trace.Trace("Verified that PluginContext.InputParameters[EntityMoniker] is EntityReference and Logical Name is Contact and Message Name : " + pluginContext.MessageName);
                    var entity = (EntityReference)pluginContext.InputParameters["EntityMoniker"];
                    trace.Trace("Get Entity from (Entity)PluginContext.InputParameters[Target] and entity ID is : " + entity.Id);

                    if (pluginContext.InputParameters.Contains("State") && ((OptionSetValue)pluginContext.InputParameters["State"]).Value == 1) // Value 1 means Deactivate
                    {
                        if (caresHelper.IsApprovalAssociatedWithContact(entity.Id, service, trace))
                        {
                            throw new InvalidPluginExecutionException("Cannot deactivate this Contact because one or more Approvals associated with this contact.");
                        }
                    }
                }

                trace.Trace("PreOperationcontactDelete Plugin Ends with out executing PluginContext.InputParameters[EntityMoniker] is Entity Condition...");
            }
            catch (FaultException fex)
            {
                trace.Trace(fex.InnerException == null ? fex.Message : fex.InnerException.Message);
                throw new InvalidPluginExecutionException(fex.Message);
            }
            catch (Exception ex)
            {
                trace.Trace(ex.InnerException == null ? ex.Message : ex.InnerException.Message);
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}