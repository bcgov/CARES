using System;
using System.Collections.Generic;
using System.ServiceModel;
using Cares.Crm.Core;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{

    /// <summary>
    /// EmailDelete Plugin.
    /// </summary>
    public class EmailDelete : PluginBase
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="EmailDelete"/> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public EmailDelete(string unsecure, string secure)
            : base(typeof(EmailDelete))
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
            trace.Trace("[INFO] EmailDelete Plugin Starts...");
            trace.Trace("[INFO] Plugin Context's InitiatingUserId : " + pluginContext.InitiatingUserId 
                            + "Plugin Context's UserId : " + pluginContext.UserId);
            var caresHelper = new CaresHelper();
            try
            {
                if (pluginContext.MessageName == "Delete")
                {
                    trace.Trace("[INFO] Post-Deletion of Return record - STARTED...");
                    Entity recordBefore = (Entity)pluginContext.PreEntityImages["preImage"];
                    //foreach (KeyValuePair<String, Object> attribute in recordBefore.Attributes)
                    //{
                    //    /*Read each field and do something*/
                    //    trace.Trace("Key:{0}, Value:{1}", attribute.Key, attribute.Value);
                    //    trace.Trace("Key:{0}, OSV's Value:{1}", attribute.Key, ((OptionSetValue)attribute.Value).Value);
                    //}
                    if (!recordBefore.Attributes.Contains("statuscode") // Status Reason
                        || !recordBefore.Attributes.Contains("subject"))
                    {
                        throw new InvalidPluginExecutionException("[ERROR] Status Reason (statecode) or Regarding or Subject field is not registered in the PreImage of the EmailDelete's PreValidation step. Please contact the administrator.");
                    }
                    else
                    {
                        OptionSetValue statusCode = (OptionSetValue)recordBefore.Attributes["statuscode"];
                        string subject = recordBefore.Attributes["subject"].ToString();

                        if ((statusCode.Value == 3 // Email is in Sent status reason
                            || statusCode.Value == 6) // Email is in Pending Send status reason
                            && subject.StartsWith("Return Authorization:"))
                        {
                            throw new InvalidPluginExecutionException("[ERROR] 'Return Authorization email record cannot be deleted.");
                        }
                    }
                    trace.Trace("[INFO] Post-Deletion of Email record - COMPLETED.");
                }
            }
            catch (InvalidPluginExecutionException ex)
            {
                throw ex;
            }
            catch (FaultException fex)
            {
                trace.Trace("[ERROR] " +  fex.InnerException == null ? fex.Message : fex.InnerException.Message);
                throw new InvalidPluginExecutionException(fex.Message);
            }
            catch (Exception ex)
            {
                trace.Trace("[ERROR] " + ex.InnerException == null ? ex.Message : ex.InnerException.Message);
                throw new InvalidPluginExecutionException(ex.Message);
            }
        }
    }
}
