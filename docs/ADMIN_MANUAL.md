# Admin Manual

This guide covers administrator functions in the Ubuntu Journal platform.

## Overview

Administrators have full access to the system, including:
- User management and role assignment
- Volume and issue management
- Article publication
- System statistics

## Accessing the Admin Dashboard

1. Log in with an admin account
2. Navigate to `/dashboard`
3. Click "Admin Panel" or go to `/dashboard/admin`

## User Management

### Viewing All Users

Go to **Admin Panel → User Management** (`/dashboard/admin/users`)

You'll see a table of all registered users with:
- Name
- Email
- Current role
- Registration date

### Changing User Roles

1. Find the user in the table
2. Use the dropdown in the "Role" column to select a new role:
   - **AUTHOR**: Can submit manuscripts and view their submissions
   - **REVIEWER**: Can accept/decline review invitations and submit reviews
   - **EDITOR**: Can assign reviewers and make editorial decisions
   - **ADMIN**: Full system access

3. The role updates immediately

**Note**: You cannot change your own role (to prevent accidentally locking yourself out).

## Volume & Issue Management

### Creating a New Volume

1. Go to **Admin Panel → Issues** (`/dashboard/admin/issues`)
2. Fill in the "Create Volume" form:
   - Volume Number (e.g., 2, 3, 4...)
   - Year (e.g., 2025)
3. Click "Create Volume"

### Creating a New Issue

1. Go to **Issues** page
2. Fill in the "Create Issue" form:
   - Select the Volume
   - Issue Number (e.g., 1, 2, 3...)
   - Title (optional, e.g., "Special Edition" or "Winter Issue")
3. Click "Create Issue"

**Note**: Issues are not visible on the public site until they are published.

### Publishing an Issue

Issues become publicly visible when they contain at least one published article.

## Article Publication

### Publishing an Article

1. Go to **Admin Panel** (`/dashboard/admin`)
2. Find articles with "ACCEPTED" status
3. Click "Publish" next to the article
4. Fill in publication details:
   - Select Volume/Issue
   - Page Start and End numbers
   - DOI (optional)
   - Upload final PDF (optional - uses accepted manuscript if not provided)
5. Click "Publish Article"

The article status changes to PUBLISHED and:
- Appears on the public site
- Author receives a notification
- DOI becomes active (if assigned)

## System Statistics

The Admin Dashboard shows:
- Total published articles
- Total users by role
- Published issues count
- Recent activity

## Seeding Test Data

For development/testing, run:
```bash
npm run db:seed
```

This creates test accounts and sample data. See README for test credentials.

## Common Tasks

### Promoting a User to Editor/Reviewer

1. Go to User Management
2. Find the user (use browser search if needed)
3. Change role to EDITOR or REVIEWER

### Creating a New Issue for Publication

1. Ensure the Volume exists (or create it)
2. Create the Issue
3. Publish accepted articles to that Issue

### Troubleshooting

**User can't submit manuscripts**
- Verify their role is AUTHOR, REVIEWER, EDITOR, or ADMIN

**Article not appearing on public site**
- Ensure status is PUBLISHED (not just ACCEPTED)
- Ensure it's assigned to a published Issue

**Role change not working**
- You cannot change your own role
- Only valid roles can be assigned
