# IDE-First Migration Guide

## Overview

Rosetta CLI has transitioned from a `.rosetta/skills/`-centric installation model to an **IDE-first approach**. This guide explains why the change was made, how to migrate existing installations, and answers common questions.

## Why the Change?

### Previous Behavior
- Skills were installed to `.rosetta/skills/` (project) or `~/.rosetta/skills/` (global)
- During scaffolding, skills were COPIED to IDE-specific folders
- The "source of truth" was the `.rosetta/skills/` location
- Confusion about where skills actually lived

### New Behavior
- Skills install directly to your IDE's skills directory (e.g., `.claude/skills/`)
- No intermediate `.rosetta/skills/` unless using multi-IDE support
- Clear mental model: skills live where your IDE expects them
- Each IDE has its own manifest for tracking

### Benefits
- **Simpler Mental Model**: Skills live in the IDE directory, no duplication
- **Faster Installation**: No copying between directories
- **Better Organization**: IDE-specific manifests track IDE-specific skills
- **Reduced Confusion**: Clear separation between single-IDE and multi-IDE use cases

## Before Migrating

### Check Your Current Setup

```bash
# Analyze your current installation
rosetta analyze-installation
```

This will show:
- How many skills in `.rosetta/skills/`
- Any existing IDE-specific skills
- Which IDEs are configured in your project

### Backup Your Work

Before migrating, create a backup:

```bash
# Copy .rosetta directory
cp -r .rosetta .rosetta.backup

# Or for global
cp -r ~/.rosetta ~/.rosetta.backup
```

## Migration Steps

### Automatic Migration

```bash
# Migrate project skills
rosetta migrate-to-ide-first

# Or migrate global skills
rosetta migrate-to-ide-first --global
```

The migration will:
1. Prompt you to select your primary IDE
2. Move skills from `.rosetta/skills/` to the IDE's directory
3. Update the IDE's manifest
4. Create a backup of the old manifest

### Manual Migration

If you prefer manual control:

```bash
# 1. Install skill to specific IDE
rosetta install <git-url> --ide "Claude Code"

# 2. Copy existing skills manually
mkdir -p .claude/skills
cp -r .rosetta/skills/* .claude/skills/

# 3. Update the manifest manually
# Edit .claude/skills/manifest.json
```

## Post-Migration

### Verify Your Skills

```bash
# List skills for specific IDE
rosetta skills --ide "Claude Code"

# List all skills across IDEs
rosetta skills --scope all
```

### Test Your Workflow

1. Open your IDE
2. Verify skills are loaded correctly
3. Test skill functionality
4. Check that IDE-specific features work

### Clean Up (Optional)

Once you've verified everything works:

```bash
# Remove old .rosetta/skills (if you're confident)
rm -rf .rosetta/skills

# Keep the backup until you're sure
rm -rf .rosetta.backup
```

## Common Questions

### Do I have to migrate?

**No.** Existing `.rosetta/skills/` installations continue to work. The migration is optional.

### What if I use multiple IDEs?

Use the `--multi-ide` flag for installations that should work across IDEs:

```bash
rosetta install <git-url> --multi-ide
```

Skills installed with `--multi-ide` go to `.rosetta/skills/` as before.

### Can I have both IDE-specific and multi-IDE skills?

**Yes.** You can:
- Install most skills to your primary IDE: `rosetta install <url> --ide "Claude Code"`
- Install shared skills to multi-IDE: `rosetta install <url> --multi-ide`

### What happens during scaffolding?

When you run `rosetta scaffold`:
1. You'll be prompted to select your primary IDE
2. Skills will be installed to that IDE's directory
3. A message will remind you how to add skills to other IDEs

### How do I add a skill to another IDE later?

```bash
rosetta install <git-url> --ide "Cursor"
```

### What if I select the wrong IDE during migration?

Re-run the migration:
```bash
rosetta migrate-to-ide-first
```

You can also manually move skills between IDE directories.

### Are global skills supported?

**Yes.** Use the `-g` flag:
```bash
rosetta install <git-url> --ide "Claude Code" -g
# Installs to ~/.claude/skills/
```

## Troubleshooting

### Skills not showing up in IDE

1. Check the skills directory exists:
   ```bash
   ls -la .claude/skills/
   ```

2. Verify the manifest:
   ```bash
   cat .claude/skills/manifest.json
   ```

3. List installed skills:
   ```bash
   rosetta skills --ide "Claude Code"
   ```

### Migration fails partway through

1. Check the error message
2. Verify source files still exist in `.rosetta/skills/`
3. Re-run the migration
4. The backup manifest will be at `.rosetta/skills/manifest.json.backup`

### IDE not detected during install

You can always specify the IDE explicitly:
```bash
rosetta install <git-url> --ide "Your IDE Name"
```

Valid IDE names:
- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- Codex CLI
- Kilo Code
- Continue.dev
- Generic

## Getting Help

If you encounter issues not covered here:

1. Check the main documentation: `docs/`
2. Run with `--dry-run` to see what would happen
3. File an issue on GitHub with:
   - Your current setup (output of `rosetta analyze-installation`)
   - The command you ran
   - Error messages
   - Your IDE and OS

## Summary

| Aspect | Old Way | New Way |
|--------|---------|---------|
| Install Location | `.rosetta/skills/` | `.claude/skills/` (or IDE-specific) |
| Manifest | `.rosetta/skills/manifest.json` | `.claude/skills/manifest.json` |
| Multi-IDE | Default | Opt-in with `--multi-ide` |
| Detection | Manual | Auto-detected with prompt |
| Mental Model | Copy to IDEs | Direct to IDE |
