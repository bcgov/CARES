using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CGIEncryptionDecryptionTool
{
    public partial class frmCGITool : Form
    {
        public frmCGITool()
        {
            InitializeComponent();
        }

        private void btnEncrypt_Click(object sender, EventArgs e)
        {
            try
            {
                txtResult.Text = string.Empty;
                lblError.Text = string.Empty;
                string SecureKey = ConfigurationManager.AppSettings["SecureKey"].ToString();

                if (!String.IsNullOrEmpty(txtInputText.Text))
                    txtResult.Text = EncryptString(txtInputText.Text, SecureKey);
                else
                    lblError.Text = "Please enter input string/text to encrypt.";

            }
            catch(Exception ex)
            {
                lblError.Text = ex.Message;
            }
        }

        private void btnDecrypt_Click(object sender, EventArgs e)
        {
            try
            {
                txtResult.Text = string.Empty;
                lblError.Text = string.Empty;
                string SecureKey = ConfigurationManager.AppSettings["SecureKey"].ToString();

                if (!String.IsNullOrEmpty(txtInputText.Text))
                    txtResult.Text = DecryptString(txtInputText.Text, SecureKey);
                else
                    lblError.Text = "Please enter input string/text to decrypt.";

            }
            catch (Exception ex)
            {
                lblError.Text = ex.Message;
            }
        }

        /// <summary>
        /// Encypt
        /// </summary>
        /// <param name="toEncrypt"></param>
        /// <param name="SecureKey"></param>
        /// <returns></returns>
        public string EncryptString(string toEncrypt, string SecureKey)
        {
            byte[] keyArray;
            byte[] toEncryptArray = UTF8Encoding.UTF8.GetBytes(toEncrypt);

            // Get the key from config file

            string key = SecureKey;
            //System.Windows.Forms.MessageBox.Show(key);
            //If hashing use get hashcode regards to your key
            //if (useHashing)
            //{
            MD5CryptoServiceProvider hashmd5 = new MD5CryptoServiceProvider();
            keyArray = hashmd5.ComputeHash(UTF8Encoding.UTF8.GetBytes(key));
            //Always release the resources and flush data
            // of the Cryptographic service provide. Best Practice

            hashmd5.Clear();
            //}
            //else
            //    keyArray = UTF8Encoding.UTF8.GetBytes(key);

            TripleDESCryptoServiceProvider tdes = new TripleDESCryptoServiceProvider();
            //set the secret key for the tripleDES algorithm
            tdes.Key = keyArray;
            //mode of operation. there are other 4 modes.
            //We choose ECB(Electronic code Book)
            tdes.Mode = CipherMode.ECB;
            //padding mode(if any extra byte added)

            tdes.Padding = PaddingMode.PKCS7;

            ICryptoTransform cTransform = tdes.CreateEncryptor();
            //transform the specified region of bytes array to resultArray
            byte[] resultArray =
              cTransform.TransformFinalBlock(toEncryptArray, 0,
              toEncryptArray.Length);
            //Release resources held by TripleDes Encryptor
            tdes.Clear();
            //Return the encrypted data into unreadable string format
            return Convert.ToBase64String(resultArray, 0, resultArray.Length);
        }
        /// <summary>
        /// Decrypt
        /// </summary>
        /// <param name="EncryptedString"></param>
        /// <param name="SecureKey"></param>
        /// <returns></returns>
        public string DecryptString(string EncryptedString, string SecureKey)
        {
            byte[] keyArray;
            //get the byte code of the string

            byte[] toEncryptArray = Convert.FromBase64String(EncryptedString);
            //Get your key from config file to open the lock!
            string key = SecureKey;

            //if (useHashing)
            //{
            //if hashing was used get the hash code with regards to your key
            MD5CryptoServiceProvider hashmd5 = new MD5CryptoServiceProvider();
            keyArray = hashmd5.ComputeHash(UTF8Encoding.UTF8.GetBytes(key));
            //release any resource held by the MD5CryptoServiceProvider

            hashmd5.Clear();
            //}
            //else
            //{
            //    //if hashing was not implemented get the byte code of the key
            //    keyArray = UTF8Encoding.UTF8.GetBytes(key);
            //}

            TripleDESCryptoServiceProvider tdes = new TripleDESCryptoServiceProvider();
            //set the secret key for the tripleDES algorithm
            tdes.Key = keyArray;
            //mode of operation. there are other 4 modes. 
            //We choose ECB(Electronic code Book)

            tdes.Mode = CipherMode.ECB;
            //padding mode(if any extra byte added)
            tdes.Padding = PaddingMode.PKCS7;

            ICryptoTransform cTransform = tdes.CreateDecryptor();
            byte[] resultArray = cTransform.TransformFinalBlock(
                                 toEncryptArray, 0, toEncryptArray.Length);
            //Release resources held by TripleDes Encryptor                
            tdes.Clear();
            //return the Clear decrypted TEXT
            return UTF8Encoding.UTF8.GetString(resultArray);
        }
    }
}
