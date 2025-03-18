# NaiKit

A Chrome extension for enhancing NovelAI's image generation interface with advanced prompt management, preset organization, and fine-tuning capabilities.

## Features

- **Segment-Based Prompt Editor**: Build complex prompts with structured segments for better organization
- **Dual-Mode Interface**: Switch between Compose mode (for writing) and Fine-tune mode (for weight adjustment)
- **Integrated Preset System**: Manage wildcards and keywords in a unified system
- **Visual Weight Management**: Adjust weights using intuitive visual controls with real-time feedback
- **Two-Way Synchronization**: Seamless sync between NaiKit and NovelAI's native interface
- **Advanced Preset Organization**: Create, manage, and categorize your presets with folders and tags
- **Image Generation Controls**: Initiate and manage image generation directly from the extension

## Development Status

NaiKit is currently in active development. The following components are complete:

- ✅ Core state management using Axion
- ✅ NovelAI integration service with DOM interaction
- ✅ Two-way synchronization between NaiKit and NovelAI
- ✅ Sidebar UI infrastructure with mode switching
- ✅ Basic prompt sections and character prompt management
- ✅ Segment visualization components with mode-specific rendering

In progress:
- 🔄 TipTap editor integration
- 🔄 Weight adjustment UI
- 🔄 Preset management interface

Check the [todo.md](./todo.md) file for detailed progress tracking.

## Development

NaiKit is built using modern web technologies:

- **TypeScript** - For type safety and improved developer experience
- **React** - For building the user interface
- **Axion** - For state management (replaces Zustand/Immer in the original spec)
- **Vite** - For fast development and optimized builds
- **TailwindCSS** - For styling
- **TipTap/ProseMirror** - For rich text editing

### Getting Started

1. Install dependencies:
   ```
   bun install
   ```

2. Run the development server:
   ```
   bun run dev
   ```

3. Load the unpacked extension from the `dist` directory in Chrome

### Building for Production

```
bun run package
```

This will create a zip file in the root directory that can be uploaded to the Chrome Web Store.

### Project Structure

- `src/core/` - Core segment model and compiler implementation
- `src/state/` - Axion-based state management
- `src/services/` - Integration services (NovelAI, storage, etc.)
- `src/features/` - Feature-specific components and logic
- `src/ui/` - Reusable UI components
- `src/entries/` - Extension entry points

## Architecture

NaiKit uses a segment-based model to represent prompts. Each element in a prompt (text, weighted text, presets, etc.) is a segment with specific properties and behaviors.

### State Management

The application uses Axion for state management, providing:

- **Atom-Based State**: Modular state divided into logical units
- **Path-Based Access**: Easy access to deeply nested state
- **Derived State**: Automatic dependency tracking and computation
- **Transactional Updates**: Atomic state changes that maintain consistency
- **Persistence**: State is automatically persisted to Chrome's storage

### Segment Model

The core of NaiKit is the segment model, which defines different types of segments:

- **TextSegment**: Basic text content
- **WeightedSegment**: Text with importance weights applied
- **PresetSegment**: Integration point for wildcards and keywords
- **InlineWildcardSegment**: Options defined inline with (option1|option2) syntax

### NovelAI Integration

NaiKit integrates with NovelAI's web interface through:

- **DOM Observation**: Monitor changes to NovelAI's UI
- **Two-Way Synchronization**: Keep both interfaces in sync
- **Image Generation**: Control NovelAI's image generation
- **Resource Monitoring**: Track Anlas usage and other resources

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.