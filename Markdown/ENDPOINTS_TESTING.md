# 🧪 API Endpoint Testing Guide

This guide provides curl commands to test all endpoints in the Paza Backend API.

## Prerequisites

Before testing, ensure:
1. The dev server is running: `npm run dev`
2. The database is properly configured with seed data
3. API is accessible at `http://localhost:5000`

---

## 1️⃣ General Endpoints

### GET / - Welcome
```bash
curl -X GET http://localhost:5000/
```

### GET /health - Health Check
```bash
curl -X GET http://localhost:5000/health
```

### GET /nonexistent - 404 Test
```bash
curl -X GET http://localhost:5000/nonexistent
```

---

## 2️⃣ Authentication Endpoints

### POST /api/auth/register - Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "birthday": "1990-01-01",
    "gender": "Male",
    "phone": "+1234567890",
    "city": "New York"
  }'
```

### POST /api/auth/login - Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Password123!"
  }'
```

### GET /api/auth/login/google/auth-url - Get Google Auth URL
```bash
curl -X GET http://localhost:5000/api/auth/login/google/auth-url
```

### GET /api/auth/me - Get Authenticated User (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### PUT /api/auth/profile - Update Profile (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "UpdatedName",
    "lastName": "UpdatedLast"
  }'
```

### POST /api/auth/forgot-password - Forgot Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com"
  }'
```

### PUT /api/auth/change-password - Change Password (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }'
```

---

## 3️⃣ Campaign Endpoints

### GET /api/campaigns - Get All Campaigns
```bash
curl -X GET http://localhost:5000/api/campaigns
```

### POST /api/campaigns - Create Campaign (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "New Campaign",
    "description": "Campaign description",
    "budget": 5000,
    "goals": ["Goal 1", "Goal 2"]
  }'
```

### GET /api/campaigns/:id - Get Campaign by ID
```bash
curl -X GET http://localhost:5000/api/campaigns/1
```

### GET /api/campaigns/search - Search Campaigns
```bash
curl -X GET "http://localhost:5000/api/campaigns/search?q=campaign"
```

### GET /api/campaigns/user - Get User's Campaigns (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:5000/api/campaigns/user \
  -H "Authorization: Bearer $TOKEN"
```

### PUT /api/campaigns/:id - Update Campaign (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/campaigns/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Title"
  }'
```

### DELETE /api/campaigns/:id - Delete Campaign (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/campaigns/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/campaigns/:id/milestones - Add Milestone (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/campaigns/1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Milestone 1",
    "description": "First milestone",
    "objectives": ["Objective 1"],
    "start": "2025-01-01",
    "end": "2025-02-01",
    "budget": 1000
  }'
```

### PUT /api/campaigns/:id/milestones/:milestoneId - Update Milestone (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/campaigns/1/milestones/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Milestone"
  }'
```

### DELETE /api/campaigns/:id/milestones/:milestoneId - Delete Milestone (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/campaigns/1/milestones/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/campaigns/:id/teams - Add Team (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/campaigns/1/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Team A"
  }'
```

### DELETE /api/campaigns/:id/teams/:teamId - Delete Team (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/campaigns/1/teams/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/campaigns/:id/feedback - Add Feedback
```bash
curl -X POST http://localhost:5000/api/campaigns/1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "feedback": "Great campaign!"
  }'
```

### GET /api/campaigns/:id/feedback - Get Campaign Feedback
```bash
curl -X GET http://localhost:5000/api/campaigns/1/feedback
```

### DELETE /api/campaigns/:id/feedback/:feedbackId - Delete Feedback (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/campaigns/1/feedback/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4️⃣ Job Endpoints

### GET /api/jobs - Get All Jobs
```bash
curl -X GET http://localhost:5000/api/jobs
```

### POST /api/jobs - Create Job (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Content Creator Needed",
    "description": "Create videos for our campaign",
    "category": "Content Creation",
    "payment": "5000",
    "gender": "Any",
    "availability": "Full-time",
    "location": "Remote",
    "age": "18+",
    "experience": "2+ years",
    "priority": "High",
    "visibility": "Public",
    "skills": ["Video Editing"],
    "platforms": ["TikTok"]
  }'
```

### GET /api/jobs/:id - Get Job by ID
```bash
curl -X GET http://localhost:5000/api/jobs/1
```

### GET /api/jobs/search - Search Jobs
```bash
curl -X GET "http://localhost:5000/api/jobs/search?q=creator"
```

### GET /api/jobs/category/:category - Get Jobs by Category
```bash
curl -X GET "http://localhost:5000/api/jobs/category/Content%20Creation"
```

### GET /api/jobs/owner/:ownerId - Get Jobs by Owner
```bash
curl -X GET http://localhost:5000/api/jobs/owner/1
```

### PUT /api/jobs/:id - Update Job (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/jobs/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Job Title"
  }'
```

### DELETE /api/jobs/:id - Delete Job (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/jobs/1 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/jobs/:id/proposals - Create Proposal (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/jobs/1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "I can do this",
    "description": "I have experience",
    "proposedBudget": "4500",
    "deliverables": ["10 videos", "Thumbnails"]
  }'
```

### GET /api/jobs/:id/proposals - Get Job Proposals
```bash
curl -X GET http://localhost:5000/api/jobs/1/proposals
```

### PUT /api/jobs/:id/proposals/:proposalId - Update Proposal Status (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/jobs/1/proposals/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "accepted"
  }'
```

### DELETE /api/jobs/:id/proposals/:proposalId - Delete Proposal (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/jobs/1/proposals/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5️⃣ Collaboration Endpoints

### POST /api/collaborations/invite - Send Invitation (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/collaborations/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "inviteeEmail": "creator@example.com",
    "role": "Contributor",
    "collaborationType": "Campaign",
    "campaignId": 1,
    "message": "Join our campaign"
  }'
```

### GET /api/collaborations/my-invitations - Get My Invitations (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:5000/api/collaborations/my-invitations \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/collaborations/pending - Get Pending Invitations (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:5000/api/collaborations/pending \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/collaborations/accept - Accept Invitation (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/collaborations/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collaborationId": 1
  }'
```

### POST /api/collaborations/reject - Reject Invitation (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:5000/api/collaborations/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collaborationId": 1
  }'
```

### GET /api/collaborations/campaign/:campaignId - Get Campaign Collaborators
```bash
curl -X GET http://localhost:5000/api/collaborations/campaign/1
```

### GET /api/collaborations/business/:businessId - Get Business Collaborators
```bash
curl -X GET http://localhost:5000/api/collaborations/business/1
```

### PUT /api/collaborations/:collaborationId/role - Update Role (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/collaborations/1/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "role": "Lead"
  }'
```

### DELETE /api/collaborations/:collaborationId - Remove Collaborator (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X DELETE http://localhost:5000/api/collaborations/1 \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/collaborations/verify/:token - Verify Invitation Token
```bash
curl -X GET http://localhost:5000/api/collaborations/verify/token-here
```

---

## 6️⃣ Brand Endpoints

### GET /api/brands/:businessId/profile - Get Brand Profile
```bash
curl -X GET http://localhost:5000/api/brands/1/profile
```

### PUT /api/brands/:businessId/about - Update About (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/about \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "about": "We are a leading brand..."
  }'
```

### PUT /api/brands/:businessId/mission - Update Mission (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/mission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mission": "Our mission is to..."
  }'
```

### PUT /api/brands/:businessId/values - Update Values (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/values \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "values": ["Innovation", "Integrity", "Excellence"]
  }'
```

### PUT /api/brands/:businessId/social-links - Update Social Links (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/social-links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "instagram": "@brand",
    "twitter": "@brand",
    "facebook": "brand"
  }'
```

### PUT /api/brands/:businessId/target-audience - Update Target Audience (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/target-audience \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetAudience": "Tech enthusiasts and entrepreneurs"
  }'
```

### PUT /api/brands/:businessId/industry - Update Industry (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/industry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "industry": "Technology"
  }'
```

### PUT /api/brands/:businessId/budget - Update Budget (Requires Token)
```bash
TOKEN="your-jwt-token-here"
curl -X PUT http://localhost:5000/api/brands/1/budget \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "budget": 50000
  }'
```

---

## 7️⃣ Social Verification Endpoints

### GET /api/social-verification/youtube/auth - Get YouTube Auth
```bash
curl -X GET http://localhost:5000/api/social-verification/youtube/auth
```

### GET /api/social-verification/youtube/callback - YouTube Callback
```bash
curl -X GET "http://localhost:5000/api/social-verification/youtube/callback?code=auth-code&state=state"
```

---

## 📊 Quick Test Checklist

Use this checklist to verify all endpoints are working:

### General
- [ ] GET / (Welcome)
- [ ] GET /health (Health check)
- [ ] GET /nonexistent (404)

### Auth
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] GET /api/auth/me
- [ ] GET /api/auth/login/google/auth-url
- [ ] PUT /api/auth/profile
- [ ] POST /api/auth/forgot-password

### Campaigns
- [ ] GET /api/campaigns
- [ ] POST /api/campaigns
- [ ] GET /api/campaigns/:id
- [ ] GET /api/campaigns/search
- [ ] PUT /api/campaigns/:id
- [ ] DELETE /api/campaigns/:id
- [ ] POST /api/campaigns/:id/milestones
- [ ] POST /api/campaigns/:id/teams
- [ ] POST /api/campaigns/:id/feedback

### Jobs
- [ ] GET /api/jobs
- [ ] POST /api/jobs
- [ ] GET /api/jobs/:id
- [ ] GET /api/jobs/search
- [ ] PUT /api/jobs/:id
- [ ] DELETE /api/jobs/:id
- [ ] POST /api/jobs/:id/proposals
- [ ] GET /api/jobs/:id/proposals

### Collaborations
- [ ] POST /api/collaborations/invite
- [ ] GET /api/collaborations/my-invitations
- [ ] POST /api/collaborations/accept
- [ ] POST /api/collaborations/reject
- [ ] GET /api/collaborations/campaign/:campaignId
- [ ] PUT /api/collaborations/:collaborationId/role
- [ ] DELETE /api/collaborations/:collaborationId

### Brands
- [ ] GET /api/brands/:businessId/profile
- [ ] PUT /api/brands/:businessId/about
- [ ] PUT /api/brands/:businessId/mission
- [ ] PUT /api/brands/:businessId/values

### Social Verification
- [ ] GET /api/social-verification/youtube/auth

---

## 🔑 Important Notes

1. **Authentication**: Many endpoints require a JWT token. Get one by:
   - Register a new user via `POST /api/auth/register`
   - Login via `POST /api/auth/login`
   - Extract the `token` from the response
   - Use it in subsequent requests with `Authorization: Bearer <token>`

2. **Rate Limiting**: Some endpoints have rate limits applied. If you get 429 errors, wait a moment before retrying.

3. **Database**: Ensure the database is initialized and contains seed data before testing.

4. **CORS**: The API is configured to handle CORS requests. Origins can be adjusted in the CORS middleware.

5. **Error Handling**: All endpoints include proper error handling. Check response status codes and error messages.

---

## 📝 Usage Examples

### Register and Get Token
```bash
# 1. Register
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "birthday": "1990-01-01",
    "gender": "Male",
    "phone": "+1234567890",
    "city": "New York"
  }')

# 2. Extract token
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# 3. Use token
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create and Test Campaign Flow
```bash
TOKEN="your-token"

# Create campaign
CAMPAIGN=$(curl -s -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Campaign",
    "description": "Test campaign",
    "budget": 5000,
    "goals": ["Goal 1"]
  }')

CAMPAIGN_ID=$(echo $CAMPAIGN | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Created campaign: $CAMPAIGN_ID"

# Get campaign
curl -X GET http://localhost:5000/api/campaigns/$CAMPAIGN_ID
```

---

Happy testing! 🚀
