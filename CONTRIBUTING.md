# Contributing to Rosetta

First off, thank you for considering contributing to Rosetta! It's people like you who make Rosetta such a great tool.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RajanChavada/Rosetta.git
   cd Rosetta
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run locally:**
   ```bash
   # Using the dev script
   npm run dev scaffold
   
   # Or directly
   node cli.js scaffold
   ```

## Coding Standards

We follow these core principles:

- **ESM Only:** Use ES6 `import`/`export` syntax. No `require`.
- **Async First:** Use `async/await` for all file and terminal operations.
- **Error Handling:** Wrap logic in `try/catch` and use `chalk.red()` for error messages.
- **Dry-Run Support:** Any command that modifies the file system **must** support the `--dry-run` flag and check it before writing.
- **Portability:** Use `path.join()` for all file paths to ensure cross-platform compatibility.

## Testing

Contributions should include tests where applicable.

```bash
# Run all unit tests
npm run test:unit

# Run specific test suites
node --experimental-vm-modules node_modules/jest/bin/jest.js test/lib/git-ops.unit.test.js
```

## Folder Structure

- `cli.js`: Entry point and command registrations.
- `lib/`: Core logic modules.
- `lib/commands/`: Individual command implementations.
- `templates/`: Boilerplate files and IDE wrappers.
- `docs/`: User documentation.

## Pull Request Process

1. Create a new branch for your feature or bugfix.
2. Ensure all tests pass.
3. Update relevant documentation in `docs/` and `README.md`.
4. Submit your PR with a clear description of the changes.

## Security

If you discover a security vulnerability, please email security@rosetta.ai.

---

MIT © [Rajan Chavada](https://github.com/RajanChavada)
