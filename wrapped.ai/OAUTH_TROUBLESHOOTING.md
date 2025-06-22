# OAuth Troubleshooting Guide

## Error: "OAuth client was not found" (Error 401: invalid_client)

This error occurs when Google cannot find your OAuth client. Here's how to fix it:

## 🔍 **Step-by-Step Fix**

### **1. Verify Your Google Cloud Console Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one you created for OAuth)
3. **Navigate to**: APIs & Services → Credentials
4. **Look for**: "OAuth 2.0 Client IDs" section

### **2. Check Your OAuth Client ID**

Your OAuth client ID should:
- **Format**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Length**: Usually around 72 characters
- **End with**: `.apps.googleusercontent.com`

### **3. Verify Environment Variables**

Create a `.env.local` file in your project root with:

```env
# Replace with your ACTUAL values from Google Cloud Console
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**Important**: 
- Use the **exact** values from Google Cloud Console
- Don't use placeholder text like "your_actual_google_client_id_here"
- Make sure there are no extra spaces or quotes

### **4. Check Redirect URIs**

In Google Cloud Console, verify your redirect URIs:

**For Development:**
```
http://localhost:3000/api/auth/google/callback
```

**For Production:**
```
https://yourdomain.com/api/auth/google/callback
```

**Common Mistakes:**
- ❌ `http://localhost:3000/` (missing callback path)
- ❌ `http://localhost:3000/api/auth/google/callback/` (extra slash)
- ❌ `https://localhost:3000/api/auth/google/callback` (wrong protocol)

### **5. Enable Required APIs**

Make sure these APIs are enabled in your Google Cloud project:

1. Go to **APIs & Services → Library**
2. Search for and enable:
   - **Google+ API** (or Google Identity)
   - **Google Identity and Access Management (IAM) API**

### **6. Configure OAuth Consent Screen**

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users if needed
6. **Save and continue**

### **7. Restart Your Development Server**

After updating environment variables:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🛠️ **Debug Tools**

### **Use the Debug Component**

1. Go to your login page
2. Click "Show Debug Info"
3. Click "Check Configuration"
4. Review the debug information

### **Check Console Logs**

Open browser developer tools (F12) and look for:
- OAuth URL generation logs
- Error messages
- Network requests

## 🚨 **Common Issues & Solutions**

### **Issue 1: Client ID Not Set**
**Error**: `clientId: 'NOT SET'` in debug info
**Solution**: Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`

### **Issue 2: Wrong Client ID Format**
**Error**: Client ID doesn't end with `.apps.googleusercontent.com`
**Solution**: Copy the exact Client ID from Google Cloud Console

### **Issue 3: Redirect URI Mismatch**
**Error**: "Invalid redirect_uri" in Google error
**Solution**: Ensure redirect URI in Google Cloud Console matches exactly

### **Issue 4: API Not Enabled**
**Error**: Various OAuth errors
**Solution**: Enable Google+ API or Google Identity API

### **Issue 5: Consent Screen Not Configured**
**Error**: OAuth consent screen errors
**Solution**: Complete OAuth consent screen setup

## 🔧 **Quick Verification Steps**

1. **Check .env.local exists** in your project root
2. **Verify Client ID format**: Should end with `.apps.googleusercontent.com`
3. **Confirm redirect URI**: Should match exactly in Google Cloud Console
4. **Restart server**: After changing environment variables
5. **Clear browser cache**: Sometimes cached data causes issues

## 📞 **Still Having Issues?**

If you're still getting the error after following these steps:

1. **Double-check Google Cloud Console**:
   - Are you in the correct project?
   - Is the OAuth client ID visible in the credentials list?
   - Are the redirect URIs exactly correct?

2. **Verify Environment Variables**:
   - Is `.env.local` in the project root?
   - Are the values copied exactly (no extra spaces)?
   - Did you restart the development server?

3. **Check Browser Console**:
   - Are there any JavaScript errors?
   - What does the debug component show?

4. **Test with Debug Component**:
   - Click "Test OAuth URL" in the debug component
   - Check the generated URL in console
   - Verify the client_id parameter matches your Google Client ID

## 🎯 **Success Indicators**

When everything is working correctly, you should see:
- ✅ Debug component shows your actual Client ID
- ✅ No "NOT SET" or placeholder values
- ✅ Redirect URI matches your current domain
- ✅ Clicking "Continue with Google" redirects to Google's consent screen
- ✅ No "OAuth client was not found" errors 