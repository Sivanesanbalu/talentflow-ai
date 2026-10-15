# TalentFlow AI

AI interview SaaS built using Next.js, PostgreSQL, browser voice interviewing, human HR reviews, candidate invitation links and email delivery workflows.

## Status

Source transfer from the consolidated local release is in progress. **This GitHub repository is not yet a complete or production-verified codebase.** Do not deploy this branch as production without verifying the full source and migrations.

## Security

Never commit `.env.local`, database credentials, OpenRouter API keys, Resend API keys, or Vercel tokens.

## Release process

Run unit tests, install dependencies, build the Next.js application, apply reviewed database migrations, test a protected preview end-to-end, then promote only after those checks pass.
