# monicredit API Reference

Quick reference for monicredit API endpoints used in this project.

## Base Configuration

```typescript
Base URL: https://live.backend.monicredit.com/api/v1
Authentication: Bearer Token (obtained via login)
```

## Authentication

### Login
**Endpoint**: `POST /core/auth/login`

**Request**:
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response**:
```json
{
  "status": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

**Implementation**: Automatically handled by `lib/monicredit.ts` with token caching.

---

## Banking APIs

### 1. Bank List

**Endpoint**: `GET /banking/bank-list`

**Headers**:
```
Accept: application/json
Authorization: Bearer {token}
```

**Response**:
```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "Access Bank",
      "code": "044",
      "slug": "access-bank",
      "bank_shortname": "Access",
      "logo": "/banks/access.png"
    },
    {
      "id": 2,
      "name": "GTBank",
      "code": "058",
      "slug": "gtbank",
      "bank_shortname": "GTB",
      "logo": "/banks/gtbank.png"
    }
  ]
}
```

**Usage**:
```typescript
import { listMonicreditBanks } from "@/lib/monicredit";

const banks = await listMonicreditBanks();
```

---

### 2. Name Enquiry (Account Verification)

**Endpoint**: `GET /banking/wallet/name-enquiry`

**Query Parameters**:
- `bank_code` (required): Bank code (e.g., "058" for GTBank)
- `account_no` (required): 10-digit account number

**Headers**:
```
Accept: application/json
Authorization: Bearer {token}
```

**Example Request**:
```
GET /banking/wallet/name-enquiry?bank_code=058&account_no=0123456789
```

**Response (Success)**:
```json
{
  "status": true,
  "data": {
    "account_name": "JOHN DOE",
    "account_number": "0123456789",
    "bank_code": "058",
    "status": 1
  }
}
```

**Response (Failed)**:
```json
{
  "status": false,
  "message": "Invalid account number",
  "data": {
    "account_name": "",
    "account_number": "0123456789",
    "bank_code": "058",
    "status": 0
  }
}
```

**Status Codes**:
- `1`: Account verification successful
- `0`: Account verification failed

**Usage**:
```typescript
import { resolveMonicreditAccount } from "@/lib/monicredit";

const accountDetails = await resolveMonicreditAccount({
  accountNumber: "0123456789",
  bankCode: "058"
});

console.log(accountDetails.account_name); // "JOHN DOE"
```

---

## Common Bank Codes

| Bank Name | Code |
|-----------|------|
| Access Bank | 044 |
| GTBank | 058 |
| Zenith Bank | 057 |
| First Bank | 011 |
| UBA | 033 |
| Fidelity Bank | 070 |
| Union Bank | 032 |
| Sterling Bank | 232 |
| Stanbic IBTC | 221 |
| Polaris Bank | 076 |
| Wema Bank | 035 |
| Ecobank | 050 |
| FCMB | 214 |
| Heritage Bank | 030 |
| Keystone Bank | 082 |
| Providus Bank | 101 |
| Kuda Bank | 50211 |
| Opay | 999992 |
| PalmPay | 999991 |

*Note: Use the Bank List API to get the complete and up-to-date list.*

---

## Error Handling

### Common Error Responses

**Authentication Error**:
```json
{
  "status": false,
  "message": "Invalid credentials"
}
```

**Invalid Request**:
```json
{
  "status": false,
  "message": "Validation error",
  "errors": {
    "account_no": ["The account no field is required."]
  }
}
```

**Server Error**:
```json
{
  "status": false,
  "message": "Internal server error"
}
```

### Error Handling in Code

```typescript
try {
  const accountDetails = await resolveMonicreditAccount({
    accountNumber: "0123456789",
    bankCode: "058"
  });
  console.log("Verified:", accountDetails.account_name);
} catch (error) {
  console.error("Verification failed:", error.message);
  // Handle error appropriately
}
```

---

## Rate Limiting

monicredit may implement rate limiting. Best practices:

1. **Cache Results**: Cache bank list to avoid repeated calls
2. **Debounce Requests**: Debounce account verification requests
3. **Handle Errors**: Implement retry logic with exponential backoff

---

## Testing

### Test Environment
```
Base URL: https://demo.backend.monicredit.com/api/v1
```

### Production Environment
```
Base URL: https://live.backend.monicredit.com/api/v1
```

**Current Configuration**: Production (Live)

---

## Security Best Practices

1. **Never expose credentials**: Keep email/password in environment variables
2. **Token Security**: Tokens are cached in memory, never logged
3. **HTTPS Only**: All requests use HTTPS
4. **Input Validation**: Always validate account numbers (10 digits)
5. **Error Messages**: Don't expose sensitive info in error messages

---

## Integration Checklist

- [x] Environment variables configured
- [x] Authentication implemented with token caching
- [x] Bank list API integrated
- [x] Name enquiry API integrated
- [x] Error handling implemented
- [x] TypeScript types defined
- [ ] Rate limiting handled
- [ ] Monitoring and logging setup
- [ ] Production testing completed

---

## Additional Resources

- **Official Documentation**: https://monicredit.gitbook.io/mc-api
- **Support**: Contact monicredit support team
- **Migration Guide**: See `MONICREDIT_MIGRATION.md`

---

**Last Updated**: June 1, 2026  
**API Version**: v1  
**Library**: `lib/monicredit.ts`
