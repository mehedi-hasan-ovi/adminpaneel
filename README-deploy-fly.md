# Deploy to Fly.io

1. Set the app `name` and `primary region` at fly.toml.

```
app = "YOUR_APP_NAME"
...
primary_region = "iad"
```

The primary region should match your database (e.g. Supabase) region.

2. Create the app using `fly` CLI:

```
fly apps create YOUR_APP_NAME
```

3. Set your secrets:

You can see the examples at `.env.fly.example`.

```
flyctl secrets set APP_NAME=YOUR_APP_NAME \
SERVER_URL=https://YOUR_APP_NAME.fly.dev \
DOMAIN_NAME=YOUR_APP_NAME.fly.dev \
DATABASE_URL=postgres://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE} \
API_ACCESS_TOKEN=1234567890 \
SESSION_SECRET=abc123 \
JWT_SECRET=abc123 \
SUPABASE_API_URL= \
SUPABASE_KEY= \
SUPABASE_ANON_PUBLIC_KEY= \
STRIPE_SK= \
SUPPORT_EMAIL= \
POSTMARK_SERVER_TOKEN= \
POSTMARK_FROM_EMAIL= \
--app YOUR_APP_NAME
```

4. Deploy the app:

```
fly deploy --remote-only
```

5. Optional: Scale

```
fly scale vm shared-cpu-2x --app YOUR_APP_NAME
```
