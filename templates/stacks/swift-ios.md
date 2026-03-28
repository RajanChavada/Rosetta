# {{PROJECT_NAME}}

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** ios_app
**Description:** An iOS application built with Swift

### Technology Stack

- **Language:** Swift
- **Framework:** {{FRAMEWORK}}
- **Testing:** XCTest
- **IDE:** Xcode
- **Risk Level:** medium

{{#IDE claude}}
## Standard Operating Procedures

1. **Xcode First**: Always build and run in Xcode to verify changes
2. **Verification**: Run unit tests before committing
3. **SwiftUI**: Prefer SwiftUI for new features

## Project Guardrails

- **SwiftUI**: Use SwiftUI for views
- **Combine**: Use Combine for reactive programming
- **Testing**: Write unit tests for business logic
{{/IDE}}

## Conventions

### SwiftUI
- **[Enforced]** Use SwiftUI for views
- **[Enforced]** Views should be small and composable
- **[Enforced]** Use @State, @Binding, and @Observable appropriately

### Swift
- **[Enforced]** Use Swift naming conventions (camelCase)
- **[Enforced]** Mark classes as final when not intended to be subclassed

## Commands

### Development
```bash
xcodebuild -scheme {{PROJECT_NAME}} -sdk iphonesimulator
xcodebuild test -scheme {{PROJECT_NAME}}
```

## Notes

### GOTCHA - MainActor
**Priority:** 8
UI updates must happen on main actor. Mark ViewModels and View-related classes with @MainActor.

### GOTCHA - Memory Management
**Priority:** 7
Swift uses ARC, but be careful with retain cycles when using closures. Use [weak self] in closures.
