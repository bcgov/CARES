using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{

    /// <summary>
    /// ReturnDeReActivate Plugin.
    /// </summary>
    public class ReturnDeReActivate : PluginBase
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ReturnDeReActivate"/> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public ReturnDeReActivate(string unsecure, string secure)
            : base(typeof(ReturnDeReActivate))
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
            trace.Trace("[INFO] ReturnDeReActivate Plugin Starts...");
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
                    //var entity = (EntityReference)pluginContext.InputParameters["EntityMoniker"];
                    //trace.Trace("Get Entity from (Entity)PluginContext.InputParameters[Target] and entity ID is : " + entity.Id);

                    trace.Trace("PluginContext.InputParameters[SetState] Value is : " + ((OptionSetValue)pluginContext.InputParameters["State"]).Value);
                    
                    if (pluginContext.InputParameters.Contains("State")) // 1: Inactive
                    {
                        int stateCode = ((OptionSetValue)pluginContext.InputParameters["State"]).Value; // 1: inactive | 0: active
                        EntityReference entityReference = (EntityReference)pluginContext.InputParameters["EntityMoniker"];
                        if (stateCode == 1) //Inactive Return
                        {
                            //Read the approvalId.
                            Entity postImage = (Entity)pluginContext.PostEntityImages["postImage"];
                            if (!postImage.Attributes.Contains("cares_approvalid"))
                            {
                                throw new InvalidPluginExecutionException("[ERROR] Approval (cares_approvalid) field is not registered in the PostImage of the ReturnDeReActivate's PostOperation step. Please contact the administrator.");
                            }
                            var approvalId = ((EntityReference)postImage.Attributes["cares_approvalid"]).Id;

                            // Req. 12.7. (3) System will update the status of the related Return Items records to Inactive https://jira.vic.cgi.com/browse/CARE-243
                            if (!caresHelper.PrepareToDeactivateReturnItemsByReturnId(entityReference.Id, approvalId, service, trace))
                            throw new InvalidPluginExecutionException("Return can't be deactivated. An error occured when deactivating the return's associated return items.");
                        else
                            trace.Trace("[INFO] Deactivation of Associated Return Items COMPLETED.");

                            //Implement Req. 12.7. (1) System will generate a Return Authorization email based on the Return Items on the Return record.
                            // AND System will attach the Return Authorization email to the Return record
                            trace.Trace("[INFO] Creating & Sending Return Authorization Email ...");
                            caresHelper.SendReturnAuthorizationEmail(entityReference.Id, service, trace, pluginContext.OrganizationName);
                            trace.Trace("[INFO] Sending Return Authorization Email COMPLETED.");
                        }
                        else if (stateCode == 0) //Active Return
                        {
                            //Implement Req. 12.19. The system will prevent a user from manually setting a record to Active from Inactive
                            // throw new InvalidPluginExecutionException("Return in Inactive status can't be reactivated.");
                        }
                    }
                }

                trace.Trace("ReturnDeReActivate Plugin Ends with out executing PluginContext.InputParameters[EntityMoniker] is Entity Condition...");
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
