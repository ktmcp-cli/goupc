# AGENT.md — @ktmcp-cli/goupc

Agent reference for the Go-UPC Barcode Lookup CLI.

## Project Overview

`@ktmcp-cli/goupc` is a Node.js ESM CLI that wraps the [Go-UPC](https://go-upc.com) REST API. It allows users to look up product details by UPC, EAN, or ISBN-13 barcode from the terminal.

## Repository Layout

```
goupc/
├── bin/
│   └── goupc.js          # Entry point (shebang, imports src/index.js)
├── src/
│   ├── index.js          # Commander CLI — all commands defined here
│   ├── api.js            # API client (lookupBarcode, lookupBatch, formatProduct)
│   └── config.js         # Conf-based persistent config (apiKey storage)
├── package.json
├── README.md
├── AGENT.md              # This file
├── LICENSE
└── banner.svg
```

## Key Source Files

### src/config.js

Uses the `conf` package with `projectName: 'ktmcp-goupc'`.

Exports:
- `getConfig(key)` — retrieve a config value
- `setConfig(key, value)` — store a config value
- `getAllConfig()` — return the full config store object
- `clearConfig()` — wipe all stored config
- `isConfigured()` — returns `true` if `apiKey` is a non-empty string

### src/api.js

Exports:
- `lookupBarcode(code)` — `GET https://go-upc.com/api/v1/code/{code}` with Bearer auth. Throws user-friendly errors for 401, 404, 429, and network failures.
- `lookupBatch(codes)` — iterates an array of codes, calls `lookupBarcode` for each, returns `[{code, data?, error?}]`.
- `formatProduct(data)` — normalises a raw API response to `{name, description, brand, category, imageUrl, specs, barcode, barcodeType}`.

### src/index.js

Commander-based CLI. Commands:
- `config set --api-key <key>` — store API key
- `config show` — display masked key and configured status
- `config clear` — wipe config
- `lookup <code> [--json]` — single barcode lookup; pretty-prints or outputs JSON
- `batch <codes...> [--json]` — multiple barcodes; table view or JSON array
- `info` — API info, status, usage examples, tips

All lookup commands call `requireAuth()` which exits with an error message if no API key is set.

## API Details

| Property     | Value                                   |
|--------------|-----------------------------------------|
| Base URL     | `https://go-upc.com/api/v1`             |
| Auth         | `Authorization: Bearer <API_KEY>`       |
| Main endpoint| `GET /code/{barcode}`                   |
| Timeout      | 15 000 ms                               |
| Formats      | UPC-A (12 digit), EAN-13, ISBN-13       |

## Dependencies

| Package    | Purpose                              |
|------------|--------------------------------------|
| commander  | CLI argument parsing                 |
| axios      | HTTP client                          |
| chalk      | Terminal colours                     |
| ora        | Spinners                             |
| conf       | Persistent config (OS-native paths)  |

## Common Tasks

### Add a new command

In `src/index.js`, call `program.command(...)` and implement the handler. Import any new API methods from `src/api.js`.

### Add a new config field

Add the field to the `schema` object in `src/config.js`. Access it with `getConfig('fieldName')` / `setConfig('fieldName', value)`.

### Add a new API endpoint

Add a new exported async function in `src/api.js` using the shared `buildClient()` helper.

## Testing Manually

```bash
node bin/goupc.js info
node bin/goupc.js config set --api-key TEST_KEY
node bin/goupc.js config show
node bin/goupc.js lookup 012345678905
node bin/goupc.js batch 012345678905 5901234123457 --json
```

## Notes

- The project uses ES modules (`"type": "module"` in package.json). All imports must use `.js` extensions.
- `chalk`, `ora`, and `conf` v12+ are ESM-only; do not downgrade them.
- Node.js 18+ is required (native `fetch` is available if needed in the future).
- This is an unofficial CLI; it is not affiliated with Go-UPC.
