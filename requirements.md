# Requirements Document

## Introduction

An Instagram automation SaaS platform that enables content creators and businesses to automate Instagram engagement — turning comments, story replies, and direct messages into automated DM flows with links, lead capture, and follow gates. Users authenticate via Google OAuth, connect their Instagram accounts via Meta OAuth, and manage automations through a multi-workspace dashboard. The platform operates on a tiered subscription model (Free, Pro, Growth) with optional DM add-on packs.

## Glossary

- **Platform**: The Instagram automation SaaS application described in this document.
- **User**: An authenticated person who has signed in via Google OAuth.
- **Workspace**: A logical container owned by a User, holding one or more connected Instagram Accounts and all associated automations, contacts, and analytics.
- **Instagram_Account**: A Meta/Instagram account linked to a Workspace via Instagram OAuth.
- **Automation**: A configured rule that listens for a Trigger and executes one or more Actions.
- **Trigger**: An Instagram event that activates an Automation (e.g., a comment containing a keyword, a story reply, or an incoming DM).
- **Action**: A response the Platform performs when a Trigger fires (e.g., send a DM, collect an email, require a follow).
- **DM**: A direct message sent on Instagram from the connected Instagram_Account to a recipient.
- **Keyword**: A word or phrase that, when found in a comment or DM, activates a keyword-based Trigger.
- **Template**: A pre-configured Automation blueprint that Users can apply to create a new Automation quickly.
- **Contact**: A person who has interacted with at least one Automation; may include an email address if captured via an Email_Gate.
- **Email_Gate**: An Action that requires a recipient to provide their email address before receiving a link.
- **Follow_Gate**: An Action that requires the recipient to follow the connected Instagram_Account before receiving a link.
- **Rewind**: A feature that retroactively sends DMs to users who commented on a past post before an Automation was set up.
- **Plan**: A subscription tier — Free, Pro, or Growth — that determines usage limits and available features.
- **DM_Add_On**: A one-time purchasable pack of additional DM credits that never expire and stack with each other.
- **CTR**: Click-through rate — the ratio of link clicks to DMs sent for an Automation.
- **Subscription_Service**: The billing subsystem responsible for plan management and DM_Add_On purchases.
- **Auth_Service**: The subsystem responsible for Google OAuth sign-in and session management.
- **Instagram_OAuth_Service**: The subsystem responsible for Meta/Instagram OAuth account linking.
- **Automation_Engine**: The subsystem that listens for Triggers and executes Actions.
- **Analytics_Service**: The subsystem that aggregates and surfaces engagement metrics.
- **Contact_Service**: The subsystem that stores and manages Contact records.

---

## Requirements

### Requirement 1: Google OAuth Authentication

**User Story:** As a visitor, I want to sign in using my Google account, so that I can access the Platform without managing a separate password.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a Google OAuth sign-in entry point as the sole authentication method (no email/password login).
2. WHEN a visitor initiates Google OAuth sign-in, THE Auth_Service SHALL redirect the visitor to Google's authorization endpoint.
3. WHEN Google returns a successful authorization code, THE Auth_Service SHALL exchange it for tokens, create or retrieve the User record, and establish an authenticated session.
4. IF Google returns an error or the visitor denies authorization, THEN THE Auth_Service SHALL display a descriptive error message and return the visitor to the sign-in page.
5. WHEN an authenticated session expires, THE Auth_Service SHALL redirect the User to the sign-in page before allowing access to any protected resource.
6. WHEN a User signs out, THE Auth_Service SHALL invalidate the session and redirect the User to the sign-in page.

---

### Requirement 2: Instagram Account Linking

**User Story:** As an authenticated User, I want to connect my Instagram account to my Workspace via Instagram OAuth, so that the Platform can listen for events and send DMs on my behalf.

#### Acceptance Criteria

1. WHEN an authenticated User initiates Instagram account linking, THE Instagram_OAuth_Service SHALL redirect the User to Meta's Instagram authorization endpoint requesting the required permissions (read comments, send messages, read stories).
2. WHEN Meta returns a successful authorization code, THE Instagram_OAuth_Service SHALL exchange it for a long-lived access token and associate the resulting Instagram_Account with the User's Workspace.
3. IF Meta returns an error or the User denies authorization, THEN THE Instagram_OAuth_Service SHALL display a descriptive error message and return the User to the account-linking screen.
4. WHILE a Workspace has an active Instagram_Account linked, THE Platform SHALL display the connected Instagram username in the sidebar and dashboard.
5. THE Instagram_OAuth_Service SHALL refresh Instagram access tokens before they expire to maintain uninterrupted connectivity.
6. IF an Instagram access token cannot be refreshed, THEN THE Platform SHALL notify the User that re-authorization is required and pause all Automations for the affected Instagram_Account.
7. WHEN a User removes a linked Instagram_Account, THE Platform SHALL revoke the stored access token and deactivate all Automations associated with that account.

---

### Requirement 3: Workspace Management

**User Story:** As a User, I want a Workspace that groups my Instagram accounts, automations, and contacts, so that I can manage all activity for my brand in one place.

#### Acceptance Criteria

1. THE Platform SHALL create a default Workspace automatically when a new User completes Google OAuth sign-in for the first time.
2. THE Platform SHALL enforce the maximum number of Instagram_Accounts per Workspace according to the active Plan (1 for Free, 2 for Pro, 5 for Growth).
3. WHEN a User attempts to link an Instagram_Account that would exceed the Plan limit, THE Platform SHALL prevent the linking and display a prompt to upgrade the Plan.
4. THE Platform SHALL display the total number of linked Instagram_Accounts and the Plan limit in the sidebar at all times while a User is authenticated.
5. WHILE a Workspace is active, THE Platform SHALL isolate all Automations, Contacts, and analytics data within that Workspace from other Workspaces.

---

### Requirement 4: Dashboard (Home)

**User Story:** As a User, I want a home dashboard that surfaces recent posts lacking automations and today's key activity, so that I can quickly identify gaps and take action.

#### Acceptance Criteria

1. WHEN a User navigates to the Home screen, THE Platform SHALL display the connected Instagram username for the selected Instagram_Account.
2. THE Platform SHALL display a "Today's Actions" section listing recent Instagram posts and reels that have no active Automation configured.
3. FOR each post listed in "Today's Actions", THE Platform SHALL provide a "Set up Automation" button that navigates directly to the Automation Builder pre-filled with that post as the Trigger source.
4. FOR each post that already has an Automation, THE Platform SHALL provide a "View Automation" button that navigates to the Automation detail view.
5. THE Platform SHALL display the total DMs sent today and the total number of linked Instagram_Accounts in the sidebar.

---

### Requirement 5: Automation List

**User Story:** As a User, I want to view all my Automations in a list with key metrics, so that I can monitor performance and manage their status.

#### Acceptance Criteria

1. WHEN a User navigates to the Automations screen, THE Platform SHALL display a list of all Automations for the current Workspace with columns: Name, DMs sent, Link Clicks, CTR, Status, and Actions.
2. THE Platform SHALL display each Automation's Status as either "Live" or "Paused".
3. WHEN a User clicks "Pause" on a Live Automation, THE Automation_Engine SHALL stop processing new Triggers for that Automation and update its Status to "Paused".
4. WHEN a User clicks "Resume" on a Paused Automation, THE Automation_Engine SHALL resume processing Triggers for that Automation and update its Status to "Live".
5. IF any Instagram post published within the last 7 days has no associated Automation, THEN THE Platform SHALL display a warning banner on the Automations screen indicating the number of unautomated recent posts.
6. WHEN a User deletes an Automation, THE Platform SHALL require explicit confirmation before permanently removing the Automation and its associated metrics.

---

### Requirement 6: Automation Builder — Triggers

**User Story:** As a User, I want to configure what events trigger my Automation, so that the right Instagram interactions activate the correct response.

#### Acceptance Criteria

1. THE Automation_Engine SHALL support three Trigger types: "Comment on Post/Reel", "Story Reply/Reaction", and "Direct Message".
2. WHEN a User selects the "Comment on Post/Reel" Trigger, THE Platform SHALL allow the User to select a specific post or reel from the connected Instagram_Account as the Trigger source.
3. WHEN a User configures a "Comment on Post/Reel" Trigger with one or more Keywords, THE Automation_Engine SHALL activate only when a comment contains at least one of the specified Keywords (case-insensitive match).
4. WHEN a User configures a "Comment on Post/Reel" Trigger with no Keywords, THE Automation_Engine SHALL activate for every comment on the selected post or reel.
5. WHEN a User selects the "Story Reply/Reaction" Trigger, THE Platform SHALL allow the User to select a specific active story from the connected Instagram_Account as the Trigger source.
6. WHEN a User selects the "Direct Message" Trigger with one or more Keywords, THE Automation_Engine SHALL activate when an incoming DM contains at least one of the specified Keywords.
7. THE Platform SHALL allow an unlimited number of Keywords per Trigger on all Plans.
8. WHEN a Trigger fires and the same user has already received a DM from the same Automation within the last 24 hours, THE Automation_Engine SHALL not send a duplicate DM to that user.

---

### Requirement 7: Automation Builder — Actions

**User Story:** As a User, I want to configure what happens after a Trigger fires, so that the right response is delivered to the person who interacted with my content.

#### Acceptance Criteria

1. THE Automation_Engine SHALL support three Action types: "Send DM with Link", "Email Gate", and "Follow Gate".
2. WHEN a User configures a "Send DM with Link" Action, THE Platform SHALL require the User to provide a message body and a URL to include in the DM.
3. WHEN a Trigger fires and the configured Action is "Send DM with Link", THE Automation_Engine SHALL send the DM containing the message body and URL to the triggering user within 60 seconds.
4. WHERE the active Plan is Pro or Growth, WHEN a User configures an "Email Gate" Action, THE Platform SHALL present an email-collection prompt to the triggering user before delivering the link.
5. WHERE the active Plan is Pro or Growth, WHEN a User configures a "Follow Gate" Action, THE Platform SHALL verify whether the triggering user follows the connected Instagram_Account before delivering the link, and prompt them to follow if they do not.
6. IF a DM cannot be delivered due to an Instagram API error, THEN THE Automation_Engine SHALL retry delivery up to 3 times with exponential backoff and log the failure if all retries are exhausted.
7. WHEN a User saves an Automation, THE Platform SHALL validate that at least one Trigger and one Action are configured before saving.

---

### Requirement 8: Automation Templates

**User Story:** As a User, I want pre-built Automation templates organized by goal, so that I can launch common automation patterns quickly without building from scratch.

#### Acceptance Criteria

1. THE Platform SHALL provide a Templates library containing at least 18 pre-built templates organized into the categories: Featured, Engage Audience, Sell & Earn, Capture Leads, and Book Clients.
2. WHEN a User selects a Template, THE Platform SHALL open the Automation Builder pre-filled with the Template's Trigger type, Action type, default message, and any relevant Keywords.
3. THE Platform SHALL include the following templates at minimum: Send link on keyword, Send link on story reaction, Require follow before link, Auto-reply to DMs, Share affiliate links, Send discount codes, Promote products, Share pricing info, Thank story reactors, Thank commenters, Start conversations, Deliver lead magnets, Collect emails first, Grow waitlist, Send booking links, Share portfolio, Promote webinars, Share content.
4. WHEN a User applies a Template and saves the resulting Automation, THE Platform SHALL treat it as a standard user-created Automation with no further dependency on the Template.

---

### Requirement 9: My Content — Posts & Reels

**User Story:** As a User, I want to browse my recent Instagram posts and reels within the Platform, so that I can set up or manage Automations directly from my content library.

#### Acceptance Criteria

1. WHEN a User navigates to My Content → Posts & Reels, THE Platform SHALL fetch and display the most recent posts and reels from the connected Instagram_Account.
2. FOR each post or reel displayed, THE Platform SHALL indicate whether an active Automation is already configured for that content.
3. FOR each post or reel without an active Automation, THE Platform SHALL provide a "Set up Automation" button that opens the Automation Builder pre-filled with that content as the Trigger source.
4. FOR each post or reel with an active Automation, THE Platform SHALL provide a "View Automation" button that navigates to the Automation detail view.
5. IF the Platform cannot fetch content from Instagram due to an API error, THEN THE Platform SHALL display an error message and provide a retry option.

---

### Requirement 10: My Content — Stories

**User Story:** As a User, I want to view my active Instagram stories within the Platform, so that I can configure story reply automations for currently live stories.

#### Acceptance Criteria

1. WHEN a User navigates to My Content → Stories, THE Platform SHALL fetch and display all stories published by the connected Instagram_Account that are within the 24-hour active window.
2. FOR each active story, THE Platform SHALL indicate whether a Story Reply/Reaction Automation is already configured.
3. FOR each active story without an Automation, THE Platform SHALL provide a "Set up Automation" button that opens the Automation Builder pre-filled with that story as the Trigger source.
4. IF no active stories exist, THEN THE Platform SHALL display a message indicating that no stories are currently active.

---

### Requirement 11: Contacts

**User Story:** As a User, I want a Contacts section that lists every person who interacted with my Automations, so that I can view and export my captured leads.

#### Acceptance Criteria

1. WHEN a user interacts with an Automation (triggers a DM, submits an email via Email_Gate, or triggers a Follow_Gate check), THE Contact_Service SHALL create or update a Contact record with the Instagram username, interaction timestamp, and Automation name.
2. WHEN a user submits an email address via an Email_Gate, THE Contact_Service SHALL store the email address on the corresponding Contact record.
3. THE Platform SHALL display aggregate Contact stats: Total Contacts, Contacts With Email, and Contacts Active Today.
4. THE Platform SHALL provide a search input that filters the Contacts list by Instagram username or email address with results appearing within 500ms.
5. WHERE the active Plan is Pro or Growth, WHEN a User clicks "Export CSV", THE Contact_Service SHALL generate and download a CSV file containing all Contact records for the current Workspace.
6. IF a User on the Free Plan attempts to export Contacts, THEN THE Platform SHALL display an upgrade prompt instead of initiating the export.

---

### Requirement 12: Rewind

**User Story:** As a User, I want to retroactively send DMs to people who commented on a past post before I had an Automation set up, so that I can capture engagement I would have otherwise missed.

#### Acceptance Criteria

1. WHEN a User initiates a Rewind, THE Platform SHALL present a step-by-step flow: Select Automation → Scan Comments → Processing → Complete.
2. WHEN a User selects an Automation in the Rewind flow, THE Platform SHALL display the post associated with that Automation's Trigger.
3. WHEN a User confirms the Rewind scan, THE Automation_Engine SHALL fetch all historical comments on the selected post that match the Automation's Trigger Keywords and have not previously received a DM from this Automation.
4. WHEN a Rewind scan completes, THE Platform SHALL display the number of comments found and the estimated number of DMs to be sent before the User confirms processing.
5. WHEN a User confirms processing, THE Automation_Engine SHALL send DMs to each identified commenter and decrement the Workspace's remaining DM quota accordingly.
6. WHEN a Rewind completes, THE Platform SHALL add an entry to the Rewind history log with the date, Automation name, post, and number of DMs sent.
7. IF the number of DMs to be sent in a Rewind would exceed the Workspace's remaining DM quota, THEN THE Platform SHALL warn the User and offer to send as many DMs as quota allows or cancel.

---

### Requirement 13: Analytics — Overview

**User Story:** As a User, I want an analytics overview showing DMs sent, link clicks, and leads captured, so that I can measure the performance of my automations over time.

#### Acceptance Criteria

1. WHEN a User navigates to Analytics → Overview, THE Analytics_Service SHALL display aggregate metrics for the current Workspace: total DMs Sent, total Link Clicks, and total Leads Captured.
2. THE Analytics_Service SHALL display a comparison of each metric against the previous equivalent period (last 7 days or last 30 days) as a percentage change.
3. THE Platform SHALL provide a date range filter allowing Users to select between last 7 days, last 30 days, and a custom date range.
4. WHEN a User changes the date range filter, THE Analytics_Service SHALL refresh all displayed metrics within 2 seconds.
5. THE Analytics_Service SHALL display an Automation Performance table listing each Automation with its DMs Sent, Link Clicks, and CTR for the selected date range.
6. THE Analytics_Service SHALL display a Content Performance section listing top-performing posts ranked by DMs sent for the selected date range.

---

### Requirement 14: Analytics — Audience Insights

**User Story:** As a User, I want audience-level engagement data per automation, so that I can understand commenter behavior and identify my most engaged followers.

#### Acceptance Criteria

1. WHEN a User navigates to Analytics → Audience Insights, THE Analytics_Service SHALL display per-Automation stats: Total Comments, Unique Commenters, and Average Comments per User.
2. THE Analytics_Service SHALL display a Top Commenters leaderboard listing the Instagram usernames with the highest comment count across Automations for the selected date range.
3. THE Platform SHALL allow Users to filter Audience Insights by a specific Automation from a dropdown.
4. WHERE the active Plan is Pro or Growth, THE Analytics_Service SHALL display geo-analytics showing the geographic distribution of users who clicked links.
5. IF a User on the Free Plan navigates to the geo-analytics section, THEN THE Platform SHALL display an upgrade prompt.

---

### Requirement 15: Subscription Plans and Billing

**User Story:** As a User, I want to choose and manage a subscription plan, so that I can access the features and DM limits appropriate for my needs.

#### Acceptance Criteria

1. THE Subscription_Service SHALL offer three Plans: Free ($0/month), Pro ($12/month billed annually or equivalent monthly rate), and Growth ($24/month billed annually or equivalent monthly rate).
2. THE Platform SHALL display a Pricing page with a monthly/yearly billing toggle, where selecting yearly billing clearly communicates a 20% discount.
3. THE Platform SHALL enforce the following DM quotas per Workspace per calendar month: 500 DMs on Free, 5,000 DMs on Pro, 10,000 DMs on Growth.
4. WHEN a Workspace's DM quota is exhausted for the current billing period, THE Automation_Engine SHALL stop sending new DMs and notify the User via an in-app banner with options to purchase a DM_Add_On or upgrade the Plan.
5. THE Platform SHALL display the current DM usage (sent / monthly limit) in the sidebar at all times while a User is authenticated.
6. THE Subscription_Service SHALL gate the following features to Pro and Growth Plans only: Email_Gate, Follow_Gate, link click tracking, Contact CSV export, and Geo analytics.
7. WHEN a User on the Free Plan attempts to use a gated feature, THE Platform SHALL display a targeted upgrade prompt identifying the specific feature and the Plan that unlocks it.
8. WHEN a User upgrades their Plan, THE Subscription_Service SHALL apply the new Plan limits and feature access immediately upon successful payment confirmation.
9. WHEN a User downgrades their Plan, THE Subscription_Service SHALL apply the lower limits at the start of the next billing period.

---

### Requirement 16: DM Add-On Packs

**User Story:** As a User, I want to purchase additional DM credits as a one-time add-on, so that I can send more DMs without changing my subscription plan.

#### Acceptance Criteria

1. THE Subscription_Service SHALL offer four DM_Add_On packs: 1,000 DMs for $5, 2,000 DMs for $9, 3,000 DMs for $12, and 5,000 DMs for $19.
2. WHEN a User purchases a DM_Add_On, THE Subscription_Service SHALL credit the purchased DM quantity to the Workspace's DM balance immediately upon payment confirmation.
3. THE Subscription_Service SHALL treat DM_Add_On credits as non-expiring; they SHALL persist across billing periods until consumed.
4. WHEN calculating remaining DM quota, THE Automation_Engine SHALL consume Plan DMs first and then deduct from DM_Add_On credits once Plan DMs are exhausted.
5. THE Platform SHALL allow a User to purchase multiple DM_Add_On packs, and their credits SHALL stack additively.
6. THE Platform SHALL provide a "Buy More DMs" link in the sidebar that navigates to the DM_Add_On purchase screen.

---

### Requirement 17: DM Rate Limits and Quota Enforcement

**User Story:** As a platform operator, I want the system to enforce DM sending limits accurately and in compliance with Meta's API policies, so that accounts are not penalized for spammy behavior.

#### Acceptance Criteria

1. THE Automation_Engine SHALL track the number of DMs sent per Workspace per calendar month and increment the counter atomically with each successful DM delivery.
2. WHEN the Automation_Engine determines a DM cannot be sent due to quota exhaustion, THE Platform SHALL record the blocked DM attempt in a log with the timestamp, Automation name, and recipient identifier.
3. THE Automation_Engine SHALL respect Meta's Instagram Messaging API rate limits and introduce delays between DM sends when approaching those limits.
4. IF a Meta API rate limit error is returned, THEN THE Automation_Engine SHALL pause DM sending for the affected Instagram_Account for the duration specified in the API error response before retrying.

---

### Requirement 18: Upgrade Prompt Banner

**User Story:** As a User, I want to see contextual upgrade prompts when I encounter feature or limit restrictions, so that I understand what I need to do to unlock additional capabilities.

#### Acceptance Criteria

1. THE Platform SHALL display a persistent top-navigation banner to Users on the Free Plan with a CTA to upgrade, and the banner SHALL be dismissible per session.
2. WHEN a Free Plan User dismisses the upgrade banner, THE Platform SHALL hide the banner for the remainder of that session and restore it on the next sign-in session.
3. WHEN a User upgrades to a paid Plan, THE Platform SHALL permanently hide the upgrade banner for that User.
4. THE Platform SHALL display contextual inline upgrade prompts at the point where a gated feature is accessed, identifying the specific Plan that unlocks the feature.
