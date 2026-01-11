# 🧪 Authentication Testing Guide

## Test Environment Setup

### 1. Start Local Development Server
```bash
npm run dev
```

Application will run at: http://localhost:5173

---

## 🔐 Test Cases

### Test 1: Email/Password Signup ✅
**Steps**:
1. Go to: http://localhost:5173/signup
2. Enter details:
   - **Username**: testuser123
   - **Email**: test@example.com
   - **Password**: TestPass123!
   - **Confirm Password**: TestPass123!
3. Click "Create Account"

**Expected Result**:
- ✅ Account created successfully
- ✅ Redirected to dashboard
- ✅ User profile created in database
- ✅ Welcome message shown

**Common Issues**:
- If "Email already exists" → Use different email
- If "Weak password" → Password needs: 8+ chars, uppercase, lowercase, number

---

### Test 2: Email/Password Login ✅
**Steps**:
1. Go to: http://localhost:5173/login
2. Enter credentials:
   - **Email/Username**: testuser123
   - **Password**: TestPass123!
3. Click "Sign In"

**Expected Result**:
- ✅ Logged in successfully
- ✅ Redirected to dashboard
- ✅ User data loaded
- ✅ Session persists on refresh

**Common Issues**:
- If "Invalid credentials" → Check email/password
- If stuck loading → Check Supabase connection

---

### Test 3: Forgot Password Flow ✅
**Steps**:
1. Go to: http://localhost:5173/login
2. Click "Forgot password?"
3. Enter email: test@example.com
4. Click "Send Reset Link"
5. **Check email** for reset link
6. Click link in email
7. Enter new password
8. Click "Reset Password"
9. Login with new password

**Expected Result**:
- ✅ Reset email sent successfully
- ✅ Email received (check spam if not in inbox)
- ✅ Reset link works
- ✅ Password updated
- ✅ Can login with new password

**Email Configuration**:
Supabase sends password reset emails automatically. Make sure:
- Email is valid
- Check spam folder
- Wait 1-2 minutes for email delivery

**Common Issues**:
- **"Email not found"** → User doesn't exist, signup first
- **"Email not sent"** → Check Supabase email settings
- **"Link expired"** → Reset links expire after 1 hour, request new one

---

### Test 4: Google OAuth (After Setup) 🔧
**Status**: Needs Google OAuth keys (you'll provide)

**Steps**:
1. Go to: http://localhost:5173/login
2. Click "Continue with Google"
3. Select Google account
4. Grant permissions
5. Redirected back to app

**Expected Result**:
- ✅ Google login popup opens
- ✅ Account selected
- ✅ Logged in automatically
- ✅ Profile picture from Google
- ✅ Email verified automatically

**Setup Required**:
- Get Google OAuth keys (guide provided)
- Add `VITE_GOOGLE_CLIENT_ID` to .env
- Enable Google in Supabase dashboard

---

### Test 5: Session Persistence ✅
**Steps**:
1. Login successfully
2. Refresh page (F5 or Cmd+R)
3. Close tab and reopen app
4. Check if still logged in

**Expected Result**:
- ✅ Session persists after refresh
- ✅ Session persists after closing tab
- ✅ No need to login again
- ✅ User data loads automatically

---

### Test 6: Logout ✅
**Steps**:
1. While logged in, click profile menu
2. Click "Logout" or "Sign Out"
3. Confirm logout

**Expected Result**:
- ✅ Logged out successfully
- ✅ Redirected to login page
- ✅ Session cleared
- ✅ Can't access protected pages

---

### Test 7: Protected Routes ✅
**Steps**:
1. Logout first
2. Try to access:
   - http://localhost:5173/dashboard
   - http://localhost:5173/ai-tools
   - http://localhost:5173/habits
3. Should redirect to login

**Expected Result**:
- ✅ Redirected to login page
- ✅ Cannot access without auth
- ✅ After login, redirected to originally requested page

---

## 🔍 Forgot Password - Detailed Testing

### Scenario 1: Valid Email
```
1. Enter: test@example.com
2. Click "Send Reset Link"
3. See: "Reset link sent! Check your email"
4. Check email inbox
5. Click reset link
6. Enter new password
7. Login with new password
```

**✅ Result**: Password reset successfully

---

### Scenario 2: Invalid Email
```
1. Enter: nonexistent@example.com
2. Click "Send Reset Link"
3. See: "If that email exists, we sent a reset link"
```

**Note**: For security, we don't reveal if email exists or not.

---

### Scenario 3: Check Email Provider
Supabase sends emails from: `noreply@mail.app.supabase.io`

**Email Template**:
```
Subject: Reset Your Password - StarPath

Hi there,

We received a request to reset your password for StarPath.

Click here to reset your password:
[Reset Password Button]

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
StarPath Team
```

---

### Email Configuration (Supabase Dashboard)

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/templates
2. Check "Reset Password" template
3. Verify:
   - ✅ Template is enabled
   - ✅ Redirect URL is correct
   - ✅ Subject line is set

**Default Redirect URL**:
```
{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery
```

This should point to your app's reset password page.

---

## 🐛 Troubleshooting

### Issue: "Failed to send reset email"
**Fix**: 
- Check Supabase project is active
- Verify email settings in Supabase dashboard
- Check email is valid format

### Issue: "Reset link doesn't work"
**Fix**:
- Check link hasn't expired (1 hour limit)
- Ensure you're using the latest link
- Clear browser cache
- Try incognito/private mode

### Issue: "Password reset page not found"
**Fix**:
- Verify route exists: `src/pages/ResetPasswordPage.tsx`
- Check routing in `src/App.tsx`
- Ensure path is `/reset-password`

### Issue: "Email not received"
**Fixes**:
1. Check spam/junk folder
2. Wait 2-5 minutes (email can be delayed)
3. Verify email address is correct
4. Check Supabase email quota not exceeded
5. Try different email provider (Gmail, Outlook)

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Signup works with valid email
- [ ] Login works with correct credentials
- [ ] Forgot password sends email
- [ ] Password reset link works
- [ ] New password can be used to login
- [ ] Session persists on refresh
- [ ] Logout clears session
- [ ] Protected routes require auth
- [ ] Google OAuth button displays (even if not configured)
- [ ] Error messages are clear and helpful

---

## 📧 Email Testing Tips

### Use Real Email for Testing:
- **Gmail**: test.starpath@gmail.com
- **Outlook**: test.starpath@outlook.com
- **Temp Email**: Use https://temp-mail.org for disposable emails

### Check Email Delivery:
1. **Supabase Dashboard** → **Authentication** → **Email Rate Limit**
2. Check if email quota exceeded
3. Free tier: 3 emails/hour to same address

### Email Troubleshooting:
- **Not in inbox?** → Check spam
- **Delayed?** → Wait 5 minutes
- **Not received?** → Check Supabase logs
- **Quota exceeded?** → Wait 1 hour or upgrade plan

---

## 🎯 Success Criteria

**Authentication is working if**:
1. ✅ Can signup with email/password
2. ✅ Can login with credentials
3. ✅ Forgot password sends email (check spam if needed)
4. ✅ Password reset link works
5. ✅ Can login with new password
6. ✅ Session persists correctly
7. ✅ Logout works properly
8. ✅ Protected routes are secured

**All 8 tests passing = Authentication fully functional!** 🎉

---

## 🆘 Need Help?

### Common Questions:

**Q: Where do password reset emails go?**  
A: Check your email inbox and spam folder. Emails come from `noreply@mail.app.supabase.io`

**Q: How long is the reset link valid?**  
A: 1 hour. After that, request a new one.

**Q: Can I test without real email?**  
A: Yes, but you won't be able to test password reset. Use real email for full testing.

**Q: What if email never arrives?**  
A: 
1. Wait 5 minutes
2. Check spam
3. Check Supabase email logs
4. Try different email provider

---

## 📊 Test Results Template

Use this to track your testing:

```
Date: ___________
Tester: _________

✅ Signup: PASS / FAIL
✅ Login: PASS / FAIL  
✅ Forgot Password (Email Sent): PASS / FAIL
✅ Forgot Password (Email Received): PASS / FAIL
✅ Forgot Password (Link Works): PASS / FAIL
✅ Reset Password: PASS / FAIL
✅ Login with New Password: PASS / FAIL
✅ Session Persistence: PASS / FAIL
✅ Logout: PASS / FAIL
✅ Protected Routes: PASS / FAIL

Notes:
_________________________________
_________________________________
```

---

**Ready to test? Start with Test 1: Signup!** 🚀
