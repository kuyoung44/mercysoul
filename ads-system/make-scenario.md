# MercySoul Make.com Scenario

## Goal
Facebook Lead Ads -> Notion Leads, while protecting the 1,000 operations/month free-plan budget.

## Scenario

1. Facebook Lead Ads — Watch Leads
2. Notion — Search database items for Lead ID
3. Filter — continue only when no existing Lead ID is found
4. Notion — Create database item in Leads
5. Optional notification — only if genuinely needed

## Facebook fields

Lead ID
Created Time
Full Name
Phone
Email
Campaign ID
Campaign Name
Ad Set ID
Ad Set Name
Ad ID
Ad Name
Form ID
Form Name

## Notion mapping

Lead Name <- Full Name
Lead ID <- Facebook Lead ID
Created Time <- Facebook Created Time
Source <- Facebook
Phone <- Facebook Phone
Email <- Facebook Email
Ad Set <- Facebook Ad Set Name
Ad Name <- Facebook Ad Name
Status <- New
Lead Quality <- Cold
Follow-up Date <- Today
Notes <- Facebook Lead Ad

## Duplicate filter

Search Notion for Lead ID equal to the Facebook Lead ID.
Continue only when zero results are returned.

## Error handling

Facebook trigger failure: retry.
Notion temporary failure: retry.
Duplicate lead: stop route.
Missing phone: create the lead but add `Missing phone number` to Notes.

## Operation budget

Target 3-4 operations per lead.

At 250 leads/month: approximately 750-1,000 operations.

Do not create Daily Performance or Weekly Review records per lead. Enter/batch reporting separately.

## Lower-operation option

Maintain a Make Data Store mapping:

Meta Campaign ID -> Notion Campaign page ID

This avoids repeatedly searching Notion for the campaign on every lead.

## Lead form questions

1. What do you need?
- Custom AI Artwork
- Business Creative
- Social Media Artwork
- Portrait
- Other

2. Is this for?
- Personal use
- Business use

3. What is your budget?
- Under NGN10,000
- NGN10,000-NG50,000
- NGN50,000-NG150,000
- NGN150,000+

4. WhatsApp number

5. Describe what you want.
