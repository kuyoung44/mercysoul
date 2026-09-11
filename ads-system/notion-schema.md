# MercySoul Ads Command Center — Notion Schema

## 1. Campaigns

| Property | Type | Options / Formula | Purpose |
|---|---|---|---|
| Campaign Name | Title | | Identifier |
| Campaign ID | Text | Meta campaign ID | Attribution |
| Status | Select | Planned, Active, Learning, Paused, Completed | Lifecycle |
| Objective | Select | Leads, Sales, Traffic, Engagement | Objective |
| Offer | Select | Vision Brain, Bot, Build Flash, News Gate, Enterprise | Offer |
| Start Date | Date | | Launch |
| End Date | Date | | End |
| Budget | Number | NGN | Planned budget |
| Daily Budget | Number | NGN | Daily spend cap |
| Audience | Text | | Target definition |
| Location | Multi-select | Nigeria, Lagos, Ibadan, etc. | Geography |
| Leads | Relation | -> Leads | Lead linkage |
| Creatives | Relation | -> Creatives | Creative linkage |
| Performance | Relation | -> Daily Performance | Metrics linkage |
| Weekly Reviews | Relation | -> Weekly Review | Review linkage |
| Total Spend | Rollup | Performance -> Spend -> Sum | Spend |
| Total Leads | Rollup | Leads -> Lead Name -> Count | Leads |
| Revenue | Rollup | Leads -> Revenue -> Sum | Revenue |
| CPL | Formula | `if(prop("Total Leads") == 0, 0, prop("Total Spend") / prop("Total Leads"))` | Cost per lead |
| ROAS | Formula | `if(prop("Total Spend") == 0, 0, prop("Revenue") / prop("Total Spend"))` | Return |
| Decision | Select | Scale, Maintain, Improve, Pause | Action |
| Notes | Text | | Notes |

## 2. Leads

| Property | Type | Options / Formula | Purpose |
|---|---|---|---|
| Lead Name | Title | | Person/business |
| Lead ID | Text | Meta lead ID | Deduplication |
| Created Time | Date | | Arrival |
| Campaign | Relation | -> Campaigns | Attribution |
| Ad Set | Text | | Attribution |
| Ad Name | Text | | Attribution |
| Source | Select | Facebook, Instagram, WhatsApp, Website, Referral | Source |
| Phone | Phone | | Contact |
| Email | Email | | Contact |
| Business Type | Select | SME, Creator, Professional, Enterprise, Personal, Other | Qualification |
| Need | Select | AI Art, Bot, Website, Marketing, Automation, Other | Qualification |
| Budget Range | Select | <NGN10k, NGN10k-NG50k, NGN50k-NG150k, NGN150k-NG500k, NGN500k+ | Qualification |
| Lead Quality | Select | Cold, Warm, Hot, Qualified, Unqualified | Quality |
| Status | Select | New, Contacted, Qualified, Proposal, Won, Lost, Nurture | Sales stage |
| Follow-up Date | Date | | Next action |
| Revenue | Number | NGN | Customer value |
| Product Sold | Select | Vision Brain, Bot, Build Flash, News Gate, Enterprise, Other | Sale |
| First Response | Date | | Speed |
| Response Time | Formula | `dateBetween(prop("First Response"), prop("Created Time"), "minutes")` | Response time |
| Notes | Text | | Sales notes |
| WhatsApp | URL | `https://wa.me/` + phone digits | Contact shortcut |
| Owner | Person | | Assignment |

## 3. Creatives

| Property | Type | Options / Formula | Purpose |
|---|---|---|---|
| Creative Name | Title | | Identifier |
| Creative ID | Text | Meta creative ID | Attribution |
| Campaign | Relation | -> Campaigns | Campaign |
| Format | Select | Image, Video, Carousel, Reel | Format |
| Angle | Select | Transformation, Problem, Demo, Social Proof, Founder | Angle |
| Hook | Text | | Opening |
| Offer | Select | Vision Brain, Bot, Build Flash, News Gate, Enterprise | Offer |
| Status | Select | Draft, Ready, Live, Winner, Fatigued, Paused | Lifecycle |
| Spend | Number | NGN | Spend |
| Impressions | Number | | Delivery |
| Clicks | Number | | Traffic |
| Leads | Number | | Leads |
| CTR | Formula | `if(prop("Impressions") == 0, 0, prop("Clicks") / prop("Impressions") * 100)` | Click efficiency |
| CPL | Formula | `if(prop("Leads") == 0, 0, prop("Spend") / prop("Leads"))` | Lead efficiency |
| Winner Score | Number | | Internal score |
| Asset URL | URL | | Asset |
| Notes | Text | | Learning |

## 4. Daily Performance

| Property | Type | Options / Formula | Purpose |
|---|---|---|---|
| Date | Date | | Reporting day |
| Campaign | Relation | -> Campaigns | Campaign |
| Spend | Number | NGN | Spend |
| Impressions | Number | | Delivery |
| Reach | Number | | Unique users |
| Clicks | Number | | Traffic |
| Leads | Number | | Leads |
| Purchases | Number | | Sales |
| Revenue | Number | NGN | Revenue |
| CTR | Formula | `if(prop("Impressions") == 0, 0, prop("Clicks") / prop("Impressions") * 100)` | CTR |
| CPC | Formula | `if(prop("Clicks") == 0, 0, prop("Spend") / prop("Clicks"))` | CPC |
| CPL | Formula | `if(prop("Leads") == 0, 0, prop("Spend") / prop("Leads"))` | CPL |
| Conversion Rate | Formula | `if(prop("Clicks") == 0, 0, prop("Leads") / prop("Clicks") * 100)` | Lead conversion |
| ROAS | Formula | `if(prop("Spend") == 0, 0, prop("Revenue") / prop("Spend"))` | ROAS |
| Notes | Text | | Observation |

## 5. Weekly Review

| Property | Type | Options / Formula | Purpose |
|---|---|---|---|
| Week | Title | | Review period |
| Start Date | Date | | Monday |
| End Date | Date | | Sunday |
| Campaign | Relation | -> Campaigns | Campaign |
| Spend | Number | NGN | Weekly spend |
| Leads | Number | | Weekly leads |
| Revenue | Number | NGN | Weekly revenue |
| CPL | Formula | `if(prop("Leads") == 0, 0, prop("Spend") / prop("Leads"))` | CPL |
| ROAS | Formula | `if(prop("Spend") == 0, 0, prop("Revenue") / prop("Spend"))` | ROAS |
| Best Creative | Relation | -> Creatives | Winner |
| Worst Creative | Relation | -> Creatives | Weakest |
| Lead Quality | Select | Poor, Fair, Good, Excellent | Quality |
| Decision | Select | Scale, Maintain, Improve, Pause | Action |
| Main Learning | Text | | Learning |
| Next Experiment | Text | | Next test |
| Owner | Person | | Accountability |

## Relations

Campaigns -> Leads
Campaigns -> Creatives
Campaigns -> Daily Performance
Campaigns -> Weekly Review

Optional later relation:
Creatives <-> Leads, allowing Creative -> Leads -> Revenue attribution.

## Views

### Campaigns
- All Campaigns: table, Start Date descending
- Campaign Board: board grouped by Status
- Active Campaigns: Status = Active
- Scale Candidates: Decision = Scale
- Paused Campaigns: Status = Paused

### Leads
- All Leads: Created Time descending
- Lead Pipeline: board grouped by Status
- Hot Leads: Lead Quality = Hot
- Follow Up Today: Follow-up Date = Today
- Won Customers: Status = Won
- Lost: Status = Lost

### Creatives
- Creative Library: gallery
- Creative Board: board grouped by Status
- Winners: Status = Winner
- Testing: Status = Draft or Ready
- Fatigued: Status = Fatigued

### Daily Performance
- Daily Tracker: Date descending
- Calendar: calendar by Date
- This Week: Date is within this week
- This Month: Date is within this month

### Weekly Review
- Weekly Dashboard: Start Date descending
- Scale Decisions: Decision = Scale
- Improvement Queue: Decision = Improve
- Historical Reviews: all
- Calendar: Start Date
