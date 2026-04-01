# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** Swift iOS Application
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** {{FRAMEWORK}}
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Build Tool:** Xcode

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use Xcode or VS Code with Swift extensions
3. **Testing**: Run unit and UI tests before committing changes
4. **Build**: Archive and distribute with Xcode

## Conventions

<!-- TODO: Add project conventions -->

## Commands

### Development
```bash
{{DEV_COMMAND}}
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
```

### iOS Specific
```bash
xcodebuild -project {{PROJECT_NAME}}.xcodeproj -scheme {{PROJECT_NAME}} build  # Build project
xcodebuild -project {{PROJECT_NAME}}.xcodeproj -scheme {{PROJECT_NAME}} test   # Run tests
swift test                              # Run Swift tests if using Swift Package Manager
```

## Windsurf Configuration

### Development Patterns
- Follow Swift conventions and best practices
- Use SwiftUI for modern iOS development
- Implement proper MVVM architecture
- Use Combine for reactive programming
- Implement proper error handling
- Follow iOS Human Interface Guidelines
- Use Swift Concurrency for async operations
- Implement proper data persistence with Core Data
- Use dependency injection for testability
- Implement proper networking with URLSession or Alamofire
- Follow iOS memory management patterns
- Implement proper localization support
- Use Swift Package Manager for dependencies

### Key Features
- Swift programming language
- SwiftUI framework
- MVVM architecture pattern
- Combine reactive framework
- Swift Concurrency
- Core Data persistence
- URL networking
- iOS design guidelines
- App Store deployment

### Key Features
- Swift programming language
- SwiftUI framework
- MVVM architecture pattern
- Combine reactive framework
- Swift Concurrency
- Core Data persistence
- URL networking
- iOS design guidelines
- App Store deployment