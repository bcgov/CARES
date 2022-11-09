using System;
using Cares.Crm.Plugin;
using FakeXrmEasy;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Xrm.Sdk.Messages;

namespace Cares.Crm.Plugins.Tests
{
    
    /// <summary>
    /// This class is isued for testing the Plugins code
    /// </summary>
    [TestClass]
    public class ReturnUnitTests
    {
        [TestMethod]
        public void TestLogicsWhenDeactivatingReturn()
        {
            try
            {
                var context = new XrmRealContext
                {
                    ProxyTypesAssembly = typeof(ReturnDeReActivate).Assembly,
                    ConnectionStringName = "CaresCRMServer"
                };
                var executionContext = context.GetDefaultPluginContext();
                var service = context.GetOrganizationService();
                var trace = context.GetFakeTracingService();

                ExecuteMultipleRequest executeMultipleRequest = new ExecuteMultipleRequest();

                var caresHelper = new CaresHelper();
               // caresHelper.OnContactFullNameUpdating(new Guid("1E63AD88-C4D7-E811-90F7-005056A3B666"), service, trace);

                //var returnId = new Guid("03D415B5-36B1-E811-90F4-005056A3B666");//CareDEV
                // "Tac Bday2 - CA82 - 9/30/2018" Return in CaresQA
                ////var returnId = new Guid("900A0F7E-4CE1-E811-90F7-005056A3B666");
                ////var approvalId = new Guid("66A92E78-6BD6-E811-90F7-005056A3B666");
                ////var result = caresHelper.PrepareToDeactivateReturnItemsByReturnId(returnId, approvalId, service, trace);
                ////caresHelper.SendReturnAuthorizationEmail(returnId, service, trace, "DevTesting");
                //Assert.AreEqual(true, result, "Failed in deactivating associated return items.");
            }
            catch(Exception ex)
            {

            }
        }
    }
}
