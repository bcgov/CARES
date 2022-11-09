using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{

    /// <summary>
    /// ReturnItemDeactivate Plugin.
    /// </summary>
    public class ReturnItemDeactivate : PluginBase
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ReturnItemDeactivate"/> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public ReturnItemDeactivate(string unsecure, string secure)
            : base(typeof(ReturnItemDeactivate))
        {
            
           // TODO: Implement your custom configuration handling.
        }


        /// <summary>
        /// Main entry point for he business logic that the plug-in is to execute.
        /// </summary>
        /// <param name="localContext">The <see cref="LocalPluginContext"/> which contains the
        /// <see cref="IPluginExecutionContext"/>,
        /// <see cref="IOrganizationService"/>
        /// and <see cref="ITracingService"/>
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
            trace.Trace("[INFO] ReturnItemDeactivate Plugin Starts...");
            trace.Trace("[INFO] Plugin Context's InitiatingUserId : " + pluginContext.InitiatingUserId 
                            + "Plugin Context's UserId : " + pluginContext.UserId);
            var caresHelper = new CaresHelper();
            try
            {
                if (pluginContext.InputParameters.Contains("EntityMoniker") && pluginContext.InputParameters["EntityMoniker"] is EntityReference &&
                         ((EntityReference)pluginContext.InputParameters["EntityMoniker"]).LogicalName == "cares_caresreturnitem")
                {
                    // Only perform this code if this is a SetState
                    if (!pluginContext.MessageName.Contains("SetState"))
                    {
                        return;
                    }

                    trace.Trace("Verified that PluginContext.InputParameters[EntityMoniker] is EntityReference and Logical Name is cares_caresreturnitem and Message Name : " + pluginContext.MessageName);
                    //var entity = (EntityReference)pluginContext.InputParameters["EntityMoniker"];
                    //trace.Trace("Get Entity from (Entity)PluginContext.InputParameters[Target] and entity ID is : " + entity.Id);

                    trace.Trace("PluginContext.InputParameters[SetState] Value is : " + ((OptionSetValue)pluginContext.InputParameters["State"]).Value);

                    if (pluginContext.InputParameters.Contains("State"))
                    {
                        var returnItemStateCode = ((OptionSetValue)pluginContext.InputParameters["State"]).Value;

                        if (returnItemStateCode == 1) // 1: Inactive
                        {
                            // get PreImage from Context
                            if (pluginContext.PostEntityImages.Contains("postImage") && pluginContext.PostEntityImages["postImage"] is Entity)
                            {
                                Entity postMessageImage = (Entity)pluginContext.PostEntityImages["postImage"];
                                // Validate PostImage
                                if (!postMessageImage.Attributes.ContainsKey("cares_returnid")
                                    //!postMessageImage.Attributes.ContainsKey("cares_orderitem") ||
                                    //!postMessageImage.Attributes.ContainsKey("cares_quantity") ||
                                    //!postMessageImage.Attributes.ContainsKey("cares_allowcredit")
                                    )
                                    throw new InvalidPluginExecutionException("An error occurred in the FollowupPlugin plug-in. [Techinical Details: cares_returnid is not registered in the PostImage of the ReturnItemDeactivate Plugin step.]");

                                // Sprint 4 - Manage Return Items: Req. 10.10. The system will not allow a user to Inactive a Return Item record
                                EntityReference returnIdRef = (EntityReference)postMessageImage.Attributes["cares_returnid"];
                                if (!caresHelper.IsReturnInactive(returnIdRef.Id, service, trace))
                                {
                                    trace.Trace("[INFO] Associated Return record is not in Inactive status. Return Item record cannot be deactivated. Throwing business exception...");
                                    throw new InvalidPluginExecutionException("Return Item record cannot be deactivated as its Return record is not in Inactive status.");
                                }

                                //EntityReference orderItemRef = (EntityReference) postMessageImage.Attributes["cares_orderitem"];
                                //int? returnQty = (int?) postMessageImage.Attributes["cares_quantity"];
                                //bool? allowCredit = (bool?)postMessageImage.Attributes["cares_allowcredit"];
                                //if (orderItemRef != null)
                                //{
                                //    trace.Trace("[INFO] Related Order Item contains data. cares_orderitem: " + orderItemRef.Id);
                                //    caresHelper.OnDeactivatedReturnItem(postMessageImage.Id, orderItemRef.Id, returnQty, allowCredit, service, trace);
                                //}
                                //else
                                //    trace.Trace("[ERROR] Related Order Item doesn't contain data.");


                            }
                        }
                        else if (returnItemStateCode == 0) // active
                        {
                            trace.Trace("[INFO] Return Item record in Inactive status cannot be deleted. Throwing business exception...");
                            throw new InvalidPluginExecutionException("Return Item record in Inactive status cannot be reactivated");
                        }
                    }
                }

                trace.Trace("ReturnItemDeactivate Plugin Ends with out executing PluginContext.InputParameters[EntityMoniker] is Entity Condition...");
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
