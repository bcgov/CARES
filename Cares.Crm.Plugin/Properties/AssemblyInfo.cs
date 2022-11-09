using System;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security;

// General Information about an assembly is controlled through the following 
// set of attributes. Change these attribute values to modify the information
// associated with an assembly.
[assembly: AssemblyTitle("Microsoft Dynamics 365 Developer Toolkit")]
[assembly: AssemblyDescription("Dynamics 365 Developer Toolkit for Visual Studio")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("Microsoft")]
[assembly: AssemblyProduct("Microsoft Dynamics© CRM")]
[assembly: AssemblyCopyright("© 2015 Microsoft Corporation. All rights reserved")]
[assembly: AssemblyTrademark("")]
[assembly: AssemblyCulture("")]
[assembly: CLSCompliant(true)]

// Setting ComVisible to false makes the types in this assembly not visible 
// to COM components.  If you need to access a type in this assembly from 
// COM, set the ComVisible attribute to true on that type.
[assembly: ComVisible(false)]

// The following GUID is for the ID of the typelib if this project is exposed to COM
[assembly: Guid("fa11da31-2c3f-4813-9e1e-6b9f4ffda2f6")]

// Version information for an assembly consists of the following four values:
//
//      Major Version
//      Minor Version 
//      Build Number
//      Revision
//
// You can specify all the values or you can default the Build and Revision Numbers 
// by using the '*' as shown below:
// [assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.2000.9032")]

// Added to fix "The specified type XXXXX is not a known entity type"
[assembly: Microsoft.Xrm.Sdk.Client.ProxyTypesAssemblyAttribute()]

[assembly: SecurityRules(SecurityRuleSet.Level1)]