using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using Cares.Crm.Core;
using Cares.Crm.Core.Allotment;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Task = System.Threading.Tasks.Task;

namespace Cares.Crm.Plugin
{
    public class CaresHelper
    {
        public class CaresCrmCredentials
        {
            public string DiscoveryUrl { get; set; }

            public string OrganizationName { get; set; }

            public string DomainName { get; set; }

            public string UserName { get; set; }

            public string Password { get; set; }
        }

        public enum RenewalRule
        {
            Birthday = 750760000,
            StartDate = 750760001,
            None = 750760003
        }

        /// <summary>
        /// This method is used to get credentials from web resource
        /// </summary>
        /// <param name="context">Plugin execution context object</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>CaresCrmCredentials</returns>
        public CaresCrmCredentials GetCaresCrmCredentialsfromWebResource(IPluginExecutionContext context, IOrganizationService service, ITracingService trace)
        {
            try
            {
                trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource Starts...");

                var entityCollection = GetWebResourceEntityCollection(context, service, trace);
                trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource _entityCollection retrieved");

                if (entityCollection != null && entityCollection.Entities.Count > 0)
                {
                    trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource _entityCollection has entities : " + entityCollection.Entities.Count);
                    var webResourceContent = ConvertContentToXmlString(entityCollection, trace);
                    trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource get _WebResourceContent from ConvertContentToXMLString : " + webResourceContent);

                    var xml = new XmlDocument();
                    xml.LoadXml(webResourceContent);
                    trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource LoadXml done..");
                    var xnList = xml.SelectNodes("/CaresCrmCredentials");

                    if (xnList?.Count > 0)
                    {
                        var caresCrmCredentials = new CaresCrmCredentials();
                        trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource xnList found : " + xnList.Count);
                        foreach (XmlNode xn in xnList)
                        {
                            caresCrmCredentials.DiscoveryUrl = xn.ChildNodes[0].InnerText;
                            caresCrmCredentials.OrganizationName = xn.ChildNodes[1].InnerText;
                            caresCrmCredentials.DomainName = xn.ChildNodes[2].InnerText;
                            var secureKey = xn.ChildNodes[5].InnerText;
                            caresCrmCredentials.UserName = DecryptString(xn.ChildNodes[3].InnerText, secureKey);
                            caresCrmCredentials.Password = DecryptString(xn.ChildNodes[4].InnerText, secureKey);
                            trace.Trace("CaresHelper - DisplayXmlNodes _caresCrmCredentials.DiscoveryURL xnList value is : " + caresCrmCredentials.DiscoveryUrl);
                            trace.Trace("CaresHelper - DisplayXmlNodes _caresCrmCredentials.OrganizationName xnList value is : " + caresCrmCredentials.OrganizationName);
                            trace.Trace("CaresHelper - DisplayXmlNodes _caresCrmCredentials.Domain Name xnList value is : " + caresCrmCredentials.DomainName);
                            trace.Trace("CaresHelper - DisplayXmlNodes SecureKey xnList value is : " + secureKey);
                        }

                        return caresCrmCredentials;
                    }
                }

                trace.Trace("CaresHelper - GetCaresCrmCredentialsfromWebResource Ends..");
            }
            catch (Exception ex)
            {
                trace.Trace(ex.InnerException == null ? ex.Message : ex.InnerException.Message);
            }

            return null;
        }

        /// <summary>
        /// This method returns the web resource entity collection
        /// </summary>
        /// <param name="context">Plugin execution object</param>
        /// <param name="service">tracing service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>EntityCollection object</returns>
        private static EntityCollection GetWebResourceEntityCollection(IPluginExecutionContext context, IOrganizationService service, ITracingService trace)
        {
            try
            {
                trace.Trace("CaresHelper - GetWebResourceEntityCollection Starts...");
                var columns = new ColumnSet("name", "content");
                var query = new QueryExpression
                {
                    EntityName = "webresource",
                    ColumnSet = columns,
                    Criteria = new FilterExpression
                    {
                        Conditions =
                        {
                            new ConditionExpression
                            {
                                AttributeName = "name",
                                Operator = ConditionOperator.Equal,
                                Values = {"cares_cares.crm.connectionmanagercredentials"}
                            }
                        }
                    }
                };
                trace.Trace("CaresHelper - GetWebResourceEntityCollection retrieving entity collection");
                return service.RetrieveMultiple(query);
            }
            catch (Exception ex)
            {
                trace.Trace(ex.InnerException == null ? ex.Message : ex.InnerException.Message);
                return null;
            }
        }

        /// <summary>
        /// This function converts content to XML string
        /// </summary>
        /// <param name="entityCollection">entity collection object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>string</returns>
        private static string ConvertContentToXmlString(EntityCollection entityCollection, ITracingService trace)
        {
            try
            {
                trace.Trace("CaresHelper - ConvertContentToXMLString Starts...");
                var webResourceContent = string.Empty;

                if (entityCollection != null && entityCollection.Entities.ToList().Any())
                {
                    trace.Trace("CaresHelper - ConvertContentToXMLString _entityCollection has entities : " + entityCollection.Entities.Count());
                    var webResource = entityCollection.Entities[0];
                    trace.Trace("CaresHelper - ConvertContentToXMLString webResource entity found");
                    if (webResource.Attributes.Contains("content"))
                    {
                        trace.Trace("CaresHelper - ConvertContentToXMLString webResource entity contains content attribute");
                        var binary = Convert.FromBase64String(webResource.Attributes["content"].ToString());
                        trace.Trace("CaresHelper - ConvertContentToXMLString webResource entity content attribute converted into binary");
                        webResourceContent = Encoding.UTF8.GetString(binary);
                        trace.Trace("CaresHelper - ConvertContentToXMLString webResource entity content attribute converted into string : " + webResourceContent);
                    }

                    trace.Trace("CaresHelper - ConvertContentToXMLString Ends..");
                    return webResourceContent;
                }

                return null;
            }
            catch (Exception ex)
            {
                trace.Trace(ex.InnerException == null ? ex.Message : ex.InnerException.Message);
                return null;
            }
        }

        /// <summary>
        /// Encrypts string
        /// </summary>
        /// <param name="toEncrypt">string to encrypt</param>
        /// <param name="secureKey">key for encryption</param>
        /// <returns>encrypted string</returns>
        private string EncryptString(string toEncrypt, string secureKey)
        {
            var toEncryptArray = Encoding.UTF8.GetBytes(toEncrypt);

            // Get the key from config file

            var key = secureKey;
            var hashmd5 = new MD5CryptoServiceProvider();
            var keyArray = hashmd5.ComputeHash(Encoding.UTF8.GetBytes(key));

            //Always release the resources and flush data of the Cryptographic service provide. Best Practice
            hashmd5.Clear();

            // Set the secret key for the tripleDES algorithm mode of operation. there are other 4 modes.
            // We choose ECB(Electronic code Book) padding mode(if any extra byte added)
            var tdes = new TripleDESCryptoServiceProvider
            {
                Key = keyArray,
                Mode = CipherMode.ECB,
                Padding = PaddingMode.PKCS7
            };


            var cTransform = tdes.CreateEncryptor();
            //transform the specified region of bytes array to resultArray
            var resultArray =
                cTransform.TransformFinalBlock(toEncryptArray, 0,
                    toEncryptArray.Length);
            //Release resources held by TripleDes Encryptor
            tdes.Clear();
            //Return the encrypted data into unreadable string format
            return Convert.ToBase64String(resultArray, 0, resultArray.Length);
        }

        /// <summary>
        /// Decrypt string
        /// </summary>
        /// <param name="encryptedString">string to decrypt</param>
        /// <param name="secureKey">decryption key</param>
        /// <returns>decrypted string</returns>
        private static string DecryptString(string encryptedString, string secureKey)
        {
            var toEncryptArray = Convert.FromBase64String(encryptedString);

            //Get your key from config file to open the lock!
            var key = secureKey;

            //if hashing was used get the hash code with regards to your key
            var hashmd5 = new MD5CryptoServiceProvider();
            var keyArray = hashmd5.ComputeHash(Encoding.UTF8.GetBytes(key));

            hashmd5.Clear();

            //set the secret key for the tripleDES algorithm mode of operation. there are other 4 modes. 
            //We choose ECB(Electronic code Book)
            var tdes = new TripleDESCryptoServiceProvider
            {
                Key = keyArray,
                Mode = CipherMode.ECB,
                Padding = PaddingMode.PKCS7
            };

            //padding mode(if any extra byte added)

            var cTransform = tdes.CreateDecryptor();
            var resultArray = cTransform.TransformFinalBlock(toEncryptArray, 0, toEncryptArray.Length);

            //Release resources held by TripleDes Encryptor                
            tdes.Clear();

            //return the Clear decrypted TEXT
            return Encoding.UTF8.GetString(resultArray);
        }

        #region Common Functions

        /// <summary>
        /// This method retreives the whole entity
        /// </summary>
        /// <param name="entityName">Name of entity</param>
        /// <param name="id">Guid Id of entity</param>
        /// <param name="service">Organization service object</param>
        /// <returns>Entity Object</returns>
        public Entity RetrieveEntitybyId(string entityName, Guid id, IOrganizationService service)
        {
            return service.Retrieve(entityName, id, new ColumnSet(true));
        }


        /// <summary>
        /// Check Approval association with contact
        /// </summary>
        /// <param name="id">Guid of contact</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>true/false</returns>
        public bool IsApprovalAssociatedWithContact(Guid id, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - RetrieveApprovalsbyContactId Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = "cares_approval",
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_contactid",
                            Operator = ConditionOperator.Equal,
                            Values = { id }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0}
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - Going to retrieve multiple : " + query);
            EntityCollection approvalentityCollection = service.RetrieveMultiple(query);

            if (approvalentityCollection != null && approvalentityCollection.Entities != null &&
                approvalentityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved approvals by contact id count is : " + approvalentityCollection.Entities.Count);
                return true;
            }

            return false;
        }


        /// <summary>
        /// Check Approval association with group
        /// </summary>
        /// <param name="groupId">Guid of group</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        public void InactiveGroupApprovalItems(Guid groupId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - InactiveApprovalsAssociatedWithGroup Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = "cares_approvalitem",
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_groupid",
                            Operator = ConditionOperator.Equal,
                            Values = { groupId }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0}
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - InactiveApprovalsAssociatedWithGroup Going to retrieve multiple : " + query);
            EntityCollection approvalItementityCollection = service.RetrieveMultiple(query);

            if (approvalItementityCollection != null && approvalItementityCollection.Entities != null &&
                approvalItementityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved active approvals items by group id count is : " + approvalItementityCollection.Entities.Count);

                foreach (Entity approvalItem in approvalItementityCollection.Entities)
                {
                    SetStateRequest inactiveRequest = new SetStateRequest
                    {
                        EntityMoniker = new EntityReference(approvalItem.LogicalName, approvalItem.Id),
                        State = new OptionSetValue(1),
                        Status = new OptionSetValue(2)
                    };
                    service.Execute(inactiveRequest);
                }
            }
        }


        /// <summary>
        /// Make status inactive of order items
        /// </summary>
        /// <param name="orderId">Guid of Order</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>true/false</returns>
        public bool DeactivateOrderItems(Guid orderId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - DeactivateOrderItems Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = "cares_caresorderitem",
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_orderid",
                            Operator = ConditionOperator.Equal,
                            Values = { orderId }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0}
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - DeactivateOrderItems Going to retrieve multiple : " + query);
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved active order items by order id count is : " + entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();
                Entity entity;

                foreach (var Item in entityCollection.Entities)
                {
                    entity = new Entity("cares_caresorderitem");
                    entity.Id = Item.Id;
                    entity.Attributes["statecode"] = new OptionSetValue(1);
                    entity.Attributes["statuscode"] = new OptionSetValue(750760003);

                    UpdateRequest updateRequest = new UpdateRequest { Target = entity };
                    multipleRequest.Requests.Add(updateRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("multipleResponse IsFaulted : " + multipleResponse.IsFaulted);
                return multipleResponse.IsFaulted;
            }

            return true;
        }


        /// <summary>
        /// Delete order items
        /// </summary>
        /// <param name="orderId">Guid of order</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>true/false</returns>
        public bool DeleteOrderItems(Guid orderId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - DeleteOrderItems Starts...");

            var columns = new ColumnSet(new String[] { "cares_name" });

            var query = new QueryExpression
            {
                EntityName = "cares_caresorderitem",
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_orderid",
                            Operator = ConditionOperator.Equal,
                            Values = { orderId }
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - DeleteOrderItems Going to retrieve multiple : " + query);
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved related order items by order id count is : " + entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();
                Entity entity;

                foreach (var Item in entityCollection.Entities)
                {
                    entity = new Entity("cares_caresorderitem")
                    {
                        Id = Item.Id
                    };

                    DeleteRequest deleteRequest = new DeleteRequest { Target = entity.ToEntityReference() };
                    multipleRequest.Requests.Add(deleteRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("multipleResponse IsFaulted : " + multipleResponse.IsFaulted);
                return multipleResponse.IsFaulted;
            }

            return true;
        }


        /// <summary>
        /// This general function executes multiple request
        /// </summary>
        /// <returns>ExecuteMultipleRequest object</returns>
        private static ExecuteMultipleRequest GetExecuteMultipleRequest()
        {
            var multipleRequest = new ExecuteMultipleRequest()
            {
                Settings = new ExecuteMultipleSettings()
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                },
                Requests = new OrganizationRequestCollection()
            };
            return multipleRequest;
        }


        /// <summary>
        /// Get renewal rule of program
        /// </summary>
        /// <param name="programId">Guid of program</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>integer value of option set enum</returns>
        public int GetProgramRenewalRule(Guid programId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetProgramRenewalRule Starts...");
            var columns = new ColumnSet(true);
            var program = service.Retrieve("cares_program", programId, columns);
            if (program != null)
            {
                trace.Trace("CaresHelper - GetProgramRenewalRule retrieved program...");
                if (program.Attributes.Contains("cares_renewalrule") && program.Attributes["cares_renewalrule"] != null)
                {
                    trace.Trace("CaresHelper - GetProgramRenewalRule renewal value : " + ((OptionSetValue)program.Attributes["cares_renewalrule"]).Value);
                    return ((OptionSetValue)program.Attributes["cares_renewalrule"]).Value;
                }
            }
            return -1;
        }


        /// <summary>
        /// Get age out year of program
        /// </summary>
        /// <param name="programId">Guid of program</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>integer value of option set enum</returns>
        public int GetAgeOutYear(Guid programId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetAgeOutYear Starts...");
            var columns = new ColumnSet(true);
            var program = service.Retrieve("cares_program", programId, columns);
            if (program != null)
            {
                trace.Trace("CaresHelper - GetAgeOutYear retrieved program...");
                trace.Trace($"{program.Attributes["cares_ageoutyear"]} AGEOUT YEAR...");
                if (program.Attributes.Contains("cares_ageoutyear") && program.Attributes["cares_ageoutyear"] != null)
                { 
                    return ((int)program.Attributes["cares_ageoutyear"]);
                }
            }
            return -1;
        }

        /// <summary>
        /// Get expiry rule of program
        /// </summary>
        /// <param name="programId">Guid of program</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>integer value of option set enum</returns>
        public int GetExpiryRule(Guid programId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetExpiryRule Starts...");
            var columns = new ColumnSet(true);
            var program = service.Retrieve("cares_program", programId, columns);
            if (program != null)
            {
                trace.Trace("CaresHelper - GetExpiryRule retrieved program...");
                if (program.Attributes.Contains("cares_expiryrule") && program.Attributes["cares_expiryrule"] != null)
                {
                    trace.Trace("CaresHelper - GetExpiryRule value : " + ((OptionSetValue)program.Attributes["cares_expiryrule"]).Value);
                    return ((OptionSetValue)program.Attributes["cares_expiryrule"]).Value;
                }
            }
            return -1;
        }


        /// <summary>
        /// This function returns contact birth date
        /// </summary>
        /// <param name="contactId">Guid of contact</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>Birth date </returns>
        public DateTime GetContactBirthday(Guid contactId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetContactBirthday Starts...");
            var columns = new ColumnSet(true);
            var contact = service.Retrieve("contact", contactId, columns);
            if (contact != null)
            {
                trace.Trace("CaresHelper - GetContactBirthday retrieved contact...");
                if (contact.Attributes.Contains("birthdate") && contact.Attributes["birthdate"] != null)
                {
                    trace.Trace("CaresHelper - GetContactBirthday birthday value : " + contact.Attributes["birthdate"]);
                    return (DateTime)contact.Attributes["birthdate"];
                }
            }
            return new DateTime(1800, 01, 01);
        }


        /// <summary>
        /// This function is used to fetch key value from configuration entity
        /// </summary>
        /// <param name="Key">Key as string</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>string value</returns>
        public string GetConfigurationKeyValue(string Key, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetConfigurationKeyValue Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = "cares_caresconfiguration",
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_key",
                            Operator = ConditionOperator.Equal,
                            Values = { Key }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0}
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - GetConfigurationKeyValue -  Going to retrieve multiple : " + query);
            EntityCollection approvalentityCollection = service.RetrieveMultiple(query);

            if (approvalentityCollection != null && approvalentityCollection.Entities != null &&
                approvalentityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved GetConfigurationKeyValue is : " + approvalentityCollection.Entities[0].Attributes["cares_value"]);
                return approvalentityCollection.Entities[0].Attributes["cares_value"].ToString();
            }

            return null;
        }


        /// <summary>
        /// It updates the remaining balance and status of order items
        /// </summary>
        /// <param name="approvalItemId">Guid of approval</param>
        /// <param name="balance">Balance as decimal</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true/false</returns>
        public bool UpdateActiveOrderItemsbyApprovalItemId(Guid approvalItemId, decimal balance, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - GetActiveOrderItemsbyApprovalId Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = cares_caresorderitem.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_approvalitemid",
                            Operator = ConditionOperator.Equal,
                            Values = { approvalItemId }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0 } // active order items only
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - GetActiveOrderItemsbyApprovalId Going to retrieve multiple.");
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("CaresHelper - GetActiveOrderItemsbyApprovalId retrieved related order items by approval item id count is : " + entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();

                decimal remainingBalanace = 0;

                foreach (var Item in entityCollection.Entities)
                {
                    remainingBalanace = Item.Attributes["cares_qty"] != null ? Convert.ToDecimal(Item.Attributes["cares_qty"].ToString()) : 0;

                    remainingBalanace = balance - remainingBalanace;

                    cares_caresorderitem cares_Caresorderitem = new cares_caresorderitem
                    {
                        Id = Item.Id,
                        cares_RemainingBalance = remainingBalanace < 0 ? 0 : remainingBalanace,
                    };

                    UpdateRequest updateRequest = new UpdateRequest { Target = cares_Caresorderitem };
                    multipleRequest.Requests.Add(updateRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("CaresHelper - GetActiveOrderItemsbyApprovalId multipleResponse IsFaulted : " + multipleResponse.IsFaulted);
                return multipleResponse.IsFaulted;
            }
            return true;
        }


        /// <summary>
        /// It updates the remaining balance and status of order groups
        /// </summary>
        /// <param name="groupId">Guid of group</param>
        /// <param name="balance">Balance as decimal</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true/false</returns>
        public bool UpdateActiveOrderItemsbyGroupId(Guid groupId, decimal balance, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - UpdateActiveOrderItemsbyGroupId Starts...");

            return true;
        }

        #endregion


        #region Manage Return & Return Items


        /// <summary>
        /// When a Return Item status is set to Inactive 
        /// The system will update the associated Approval Item’s Return Item Count field
        /// It updates return qty
        /// </summary>
        /// <param name="returnItemId">Guid of return item</param>
        /// <param name="orderItemId">Guid of order</param>
        /// <param name="returnQty">Return Qty</param>
        /// <param name="allowCredit">True/false</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">the system will update the associated Approval Item’s Return Item Count field</param>
        /// <param name="executeMultipleRequest">Execute multiple request object</param>
        public void OnDeactivatingReturnItem(Guid returnItemId, Guid orderItemId, int? returnQty, bool? allowCredit, IOrganizationService service, ITracingService trace, ref ExecuteMultipleRequest executeMultipleRequest)
        {
            trace.Trace("CaresHelper - OnDeactivatedReturnItem Starts...");
            cares_caresorderitem orderItem = (cares_caresorderitem)service.Retrieve(cares_caresorderitem.EntityLogicalName, orderItemId, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));

            //Sprint 4 - Manage Return Items
            //  10.5.When a Return Item status is set to Inactive the system will update the associated Order Item’s Returned field by adding the value entered in the Return Qty field
            if (returnQty.HasValue)
            {
                cares_caresorderitem updateOrderItem = new cares_caresorderitem()
                {
                    Id = orderItem.Id,
                    cares_ReturnAmount = returnQty.Value + (orderItem.cares_ReturnAmount.HasValue ? orderItem.cares_ReturnAmount.Value : 0)
                };
                executeMultipleRequest.Requests.Add(new UpdateRequest() { Target = updateOrderItem });
            }

            // 10.6. When a Return Item status is set to Inactive 
            //          the system will update the associated Approval Item’s Return Item Count field
            if (allowCredit.HasValue && allowCredit.Value)
            {
                UpdateReturnItemCountsOnApprovalItemOrGroup(returnItemId, service, trace, ref executeMultipleRequest);

            }
        }

        /// <summary>
        /// Updates status and qty in returns
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true / false</returns>
        public bool DeactivateReturnItemsByInactiveReturn(Guid returnId, IOrganizationService service, ITracingService trace)
        {
            bool returnValue = true;
            trace.Trace("CaresHelper - PrepareToDeactivateReturnItemsByReturnId Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = cares_caresreturnitem.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_returnid",
                            Operator = ConditionOperator.Equal,
                            Values = { returnId }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0 } // active return items only
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - DeactivateReturnItemsByReturnId Going to retrieve multiple.");
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved active return items by return id count is : {0}", entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();
                string returnItemsDetail = "";

                trace.Trace("initializing Return Items Detail variable");
                foreach (var Item in entityCollection.Entities)
                {
                    var returnItemRecord = Item as cares_caresreturnitem;
                    SetStateRequest inactiveRequest = new SetStateRequest
                    {
                        EntityMoniker = new EntityReference(cares_caresreturnitem.EntityLogicalName, returnItemRecord.Id),
                        State = new OptionSetValue((int)cares_caresreturnitemState.Inactive),
                        Status = new OptionSetValue((int)cares_caresreturnitem_statuscode.Inactive)
                    };

                    multipleRequest.Requests.Add(inactiveRequest);

                    //Update Return Items field in Return Entity
                    returnItemsDetail += (returnItemRecord.cares_Quantity.HasValue ? returnItemRecord.cares_Quantity.Value.ToString() : "0") + " - " + (returnItemRecord.cares_Product.Name.Trim() + Environment.NewLine);
                }

                trace.Trace("returnItemsDetail value is : " + returnItemsDetail);

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("Deactivating Return Items, multipleResponse IsFaulted : " + multipleResponse.IsFaulted);
                returnValue = !multipleResponse.IsFaulted;

                trace.Trace("Updating Return Item details in Return");
                cares_caresreturn cares_Caresreturn = new cares_caresreturn();
                cares_Caresreturn.Id = returnId;
                cares_Caresreturn.cares_ReturnItems = returnItemsDetail;
                trace.Trace("Return object intialized now calling Update");
                service.Update(cares_Caresreturn);
                trace.Trace("Return object Updated");
            }

            return returnValue;
        }

        /// <summary>
        /// This method sends email fro return
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <param name="orgName">name of organization</param>
        public void SendReturnAuthorizationEmail(Guid returnId, IOrganizationService service, ITracingService trace, string orgName)
        {
            Guid? noReplyQueueId, pdcReturnAuthorizationQueueId;

            trace.Trace("[INFO] Retrieving the OREO.Notifications and PDC Return Authorization queues...");
            //Retrieve GUIDs of the CARES.Notifications and PDCReturnAuthorization queues for From and To fields
            GetQueueIDs(out noReplyQueueId, out pdcReturnAuthorizationQueueId, service, trace);
            trace.Trace("[INFO] OREO.Notifications queue's id: " + noReplyQueueId.Value + "; PDC Return Authorization queue's ID: " + pdcReturnAuthorizationQueueId.Value);
            // Create the 'From:' activity party for the email
            ActivityParty fromParty = new ActivityParty
            {
                PartyId = new EntityReference(Queue.EntityLogicalName, noReplyQueueId.Value)  // GUID of the "CARES.Notifications" queue // new Guid("D25840BC-AABA-E811-90F5-005056A3B666")) for DEV
                // PartyId = new EntityReference(SystemUser.EntityLogicalName, fromCrmUserGuid.Value) //i.e. of System User
            };
            // Create the 'To:' activity party for the email
            ActivityParty toParty = new ActivityParty
            {
                PartyId = new EntityReference(Queue.EntityLogicalName, pdcReturnAuthorizationQueueId.Value) // GUID of the "PDCReturnAuthorization" queue // new Guid("BC9B557A-ACBA-E811-90F5-005056A3B666")) in DEV
                // PartyId = new EntityReference(SystemUser.EntityLogicalName, fromCrmUserGuid.Value)
            };

            //Create a query expression to get one of Email Template
            QueryExpression queryBuildInTemplates = new QueryExpression
            {
                EntityName = "template",
                ColumnSet = new ColumnSet("templateid", "templatetypecode"),
                Criteria = new FilterExpression()
            };
            queryBuildInTemplates.Criteria.AddCondition("title",
                ConditionOperator.Equal, "Return Authorization");
            RetrieveRequest req = new RetrieveRequest();

            trace.Trace("[INFO] Retrieving the 'Return Authorization' email template...");
            //get order items so that we can update the delivery date
            var template = GetEmailTemplateByTitle("Return Authorization", service, trace);
            if (template != null)
            {
                trace.Trace("[INFO] 'Return Authorization' email template found. Template Id: " + template.Id);
                // Use the InstantiateTemplate message to create an e-mail message using a template.
                InstantiateTemplateRequest instTemplateReq = new InstantiateTemplateRequest
                {
                    TemplateId = template.Id,
                    ObjectId = returnId,
                    ObjectType = cares_caresreturn.EntityLogicalName
                };
                trace.Trace("[INFO] Instantiating new Email Template Request for Return entity...");
                InstantiateTemplateResponse instTemplateResp = (InstantiateTemplateResponse)service.Execute(instTemplateReq);

                if (instTemplateResp != null && instTemplateResp.EntityCollection.Entities.Count > 0)
                {
                    trace.Trace("[INFO] Email Template Request INSTANTIATED for Return entity. ");
                    Email returnEmail = instTemplateResp.EntityCollection.Entities[0] as Email;
                    returnEmail.RegardingObjectId = new EntityReference(cares_caresreturn.EntityLogicalName, returnId); //setting the Regarding as Return
                    returnEmail.To = new ActivityParty[] { toParty };
                    returnEmail.From = new ActivityParty[] { fromParty };
                    returnEmail.DirectionCode = true;

                    // Fetch the list of 
                    string returnRecordsFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>
                                              <entity name='cares_caresreturn'>
                                                <attribute name='cares_caresreturnid' />
                                                <attribute name='cares_returnauthnum' />
                                                <attribute name='cares_returnreason' />
                                                <attribute name='cares_returnreasonname' />
                                                <attribute name='createdon' />
                                                <attribute name='cares_actiontaken' />
                                                <order attribute='cares_returnauthnum' descending='false' />
                                                <filter type='and'>
                                                  <condition attribute='cares_caresreturnid' operator='eq' value='{" + returnId + @"}' />
                                                </filter>
                                                <link-entity name='cares_approval' from='cares_approvalid' to='cares_approvalid' alias='approval'>
                                                  <attribute name='cares_sapnumber' />
                                                  <link-entity name='contact' from='contactid' to='cares_contactid' alias='contact'>
                                                    <attribute name='firstname' />
                                                    <attribute name='lastname' />
                                                    <attribute name='address1_composite' />
                                                    <attribute name='telephone1' />
                                                    <attribute name='telephone2' />
                                                  </link-entity>
                                                </link-entity>
                                                <link-entity name='cares_caresreturnitem' from='cares_returnid' to='cares_caresreturnid' link-type='outer' alias='returnitem'>
                                                    <attribute name='cares_quantity' />
                                                    <attribute name='cares_allowcredit' />
                                                    <attribute name='cares_restockingfee' />
                                                    <attribute name='cares_caresreturnitemid' />                                     
                                                    <link-entity name='cares_caresorderitem' from='cares_caresorderitemid' to='cares_orderitem' link-type='outer' alias='orderitem'>                  <attribute name='cares_qty' />
                                                        <link-entity name='product' from='productid' to='cares_product' link-type='outer' alias='product'>
                                                            <attribute name='vendorpartnumber' />
                                                            <attribute name='productnumber' />
                                                            <attribute name='cares_additionalinfo' />
                                                            <attribute name='name' />
                                                        </link-entity>
                                                        <link-entity name='cares_caresorder' from='cares_caresorderid' to='cares_orderid' link-type='outer' alias='order'>
                                                          <attribute name='cares_ordernumber' />
                                                          <attribute name='cares_sapordernumber' />
                                                        </link-entity>
                                                  </link-entity>               
                                            </link-entity>
                                              </entity>
                                            </fetch>";

                    trace.Trace("[INFO] Retrieving data re. Return, Product, Order, Approval and Return Items list by returnID: " + returnId.ToString());
                    EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));

                    trace.Trace("[INFO] COMPLETED - Retrieving data re. Return, Product, Order, Approval and Return Items list by returnID: " + returnId.ToString());

                    string returntAuthNum = string.Empty, reasonForReturn = string.Empty, actionTaken = string.Empty;
                    DateTime? returnCreatedOn = null;
                    string sapNumber = string.Empty, clientFirstName = string.Empty, clientLastName = string.Empty,
                        clientStreetAddress = string.Empty, clientCityProvinceZipCode = string.Empty, clientCountry = string.Empty,
                        clientShippingAddress = string.Empty,
                        clientHomePhone = string.Empty, clientWorkPhone = string.Empty;
                    List<cares_caresreturnitem> returnItemsList = new List<cares_caresreturnitem>();

                    if (returnRecords.Entities.Count > 0)
                    {
                        var dataRow = returnRecords.Entities[0];

                        if (string.IsNullOrEmpty(returntAuthNum))
                        {
                            if (dataRow.Contains("cares_returnauthnum"))
                            {
                                returntAuthNum = dataRow["cares_returnauthnum"].ToString();
                            }

                            returnEmail.Subject = orgName.ToUpper().Equals("CARESPROD") ? "" : orgName + " " + returnEmail.Subject.Replace("{!ReturnAuthNum;}", returntAuthNum);
                            returnEmail.Description = returnEmail.Description.Replace("{!ReturnAuthNum;}", returntAuthNum);

                            if (dataRow.Contains("approval.cares_sapnumber"))
                            {
                                sapNumber = ((AliasedValue)dataRow["approval.cares_sapnumber"]).Value.ToString();
                            }
                            returnEmail.Subject = returnEmail.Subject.Replace("{!SAPNumber;}", sapNumber);
                            returnEmail.Description = returnEmail.Description.Replace("{!SAPNumber;}", sapNumber);

                            if (dataRow.FormattedValues.ContainsKey("cares_returnreason"))
                            {
                                reasonForReturn = dataRow.FormattedValues["cares_returnreason"];
                            }
                            returnEmail.Subject = returnEmail.Subject.Replace("{!ReasonForReturn;}", reasonForReturn);
                            returnEmail.Description = returnEmail.Description.Replace("{!ReasonForReturn;}", reasonForReturn);

                            if (dataRow.Contains("createdon"))
                            {
                                returnCreatedOn = (DateTime)dataRow["createdon"];
                                returnEmail.Description = returnEmail.Description.Replace("{!Return.CreatedOn;}", returnCreatedOn.Value.ToLocalTime().ToString("MM/dd/yyyy hh:mm tt"));
                            }
                            else
                                returnEmail.Description = returnEmail.Description.Replace("{!Return.CreatedOn;}", string.Empty);

                            if (dataRow.Contains("contact.firstname"))
                            {
                                clientFirstName = ((AliasedValue)dataRow["contact.firstname"]).Value.ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Contact.FirstName;}", clientFirstName);
                            if (dataRow.Contains("contact.lastname"))
                            {
                                clientLastName = ((AliasedValue)dataRow["contact.lastname"]).Value.ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Contact.LastName;}", clientLastName);
                            if (dataRow.Contains("contact.address1_composite"))
                            {
                                clientShippingAddress = ((AliasedValue)dataRow["contact.address1_composite"]).Value.ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Contact.ShippingAddress;}", clientShippingAddress);
                            if (dataRow.Contains("contact.telephone2"))
                            {
                                clientHomePhone = ((AliasedValue)dataRow["contact.telephone2"]).Value.ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Contact.HomePhone;}", clientHomePhone);
                            if (dataRow.Contains("contact.telephone1"))
                            {
                                clientWorkPhone = ((AliasedValue)dataRow["contact.telephone1"]).Value.ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Contact.WorkPhone;}", clientWorkPhone);
                            if (dataRow.Contains("cares_actiontaken"))
                            {
                                actionTaken = dataRow["cares_actiontaken"].ToString();
                            }
                            returnEmail.Description = returnEmail.Description.Replace("{!Return.ActionTaken;}", actionTaken);

                            //if (dataRow.Contains("contact.address1_line1"))
                            //{
                            //    clientStreetAddress = dataRow["contact.address1_line1"].ToString();
                            //}

                            //Contact c; c.Address1_City, c.Address1_StateOrProvince, c.Address1_PostalCode
                        }

                        StringBuilder returnItemHtmlTable = new StringBuilder();
                        string qtyToReturn, qtyOrdered, materialNumber, productDesc, orderNumber, sapOrderNumber, allowCredit, restockingFee;
                        // Build the Return Items list
                        foreach (var ri in returnRecords.Entities)
                        {
                            if (ri.Contains("returnitem.cares_quantity"))
                                qtyToReturn = ((AliasedValue)ri["returnitem.cares_quantity"]).Value.ToString();
                            else
                                qtyToReturn = string.Empty;
                            if (ri.Contains("orderitem.cares_qty"))
                                qtyOrdered = ((AliasedValue)ri["orderitem.cares_qty"]).Value.ToString();
                            else
                                qtyOrdered = string.Empty;
                            if (ri.Contains("product.productnumber"))
                                materialNumber = ((AliasedValue)ri["product.productnumber"]).Value.ToString();
                            else
                                materialNumber = string.Empty;
                            if (ri.Contains("product.name"))
                                productDesc = ((AliasedValue)ri["product.name"]).Value.ToString();
                            else
                                productDesc = string.Empty;
                            if (ri.Contains("order.cares_ordernumber"))
                            {
                                orderNumber = ((AliasedValue)ri["order.cares_ordernumber"]).Value.ToString().Replace("CO-", "");
                            }
                            else
                                orderNumber = string.Empty;
                            if (ri.Contains("order.cares_sapordernumber"))
                            {
                                sapOrderNumber = ((AliasedValue)ri["order.cares_sapordernumber"]).Value.ToString();
                            }
                            else
                                sapOrderNumber = string.Empty;

                            if (ri.Contains("returnitem.cares_allowcredit"))
                            {
                                trace.Trace("[INFO] returnitem.cares_allowcredit found : " + ((AliasedValue)ri["returnitem.cares_allowcredit"]).Value);
                                allowCredit = ((Boolean)((AliasedValue)ri["returnitem.cares_allowcredit"]).Value) ? "Yes" : "No";
                            }
                            else
                                allowCredit = string.Empty;
                            if (ri.Contains("returnitem.cares_restockingfee"))
                            {
                                trace.Trace("[INFO] returnitem.cares_restockingfee found : " + ((AliasedValue)ri["returnitem.cares_restockingfee"]).Value);
                                restockingFee = ((Boolean)((AliasedValue)ri["returnitem.cares_restockingfee"]).Value) ? "Yes" : "No";
                            }
                            else
                                restockingFee = string.Empty;

                            returnItemHtmlTable.Append("<tr><td>" + qtyToReturn + "</td>");
                            returnItemHtmlTable.Append("<td>" + qtyOrdered + "</td>");
                            returnItemHtmlTable.Append("<td>" + materialNumber + "</td>");
                            returnItemHtmlTable.Append("<td>" + productDesc + "</td>");
                            returnItemHtmlTable.Append("<td>" + orderNumber + "</td>");
                            returnItemHtmlTable.Append("<td>" + sapOrderNumber + "</td>");
                            returnItemHtmlTable.Append("<td>" + allowCredit + "</td>");
                            returnItemHtmlTable.Append("<td>" + restockingFee + "</td>");

                            returnItemHtmlTable.Append("</tr>");
                        }
                        if (returnItemHtmlTable.Length > 0)
                        {
                            returnItemHtmlTable.Insert(0, @"<table id='returnitems'><tr><td><b>Qty To Return</b></td><td><b>Qty Ordered</b></td><td><b>Material Number</b></td><td><b>Description</b></td><td><b>Order Number</b></td><td><b>SAP Order Number #</b></td><td><b>Allow Credit</b></td><td><b>Restocking Fee</b></td></tr>"); //<td><b>PO Number #</b></td>
                            returnItemHtmlTable.Append("</table>");
                        }

                        string emailDescriptionCSS = @"<style>
                                                        #returnitems {
                                                            border-collapse: collapse;
                                                        }
                                                        #returnitems, #returnitems td, #returnitems th {
                                                            border: 1px solid black;
                                                        }
                                                        </style>";

                        returnEmail.Description = returnEmail.Description.Replace("{!Return.ReturnItems;}", returnItemHtmlTable.ToString()) + emailDescriptionCSS;
                        if (returnEmail.Subject.Length > 200)
                        {
                            returnEmail.Subject = returnEmail.Subject.Substring(0, 197) + "...";
                        }

                        CreateRequest createReq = new CreateRequest();
                        createReq.Target = returnEmail;

                        trace.Trace("[INFO] Creating new Return Authorization email...");
                        CreateResponse organizationResponse = service.Execute(createReq) as CreateResponse;
                        trace.Trace("[INFO] New Return Authorization email CREATED.");

                        if (organizationResponse != null && Guid.Empty != organizationResponse.id)
                        {
                            trace.Trace("[INFO] Request to send Return Authorization email...");
                            SendEmailRequest sendEmailreq = new SendEmailRequest
                            {
                                EmailId = organizationResponse.id,
                                TrackingToken = "",
                                IssueSend = true
                            };
                            SendEmailResponse sendEmailresp
                                    = (SendEmailResponse)service.Execute(sendEmailreq);
                            trace.Trace("[INFO] Request of sending Return Authorization email SUBMITTED. Email is in 'Pending Sent' status.");
                        }
                    }
                    else
                    {
                        throw new InvalidPluginExecutionException("No any return items found for this return.");
                    }
                }
                else
                {
                    throw new InvalidPluginExecutionException("'Return Authorization' Email can NOT be instantiated.");
                }
            }
            else
            {
                throw new InvalidPluginExecutionException("'Return Authorization' email template is NOT found.");
            }
        }

        /// <summary>
        /// This method checks whether item is active or inactive in returns
        /// </summary>
        /// <param name="returnItemId">Guid of return item</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>True/false</returns>
        public bool IsReturnItemInactive(Guid returnItemId, IOrganizationService service, ITracingService trace)
        {
            bool returnValue = false;
            cares_caresreturnitem orderItem = (cares_caresreturnitem)service.Retrieve(cares_caresreturnitem.EntityLogicalName, returnItemId
                                                    , new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
            if (orderItem.statecode.HasValue && orderItem.statecode.Value == cares_caresreturnitemState.Inactive)
                returnValue = true;

            return returnValue;
        }

        /// <summary>
        /// This method check status of return
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>True/False</returns>
        public bool IsReturnInactive(Guid returnId, IOrganizationService service, ITracingService trace)
        {
            bool returnValue = false;
            cares_caresreturn returRecord = (cares_caresreturn)service.Retrieve(cares_caresreturn.EntityLogicalName, returnId
                                                    , new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
            if (returRecord.statecode.HasValue && returRecord.statecode.Value == cares_caresreturnState.Inactive)
                returnValue = true;

            return returnValue;
        }

        /// <summary>
        /// It deactivates return items
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true: if success | false: if failed</returns>
        public bool PrepareToDeactivateReturnItemsByReturnId(Guid returnId, Guid approvalId, IOrganizationService service, ITracingService trace)
        {
            bool returnValue = true;
            trace.Trace("CaresHelper - PrepareToDeactivateReturnItemsByReturnId Starts...");
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = cares_caresreturnitem.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_returnid",
                            Operator = ConditionOperator.Equal,
                            Values = { returnId }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0 } // active return items only
                        }
                    }
                }
            };

            trace.Trace("CaresHelper - DeactivateReturnItemsByReturnId Going to retrieve multiple.");
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved active return items by return id count is : " + entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();
                var recaculateApprovalAllotment = false;
                foreach (var Item in entityCollection.Entities)
                {
                    var returnItemRecord = Item as cares_caresreturnitem;
                    // Add requests to calculate Return Qty of Approval Item or Group
                    OnDeactivatingReturnItem(returnItemRecord.Id, returnItemRecord.cares_OrderItem.Id, returnItemRecord.cares_Quantity, returnItemRecord.cares_AllowCredit, service, trace, ref multipleRequest);

                    if (!recaculateApprovalAllotment
                        && returnItemRecord.cares_AllowCredit.HasValue && returnItemRecord.cares_AllowCredit.Value)
                    {
                        recaculateApprovalAllotment = true;
                    }
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("multipleResponse IsFaulted : " + multipleResponse.IsFaulted);

                returnValue = !multipleResponse.IsFaulted;
                if (returnValue && recaculateApprovalAllotment)
                {
                    var allotmentCalculationFromPlugin = new AllotmentCalculationFromPlugin() { UpdateAllotmentCycleDate = false };
                    trace.Trace("Passing parameter UpdateAllotmentCycleDate:false ");
                    allotmentCalculationFromPlugin.SetApprovalAllotmentfromPlugin(approvalId, service, trace);
                }

                return returnValue;
            }
            else
            {
                trace.Trace("No active return items for returnId: " + returnId);
            }

            return returnValue;
        }

        /// <summary>
        /// It assigns MCFD team to return items
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="ownerId">Guid of MCFD team</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true/false</returns>
        public bool AssignReturnAndReturnItemsToMCFDteam(Guid returnId, Guid ownerId, IOrganizationService service, ITracingService trace)
        {
            trace.Trace("CaresHelper - AssignReturnAndReturnItemsToMCFDteam Starts...");
            if (IsReturnAssociatedToMCFDProgram(returnId, service, trace))
            {
                trace.Trace("[INFO] the parent Approval Record is associated to a Program where the IS MCFD value is YES. Updating owner to MCFD team...");
            }
            else
            {
                trace.Trace("[INFO] the parent Approval Record is associated to a Program where the IS MCFD value is NO --> No need to assign ownership to MCFD team.");
                return false;
            }

            Guid? mcfdTeamId = GetMCFDTeamId(service, trace);
            if (!mcfdTeamId.HasValue)
            {
                trace.Trace("[ERROR] MCFD team is not found.");
                return false;
            }
            else
            {
                trace.Trace("[INFO] MCFD team's ID retrieved: ." + mcfdTeamId.Value);

            }

            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = cares_caresreturnitem.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "cares_returnid",
                            Operator = ConditionOperator.Equal,
                            Values = { returnId }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);

            if (entityCollection != null && entityCollection.Entities != null &&
                entityCollection.Entities.ToList().Any())
            {
                trace.Trace("retrieved return items by return id count is : " + entityCollection.Entities.Count);

                var multipleRequest = GetExecuteMultipleRequest();
                AssignRequest assign;
                if (ownerId != mcfdTeamId.Value)
                {
                    trace.Trace("[INFO] Adding request to assign the Return to MCFD.");
                    // Create the Request Object and Set the Request Object's Properties
                    assign = new AssignRequest
                    {
                        Assignee = new EntityReference(Team.EntityLogicalName, mcfdTeamId.Value),
                        Target = new EntityReference(cares_caresreturn.EntityLogicalName, returnId)
                    };
                    //Assign return to MCFD
                    multipleRequest.Requests.Add(assign);
                }
                else
                    trace.Trace("[INFO] Return is already owned by MCFD.");

                foreach (var Item in entityCollection.Entities)
                {
                    var returnItemRecord = Item as cares_caresreturnitem;

                    if (returnItemRecord.OwnerId.Id != mcfdTeamId.Value)
                    {
                        trace.Trace("[INFO] Adding request to assign the Return Item to MCFD. (ReturnItemId: {0})", returnItemRecord.Id);
                        // Create the Request Object and Set the Request Object's Properties
                        assign = new AssignRequest
                        {
                            Assignee = new EntityReference(Team.EntityLogicalName, mcfdTeamId.Value),
                            Target = new EntityReference(cares_caresreturnitem.EntityLogicalName, returnItemRecord.Id)
                        };
                        multipleRequest.Requests.Add(assign);
                    }
                    else
                        trace.Trace("[INFO] Return Item is already owned by MCFD. (ReturnItemId: {0})", returnItemRecord.Id);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                trace.Trace("multipleResponse IsFaulted : " + multipleResponse.IsFaulted);
                return multipleResponse.IsFaulted;
            }

            return false;
        }

        /// <summary>
        /// It assigns MCFD team to return programs
        /// </summary>
        /// <param name="returnId">Guid of return</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <returns>true/false</returns>
        public bool IsReturnAssociatedToMCFDProgram(Guid returnId, IOrganizationService service, ITracingService trace)
        {
            // Fetch the list of return which has the parent Approval Record is associated to a Program where the IS MCFD value is Yes.
            string returnRecordsFetch = @" <fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
                                          <entity name='cares_caresreturn'>
                                            <attribute name='cares_caresreturnid' />
                                            <attribute name='cares_name' />
                                            <attribute name='createdon' />
                                            <order attribute='cares_name' descending='false' />
                                            <filter type='and'>
                                              <condition attribute='cares_caresreturnid' operator='eq' uitype='cares_caresreturn' value='{"
                                                    + returnId + @"}' />
                                            </filter>
                                            <link-entity name='cares_approval' from='cares_approvalid' to='cares_approvalid' alias='approval'>
                                              <link-entity name='cares_program' from='cares_programid' to='cares_programid' alias='program'>
                                                <filter type='and'>
                                                  <condition attribute='cares_mcfd' operator='eq' value='1' />
                                                </filter>
                                              </link-entity>
                                            </link-entity>
                                          </entity>
                                        </fetch>";

            EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            if (returnRecords.Entities.Count > 0)
                return true;
            else
                return false;
        }

        /// <summary>
        /// This method return MCFD user guid
        /// </summary>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>Guid of MCFD user</returns>
        public Guid? GetMCFDTeamId(IOrganizationService service, ITracingService trace)
        {
            Guid? returnValue = null;

            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = Team.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "name",
                            Operator = ConditionOperator.Equal,
                            Values = { "MCFD" }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);
            if (entityCollection.Entities.Count > 0)
            {
                returnValue = entityCollection.Entities[0].Id;

            }

            return returnValue;
        }

        /// <summary>
        /// It updates the returned items count
        /// </summary>
        /// <param name="returnItemId">Return Item Id as Guid</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        /// <param name="multiReq">Exectuion object for multiple request</param>
        public void UpdateReturnItemCountsOnApprovalItemOrGroup(Guid returnItemId, IOrganizationService service, ITracingService trace, ref ExecuteMultipleRequest multiReq)
        {
            // Fetch the list of approval items & groups which has the parent Approval Record is associated to the Return Item (by returnItemId.
            string returnRecordsFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>
                                              <entity name='cares_approvalitem'>
                                                <attribute name='cares_approval' />
                                                <attribute name='cares_approvalitemid' />
                                                <attribute name='cares_itemsreturned' />
                                                <attribute name='cares_itemsordered' />
                                                <attribute name='cares_substituteditemid' />
                                                <attribute name='cares_returnitemcount' />
                                                <attribute name='cares_groupid' />
                                                <attribute name='statuscode' />
                                                <attribute name='statecode' />
                                                <attribute name='cares_allotmentstartdate' />
                                                <order attribute='cares_approval' descending='false' />
                                                <link-entity name='cares_approval' from='cares_approvalid' to='cares_approval' alias='approval'>
                                                  <attribute name='cares_nextrenewaldate' />
                                                  <attribute name='cares_startdate' />
                                                  <link-entity name='cares_caresorder' from='cares_approvalid' to='cares_approvalid' alias='order_filter'>
                                                    <link-entity name='cares_caresorderitem' from='cares_orderid' to='cares_caresorderid' alias='orderitem_filter'>
                                                      <link-entity name='cares_caresreturnitem' from='cares_orderitem' to='cares_caresorderitemid' alias='returnitem_filter'>
                                                        <filter type='and'>
                                                          <condition attribute='cares_caresreturnitemid' operator='eq' value='{"
                                                               + returnItemId + @"}' />
                                                        </filter>
                                                      </link-entity>
                                                    </link-entity>
                                                  </link-entity>
                                                </link-entity>
                                                <link-entity name='product' from='productid' to='cares_productid' visible='false' link-type='outer' alias='product'>
                                                  <attribute name='cares_caresunitquantity' />
                                                </link-entity>
                                                <link-entity name='cares_approvalitemgroup' from='cares_approvalitemgroupid' to='cares_groupid' visible='false' link-type='outer' alias='approvalitemgroup'>
                                                  <attribute name='cares_approvalitemgroupid' />
                                                  <attribute name='cares_returnitemcount' />
                                                  <attribute name='cares_allotmentstartdate' />
                                                </link-entity>
	                                            <link-entity name='cares_caresorderitem' from='cares_approvalitemid' to='cares_approvalitemid' link-type='outer' alias='orderitem'>
                                                    <attribute name='createdon' />
                                                  <link-entity name='cares_caresreturnitem' from='cares_orderitem' to='cares_caresorderitemid' link-type='outer' alias='returnitem'>
		                                            <attribute name='cares_caresreturnitemid' />
		                                            <attribute name='cares_quantity' />
		                                            <attribute name='cares_allowcredit' />
	                                              </link-entity>
                                                    <link-entity name='cares_caresorder' from='cares_caresorderid' to='cares_orderid' link-type='outer' alias='order'>
                                                      <attribute name='cares_sapordernumberpopulatedon' />
                                                    </link-entity>
                                                </link-entity>
                                              </entity>
                                            </fetch>";
            trace.Trace("[INFO] Retrieving Approval Items & Groups by ReturnItem's Approval's FetchXML: {0}", returnRecordsFetch);
            EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            //returnRecords collection above contains ALL the Approval Items of the Return Items's associated Approval, 
            //  this collection includes also the Approval Item which is associated to the Order Item of this Return Item.

            //Implement Req. 10.6: When a Return Item status is set to Inactive the system will update the associated Approval Item’s Return Item Count field if the following conditions are met https://jira.vic.cgi.com/browse/CARE-244
            if (returnRecords.Entities.Count > 0)
            {
                Guid? associatedApprovalItemId = null;
                DateTime? approvalItemAllotmentStartDate = null;
                DateTime? groupAllotmentStartDate = null;
                DateTime? sapOrderNumberPopulatedOn = null;
                int productUnitQty = 1;
                int returnItemQty = 0;
                Guid? associatedGroupId = null;
                decimal currentReturnItemCount = 0;
                int currentReturnItemEach = 0;
                OptionSetValue approvalItemStateCode = null; //active
                Dictionary<Guid, KeyValuePair<Guid, int>> substituteApprovalItems = new Dictionary<Guid, KeyValuePair<Guid, int>>();

                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Approval Items found for the Return Item's Id: " + returnItemId);
                //debug
                //foreach (KeyValuePair<string, object> kvp in returnRecords.Entities[0].Attributes)
                //{
                //    trace.Trace("Key: " + kvp.Key + ", Object type: " + kvp.Value.ToString());
                //}
                foreach (var dataRow in returnRecords.Entities)
                {

                    approvalItemStateCode = (OptionSetValue)dataRow["statecode"];
                    if (dataRow.Contains("returnitem.cares_caresreturnitemid"))
                    {
                        Guid? retrievedReturnItemId = ((AliasedValue)dataRow["returnitem.cares_caresreturnitemid"]).Value as Guid?;

                        // substituteApprovalItems
                        if (retrievedReturnItemId.HasValue && retrievedReturnItemId.Value.Equals(returnItemId))
                        {
                            trace.Trace("[INFO] Rows with details found for the Return Item's Id: " + returnItemId);
                            // this row contains details (Approval Item, Group, Order, Product etc...) of the specified Return Item.
                            associatedApprovalItemId = dataRow["cares_approvalitemid"] as Guid?;
                            if (dataRow.Contains("cares_allotmentstartdate"))
                            {
                                approvalItemAllotmentStartDate = dataRow["cares_allotmentstartdate"] as DateTime?;
                            }
                            if (dataRow.Contains("order.cares_sapordernumberpopulatedon"))
                            {
                                sapOrderNumberPopulatedOn = ((AliasedValue)dataRow["order.cares_sapordernumberpopulatedon"]).Value as DateTime?;
                            }
                            if (dataRow.Contains("product.cares_caresunitquantity"))
                            {
                                productUnitQty = (int)((AliasedValue)dataRow["product.cares_caresunitquantity"]).Value;
                            }
                            if (dataRow.Contains("returnitem.cares_quantity"))
                            {
                                returnItemQty = (int)((AliasedValue)dataRow["returnitem.cares_quantity"]).Value;
                            }
                            if (dataRow.Contains("cares_groupid"))
                            {
                                // Approval Item is associated to a Group --> Logics will apply to Group only (not Approval Item).
                                associatedGroupId = ((EntityReference)dataRow["cares_groupid"]).Id;
                                if (dataRow.Contains("approvalitemgroup.cares_returnitemcount"))
                                {
                                    currentReturnItemCount = (decimal)((AliasedValue)dataRow["approvalitemgroup.cares_returnitemcount"]).Value;
                                }
                                if (dataRow.Contains("approvalitemgroup.cares_allotmentstartdate"))
                                {
                                    groupAllotmentStartDate = ((AliasedValue)dataRow["approvalitemgroup.cares_allotmentstartdate"]).Value as DateTime?;
                                }
                            }
                            else
                            {
                                // Approval Item is NOT associated to a Group --> Logics will apply to Approval Item or its substituting Approval Items (not Group).
                                if (dataRow.Contains("cares_itemsreturned")) // Items Returned Each on Approval Item
                                {
                                    currentReturnItemEach = (int)dataRow["cares_itemsreturned"];
                                }
                                if (dataRow.Contains("cares_returnitemcount")) // Return Items Count on Approval Item
                                {
                                    currentReturnItemCount = (decimal)dataRow["cares_returnitemcount"];
                                }
                            }
                            if (approvalItemStateCode.Value == 0 // Active Approval Item
                                || associatedGroupId.HasValue)
                            {
                                // Active Approval Item (no substitution involved) or Approval Item Group scenario
                                //  --> no need to build the logics to find the active Sustitue Approval
                                break;
                            }
                        }
                    }
                    else if (dataRow.Contains("cares_substituteditemid"))
                    {
                        var substitutedApprovalItemId = ((EntityReference)dataRow["cares_substituteditemid"]).Id;
                        // Prepare for Finding the Substitute Approval Item
                        if (!substituteApprovalItems.ContainsKey(substitutedApprovalItemId))
                        {
                            substituteApprovalItems.Add(substitutedApprovalItemId, // is the GUID of the Approval Item which has been substituted. 
                                new KeyValuePair<Guid, int>(dataRow.Id, approvalItemStateCode.Value)
                            // KeyValuePair's Guid is the GUID of the Approval Item which is used to substitute; int value is the substituting Approval Item's statecode
                            );
                        }
                    }
                }
                if (sapOrderNumberPopulatedOn.HasValue)
                {
                    if ((!groupAllotmentStartDate.HasValue && approvalItemAllotmentStartDate.HasValue && sapOrderNumberPopulatedOn.Value >= approvalItemAllotmentStartDate.Value) // The associated Order Item’s Created Date is greater than or equal to the Associated Approval’s Next Renewal Date if next renewal date is NOT NULL
                        || (groupAllotmentStartDate.HasValue && sapOrderNumberPopulatedOn.Value >= groupAllotmentStartDate.Value)) // OR The associated Order Item’s Created Date is greater than or equal to the Associated Approval’s Start Date if next renewal date is NULL
                    {

                        var returnItemEachToAdd = productUnitQty * returnItemQty;
                        if (returnItemEachToAdd > 0)
                        {
                            if (associatedGroupId.HasValue)
                            {
                                // Approval Item is associated to a Group --> Update Group only (not Approval Item).
                                cares_approvalitemgroup updateGroup = new cares_approvalitemgroup();
                                updateGroup.Id = associatedGroupId.Value;
                                updateGroup.cares_ReturnItemCount = currentReturnItemCount + returnItemEachToAdd; // currentReturnItemCount contains the current Return Item Count of the Approval Item Group
                                //Group return item count should be update in every item
                                ////multiReq.Requests.Add(new UpdateRequest() { Target = updateGroup });
                                service.Update(updateGroup);
                            }
                            else
                            {
                                cares_approvalitem updateApprovalItem = new cares_approvalitem();
                                if (!associatedApprovalItemId.HasValue || approvalItemStateCode == null)
                                {
                                    // No approval items found for the return item --> warning
                                    throw new InvalidPluginExecutionException("No approval items found for the return item. ReturnItemID: " + returnItemId);
                                }
                                else if (approvalItemStateCode.Value == 0)
                                {
                                    // Approval Item is Active --> update Approval Item
                                    updateApprovalItem.Id = associatedApprovalItemId.Value;
                                }
                                else
                                {
                                    // Approval Item is Inactive which has been substituted by another Approval Item
                                    //  --> look for the substitute Approval which is Active in the Substitution chain. 
                                    // Note: mbe there are more than 1 substitute approval items in the chain
                                    Guid substituteApprovalItemId = associatedApprovalItemId.Value;
                                    int substituteApprovalItemStateCode = 1; // inactive
                                    while (substituteApprovalItemStateCode == 1)
                                    {
                                        if (substituteApprovalItems.ContainsKey(substituteApprovalItemId))
                                        {
                                            KeyValuePair<Guid, int> kvp = substituteApprovalItems[substituteApprovalItemId];
                                            substituteApprovalItemId = kvp.Key;
                                            substituteApprovalItemStateCode = kvp.Value;
                                        }
                                        else
                                        {
                                            break;
                                        }
                                    }
                                    if (substituteApprovalItemStateCode == 0)
                                    {
                                        // A ACTIVE Substitute Approval Item found --> update it
                                        updateApprovalItem.Id = substituteApprovalItemId;
                                    }
                                    else
                                    {
                                        throw new InvalidPluginExecutionException("No any ACTIVE substitute approval items found for the return item. ReturnItemID: " + returnItemId);
                                    }
                                }
                                if (updateApprovalItem.Id != Guid.Empty)
                                {
                                    // Items Returned Each on Approval Item
                                    updateApprovalItem.cares_ItemsReturned = currentReturnItemEach + returnItemEachToAdd;
                                    // Return Items Count on Approval Item
                                    updateApprovalItem.cares_ReturnItemCount = currentReturnItemCount + returnItemQty;
                                    //Approval Item return item count should be update in every item
                                    //multiReq.Requests.Add(new UpdateRequest() { Target = updateApprovalItem });
                                    service.Update(updateApprovalItem);
                                }
                            }
                        }
                        else
                        {
                            trace.Trace("[WARNING] Product's Unit Qty or Return Item's Return Qty is ZERO. No update for Approval Item or Group. ProductUnitQty: {0}, ReturnItemQty: {1}",
                                            productUnitQty, returnItemQty);
                        }
                    }
                    else
                    {
                        trace.Trace("[INFO] No update on the Approval Item / Group 's Return Item Count fields as conditions are not matched for the Order Item's Created Date and Approval Item's Next Renewal Date and Start Date. OrderItem's CreatedDate: {0}, ApprovalItem's Next Renewal Date: {1}, ApprovalItem's Start Date: {2}",
                                        sapOrderNumberPopulatedOn.Value.ToString("MM/dd/yy HH:mm"),
                                        approvalItemAllotmentStartDate.HasValue ? approvalItemAllotmentStartDate.Value.ToString("MM/dd/yy HH:mm") : "null",
                                        groupAllotmentStartDate.HasValue ? groupAllotmentStartDate.Value.ToString("MM/dd/yy HH:mm") : "null");
                    }
                }
                // Leaving commented out to test incase we need to add this back later, user's should still be able to return deleted approval items
                // else
                // {
                //     trace.Trace("[ERROR] SAP Order Number Populated On of an associated Order does NOT contain data.");
                //     throw new InvalidPluginExecutionException("[ERROR] SAP Order Number Populated On of an associated Order does NOT contain data.");
                // }
            }
            else
            {
                trace.Trace("[WARNING] No any Approval Items found for the Return Item's Approval. Return Item's Id: " + returnItemId);
            }
        }

        #endregion

        #region Manage System Users

        /// <summary>
        /// This function return User Id guid
        /// </summary>
        /// <param name="userDomainName">Domain name</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns>Guid of User</returns>
        public static Guid? GetSystemUserIdByDomainName(string userDomainName, IOrganizationService service, ITracingService trace)
        {
            Guid? returnValue = null;
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = SystemUser.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "DomainName",
                            Operator = ConditionOperator.Equal,
                            Values = { "userDomainName" }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);
            if (entityCollection.Entities.Count > 0)
            {
                returnValue = entityCollection.Entities[0].Id;
            }

            return returnValue;
        }

        #endregion

        #region Manage Email & Email Template


        /// <summary>
        /// This e=method returns email template entity
        /// </summary>
        /// <param name="title">title of email</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns></returns>
        public static Entity GetEmailTemplateByTitle(string title, IOrganizationService service, ITracingService trace)
        {
            Entity returnValue = null;
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = Template.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "title",
                            Operator = ConditionOperator.Equal,
                            Values = { title }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);
            if (entityCollection.Entities.Count > 0)
            {
                returnValue = entityCollection.Entities[0];
            }

            return returnValue;
        }

        #endregion

        #region Manage CARES Configs

        /// <summary>
        /// This method picks the configuration from oreo configuration entity
        /// </summary>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        /// <returns></returns>
        public static Dictionary<string, string> GetCaresConfigurations(IOrganizationService service, ITracingService trace)
        {
            Dictionary<string, string> results = new Dictionary<string, string>();
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = cares_caresconfiguration.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.And,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "statecode",
                            Operator = ConditionOperator.Equal,
                            Values = { 0 }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);
            if (entityCollection.Entities.Count > 0)
            {
                foreach (var record in entityCollection.Entities)
                {
                    cares_caresconfiguration caresConfig = record as cares_caresconfiguration;
                    if (!results.ContainsKey(caresConfig.cares_key))
                    {
                        results.Add(caresConfig.cares_key, caresConfig.cares_Value);
                    }
                }
            }

            return results;
        }

        #endregion

        #region Manage Queue

        /// <summary>
        /// This method sets the Queue Ids
        /// </summary>
        /// <param name="noReplyQueueId">Oreo Notification Queue Id</param>
        /// <param name="pdcReturnAuthorizationQueueId">PDC return authorization Queue Id</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">Tracing service object</param>
        public static void GetQueueIDs(out Guid? noReplyQueueId, out Guid? pdcReturnAuthorizationQueueId, IOrganizationService service, ITracingService trace)
        {
            noReplyQueueId = null;
            pdcReturnAuthorizationQueueId = null;
            var columns = new ColumnSet(true);
            var query = new QueryExpression
            {
                EntityName = Queue.EntityLogicalName,
                ColumnSet = columns,
                Criteria = new FilterExpression
                {
                    FilterOperator = LogicalOperator.Or,
                    Conditions =
                    {
                        new ConditionExpression
                        {
                            AttributeName = "name",
                            Operator = ConditionOperator.Equal,
                            Values = { "OREO.Notifications" }
                        },
                        new ConditionExpression
                        {
                            AttributeName = "name",
                            Operator = ConditionOperator.Equal,
                            Values = { "PDCReturnAuthorization" }
                        }
                    }
                }
            };
            EntityCollection entityCollection = service.RetrieveMultiple(query);
            if (entityCollection.Entities.Count > 0)
            {
                foreach (var record in entityCollection.Entities)
                {
                    Queue queueRecord = record as Queue;
                    if (queueRecord.Name == "OREO.Notifications")
                    {
                        noReplyQueueId = queueRecord.Id;
                    }
                    else if (queueRecord.Name == "PDCReturnAuthorization")
                    {
                        pdcReturnAuthorizationQueueId = queueRecord.Id;
                    }
                }
            }
        }


        #endregion

        #region Manage Contact

        /// <summary>
        /// This method updates the full name in approvals , orders and returns
        /// This method is obsoleted
        /// </summary>
        /// <param name="contactId">Guid of contact</param>
        /// <param name="firstName">First name of contact</param>
        /// <param name="lastName">Last name of contact</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        public void OnContactFullNameUpdating(Guid contactId, string firstName, string lastName, IOrganizationService service, ITracingService trace)
        {
            List<OrganizationRequest> orgRequests = new List<OrganizationRequest>();

            // Retrieve the Orders and Approvals associated with Contact.
            // Fetch the list of approval items & groups which has the parent Approval Record is associated to the Return Item (by contactId).
            string returnRecordsFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>
                                          <entity name='cares_approval'>
                                            <attribute name='cares_approvalid' />
                                            <attribute name='cares_name' />
                                            <order attribute='cares_name' descending='false' />
                                            <filter type='and'>
                                              <condition attribute='cares_contactid' operator='eq' uitype='contact' value='{"
                                                               + contactId + @"}' />
                                            </filter>
                                            <link-entity name='cares_caresorder' from='cares_approvalid' to='cares_approvalid' alias='order' link-type='outer' >
                                              <attribute name='cares_caresorderid' />
	                                          <attribute name='createdon' />
                                            </link-entity>
                                            <link-entity name='cares_program' from='cares_programid' to='cares_programid' link-type='inner' alias='pa'>
                                              <attribute name='cares_name' />
                                            </link-entity>
                                          </entity>
                                        </fetch>";
            trace.Trace("[INFO] Retrieving Approvals and Orders by ContactId. FetchXML: {0}", returnRecordsFetch);
            EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            //returnRecords collection above contains ALL the Orders including Approvals of the Contact.

            Dictionary<Guid, string> approvalRefCollection = new Dictionary<Guid, string>();
            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Orders found for the Contact's Id: " + contactId);
                //debug
                //foreach (KeyValuePair<string, object> kvp in returnRecords.Entities[0].Attributes)
                //{
                //    trace.Trace("Key: " + kvp.Key + ", Object type: " + kvp.Value.ToString());
                //}
                foreach (var dataRow in returnRecords.Entities)
                {
                    var approvalId = (Guid)dataRow["cares_approvalid"];

                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);

                    var approvalName = string.Format("{0} {1} - {2}", lastName, firstName, programShortName);
                    trace.Trace("[INFO] approvalName : " + approvalName);

                    if (!approvalRefCollection.ContainsKey(approvalId))
                    {
                        approvalRefCollection.Add(approvalId, approvalName);
                        var entity = new Entity("cares_approval");
                        entity.Id = approvalId;
                        entity.Attributes["cares_name"] = approvalName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }

                    var orderCreatedOn = dataRow.Contains("order.createdon") == true ? (DateTime)((AliasedValue)dataRow["order.createdon"]).Value : DateTime.MinValue;
                    var orderName = string.Format("{0} - {1}/{2}/{3}", approvalName, orderCreatedOn.Month, orderCreatedOn.Day, orderCreatedOn.Year);
                    if (dataRow.Contains("order.cares_caresorderid"))
                    {
                        var entity = new Entity("cares_caresorder");
                        entity.Id = (Guid)((AliasedValue)dataRow["order.cares_caresorderid"]).Value;
                        entity.Attributes["cares_name"] = orderName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }
                }
            }

            returnRecordsFetch = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>
                                          <entity name='cares_approval'>
                                            <attribute name='cares_approvalid' />
                                            <attribute name='cares_name' />
                                            <order attribute='cares_name' descending='false' />
                                            <filter type='and'>
                                              <condition attribute='cares_contactid' operator='eq' uitype='contact' value='{"
                                                               + contactId + @"}' />
                                            </filter>
                                            <link-entity name='cares_caresreturn' from='cares_approvalid' to='cares_approvalid' alias='return' link-type='outer'>      
		                                        <attribute name='cares_caresreturnid' />
		                                        <attribute name='createdon' />
                                            </link-entity>
                                            <link-entity name='cares_program' from='cares_programid' to='cares_programid' link-type='inner' alias='pa'>
                                              <attribute name='cares_name' />
                                            </link-entity>
                                          </entity>
                                        </fetch>";
            trace.Trace("[INFO] Retrieving Approvals and Returns by ContactId. FetchXML: {0}", returnRecordsFetch);
            returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));

            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Returns found for the Contact's Id: " + contactId);
                foreach (var dataRow in returnRecords.Entities)
                {
                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);

                    var approvalName = string.Format("{0} {1} - {2}", lastName, firstName, programShortName);
                    trace.Trace("[INFO] approvalName : " + approvalName);

                    var returnCreatedOn = dataRow.Contains("return.createdon") == true ? (DateTime)((AliasedValue)dataRow["return.createdon"]).Value : DateTime.MinValue;
                    var retunName = string.Format("{0} - {1}/{2}/{3}", approvalName, returnCreatedOn.Month, returnCreatedOn.Day, returnCreatedOn.Year);

                    if (dataRow.Contains("return.cares_caresreturnid"))
                    {
                        var entity = new Entity("cares_caresreturn");
                        entity.Id = (Guid)((AliasedValue)dataRow["return.cares_caresreturnid"]).Value;
                        entity.Attributes["cares_name"] = retunName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }
                }
            }

            trace.Trace("[INFO] " + orgRequests.Count + " bulk requests to be executed.");
            if (orgRequests.Count > 0)
            {
                ExecuteMultipleRequest executeMultipleRequest = GetExecuteMultipleRequest();
                executeMultipleRequest.Requests.AddRange(orgRequests);

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(executeMultipleRequest);

                if (multipleResponse.IsFaulted)
                {
                    throw new InvalidPluginExecutionException("Exception occurred while updating name of the associated Approvals, Orders and Returns.");
                }
            }

            trace.Trace("[INFO] bulk requests have been executed SUCCESSFULLY.");
        }
        /// <summary>
        /// This method updates the allotment of the designated approval assoicated to the contact who's birthdate has been updated
        /// </summary>
        /// <param name="contactId">Guid of contact</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        public void OnContactBirthdateChangeUpdateAllotmentDates(Guid contactId, IOrganizationService service, ITracingService trace, DateTime updatedBirthday)
        {
            List<OrganizationRequest> orgRequests = new List<OrganizationRequest>();
            // fetch all contact related approvals
            string returnRecordsFetch = @"<fetch>
                                          <entity name='cares_approval' >
                                            <attribute name='cares_approvalid' />
                                            <attribute name='cares_name' />
                                            <filter type='and' >
                                              <condition attribute='cares_contactid' operator='eq' value='{"
                                                              + contactId + @"}' />
                                            </filter>
                                            <link-entity name='cares_program' from='cares_programid' to='cares_programid' alias='pa' >
                                              <attribute name='cares_name' />
                                            </link-entity>
                                          </entity>
                                        </fetch>";
            trace.Trace("[INFO] Retrieving Approvals by ContactId. FetchXML: {0}", returnRecordsFetch);
            EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            //returnRecords collection above contains ALL the Orders including Approvals of the Contact.

            Dictionary<Guid, string> approvalRefCollection = new Dictionary<Guid, string>();
            Entity entityData = null;
            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Approvals found for the Contact's Id: " + contactId);
                foreach (var dataRow in returnRecords.Entities)
                { 
                    var approvalId = (Guid)dataRow["cares_approvalid"];
                    entityData = service.Retrieve(dataRow.LogicalName, dataRow.Id, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);
                    if (entityData.Attributes.Contains("cares_programid"))
                    {
                        int renewalRule = GetProgramRenewalRule(((EntityReference)entityData.Attributes["cares_programid"]).Id, service, trace);
                        int expiryRule = GetExpiryRule(((EntityReference)entityData.Attributes["cares_programid"]).Id, service, trace);
                        int ageOutYear = -1;
                        if(expiryRule == 750760001)
                        {
                            ageOutYear = GetAgeOutYear(((EntityReference)entityData.Attributes["cares_programid"]).Id, service, trace);
                        }

                        if (renewalRule == (int)CaresHelper.RenewalRule.Birthday)
                        {
                            trace.Trace("renewal rule is birthdate and Contact id is : " + contactId);
                            trace.Trace("renewal rule is birthdate and birthdate value is  : " + updatedBirthday);
                            int birthMonth = updatedBirthday.Year == 1800 ? 0 : updatedBirthday.Month;
                            int birthDay = updatedBirthday.Year == 1800 ? 1 : updatedBirthday.Day;
                            DateTime date = DateTime.Now;

                            if (DateTime.Now.Month < birthMonth)
                            {
                                trace.Trace("renewal rule DateTime.Now.Month is less than  birthMonth  : " + birthMonth);
                                if (birthMonth == 2 && birthDay == 29)
                                {
                                    if (!DateTime.IsLeapYear(DateTime.Now.Year))
                                    {
                                        birthDay = 28;
                                    }
                                }
                                date = new DateTime(DateTime.Now.Year, birthMonth, birthDay);
                            }
                            else if (DateTime.Now.Month > birthMonth)
                            {
                                trace.Trace("renewal rule DateTime.Now.Month is greater than  birthMonth  : " + birthMonth);
                                if (birthMonth == 2 && birthDay == 29)
                                {
                                    if (!DateTime.IsLeapYear(DateTime.Now.Year + 1))
                                    {
                                        birthDay = 28;
                                    }
                                }
                                date = new DateTime(DateTime.Now.Year + 1, birthMonth, birthDay);
                            }
                            else if (DateTime.Now.Month == birthMonth && DateTime.Now.Day < birthDay)
                            {
                                trace.Trace("renewal rule DateTime.Now.Month is equal to  birthMonth and brith day is less than today date : " + birthMonth + " : " + birthDay);
                                if (birthMonth == 2 && birthDay == 29)
                                {
                                    if (!DateTime.IsLeapYear(DateTime.Now.Year))
                                    {
                                        birthDay = 28;
                                    }
                                }
                                date = new DateTime(DateTime.Now.Year, birthMonth, birthDay);
                            }
                            else if (DateTime.Now.Month == birthMonth && DateTime.Now.Day >= birthDay)
                            {
                                trace.Trace("renewal rule DateTime.Now.Month is equal to  birthMonth and brith day is greater than today date : " + birthMonth + " : " + birthDay);
                                if (birthMonth == 2 && birthDay == 29)
                                {
                                    if (!DateTime.IsLeapYear(DateTime.Now.Year + 1))
                                    {
                                        birthDay = 28;
                                    }
                                }
                                date = new DateTime(DateTime.Now.Year + 1, birthMonth, birthDay);
                            }

                            DateTime approvalExpiryDate = (DateTime)entityData.Attributes["cares_approvalenddate"];
                            trace.Trace($"New end date is {approvalExpiryDate.Year}, {updatedBirthday.Month}, {updatedBirthday.Day}");

                            Entity updated = new Entity(entityData.LogicalName)
                            {
                                Id = entityData.Id
                            };

                            // ageout year defaults to -1 and gets populated if age out year present
                            if (ageOutYear != -1)
                            {
                              updated.Attributes["cares_enddate"] = new DateTime(updatedBirthday.Year + ageOutYear, updatedBirthday.Month, updatedBirthday.Day);
                            } 

                            if (approvalExpiryDate < date)
                            {
                                updated.Attributes["cares_approvalenddate"] = new DateTime(approvalExpiryDate.Year, updatedBirthday.Month, updatedBirthday.Day);
                                updated.Attributes["cares_nextrenewaldate"] = new DateTime(approvalExpiryDate.Year, updatedBirthday.Month, updatedBirthday.Day);
                                service.Update(updated);
                            }
                            else
                            {
                                updated.Attributes["cares_approvalenddate"] = date.AddDays(-1);
                                updated.Attributes["cares_nextrenewaldate"] = date;
                                service.Update(updated);
                            }

                           var allotmentCalculationFromPlugin = new AllotmentCalculationFromPlugin();
                           trace.Trace("Passing parameter UpdateAllotmentCycleDate:true ");
                           allotmentCalculationFromPlugin.SetApprovalAllotmentfromPlugin(approvalId, service, trace);
                        }
                    }
                }
            }
        }



        /// <summary>
        /// This method updates the full name in approvals , orders and returns
        /// </summary>
        /// <param name="contactId">Guid of contact</param>
        /// <param name="firstName">First name of contact</param>
        /// <param name="lastName">Last name of contact</param>
        /// <param name="service">Organization service object</param>
        /// <param name="trace">tracing service object</param>
        public void OnContactFullNameUpdateOrdersReturns(Guid contactId, string firstName, string lastName, IOrganizationService service, ITracingService trace)
        {
            List<OrganizationRequest> orgRequests = new List<OrganizationRequest>();
            string returnRecordsFetch = @"<fetch>
                                          <entity name='cares_approval' >
                                            <attribute name='cares_approvalid' />
                                            <attribute name='cares_name' />
                                            <filter type='and' >
                                              <condition attribute='cares_contactid' operator='eq' value='{"
                                                              + contactId + @"}' />
                                            </filter>
                                            <link-entity name='cares_program' from='cares_programid' to='cares_programid' alias='pa' >
                                              <attribute name='cares_name' />
                                            </link-entity>
                                          </entity>
                                        </fetch>";
            trace.Trace("[INFO] Retrieving Approvals by ContactId. FetchXML: {0}", returnRecordsFetch);
            EntityCollection returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            //returnRecords collection above contains ALL the Orders including Approvals of the Contact.

            Dictionary<Guid, string> approvalRefCollection = new Dictionary<Guid, string>();
            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Approvals found for the Contact's Id: " + contactId);
                foreach (var dataRow in returnRecords.Entities)
                {
                    var approvalId = (Guid)dataRow["cares_approvalid"];

                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);

                    var approvalName = string.Format("{0} {1} - {2}", lastName, firstName, programShortName);
                    trace.Trace("[INFO] approvalName : " + approvalName);

                    if (!approvalRefCollection.ContainsKey(approvalId))
                    {
                        approvalRefCollection.Add(approvalId, approvalName);
                        var entity = new Entity("cares_approval");
                        entity.Id = approvalId;
                        entity.Attributes["cares_name"] = approvalName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }
                }
            }
            // Retrieve the Orders and Approvals associated with Contact.
            // Fetch the list of approval items & groups which has the parent Approval Record is associated to the Return Item (by contactId).
            returnRecordsFetch = @"<fetch>
                                          <entity name='cares_caresorder' >
                                            <attribute name='cares_caresorderid' />
                                            <attribute name='createdon' />
                                            <link-entity name='cares_approval' from='cares_approvalid' to='cares_approvalid' link-type='inner' alias='a'>
                                              <attribute name='cares_approvalid' />
                                              <attribute name='cares_name' />
                                              <filter type='and' >
                                                <condition attribute='cares_contactid' operator='eq' value='{"
                                                                                                      + contactId + @"}' />
                                              </filter>
                                              <link-entity name='cares_program' from='cares_programid' to='cares_programid' link-type='inner' alias='pa' >
                                                <attribute name='cares_name' />
                                              </link-entity>
                                            </link-entity>
                                          </entity>
                                        </fetch>";
            trace.Trace("[INFO] Retrieving Approvals and Orders by ContactId. FetchXML: {0}", returnRecordsFetch);
            returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));
            //returnRecords collection above contains ALL the Orders including Approvals of the Contact.

            approvalRefCollection = new Dictionary<Guid, string>();
            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Orders found for the Contact's Id: " + contactId);

                foreach (var dataRow in returnRecords.Entities)
                {
                    trace.Trace("Looping Entities..");
                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);

                    var approvalName = string.Format("{0} {1} - {2}", lastName, firstName, programShortName);
                    trace.Trace("[INFO] approvalName : " + approvalName);


                    var orderCreatedOn = dataRow.Contains("createdon") == true ? (DateTime)dataRow["createdon"] : DateTime.MinValue;
                    var orderName = string.Format("{0} - {1}/{2}/{3}", approvalName, orderCreatedOn.Month, orderCreatedOn.Day, orderCreatedOn.Year);
                    trace.Trace("[INFO] orderName : " + orderName);
                    if (dataRow.Contains("cares_caresorderid"))
                    {
                        var entity = new Entity("cares_caresorder");
                        entity.Id = (Guid)dataRow["cares_caresorderid"];
                        entity.Attributes["cares_name"] = orderName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }
                }
            }

            returnRecordsFetch = @"<fetch>
                                  <entity name='cares_caresreturn' >
                                    <attribute name='cares_caresreturnid' />
                                    <attribute name='createdon' />
                                    <link-entity name='cares_approval' from='cares_approvalid' to='cares_approvalid' link-type='inner' alias='a' >
                                      <attribute name='cares_approvalid' />
                                      <attribute name='cares_name' />
                                      <filter type='and' >
                                        <condition attribute='cares_contactid' operator='eq' value='{"
                                                                                               + contactId + @"}' />
                                      </filter>
                                      <link-entity name='cares_program' from='cares_programid' to='cares_programid' link-type='inner' alias='pa' >
                                        <attribute name='cares_name' />
                                      </link-entity>
                                    </link-entity>
                                  </entity>
                                </fetch>";
            trace.Trace("[INFO] Retrieving Approvals and Returns by ContactId. FetchXML: {0}", returnRecordsFetch);
            returnRecords = service.RetrieveMultiple(new FetchExpression(returnRecordsFetch));

            if (returnRecords.Entities.Count > 0)
            {
                trace.Trace("[INFO] " + returnRecords.Entities.Count + " Returns found for the Contact's Id: " + contactId);
                foreach (var dataRow in returnRecords.Entities)
                {
                    var programShortName = dataRow.Contains("pa.cares_name") == true ? ((AliasedValue)dataRow["pa.cares_name"]).Value : "";
                    trace.Trace("[INFO] programShortName : " + programShortName);

                    var approvalName = string.Format("{0} {1} - {2}", lastName, firstName, programShortName);
                    trace.Trace("[INFO] approvalName : " + approvalName);

                    var returnCreatedOn = dataRow.Contains("createdon") == true ? (DateTime)dataRow["createdon"] : DateTime.MinValue;
                    var retunName = string.Format("{0} - {1}/{2}/{3}", approvalName, returnCreatedOn.Month, returnCreatedOn.Day, returnCreatedOn.Year);
                    trace.Trace("[INFO] retunName : " + retunName);
                    if (dataRow.Contains("cares_caresreturnid"))
                    {
                        var entity = new Entity("cares_caresreturn");
                        entity.Id = (Guid)dataRow["cares_caresreturnid"];
                        entity.Attributes["cares_name"] = retunName;
                        orgRequests.Add(new UpdateRequest { Target = entity });
                    }
                }
            }

            trace.Trace("[INFO] " + orgRequests.Count + " bulk requests to be executed.");
            if (orgRequests.Count > 0)
            {
                ExecuteMultipleRequest executeMultipleRequest = GetExecuteMultipleRequest();
                executeMultipleRequest.Requests.AddRange(orgRequests);

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(executeMultipleRequest);

                if (multipleResponse.IsFaulted)
                {
                    throw new InvalidPluginExecutionException("Exception occurred while updating name of the associated Approvals, Orders and Returns.");
                }
            }

            trace.Trace("[INFO] bulk requests have been executed SUCCESSFULLY.");
        }

        #endregion
    }
}