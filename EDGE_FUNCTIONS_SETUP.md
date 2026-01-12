# Edge Functions Setup & Deployment Guide

This guide explains how to set up and deploy the Supabase Edge Functions for the Goals & Planner app.

## Prerequisites

### 1. Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
# Get your project reference from Supabase Dashboard > Settings > General
supabase link --project-ref YOUR_PROJECT_REF
```

## Required Secrets

Before deploying, set these secrets in your Supabase project:

### OpenRouter API Key (Required for AI Features)

```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

Get your free API key at: https://openrouter.ai/keys

### Razorpay Keys (Required for Payments)

```bash
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Verify Secrets Are Set

```bash
supabase secrets list
```

## Deployment

### Deploy All Functions

```bash
./deploy-edge-functions.sh
```

### Deploy Specific Functions

```bash
# Deploy single function
./deploy-edge-functions.sh ai-generate

# Deploy multiple functions
./deploy-edge-functions.sh ai-generate ai-coach
```

### Dry Run (Preview)

```bash
./deploy-edge-functions.sh --dry-run
```

### List Available Functions

```bash
./deploy-edge-functions.sh --list
```

## Edge Functions Overview

| Function | Description | Required Secrets |
|----------|-------------|------------------|
| `ai-generate` | AI content generation (notes, flashcards, quizzes, etc.) | `OPENROUTER_API_KEY` |
| `ai-coach` | AI mentor chat and suggestions | `OPENROUTER_API_KEY` |
| `check-user-exists` | Verify if a user exists | None |
| `contact-us` | Handle contact form submissions | None |
| `create-razorpay-order` | Create payment orders | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| `create-razorpay-subscription` | Create subscriptions | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| `verify-razorpay-payment` | Verify payment signatures | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| `razorpay-webhook` | Handle Razorpay webhooks | `RAZORPAY_WEBHOOK_SECRET` |
| `delete-user` | Delete user account and data | None |

## Troubleshooting

### View Function Logs

```bash
# Real-time logs
supabase functions logs ai-generate --follow

# Recent logs
supabase functions logs ai-generate
```

### Common Errors

#### "OPENROUTER_API_KEY is not configured"
- Solution: Set the secret using `supabase secrets set OPENROUTER_API_KEY=your_key`

#### "Edge Function returned a non-2xx status code"
- Check the function logs for detailed error messages
- Verify all required secrets are set
- Ensure the request payload matches the expected schema

#### "PGRST204 - Column Not Found"
- The database schema may be out of sync
- Run migrations: `supabase db push`
- Regenerate types: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test a function locally
supabase functions serve ai-generate --env-file .env.local
```

## Local Development

### Start Local Supabase

```bash
supabase start
```

### Serve Functions Locally

```bash
# Serve all functions
supabase functions serve --env-file .env.local

# Serve specific function
supabase functions serve ai-generate --env-file .env.local
```

### Create `.env.local` for Local Testing

```env
OPENROUTER_API_KEY=your_key_here
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## AI Models Used (Free Tier)

The Edge Functions use free models from OpenRouter:

| Model | Best For | Context Length |
|-------|----------|----------------|
| `google/gemini-flash-1.5` | General tasks (primary) | 1M tokens |
| `meta-llama/llama-3.1-8b-instruct:free` | Reasoning, essays | 131K tokens |
| `qwen/qwq-32b-preview:free` | Math, structured output | 32K tokens |
| `mistralai/mistral-7b-instruct:free` | Creative writing | 32K tokens |

All models are 100% free with no credit cost on OpenRouter.

## Security Notes

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive configuration
3. **JWT verification** is disabled for these functions (using `--no-verify-jwt`) - they handle auth internally
4. **Rate limiting** is implemented in the functions to prevent abuse

## Support

If you encounter issues:
1. Check the function logs
2. Verify secrets are set correctly
3. Ensure database migrations are up to date
4. Check the `deploy-edge-functions.log` file for deployment errors
