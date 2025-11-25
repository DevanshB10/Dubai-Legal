## API cURL Examples

Short, ready-to-run curl commands to exercise all templates and main test cases.

> Run from the project root with the app running on `http://localhost:3000`.

---

## 1. Service Agreement – HTML (default, streaming)

```bash
curl -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -o service-agreement-v2.html \
  -d '{
    "templateId": "service-agreement",
    "data": {
      "client": {
        "name": "Acme Corp",
        "address": {
          "street": "123 Main St",
          "city": "Metropolis",
          "state": "NY",
          "postalCode": "10001",
          "country": "US"
        }
      },
      "provider": {
        "name": "Provider Ltd",
        "entityType": "LLC"
      },
      "services": {
        "description": "Software development and maintenance services"
      },
      "billing": {
        "rate": 100,
        "currency": "USD",
        "unit": "hour",
        "paymentTerms": 30
      },
      "legal": {
        "governingLaw": "Delaware",
        "disputeResolution": "Binding arbitration"
      },
      "effectiveDate": "2025-01-01"
    }
  }'
```

---

## 2. Service Agreement – HTML (v1, non-streaming)

```bash
curl -X POST "http://localhost:3000/documents/generate?stream=false" \
  -H "Content-Type: application/json" \
  -o service-agreement-v1.html \
  -d '{
    "templateId": "service-agreement",
    "version": "v1",
    "data": {
      "client": {
        "name": "Acme Corp",
        "address": {
          "street": "123 Main St",
          "city": "Metropolis",
          "country": "US"
        }
      },
      "provider": { "name": "Provider Ltd" },
      "effectiveDate": "2025-01-01",
      "billing": {
        "rate": 100,
        "currency": "USD",
        "unit": "hour"
      },
      "legal": {
        "governingLaw": "Delaware"
      }
    }
  }'
```

---

## 3. NDA – HTML (default, streaming)

```bash
curl -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -o nda-v1.html \
  -d '{
    "templateId": "nda",
    "data": {
      "partyA": {
        "name": "Alpha Inc",
        "address": { "city": "Gotham", "country": "US" }
      },
      "partyB": {
        "name": "Beta LLC",
        "address": { "city": "Star City", "country": "US" }
      },
      "purpose": "discussing potential partnership",
      "effectiveDate": "2025-01-01",
      "term": { "years": 3 },
      "legal": { "governingLaw": "California" }
    }
  }'
```

---

## 4. NDA – PDF (non-streaming)

```bash
curl -X POST "http://localhost:3000/documents/generate?stream=false" \
  -H "Content-Type: application/json" \
  -o nda-v1.pdf \
  -d '{
    "templateId": "nda",
    "format": "pdf",
    "data": {
      "partyA": {
        "name": "Alpha Inc",
        "address": { "city": "Gotham", "country": "US" }
      },
      "partyB": {
        "name": "Beta LLC",
        "address": { "city": "Star City", "country": "US" }
      },
      "purpose": "discussing potential partnership",
      "effectiveDate": "2025-01-01",
      "term": { "years": 3 },
      "legal": { "governingLaw": "California" }
    }
  }'
```

---

## 5. Validation Error Example (missing required fields)

```bash
curl -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -d '{ }'
```

Expected: `400 Bad Request` with messages about `templateId` and `data` being required.

---

## 6. Unknown Template Example

```bash
curl -X POST http://localhost:3000/documents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "unknown-template",
    "data": { "test": "data" }
  }'
```

Expected: `404 Not Found` with a message listing available templates.

---

## 7. List Templates

```bash
curl http://localhost:3000/documents/templates | jq
```

---

## 8. Health Check

```bash
curl http://localhost:3000/documents/health | jq
```


