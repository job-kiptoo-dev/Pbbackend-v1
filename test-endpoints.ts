/**
 * Comprehensive Endpoint Testing Script
 * Tests all API endpoints using seed data
 * Run: npm run dev (in another terminal) then npx ts-node test-endpoints.ts
 */

import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'http://localhost:5000';
let api: AxiosInstance;
let authToken: string;
let testUserId: number;

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Initialize API client
const initApiClient = () => {
  api = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // Don't throw on any status
  });
};

// Helper to log results
const logResult = (
  endpoint: string,
  method: string,
  status: number,
  success: boolean,
  error?: string
) => {
  const result: TestResult = { endpoint, method, status, success };
  if (error) result.error = error;
  results.push(result);

  const icon = success ? '✅' : '❌';
  console.log(
    `${icon} ${method.padEnd(6)} ${endpoint.padEnd(50)} [${status}]`
  );
};

// Test helper
const testEndpoint = async (
  method: string,
  endpoint: string,
  data?: any,
  useAuth = false
) => {
  try {
    const config: any = {};
    if (useAuth && authToken) {
      config.headers = { Authorization: `Bearer ${authToken}` };
    }

    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await api.get(endpoint, config);
        break;
      case 'POST':
        response = await api.post(endpoint, data, config);
        break;
      case 'PUT':
        response = await api.put(endpoint, data, config);
        break;
      case 'PATCH':
        response = await api.patch(endpoint, data, config);
        break;
      case 'DELETE':
        response = await api.delete(endpoint, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    const success = response.status >= 200 && response.status < 300;
    logResult(endpoint, method, response.status, success);
    return response.data;
  } catch (error: any) {
    const status = error.response?.status || 500;
    logResult(endpoint, method, status, false, error.message);
    return null;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Main test runner
const runTests = async () => {
  initApiClient();

  console.log('\n🚀 Starting Comprehensive Endpoint Tests');
  console.log('=' + '='.repeat(98));
  console.log(
    `${'METHOD'.padEnd(6)} ${'ENDPOINT'.padEnd(50)} ${'STATUS'.padEnd(10)}`
  );
  console.log('=' + '='.repeat(98));

  // === GENERAL ENDPOINTS ===
  console.log('\n📌 General Endpoints');
  await testEndpoint('GET', '/');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/nonexistent');

  // === AUTH ENDPOINTS ===
  console.log('\n🔐 Authentication Endpoints');

  // Register
  const registerData = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    birthday: '1990-01-01',
    gender: 'Male',
    phone: '+1234567890',
    city: 'New York',
  };
  const registerRes = await testEndpoint('POST', '/api/auth/register', registerData);
  if (registerRes?.user?.id) {
    testUserId = registerRes.user.id;
  }
  if (registerRes?.token) {
    authToken = registerRes.token;
  }

  // Login (use registered email if available, otherwise use seed data)
  const loginEmail = registerData.email;
  const loginRes = await testEndpoint('POST', '/api/auth/login', {
    email: loginEmail,
    password: 'Password123!',
  });
  if (loginRes?.token) {
    authToken = loginRes.token;
  }

  // Get Google auth URL
  await testEndpoint('GET', '/api/auth/login/google/auth-url');

  // Get authenticated user (requires token)
  if (authToken) {
    await testEndpoint('GET', '/api/auth/me', undefined, true);
  }

  // Update profile (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/auth/profile',
      {
        firstName: 'Updated',
        lastName: 'Name',
      },
      true
    );
  }

  // Change password (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/auth/change-password',
      {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      },
      true
    );
  }

  // Forgot password
  await testEndpoint('POST', '/api/auth/forgot-password', {
    email: loginEmail,
  });

  await sleep(500);

  // === CAMPAIGN ENDPOINTS ===
  console.log('\n📋 Campaign Endpoints');

  // Get all campaigns
  const campaignsRes = await testEndpoint('GET', '/api/campaigns');

  // Create campaign (requires token)
  let campaignId = 1;
  if (authToken) {
    const createCampaignRes = await testEndpoint(
      'POST',
      '/api/campaigns',
      {
        title: 'Test Campaign ' + Date.now(),
        description: 'Test campaign description',
        budget: 5000,
        goals: ['Goal 1', 'Goal 2'],
      },
      true
    );
    if (createCampaignRes?.id) {
      campaignId = createCampaignRes.id;
    }
  }

  // Get campaign by ID
  await testEndpoint('GET', `/api/campaigns/${campaignId}`);

  // Search campaigns
  await testEndpoint('GET', '/api/campaigns/search?q=test');

  // Get campaigns by user (requires token)
  if (authToken) {
    await testEndpoint('GET', '/api/campaigns/user', undefined, true);
  }

  // Update campaign (requires token)
  if (authToken && campaignId) {
    await testEndpoint(
      'PUT',
      `/api/campaigns/${campaignId}`,
      {
        title: 'Updated Campaign Title',
      },
      true
    );
  }

  // Add milestone (requires token)
  if (authToken && campaignId) {
    await testEndpoint(
      'POST',
      `/api/campaigns/${campaignId}/milestones`,
      {
        title: 'Milestone 1',
        description: 'First milestone',
        objectives: ['Obj 1'],
        start: '2025-01-01',
        end: '2025-02-01',
        budget: 1000,
      },
      true
    );
  }

  // Add team (requires token)
  if (authToken && campaignId) {
    await testEndpoint(
      'POST',
      `/api/campaigns/${campaignId}/teams`,
      {
        name: 'Team A',
      },
      true
    );
  }

  // Add feedback
  await testEndpoint('POST', `/api/campaigns/${campaignId}/feedback`, {
    name: 'John Doe',
    email: 'john@example.com',
    feedback: 'Great campaign!',
  });

  // Get campaign feedback
  await testEndpoint('GET', `/api/campaigns/${campaignId}/feedback`);

  await sleep(500);

  // === JOB ENDPOINTS ===
  console.log('\n💼 Job Endpoints');

  // Get all jobs
  const jobsRes = await testEndpoint('GET', '/api/jobs');

  // Create job (requires token, only for non-creators)
  let jobId = 1;
  if (authToken) {
    const createJobRes = await testEndpoint(
      'POST',
      '/api/jobs',
      {
        title: 'Test Job ' + Date.now(),
        description: 'Test job description',
        category: 'Content Creation',
        payment: '5000',
        gender: 'Any',
        availability: 'Full-time',
        location: 'Remote',
        age: '18+',
        experience: '2+ years',
        priority: 'High',
        visibility: 'Public',
        skills: ['Video Editing', 'Storytelling'],
        platforms: ['TikTok', 'Instagram'],
      },
      true
    );
    if (createJobRes?.id) {
      jobId = createJobRes.id;
    }
  }

  // Get job by ID
  await testEndpoint('GET', `/api/jobs/${jobId}`);

  // Search jobs
  await testEndpoint('GET', '/api/jobs/search?q=test');

  // Get jobs by category
  await testEndpoint('GET', '/api/jobs/category/Content%20Creation');

  // Get jobs by owner
  if (testUserId) {
    await testEndpoint('GET', `/api/jobs/owner/${testUserId}`);
  }

  // Create proposal (requires token)
  if (authToken && jobId) {
    await testEndpoint(
      'POST',
      `/api/jobs/${jobId}/proposals`,
      {
        title: 'I can do this job',
        description: 'I have experience with this',
        proposedBudget: '4500',
        deliverables: ['10 videos', 'Thumbnails'],
      },
      true
    );
  }

  // Get job proposals
  await testEndpoint('GET', `/api/jobs/${jobId}/proposals`);

  // Update job (requires token)
  if (authToken && jobId) {
    await testEndpoint(
      'PUT',
      `/api/jobs/${jobId}`,
      {
        title: 'Updated Job Title',
        description: 'Updated description',
      },
      true
    );
  }

  await sleep(500);

  // === COLLABORATION ENDPOINTS ===
  console.log('\n🤝 Collaboration Endpoints');

  // Send invitation (requires token)
  let collaborationId = 1;
  if (authToken) {
    const inviteRes = await testEndpoint(
      'POST',
      '/api/collaborations/invite',
      {
        inviteeEmail: 'test@example.com',
        role: 'Contributor',
        collaborationType: 'Campaign',
        campaignId: campaignId || 1,
        message: 'Join our campaign',
      },
      true
    );
    if (inviteRes?.id) {
      collaborationId = inviteRes.id;
    }
  }

  // Get my invitations (requires token)
  if (authToken) {
    await testEndpoint(
      'GET',
      '/api/collaborations/my-invitations',
      undefined,
      true
    );
  }

  // Get pending invitations (requires token)
  if (authToken) {
    await testEndpoint(
      'GET',
      '/api/collaborations/pending',
      undefined,
      true
    );
  }

  // Accept invitation (requires token)
  if (authToken && collaborationId) {
    await testEndpoint(
      'POST',
      '/api/collaborations/accept',
      {
        collaborationId,
      },
      true
    );
  }

  // Reject invitation (requires token)
  if (authToken) {
    await testEndpoint(
      'POST',
      '/api/collaborations/reject',
      {
        collaborationId: collaborationId + 1,
      },
      true
    );
  }

  // Get campaign collaborators
  if (campaignId) {
    await testEndpoint('GET', `/api/collaborations/campaign/${campaignId}`);
  }

  // Get business collaborators
  await testEndpoint('GET', '/api/collaborations/business/1');

  // Update collaborator role (requires token)
  if (authToken && collaborationId) {
    await testEndpoint(
      'PUT',
      `/api/collaborations/${collaborationId}/role`,
      {
        role: 'Lead',
      },
      true
    );
  }

  await sleep(500);

  // === BRAND ENDPOINTS ===
  console.log('\n🏢 Brand Endpoints');

  // Get brand profile
  await testEndpoint('GET', '/api/brands/1/profile');

  // Update brand about (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/about',
      {
        about: 'Updated brand about',
      },
      true
    );
  }

  // Update brand mission (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/mission',
      {
        mission: 'Our mission is...',
      },
      true
    );
  }

  // Update brand values (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/values',
      {
        values: ['Innovation', 'Integrity'],
      },
      true
    );
  }

  // Update brand social links (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/social-links',
      {
        instagram: '@brand',
        twitter: '@brand',
        facebook: 'brand',
      },
      true
    );
  }

  // Update brand target audience (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/target-audience',
      {
        targetAudience: 'Tech enthusiasts',
      },
      true
    );
  }

  // Update brand industry (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/industry',
      {
        industry: 'Technology',
      },
      true
    );
  }

  // Update brand budget (requires token)
  if (authToken) {
    await testEndpoint(
      'PUT',
      '/api/brands/1/budget',
      {
        budget: 50000,
      },
      true
    );
  }

  await sleep(500);

  // === SOCIAL VERIFICATION ENDPOINTS ===
  console.log('\n📱 Social Verification Endpoints');

  // Get YouTube auth
  await testEndpoint('GET', '/api/social-verification/youtube/auth');

  await sleep(500);

  // === TEST SUMMARY ===
  console.log('\n' + '='.repeat(100));
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const totalCount = results.length;

  console.log(
    `\n📊 Test Summary: ${successCount}/${totalCount} passed (${failCount} failed)`
  );
  console.log(`✅ Success Rate: ${((successCount / totalCount) * 100).toFixed(2)}%\n`);

  // Group by status code
  const byStatus: { [key: number]: number } = {};
  results.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  console.log('📈 Status Code Distribution:');
  Object.entries(byStatus)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([status, count]) => {
      console.log(`   HTTP ${status}: ${count} requests`);
    });

  // List failed endpoints
  const failedTests = results.filter((r) => !r.success);
  if (failedTests.length > 0) {
    console.log('\n⚠️  Failed Endpoints:');
    failedTests.forEach((test) => {
      console.log(`   ${test.method.padEnd(6)} ${test.endpoint} [${test.status}]`);
      if (test.error) {
        console.log(`   └─ Error: ${test.error}`);
      }
    });
  }

  console.log('\n✅ Test Complete!\n');
};

// Run tests
runTests().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
