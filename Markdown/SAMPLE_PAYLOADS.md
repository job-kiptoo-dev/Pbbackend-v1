# Sample Request Payloads for Paza Backend

Use `{{base_url}}` and `Authorization: Bearer {{auth_token}}` where required. Replace `{{...}}` variables with real values returned from previous requests.

---

GET /

- No body
- Response: welcome message

---

GET /health

- No body
- Response: health status

---

## Authentication (`/api/auth`)

### POST /api/auth/register

Headers:
- Content-Type: application/json

Body:
```json
{
  "email": "test+1@example.com",
  "password": "Password123!",
  "firstname": "Jane",
  "lastname": "Doe",
  "birthday": "1990-01-01",
  "gender": "Female",
  "phone": "+1234567890",
  "city": "Nairobi"
}
```


### POST /api/auth/login

Headers:
- Content-Type: application/json

Body:
```json
{
  "email": "test+1@example.com",
  "password": "Password123!"
}
```

Expected: JSON with `token` and `user` — set `{{auth_token}}` in environment.


### GET /api/auth/verify/:token

- No body. Replace `:token` with verification token from email flow.


### POST /api/auth/resend-verification

Headers: `Content-Type: application/json`

Body:
```json
{
  "email": "test+1@example.com"
}
```


### POST /api/auth/forgot-password

Body:
```json
{ "email": "test+1@example.com" }
```


### POST /api/auth/reset-password/:token

Body:
```json
{ "password": "NewPassw0rd!" }
```


### POST /api/auth/change-password

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassw0rd!",
  "confirmPassword": "NewPassw0rd!"
}
```


### PUT /api/auth/account-type

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "accountType": "Creator" }
```


### GET /api/auth/creator-profile

Headers: `Authorization: Bearer {{auth_token}}`


### PUT /api/auth/creator-profile/basic-info

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "creatorname": "Jane Creator",
  "about": "Short bio",
  "main": "Lifestyle"
}
```


### PUT /api/auth/creator-profile/social-media

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "followers": "12000",
  "instagram": "@jane",
  "tiktok": "@jane",
  "twitter": "@jane",
  "youtube": "https://youtube.com/channel/UCxxxx",
  "linkedin": "https://linkedin.com/in/jane",
  "facebook": "https://facebook.com/jane",
  "social": "{"}
}
```


### PUT /api/auth/creator-profile/experience

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "experience": "5 years creating content",
  "milestones": "Reached 10k followers",
  "collabs": "Brand A, Brand B"
}
```


### PUT /api/auth/creator-profile/categories-values

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "category": "Fashion",
  "subCategory": ["Streetwear", "Luxury"],
  "coreValues": ["Sustainability", "Inclusion"],
  "topics": ["Outfits", "Brand Reviews"]
}
```


### PUT /api/auth/creator-profile/media

Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "avatar": "https://cdn.example.com/avatar.jpg",
  "preview": "https://cdn.example.com/preview.jpg"
}
```


### PUT /api/auth/creator-profile/full

Headers: `Authorization: Bearer {{auth_token}}`

Body: (example combining fields — adapt as needed)
```json
{
  "creatorname": "Jane Creator",
  "about": "Full bio...",
  "main": "Lifestyle",
  "followers": "12000",
  "instagram": "@jane",
  "experience": "5 years",
  "coreValues": ["Sustainability"],
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```

---

## Social Verification (`/api/social-verification`)

### GET /api/social-verification/youtube/auth
- No body. Redirects to Google OAuth flow.

### GET /api/social-verification/youtube/callback?code=...
- No body. Receives `code` query param.

---

## Campaigns (`/api/campaigns`)

### POST /api/campaigns
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "title": "Summer Product Launch",
  "description": "Launch campaign",
  "goals": ["reach", "sales"],
  "budget": 50000,
  "createdby": "test+1@example.com"
}
```

### GET /api/campaigns
- No body. Public.

### GET /api/campaigns/search?query=summer
- No body.

### GET /api/campaigns/user?createdby=test+1@example.com
- No body.

### GET /api/campaigns/:id
- No body.

### PUT /api/campaigns/:id
Headers: `Authorization: Bearer {{auth_token}}`

Body (partial update):
```json
{ "title": "Updated Title", "budget": 55000 }
```

### DELETE /api/campaigns/:id
Headers: `Authorization: Bearer {{auth_token}}`

### POST /api/campaigns/:id/milestones
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "title": "Milestone 1",
  "description": "Deliverables",
  "start": "2025-01-01",
  "end": "2025-03-01",
  "category": "Major Milestone",
  "status": "In Progress",
  "budget": 10000
}
```

### PUT /api/campaigns/:id/milestones/:milestoneId
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "status": "Completed" }
```

### DELETE /api/campaigns/:id/milestones/:milestoneId
Headers: `Authorization: Bearer {{auth_token}}`

### POST /api/campaigns/:id/teams
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "name": "Marketing Team",
  "members": [ { "name": "Alice", "email": "alice@example.com" } ]
}
```

### DELETE /api/campaigns/:id/teams/:teamId
Headers: `Authorization: Bearer {{auth_token}}`

### POST /api/campaigns/:id/feedback
Body:
```json
{ "name": "Visitor", "email": "visitor@example.com", "feedback": "Great campaign", "desc": "Nice work" }
```

### GET /api/campaigns/:id/feedback
- No body.

### DELETE /api/campaigns/:id/feedback/:feedbackId
Headers: `Authorization: Bearer {{auth_token}}`

---

## Collaborations (`/api/collaborations`)

### POST /api/collaborations/invite
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "collaborationType": "Campaign",
  "entityId": 1,
  "inviteeEmail": "invitee@example.com",
  "role": "Contributor",
  "message": "Please join",
  "expiresIn": 168
}
```

### POST /api/collaborations/accept
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "invitationId": 123 }
```

### POST /api/collaborations/reject
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "invitationId": 123 }
```

### GET /api/collaborations/my-invitations
Headers: `Authorization: Bearer {{auth_token}}`

### GET /api/collaborations/pending
Headers: `Authorization: Bearer {{auth_token}}`

### GET /api/collaborations/campaign/:campaignId
- No body.

### GET /api/collaborations/business/:businessId
- No body.

### PUT /api/collaborations/:collaborationId/role
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "role": "Lead" }
```

### DELETE /api/collaborations/:collaborationId
Headers: `Authorization: Bearer {{auth_token}}`

### GET /api/collaborations/verify/:token
- No body.

---

## Jobs (`/api/jobs`)

### POST /api/jobs
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "title": "Frontend Developer",
  "description": "Build UI",
  "category": "Engineering",
  "location": "Remote",
  "payment": "5000"
}
```

### GET /api/jobs
- No body.

### GET /api/jobs/search?query=frontend

### GET /api/jobs/category/:category

### GET /api/jobs/owner/:ownerId

### GET /api/jobs/:id

### PUT /api/jobs/:id
Headers: `Authorization: Bearer {{auth_token}}`

Body (partial):
```json
{ "title": "Senior Frontend Developer" }
```

### DELETE /api/jobs/:id
Headers: `Authorization: Bearer {{auth_token}}`

### POST /api/jobs/:id/proposals
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "proposerId": 7,
  "title": "Proposal for job",
  "description": "I will deliver...",
  "proposedBudget": 4000,
  "deliverables": ["Home page", "Contact form"]
}
```

### GET /api/jobs/:id/proposals

### PUT /api/jobs/:id/proposals/:proposalId
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{ "status": "Accepted" }
```

### DELETE /api/jobs/:id/proposals/:proposalId
Headers: `Authorization: Bearer {{auth_token}}`

---

## Brand Profiles (`/api/brands`)

### GET /api/brands/:businessId/profile

### PUT /api/brands/:businessId/profile/basic-info
Headers: `Authorization: Bearer {{auth_token}}` (if endpoint requires auth in implementation)

Body:
```json
{
  "brandname": "Acme Co",
  "description": "We sell stuff",
  "tagline": "Best in market",
  "website": "https://acme.example.com",
  "industry": "Retail"
}
```

### PUT /api/brands/:businessId/profile/contact

Body:
```json
{
  "email": "contact@acme.example.com",
  "phone": "+254700000000",
  "address": "1 Acme Road",
  "city": "Nairobi",
  "country": "Kenya"
}
```

### PUT /api/brands/:businessId/profile/company

Body:
```json
{ "foundedYear": "2015", "employees": "50", "mission": "Deliver quality", "values": ["Integrity", "Quality"] }
```

### PUT /api/brands/:businessId/profile/social

Body:
```json
{ "instagram": "@acme", "twitter": "@acme", "linkedin": "https://linkedin.com/company/acme" }
```

### PUT /api/brands/:businessId/profile/media

Body:
```json
{ "logo": "https://cdn.example.com/logo.png", "coverImage": "https://cdn.example.com/cover.jpg" }
```

### PUT /api/brands/:businessId/profile/details

Body:
```json
{ "partnerships": ["Partner A"], "awards": ["Best Startup 2020"], "testimonials": "Great service", "categories": ["Retail"] }
```

### PUT /api/brands/:businessId/profile/full

Body: full profile JSON combining previous fields.

---

## Service Requests (`/api/service-requests`) — routes defined but not mounted by default

### POST /api/service-requests
Headers: `Authorization: Bearer {{auth_token}}`

Body:
```json
{
  "campaignId": 1,
  "serviceType": "Videographer",
  "description": "Need someone to shoot B-roll"
}
```

### GET /api/service-requests/open
- No body.

### GET /api/service-requests/campaign/:campaignId
- No body.
 
### GET /api/service-requests/:id
- No body. Returns single service request with campaign and postedBy relations.

### GET /api/service-requests/my/me
- Headers: `Authorization: Bearer {{auth_token}}`
- No body. Returns service requests posted by the authenticated user.

### GET /api/service-requests/search?serviceType=Videographer&campaignId=1
- No body. Query params: `serviceType` (required), optional `campaignId`.

### PUT /api/service-requests/:id
- Headers: `Authorization: Bearer {{auth_token}}`
- Body: any of the updatable fields (serviceType, description, skills, tools, budget, deliverables, deadline, tags, status)

Example:
```json
{ "description": "Updated description", "budget": "1000" }
```

### PUT /api/service-requests/:id/status
- Headers: `Authorization: Bearer {{auth_token}}`
- Body:
```json
{ "status": "In Progress" }
```

### DELETE /api/service-requests/:id
- Headers: `Authorization: Bearer {{auth_token}}`
- No body.

---

## Notes & usage

- Start server (default port 5000) and set `{{base_url}}` accordingly.
- Use the `POST /api/auth/register` and `POST /api/auth/login` flows first to obtain `{{auth_token}}`.
- For endpoints requiring resource IDs (campaignId, businessId, jobId, proposalId, etc.), create resources first and copy the returned IDs into your environment.

If you want, I can:
- Convert these examples into a Postman collection with tests that automatically set `auth_token` and captured IDs, or
- Run the existing Postman collection with these payloads using `newman` and report failing endpoints (I'll need the server running and DB env vars set).
