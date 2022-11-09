using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{

    /// <summary>
    /// ReturnAsynPostDeReActivate Plugin.
    /// </summary>
    public class ReturnAsynPostDeReActivate : PluginBase
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ReturnAsynPostDeReActivate"/> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public ReturnAsynPostDeReActivate(string unsecure, string secure)
            : base(typeof(ReturnAsynPostDeReActivate))
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
            trace.Trace("[INFO] ReturnAsynPostDeReActivate Plugin Starts...");
            trace.Trace("[INFO] Plugin Context's InitiatingUserId : " + pluginContext.InitiatingUserId 
                            + "Plugin Context's UserId : " + pluginContext.UserId);
            var caresHelper = new CaresHelper();
            try
            {
                if (pluginContext.InputParameters.Contains("EntityMoniker") && pluginContext.InputParameters["EntityMoniker"] is EntityReference &&
                         ((EntityReference)pluginContext.InputParameters["EntityMoniker"]).LogicalName == "cares_caresreturn")
                {
                    // Only perform this code if this is a SetState or SetStateDynamicEntity
                    if (!pluginContext.MessageName.Contains("SetState"))
                    {
                        return;
                    }

                    trace.Trace("Verified that PluginContext.InputParameters[EntityMoniker] is EntityReference and Logical Name is cares_caresreturn and Message Name : " + pluginContext.MessageName);

                    trace.Trace("PluginContext.InputParameters[SetState] Value is : " + ((OptionSetValue)pluginContext.InputParameters["State"]).Value);

                    if (pluginContext.InputParameters.Contains("State")) // 1: Inactive
                    {
                        int stateCode = ((OptionSetValue)pluginContext.InputParameters["State"]).Value; // 1: inactive | 0: active
                        EntityReference entityReference = (EntityReference)pluginContext.InputParameters["EntityMoniker"];
                        if (stateCode == 1) //Inactive Return
                        {
                            Entity recordBefore = (Entity)pluginContext.PreEntityImages["preImage"];
                            if (!recordBefore.Attributes.Contains("ownerid"))
                            {
                                throw new InvalidPluginExecutionException("[ERROR] Status Reason (statecode) or Regarding or Subject field is not registered in the PreImage of the EmailDelete's PreValidation step. Please contact the administrator.");
                            }
                            else
                            {
                                // Req. 12.20. The system must update the owner of the Return Record and its related Return Items to the MCFD Team if the parent Approval Record is associated to a Program where the IS MCFD value is Yes. https://jira.vic.cgi.com/browse/CARE-224
                                trace.Trace("PreImage's ownerid: {0}", recordBefore.Attributes["ownerid"].ToString());
                                Guid ownerId = ((EntityReference)recordBefore.Attributes["ownerid"]).Id;
                                if (caresHelper.AssignReturnAndReturnItemsToMCFDteam(entityReference.Id, ownerId, service, trace))
                                    throw new InvalidPluginExecutionException("Return has been deactivated. An error occured when assign return and associated return items to MCFD team.");
                                                                
                                if (!caresHelper.DeactivateReturnItemsByInactiveReturn(entityReference.Id, service, trace))
                                    throw new InvalidPluginExecutionException("Return has been deactivated. An error occured when deactivating associated return items.");
                                else
                                    trace.Trace("[INFO] Assigning Return & associated Return Items COMPLETED.");
                            }
                        }
                    }
                }

                trace.Trace("ReturnAsynPostDeReActivate Plugin Ends with out executing PluginContext.InputParameters[EntityMoniker] is Entity Condition...");
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
