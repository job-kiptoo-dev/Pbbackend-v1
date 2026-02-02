**Postman Quick Test Instructions**

- **Collection:** `Paza_API.postman_collection.json` (root of repo)
- **Environment:** `postman_environment.json` (root of repo)

Steps to run locally

1. Start the API server:

```bash
# make sure DB env vars are set (see README.md). Then:
npm run dev
```

2. Import collection and environment into Postman
- Open Postman -> File -> Import -> choose `Paza_API.postman_collection.json` and `postman_environment.json`.

3. Set the environment in Postman to `Paza Local Environment` (top-right environment selector).

4. Register or Login to get a token
- Use the `Auth` requests in the collection: either `Register` or `Login`.
- After a successful login, copy the returned token string and set the `auth_token` environment variable in Postman.

Tip: add this test script to the Login request's "Tests" tab to auto-save token (edit if the response field name is different):

```javascript
// Example Test script for Login response
const json = pm.response.json();
if (json && json.token) {
  pm.environment.set('auth_token', json.token);
}
```

5. Add Authorization header to requests that need it
- Many requests require `Authorization: Bearer {{auth_token}}`.
- You can add this as a collection-level header or as individual request headers.

Run the whole collection (Postman Runner)
- Open the collection -> Click the three dots -> Run Collection -> Choose environment -> Run.

Run the collection from the command line with `newman` (useful for CI)

```bash
# install newman if not present
npm install -g newman
# run collection with environment file
newman run Paza_API.postman_collection.json -e postman_environment.json --delay-request 50
```

Notes & common issues

- Port: the server defaults to `5000` (`process.env.PORT || 5000`). If you run on a different port, update `base_url` in the environment file.
- DB: The server initializes TypeORM on startup. Ensure DB env vars are set (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`) before starting.
- If collection tests assume specific resource IDs, create resources first (create user -> create business/brand/campaign) and paste their IDs into the environment variables like `sample_brand_id`.

Example minimal workflow to exercise CRUD endpoints

1. `POST /api/auth/register` -> use `test_email` / `test_password` to create a user.
2. `POST /api/auth/login` -> get `token` and set `auth_token`.
3. `POST /api/brands` -> create a brand; save returned `id` to `sample_brand_id`.
4. `POST /api/campaigns` -> create a campaign referencing `sample_brand_id`; save `sample_campaign_id`.
5. Exercise GET/PUT/DELETE on those resources using `{{base_url}}` and the saved IDs.

If you want, I can:
- Add tests to the Postman collection that automatically save returned IDs into the environment.
- Run the collection here with `newman` and report failing endpoints (requires the server to be started and DB env set).

