# GitHub Actions CI/CD Setup Instructions

## 🔐 Required Secrets

To enable the schema validation workflow, you need to add the following secrets to your GitHub repository.

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGci...`)

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

#### Secret 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Your Supabase Project URL
- **Example**: `https://abcdefghijk.supabase.co`

#### Secret 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...`

### Step 3: Verify Setup

1. Create a new branch:
   ```bash
   git checkout -b test-ci-setup
   ```

2. Make a small change (e.g., update README)

3. Push and create a PR:
   ```bash
   git add .
   git commit -m "test: Verify CI/CD setup"
   git push origin test-ci-setup
   ```

4. Go to GitHub and create a Pull Request

5. Check the **Actions** tab to see if the workflow runs

### Step 4: Troubleshooting

#### Workflow doesn't run
- Check that `.github/workflows/schema-validation.yml` exists in your repo
- Verify the workflow is enabled in Settings → Actions

#### "Missing credentials" error
- Verify secrets are named exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check that values don't have extra spaces or quotes

#### Schema validation fails
- Run locally first: `npm run schema:validate`
- Check `SCHEMA_MISMATCH_REPORT.md` for issues
- Fix issues before pushing

## ✅ Success Criteria

Workflow is working when:
- ✅ Actions tab shows "Schema Validation" workflow
- ✅ Workflow runs on every PR
- ✅ Green checkmark if validation passes
- ✅ Red X if validation fails
- ✅ Comment posted on PR if fails

## 🎯 What Happens Next

Once set up, every pull request will:
1. Automatically run schema validation
2. Check for table/column mismatches
3. Run integration tests (optional)
4. Block merge if critical issues found
5. Post detailed feedback on PR

## 📝 Optional: Integration Tests

To also run integration tests in CI/CD:

1. Create a test user in Supabase:
   - Email: `ci-test@starpath.test`
   - Password: (store in GitHub Secrets as `TEST_USER_PASSWORD`)

2. Add to workflow (uncomment in `schema-validation.yml`):
   ```yaml
   - name: Run integration tests
     run: npm run test:integration
     env:
       TEST_EMAIL: ci-test@starpath.test
       TEST_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
   ```

## 🔒 Security Notes

- **Never commit secrets to git**
- Use GitHub Secrets for all sensitive data
- Anon key is safe to use in CI/CD (it's public-facing)
- Don't use service role key in CI/CD (too powerful)

## 🚀 You're Done!

Your CI/CD pipeline is now set up and will automatically validate schema on every PR!
