### Universal Robust Guidelines

#### 🛠️ Technical Excellence

1. **Type Safety and Clarity**

   - Define explicit types for all variables, parameters, and return values, avoiding ambiguous types.
   - Design specific, intent-driven types and use guards or utilities to ensure safety.
   - Explicitly check for optional value existence before access.

2. **Immutability and Predictability**

   - Write pure functions that guarantee the same output for the same input.
   - Create new objects instead of mutating originals and isolate state clearly.

3. **Modularity and Separation of Concerns**
   - Design modules with a single, clear responsibility.
   - Define interfaces first to minimize coupling, ensuring dependencies flow from high-level to low-level.

#### 🧠 Design Approach

4. **Core Model Design**

   - Build hierarchical, extensible data structures with consistent creation and manipulation.
   - Provide safe, immutable manipulation functions.

5. **State Management Principles**

   - Maintain a single source of truth and segment state by function.
   - Prevent unnecessary updates and design persistence strategies.

6. **External Integration Design**
   - Abstract interactions with external systems for resilience to change.
   - Ensure real-time data sync while optimizing resource use.

#### 🧪 Test-Driven Development

7. **Testing Philosophy and Strategy**

   - Write tests before implementation to clarify requirements and edge cases.
   - Balance unit, integration, and E2E tests, automating for quality assurance.
   - Target 100% coverage for core logic and 90%+ overall.

8. **Multi-Layered Testing**
   - **Unit Tests**: Validate all function branches and edge cases.
   - **Integration Tests**: Confirm data flow and state changes across modules.
   - **E2E Tests**: Verify full workflows and user paths.
   - **Performance Tests**: Measure execution time and resource usage for optimization.

#### 🔄 Development Workflow

9. **Incremental Validation and Integrity**

   - Validate code (lint, build, test) immediately after writing and resolve all issues.
   - Proceed to the next step only after full error resolution, catching issues early.

10. **Prioritized Development Phases**
    - Core model → State management → External integration → UI → Performance optimization.
    - Ensure stability at each phase with testing and validation.

#### 📏 Code Quality Standards

11. **Readability and Maintainability**

    - Use intent-revealing names and comments, maintaining consistent structure.
    - Write tests that double as living documentation.

12. **Robustness and Safety**

    - Validate all inputs and implement explicit error handling and recovery.
    - Protect immutability and prepare for edge cases.

13. **Optimization and Efficiency**
    - Optimize high-cost logic and eliminate unnecessary operations.
    - Monitor and improve performance metrics continuously.

#### 🎯 Development Philosophy

14. **Focus with Holistic Awareness**

    - Concentrate on individual tasks while aligning with the broader system.

15. **Root Cause Resolution**

    - Address root causes, avoiding temporary fixes.

16. **User-Centric Value**

    - Ensure technical decisions enhance the user experience.

17. **Building for Resilience**

    - Treat current code as a stable foundation for future growth.

18. **Proof through Testing**
    - Prove every feature works as intended with tests.
