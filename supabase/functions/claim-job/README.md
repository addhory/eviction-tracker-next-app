# Claim Job Edge Function

This Supabase Edge Function handles job claiming for contractors, bypassing Row Level Security (RLS) policies by using the service role key.

## Purpose

The direct database update for claiming jobs was failing due to RLS policies. This Edge Function uses the service role key to bypass RLS while maintaining proper authentication and authorization.

## Features

- ✅ Bypasses RLS using service role key
- ✅ Validates user authentication
- ✅ Verifies contractor role permissions
- ✅ Atomic job claiming with race condition protection
- ✅ Comprehensive error handling
- ✅ CORS support for frontend integration

## Deployment

### Local Development

```bash
# Serve the function locally
supabase functions serve claim-job

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/claim-job' \
  --header 'Authorization: Bearer YOUR_USER_JWT' \
  --header 'Content-Type: application/json' \
  --data '{"caseId": "case-uuid-here"}'
```

### Production Deployment

```bash
# Deploy to Supabase
supabase functions deploy claim-job
```

## Usage

### Request Format

```json
{
  "caseId": "uuid-of-legal-case"
}
```

### Response Format

#### Success (200)

```json
{
  "message": "Job claimed successfully",
  "caseId": "case-uuid",
  "contractorId": "contractor-uuid",
  "assignedAt": "2024-01-01T12:00:00Z"
}
```

#### Error (400/401/403/404/409/500)

```json
{
  "error": "Error description",
  "details": "Additional error details (if available)"
}
```

## Error Codes

- `400` - Bad Request (missing caseId)
- `401` - Unauthorized (invalid or missing JWT)
- `403` - Forbidden (user is not a contractor)
- `404` - Not Found (job doesn't exist or doesn't meet requirements)
- `409` - Conflict (job already claimed)
- `500` - Internal Server Error

## Security

- Uses service role key to bypass RLS (stored as environment variable)
- Validates user authentication via JWT
- Verifies contractor role before allowing job claiming
- Atomic operations prevent race conditions

## Environment Variables Required

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (automatically provided)
- `SUPABASE_ANON_KEY` - Anonymous key (automatically provided)
