// <copyright file="PreOperationcares_caresorderitemDelete.cs" company="">
// Copyright (c) 2019 All Rights Reserved
// </copyright>
// <author></author>
// <date>6/3/2019 3:27:09 PM</date>
// <summary>Implements the PreOperationcares_caresorderitemDelete Plugin.</summary>
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.1
// </auto-generated>

using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Cares.Crm.Plugin
{

    /// <summary>
    /// PreOperationcares_caresorderitemDelete Plugin.
    /// </summary>    
    public class PreOperationcares_caresorderitemDelete: PluginBase
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PreOperationcares_caresorderitemDelete"/> class.
        /// </summary>
        /// <param name="unsecure">Contains public (unsecured) configuration information.</param>
        /// <param name="secure">Contains non-public (secured) configuration information. 
        /// When using Microsoft Dynamics 365 for Outlook with Offline Access, 
        /// the secure string is not passed to a plug-in that executes while the client is offline.</param>
        public PreOperationcares_caresorderitemDelete(string unsecure, string secure)
            : base(typeof(PreOperationcares_caresorderitemDelete))
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
            trace.Trace("[INFO] OrderItemDelete Plugin Starts...");
            trace.Trace("[INFO] Plugin Context's InitiatingUserId : " + pluginContext.InitiatingUserId
                            + "Plugin Context's UserId : " + pluginContext.UserId);
            var caresHelper = new CaresHelper();
            try
            {
                if (pluginContext.MessageName == "Delete")
                {
                    trace.Trace("[INFO] PreValidation of  Deletion of Order Item - STARTED...");
                    Entity recordBefore = (Entity)pluginContext.PreEntityImages["preImage"];

                    if (recordBefore.Attributes.Contains("statecode"))
                    {
                        OptionSetValue stateCode = (OptionSetValue)recordBefore.Attributes["statecode"];
                        if (stateCode.Value == 1) // INACTIVE record
                        {
                            trace.Trace("[INFO] Order Item record in Inactive status cannot be deleted. Throwing business exception...");
                            throw new InvalidPluginExecutionException("Order Item record in Inactive status cannot be deleted");
                        }
                    }
                    else
                    {
                        throw new InvalidPluginExecutionException("[ERROR] Status (statecode) field is not registered in the PreImage of the OrderItemDelete's PreValidation step.");
                    }
                    trace.Trace("[INFO] PreValidation of Deletion of Order Item - COMPLETED.");
                }
            }
            catch (InvalidPluginExecutionException ex)
            {
                throw ex;
            }
            catch (FaultException fex)
            {
                trace.Trace("[ERROR] " + fex.InnerException == null ? fex.Message : fex.InnerException.Message);
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
