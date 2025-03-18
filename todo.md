# Initial prompt

Please thoroughly read the entirety of CONTRIBUTING.md and INSTRUCTION.md,
(CONTRIBUTING.md is really long, so you might need to split it up and read it carefully over multiple sessions.)

and perfectly and more improvely implement everything outlined in CONTRIBUTING.md to bring the naikit(main folder) project to a production-ready level.

(Don’t forget one of the key points: you need to use the 'axion-state' library to handle the state management. You can find how to use this library by carefully checking the README.md at (axion folder) or even digging into the code itself to uncover features that might not be mentioned in the README.md. digging into the axion code yourself to check it all out.)

When you finish your each tasks, please review with paranoid, obsessive, and perfectionist scrutiny whether every single feature and design outlined in CONTRIBUTING.md has been fully implemented in every aspect in a (todo.md). You can check if your nai original site DOM selector works see the nai_site_reference.html

Since you have not enough context length limit, every task must be done by smartest way.

You always prevent potential issues in advance through type checking, testing, and linting. Additionally, you create a (todo.md) file each time to outline your plans, updating its contents consistently to maintain direction. While the direction may shift midway, you must remain aware at every moment of whether those changes are truly necessary, approaching the task with the responsibility of a top team leader in a large corporation’s development team.

---

# NaiKit Implementation Plan

## Project Overview

NaiKit is a Chrome extension for enhancing NovelAI's image generation interface, providing advanced prompt management, weight control, and preset management. The project uses Axion for state management instead of Zustand/Immer as initially specified in the requirements.

## Implementation Status

### ✅ Core State Management System (Completed)

- [x] Implemented Axion-based state management replacing Zustand/Immer
- [x] Created segment state models for prompt management
- [x] Developed preset management system
- [x] Added configuration state for app settings
- [x] Built NovelAI integration state
- [x] Created React bindings for all state types

### ✅ Storage and Persistence (Completed)

- [x] Enhanced storage service with Axion integration
- [x] Added chunked storage for handling large state data
- [x] Implemented state import/export functionality
- [x] Created automatic state synchronization with Chrome storage

### ✅ NovelAI Integration (Completed)

- [x] Built NovelAI DOM interaction service
- [x] Implemented two-way synchronization for prompts
- [x] Added generation monitoring and control
- [x] Created Anlas balance tracking

### 🔄 UI Components (In Progress)

- [x] Create sidebar UI structure
  - [x] Implement sidebar container component
  - [x] Add mode switching tabs (Compose/Fine-tune)
  - [x] Build collapsible sidebar functionality
  - [x] Add drag resizing support
- [x] Implement basic prompt section components
  - [x] Create PromptSection component for positive/negative prompts
  - [x] Implement CharacterSection component with collapsible sections
  - [x] Add basic MainContent layout
  - [x] Implement connection status and generation controls
- [x] Implement segment visualization components
  - [x] Create BaseSegment component for common functionality
  - [x] Create TextSegment component with mode-specific rendering
  - [x] Build WeightedSegment component with visual indicators and weight display
  - [x] Develop PresetSegment component with different displays for wildcards and keywords
  - [x] Implement InlineWildcardSegment component with option display
  - [x] Create SegmentRenderer for rendering different segment types
  - [x] Add segment CSS styling with color coding and visual hierarchy
  - [x] Integrate segment components with PromptSection
- [ ] Build prompt editor components
  - [ ] Create base TipTap editor integration
  - [ ] Add custom extensions for segment support
  - [ ] Implement keyboard shortcuts and commands
  - [ ] Build contextual menu for segment actions
- [ ] Develop weight adjustment interface
  - [ ] Create weight slider component
  - [ ] Build color-coded weight visualization
  - [ ] Implement bracket level calculation/display
  - [ ] Add group weight adjustment functionality

### 📝 Remaining Tasks

- [ ] Create preset management interface
  - [ ] Build preset library component
  - [ ] Add preset creation/editing dialog
  - [ ] Implement preset search and filtering
  - [ ] Add import/export functionality
- [ ] Add group management tools
  - [ ] Create group creation/editing interface
  - [ ] Build group visualization components
  - [ ] Implement group selection and bulk operations
- [ ] Develop settings panel
  - [ ] Build settings UI with tabs
  - [ ] Add synchronization settings
  - [ ] Implement appearance customization
  - [ ] Create backup and restore functionality
- [ ] Create user onboarding experience
  - [ ] Build first-time tutorial
  - [ ] Add tooltips and contextual help
  - [ ] Create documentation pages
- [ ] Implement unit and integration tests
  - [ ] Set up testing framework
  - [ ] Write unit tests for state operations
  - [ ] Create integration tests for UI components
  - [ ] Add end-to-end tests for critical workflows
- [ ] Performance optimization
  - [ ] Implement virtualization for large segment lists
  - [ ] Add memoization for expensive calculations
  - [ ] Optimize re-renders with React.memo and useMemo
  - [ ] Implement lazy loading for sidebar sections

## Architecture

### Core Technologies

- TypeScript 4.9+
- React 18
- Axion for state management
- Vite 4.3+ with @samrum/vite-plugin-web-extension
- Bun 1.0+ as package manager
- Tailwind CSS 3.3+
- TipTap/ProseMirror for rich text editing

### Segment Visualization Implementation

#### Component Architecture
- BaseSegment: Core component with selection and common functionality
- TextSegment: For basic text content
- WeightedSegment: For text with emphasis/de-emphasis weight
- PresetSegment: For wildcards and keywords
- InlineWildcardSegment: For inline option lists
- SegmentRenderer: Dispatcher that renders the appropriate component

#### Features
- Mode-specific rendering (different UI for Compose vs Fine-tune modes)
- Color coding for different segment types
- Interactive UI elements for weight and preset visualization
- Selection handling
- Support for nested segments
- Transitions and animations for interactive elements
- Toggle between segmented and compiled views

#### Technical Improvements
- Type safety with proper TypeScript typing
- Defensive programming to handle undefined or null states
- Performance optimization with React.memo and useMemo
- Consistent error handling
- Clean CSS with reusable classes
- Proper use of React hooks and state management

## Immediate Next Steps (Priority Order)

1. Integrate TipTap editor

   - Set up basic editor with minimal extensions
   - Add custom node types for segments
   - Implement serialization/deserialization to/from segment model
   - Create simple keyboard shortcuts for common operations
   - Connect editor to segment state for real-time updates

2. Build the weight adjustment interface

   - Create weight slider component
   - Implement bracket level visualization
   - Add visual indicators for weight levels
   - Connect to segment state for real-time updates
   - Build weight adjustment controls for fine-tune mode

3. Develop preset management UI

   - Create preset library component
   - Implement preset creation/editing interface
   - Add preset application functionality
   - Build preset search and filtering

4. Implement group management features
   - Create group creation and management interface
   - Add group selection and multiselection functionality
   - Implement group weight adjustment controls
   - Add visual indicators for group membership

## Testing Strategy

- Unit tests for all state operations and utility functions
- Component tests for UI elements using React Testing Library
- Integration tests for state and UI interaction
- End-to-end tests for critical user workflows
- Performance tests for large prompt handling

## Key Performance Indicators

- Smooth UI experience even with complex prompts (60+ FPS)
- Minimal memory footprint (<100MB for typical usage)
- Fast response times for all operations (<100ms)
- Perfect synchronization with NovelAI (no drift between systems)
- High test coverage (95%+ for core logic, 80%+ overall)

## UI Component Implementation Plan

### 1. Sidebar Container

The sidebar container will be the main UI element that hosts all NaiKit functionality. It should:

- Appear on the left side of the NovelAI interface
- Be resizable with a drag handle
- Be collapsible via a toggle button
- Have a clean, minimal design that integrates with NovelAI's aesthetic
- Contain sections for main prompts, character prompts, and settings

**Component Structure:**

- `SidebarContainer`: Main wrapper with positioning and sizing
- `SidebarHeader`: Contains title, mode tabs, and collapse button
- `SidebarContent`: Scrollable content area for all sections
- `SidebarResizeHandle`: Handle for adjusting width
- `SidebarFooter`: Contains generation controls and status information

### 2. Mode Switching System

The mode switching system will allow users to toggle between Compose and Fine-tune modes:

- Two clearly labeled tabs at the top of the sidebar
- Visual indication of current mode
- Smooth transition between modes
- Preservation of state when switching modes

**Component Structure:**

- `ModeTabs`: Container for the mode selection tabs
- `ModeTab`: Individual tab component with active state
- `ModeContext`: React context for accessing current mode throughout the app

### 3. Segment Visualization Components

These components will render different segment types with appropriate visualizations:

- `TextSegment`: Plain text rendering
- `WeightedSegment`: Text with weight indicator and color coding
- `PresetSegment`: Special visualization for wildcards/keywords
- `InlineWildcardSegment`: Options list with selection UI

Each component should:

- Render differently based on the current mode
- Support selection and focused states
- Include appropriate interaction handlers
- Be optimized for performance when many segments are rendered

### 4. Prompt Editor

The editor will be based on TipTap/ProseMirror and provide a rich editing experience:

- Custom nodes for each segment type
- Context menu for segment operations
- Keyboard shortcuts for common actions
- Real-time synchronization with segment state
- Support for both text input and drag/drop operations

**Component Structure:**

- `PromptEditor`: Main editor component with TipTap integration
- `EditorToolbar`: Format and segment controls
- `ContextMenu`: Right-click menu for segment actions
- `SuggestionDropdown`: For preset/wildcard autocompletion

### 5. Weight Adjustment Interface

The weight interface will appear in Fine-tune mode and allow precise control:

- Slider for weight adjustment with bracket level visualization
- Color-coded weight indicators (blue for increase, red for decrease)
- Numerical input for precise values
- Group management controls

**Component Structure:**

- `WeightSlider`: Interactive slider for weight adjustment
- `WeightIndicator`: Visual display of current weight
- `BracketLevelDisplay`: Shows bracketing level in NovelAI format
- `GroupControls`: Interface for creating and managing groups
