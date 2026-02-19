# Go-UPC Barcode Lookup CLI

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
> — Peter Steinberger, Founder of OpenClaw

**`@ktmcp-cli/goupc`** is a production-ready command-line interface for the [Go-UPC](https://go-upc.com) Barcode Lookup API. Look up products by UPC, EAN, or ISBN barcode directly from your terminal.

> **Note:** This is an unofficial CLI and is not affiliated with or endorsed by Go-UPC.

---

## Features

- Look up any product by UPC (12-digit), EAN (13-digit), or ISBN-13 barcode
- Batch look up multiple barcodes in a single command
- Clean, coloured terminal output with spinners
- JSON output mode for scripting and pipelines
- Persistent API key storage via `conf`
- Works with Node.js 18+

---

## Installation

```bash
npm install -g @ktmcp-cli/goupc
```

Or run without installing:

```bash
npx @ktmcp-cli/goupc lookup 012345678905
```

---

## Setup

Get an API key from [https://go-upc.com](https://go-upc.com), then:

```bash
goupc config set --api-key YOUR_API_KEY
```

---

## Usage

```
goupc [command] [options]
```

### Configuration

```bash
# Set your API key
goupc config set --api-key sk-abc123

# View current config (key is masked)
goupc config show

# Clear all stored config
goupc config clear
```

### Look Up a Single Barcode

```bash
# Look up by UPC
goupc lookup 012345678905

# Look up by EAN
goupc lookup 5901234123457

# Look up by ISBN-13
goupc lookup 9780262046305

# Get raw JSON
goupc lookup 012345678905 --json
```

### Batch Look Up

```bash
# Space-separated list of barcodes
goupc batch 012345678905 5901234123457 9780262046305

# Get JSON array output
goupc batch 012345678905 5901234123457 --json
```

### API Info & Tips

```bash
goupc info
```

---

## Example Output

```
────────────────────────────────────────────────────────
  Example Product Name
────────────────────────────────────────────────────────
  Barcode   012345678905
  Type      UPC
  Brand     Example Brand
  Category  Food & Beverages
  Desc      A great example product with a useful description.
  Image     https://images.go-upc.com/...
  Specs:
    • Weight: 500g
    • Country of Origin: USA
────────────────────────────────────────────────────────
```

---

## Barcode Format Tips

| Format  | Digits | Region            |
|---------|--------|-------------------|
| UPC-A   | 12     | North America      |
| EAN-13  | 13     | International      |
| ISBN-13 | 13     | Books (worldwide)  |

---

## API Reference

| Endpoint              | Description                        |
|-----------------------|------------------------------------|
| `GET /code/{barcode}` | Look up a product by barcode code  |

Authentication uses a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

Base URL: `https://go-upc.com/api/v1`

Full API docs: [https://go-upc.com/docs](https://go-upc.com/docs)

---

## Development

```bash
git clone https://github.com/ktmcp-cli/goupc.git
cd goupc
npm install
node bin/goupc.js info
```

---

## License

MIT — Copyright (c) 2024 KTMCP

---

## Links

- Homepage: [https://killthemcp.com/goupc-cli](https://killthemcp.com/goupc-cli)
- Issues: [https://github.com/ktmcp-cli/goupc/issues](https://github.com/ktmcp-cli/goupc/issues)
- Go-UPC API: [https://go-upc.com](https://go-upc.com)
