# AjoPay AI Development Instructions

This document guides AI agents working on this repository.

Agents must read this file before making any changes.

The goal is to ensure AI behaves like a senior backend engineer when modifying the codebase.

---

# Project Overview

AjoPay is a digital rotating savings platform based on the Nigerian "Ajo" system.

Members contribute a fixed amount periodically.

Each cycle, one member receives the payout until all members have received their turn.

This system must ensure payment verification, fairness in payout order, and transaction transparency.

---

# Tech Stack

Frontend
- Next.js (App Router)
- TypeScript

Backend
- Next.js API routes

Database
- Supabase (PostgreSQL)

Payments
- Paystack

Notifications
- WhatsApp receipt notifications after successful payments

Development tools
- Supabase CLI
- GitHub Copilot agents

---

# Core System Concepts

## Contribution Groups

Groups represent a savings cycle.

Important rules:

- Only admins can create groups
- Users cannot create groups
- Users can only join existing groups

Each group includes:

group_name  
contribution_amount  
cycle_length  
payout_order  
admin_id  
whatsapp_group_link  

---

# User Roles

Two roles exist:

admin  
user

## Admin Permissions

Admins can:

- create groups
- manage members
- update payout order
- view group payments
- access admin dashboard

## User Permissions

Users can:

- join groups
- make contributions
- view contribution history
- view payout schedule

Users cannot create groups.

---

# Payment Flow

Payments must follow this exact flow.

User initiates payment  
→ frontend calls API  
→ payment initialized with Paystack  
→ user completes payment  
→ Paystack webhook fires  
→ backend verifies transaction  
→ payment stored in database  
→ contribution marked complete  
→ receipt generated  
→ WhatsApp notification sent  

Never trust payment status from frontend.

Always verify with Paystack API.

---

# WhatsApp Notification System

When a payment succeeds:

1. Generate payment receipt
2. Send notification to the group's WhatsApp channel
3. Notify the admin

Message format example:

Contribution Received

User: {name}
Group: {group_name}
Amount: ₦{amount}
Reference: {payment_reference}

---

# Database Tables

Core tables:

users  
groups  
group_members  
contributions  
payments  
payouts  

Agents must design schemas using Supabase migrations.

Do not manually edit production database tables.

Use Supabase CLI.

Example commands:

supabase migration new create_groups_table  
supabase migration new create_contributions_table  
supabase db push

---

# Security Rules

Never expose secrets.

Sensitive variables include:

PAYSTACK_SECRET_KEY  
SUPABASE_SERVICE_ROLE_KEY  
JWT_SECRET  

Secrets must only exist in environment variables.

Never hardcode them.

---

# Backend Endpoints

Admin endpoints

/api/admin/groups/create  
/api/admin/groups/update  
/api/admin/groups/delete  

User endpoints

/api/groups/list  
/api/groups/join  

Payment endpoints

/api/paystack/initialize  
/api/paystack/webhook  

Contribution endpoints

/api/contributions/pay  
/api/contributions/history  

---

# Group Types

AjoPay supports multiple group categories beyond traditional Ajo savings.

## School Social Saving & Contribution

- School-based savings groups for students, staff, or PTA members
- Groups can be tied to a school or class
- Supports periodic social contributions (e.g. end-of-term, graduation fund)
- Members contribute a fixed amount per cycle

## Mosque Monthly Contribution

- Monthly contribution groups for mosque communities
- Members contribute a fixed amount each month
- Payout rotation follows the standard Ajo cycle
- Admin (e.g. mosque treasurer) manages group and members

## Church Monthly Contribution

- Monthly contribution groups for church communities
- Members contribute a fixed amount each month
- Payout rotation follows the standard Ajo cycle
- Admin (e.g. church treasurer) manages group and members

All group types use the same core contribution and payout logic.

The `groups` table includes a `category` field to distinguish group types:

ajo  
school  
mosque  
church  

---

# WhatsApp Payment Receipt Integration

After a successful payment, an automatic receipt is sent to the group's linked WhatsApp channel.

Flow:

1. Payment succeeds (verified via Paystack webhook)
2. System generates a formatted receipt
3. Receipt is sent to the WhatsApp group linked to the savings group
4. Individual WhatsApp notification also sent to the paying member

This ensures all group members see contributions in real time on WhatsApp.

---

# Automatic Placement on the Sheet

When a user joins a group, they are automatically assigned a position in the payout order.

Rules:

- Position is assigned sequentially based on join order
- If a member leaves, their slot is freed and the next joiner fills it
- Admin can manually reorder positions if needed
- The system tracks each member's position in `group_members.position`
- Payout is disbursed in position order each cycle

No manual spreadsheet management is needed — the system handles placement automatically.

---

# Payout Logic

Each group follows a rotation system.

Example:

10 members  
Monthly contribution ₦50,000  

Month 1 → Member A receives payout  
Month 2 → Member B receives payout  
Month 3 → Member C receives payout  

Agents must enforce payout order in backend logic.

---

# AI Agent Workflow

When implementing features, follow this process.

Step 1
Read and understand the entire repository.

Step 2
Identify existing UI components and API routes.

Step 3
Check database schema before creating new tables.

Step 4
Design architecture before writing code.

Step 5
Implement backend logic in modular functions.

Step 6
Write clean and maintainable TypeScript.

Step 7
Avoid breaking existing UI.

---

# Coding Standards

Use TypeScript.

Use async/await.

Separate business logic from API routes.

Prefer reusable service functions.

Keep API routes thin.

Use Supabase client for database operations.

---

# Tool Usage

Agents are allowed to use:

Supabase CLI  
Git commands  
Next.js build tools  

Database schema must be updated using migrations.

---

# Repository Behavior

Before making changes:

- analyze the codebase
- explain the reasoning
- propose architecture
- then implement

Large changes should be explained first.

---

# AI Goal

AI agents should behave like senior backend engineers.

Focus on:

correct payment verification  
secure database operations  
clear system architecture  
maintainable code