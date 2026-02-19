import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, getAllConfig, clearConfig, isConfigured } from './config.js';
import { lookupBarcode, lookupBatch, formatProduct } from './api.js';

const program = new Command();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireAuth() {
  if (!isConfigured()) {
    console.error(
      chalk.red('Error: No API key configured.\n') +
      chalk.yellow('Run: ') +
      chalk.cyan('goupc config set --api-key <YOUR_API_KEY>') +
      chalk.yellow('\n\nGet your key at: ') +
      chalk.underline('https://go-upc.com')
    );
    process.exit(1);
  }
}

function printProduct(formatted, code) {
  const divider = chalk.gray('─'.repeat(56));

  console.log(divider);
  console.log(chalk.bold.orange(`  ${formatted.name}`));
  console.log(divider);
  console.log(chalk.cyan('  Barcode  ') + chalk.white(code || formatted.barcode));
  if (formatted.barcodeType && formatted.barcodeType !== 'N/A') {
    console.log(chalk.cyan('  Type     ') + chalk.white(formatted.barcodeType));
  }
  console.log(chalk.cyan('  Brand    ') + chalk.white(formatted.brand));
  console.log(chalk.cyan('  Category ') + chalk.white(formatted.category));

  if (formatted.description && formatted.description !== 'N/A') {
    const wrapped = formatted.description.length > 120
      ? formatted.description.slice(0, 117) + '...'
      : formatted.description;
    console.log(chalk.cyan('  Desc     ') + chalk.white(wrapped));
  }

  if (formatted.imageUrl && formatted.imageUrl !== 'N/A') {
    console.log(chalk.cyan('  Image    ') + chalk.underline.blue(formatted.imageUrl));
  }

  if (Array.isArray(formatted.specs) && formatted.specs.length > 0) {
    console.log(chalk.cyan('\n  Specs:'));
    for (const spec of formatted.specs) {
      if (spec && typeof spec === 'object') {
        const key = spec.key || spec.name || Object.keys(spec)[0];
        const val = spec.value || spec.val || spec[Object.keys(spec)[0]];
        console.log(chalk.gray(`    • ${key}: `) + chalk.white(val));
      } else if (typeof spec === 'string') {
        console.log(chalk.gray(`    • `) + chalk.white(spec));
      }
    }
  }

  console.log(divider);
}

// ---------------------------------------------------------------------------
// Program metadata
// ---------------------------------------------------------------------------

program
  .name('goupc')
  .description(
    chalk.bold('Go-UPC Barcode Lookup CLI') +
    ' — look up products by UPC, EAN, or ISBN barcode'
  )
  .version('1.0.0');

// ---------------------------------------------------------------------------
// config command
// ---------------------------------------------------------------------------

const configCmd = program
  .command('config')
  .description('Manage CLI configuration (API key, etc.)');

configCmd
  .command('set')
  .description('Set a configuration value')
  .option('--api-key <key>', 'Your Go-UPC API key')
  .action((opts) => {
    if (!opts.apiKey) {
      console.error(chalk.red('Error: --api-key is required.'));
      console.log(chalk.yellow('Usage: goupc config set --api-key <YOUR_KEY>'));
      process.exit(1);
    }

    setConfig('apiKey', opts.apiKey.trim());
    console.log(
      chalk.green('✔ API key saved.\n') +
      chalk.gray('Config stored at: ') +
      chalk.cyan(getAllConfig().__path || '~/.config/ktmcp-goupc')
    );
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const cfg = getAllConfig();
    const apiKey = cfg.apiKey;

    console.log(chalk.bold('\nCurrent Configuration\n'));

    if (apiKey && apiKey.length > 0) {
      const masked = apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
      console.log(chalk.cyan('  API Key: ') + chalk.white(masked));
      console.log(chalk.green('\n  Status: ') + chalk.bold.green('Configured'));
    } else {
      console.log(chalk.cyan('  API Key: ') + chalk.gray('(not set)'));
      console.log(chalk.red('\n  Status: ') + chalk.bold.red('Not configured'));
      console.log(chalk.yellow('\n  Run: goupc config set --api-key <YOUR_KEY>'));
    }
    console.log();
  });

configCmd
  .command('clear')
  .description('Clear all stored configuration')
  .action(() => {
    clearConfig();
    console.log(chalk.yellow('Configuration cleared.'));
  });

// ---------------------------------------------------------------------------
// lookup command
// ---------------------------------------------------------------------------

program
  .command('lookup <code>')
  .description('Look up a product by barcode (UPC / EAN / ISBN)')
  .option('--json', 'Output raw JSON response')
  .action(async (code, opts) => {
    requireAuth();

    const spinner = ora({
      text: `Looking up barcode ${chalk.cyan(code)}...`,
      color: 'yellow',
    }).start();

    try {
      const data = await lookupBarcode(code);
      spinner.succeed(chalk.green('Product found!'));

      if (opts.json) {
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      const formatted = formatProduct(data);
      printProduct(formatted, code);
    } catch (err) {
      spinner.fail(chalk.red('Lookup failed'));
      console.error(chalk.red('\n' + err.message));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// batch command
// ---------------------------------------------------------------------------

program
  .command('batch <codes...>')
  .description('Look up multiple barcodes (space-separated)')
  .option('--json', 'Output raw JSON array')
  .action(async (codes, opts) => {
    requireAuth();

    const spinner = ora({
      text: `Looking up ${codes.length} barcode(s)...`,
      color: 'yellow',
    }).start();

    try {
      const results = await lookupBatch(codes);
      spinner.succeed(chalk.green(`Done. ${results.length} result(s).`));

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      // Table header
      const col1 = 18;
      const col2 = 32;
      const col3 = 24;
      const divider = chalk.gray('─'.repeat(col1 + col2 + col3 + 6));

      console.log(divider);
      console.log(
        chalk.bold.cyan(padRight('Code', col1)) +
        chalk.bold.cyan(padRight('Name', col2)) +
        chalk.bold.cyan(padRight('Brand', col3))
      );
      console.log(divider);

      for (const result of results) {
        if (result.error) {
          console.log(
            chalk.gray(padRight(result.code, col1)) +
            chalk.red(padRight('Error: ' + result.error.slice(0, 28), col2)) +
            chalk.gray(padRight('—', col3))
          );
        } else {
          const f = formatProduct(result.data);
          console.log(
            chalk.white(padRight(result.code, col1)) +
            chalk.white(padRight(truncate(f.name, col2 - 2), col2)) +
            chalk.white(padRight(truncate(f.brand, col3 - 2), col3))
          );
        }
      }

      console.log(divider);

      // Summary
      const ok = results.filter((r) => !r.error).length;
      const failed = results.filter((r) => r.error).length;
      console.log(
        chalk.green(`\n  Found: ${ok}`) +
        (failed > 0 ? chalk.red(`  Failed: ${failed}`) : '') +
        '\n'
      );
    } catch (err) {
      spinner.fail(chalk.red('Batch lookup failed'));
      console.error(chalk.red('\n' + err.message));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// info command
// ---------------------------------------------------------------------------

program
  .command('info')
  .description('Show API information and usage tips')
  .action(() => {
    const configured = isConfigured();
    const apiKey = getConfig('apiKey');
    const maskedKey = apiKey && apiKey.length > 8
      ? apiKey.slice(0, 4) + '****' + apiKey.slice(-4)
      : '(not set)';

    console.log(chalk.bold('\nGo-UPC Barcode Lookup CLI') + chalk.gray(' — @ktmcp-cli/goupc v1.0.0'));
    console.log(chalk.gray('─'.repeat(56)));

    console.log(chalk.bold('\nAPI Details'));
    console.log(chalk.cyan('  Provider : ') + 'Go-UPC (https://go-upc.com)');
    console.log(chalk.cyan('  Base URL : ') + 'https://go-upc.com/api/v1');
    console.log(chalk.cyan('  Auth     : ') + 'Bearer token (Authorization header)');
    console.log(chalk.cyan('  Endpoint : ') + 'GET /code/{barcode}');

    console.log(chalk.bold('\nStatus'));
    console.log(
      chalk.cyan('  API Key  : ') + maskedKey +
      (configured ? chalk.green(' ✔') : chalk.red(' ✗'))
    );
    console.log(
      chalk.cyan('  Ready    : ') +
      (configured ? chalk.bold.green('Yes') : chalk.bold.red('No — run: goupc config set --api-key <KEY>'))
    );

    console.log(chalk.bold('\nUsage Examples'));
    console.log(chalk.gray('  # Set your API key'));
    console.log(chalk.cyan('  goupc config set --api-key sk-abc123'));
    console.log();
    console.log(chalk.gray('  # Look up a single UPC'));
    console.log(chalk.cyan('  goupc lookup 012345678905'));
    console.log();
    console.log(chalk.gray('  # Look up an EAN'));
    console.log(chalk.cyan('  goupc lookup 5901234123457'));
    console.log();
    console.log(chalk.gray('  # Look up an ISBN'));
    console.log(chalk.cyan('  goupc lookup 9780262046305'));
    console.log();
    console.log(chalk.gray('  # Batch lookup (space-separated)'));
    console.log(chalk.cyan('  goupc batch 012345678905 5901234123457 9780262046305'));
    console.log();
    console.log(chalk.gray('  # Get JSON output'));
    console.log(chalk.cyan('  goupc lookup 012345678905 --json'));
    console.log();
    console.log(chalk.gray('  # Show stored config'));
    console.log(chalk.cyan('  goupc config show'));

    console.log(chalk.bold('\nTips'));
    console.log(chalk.gray('  • UPC codes are 12 digits (North America)'));
    console.log(chalk.gray('  • EAN codes are 13 digits (international)'));
    console.log(chalk.gray('  • ISBN-13 codes work directly as barcodes'));
    console.log(chalk.gray('  • Use --json for scripting and piping to jq'));
    console.log(chalk.gray('  • Rate limits depend on your Go-UPC plan'));

    console.log(chalk.gray('\n  Docs   : https://go-upc.com/docs'));
    console.log(chalk.gray('  Issues : https://github.com/ktmcp-cli/goupc/issues\n'));
  });

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function padRight(str, length) {
  const s = String(str || '');
  return s.length >= length ? s.slice(0, length) : s + ' '.repeat(length - s.length);
}

function truncate(str, maxLen) {
  const s = String(str || '');
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

program.parse(process.argv);
