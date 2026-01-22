# Guided Assistant - AI-Powered Prompt-Driven Interface

## Overview

The Guided Assistant is an enterprise-grade AI-assisted interface that enables users to interact with the finance application using natural language prompts (text or voice). It provides step-by-step visual guidance, explains actions before execution, and ensures safe, auditable operations.

## Architecture

### Core Components

1. **PromptIntentParser** (`PromptIntentParser.ts`)
   - Parses natural language prompts
   - Extracts: module, action, target system, financial year, period
   - Validates parsed intent
   - Calculates confidence scores

2. **ActionPlanner** (`ActionPlanner.ts`)
   - Converts parsed intent into step-by-step execution plan
   - Creates action steps (navigate, select, click, validate, confirm)
   - Determines risk levels and confirmation requirements
   - Estimates execution duration

3. **ExecutionEngine** (`ExecutionEngine.ts`)
   - Executes action steps with visual feedback
   - Handles navigation, selection, clicks, inputs
   - Provides progress updates
   - Handles errors gracefully

4. **GuidedModeOverlay** (`GuidedModeOverlay.tsx`)
   - Visual overlay system with spotlight highlighting
   - Tooltips and step indicators
   - Progress tracking
   - User controls (Next, Previous, Cancel, Auto-Execute)

5. **GuidedAssistant** (`GuidedAssistant.tsx`)
   - Main orchestrator component
   - Manages state and flow
   - Integrates voice and text input
   - Coordinates all components

6. **AuditLogger** (`AuditLogger.ts`)
   - Logs all guided actions
   - Tracks user, action, steps, results
   - Provides export functionality
   - Ensures compliance

## User Flow

### 1. Input Phase
- User enters text prompt or uses voice
- Example: "For payroll, current financial year, December 2025, push records to Tally"

### 2. Parsing Phase
- System parses intent
- Extracts entities (module, action, period, target)
- Validates completeness

### 3. Planning Phase
- Creates step-by-step execution plan
- Determines risk level
- Identifies confirmation requirements

### 4. Explain Phase
- Shows execution plan preview
- Lists all steps that will be performed
- Provides options:
  - "Guide Me Step-by-Step" (visual guidance)
  - "Auto-Execute" (automatic execution)

### 5. Guided Mode (if selected)
- Visual overlay with spotlight highlighting
- Step-by-step tooltips
- User controls navigation
- Can switch to auto-execute at any time

### 6. Execution Phase
- Executes steps sequentially
- Shows visual feedback for each action
- Highlights UI elements being interacted with
- Displays progress

### 7. Completion Phase
- Shows success/failure status
- Displays summary of executed steps
- Provides next actions

## Safety Features

### Two-Step Confirmation
- Critical actions (sync, push) require explicit confirmation
- System reads back action before execution
- User must confirm via voice or button click

### Risk Levels
- **Low**: View, list operations (auto-execute)
- **Medium**: Export, report generation (optional confirmation)
- **High**: Sync, push operations (mandatory confirmation)

### Audit Trail
- Every action logged with timestamp
- User identification
- Full step-by-step record
- Execution results
- Exportable for compliance

## UI Elements with Data Attributes

For guided mode to work, UI elements must have data attributes:

- `data-field="financial-year"` - Financial year dropdown
- `data-field="pay-period"` - Pay period dropdown
- `data-step="next"` - Next button
- `data-action="push-to-tally"` - Push/Sync button
- `data-nav="payroll"` - Sidebar navigation items
- `data-status="data-loaded"` - Status indicators

## Integration Points

### With VoiceSync
- Guided Assistant can be triggered by VoiceSync commands
- Shares intent parsing logic
- Unified confirmation flow

### With Transaction Management
- Can navigate to Transaction Management
- Can select financial year and period
- Can trigger sync operations

### With Sidebar Navigation
- Can navigate to any module
- Can expand/collapse sections
- Can highlight active menu items

## Example Usage

```typescript
// User prompt
"For payroll, current financial year, December 2025, push records to Tally"

// Parsed Intent
{
  module: 'payroll',
  action: 'push',
  targetSystem: 'tally',
  financialYear: 'current',
  period: 'December-2025',
  confidence: 0.95
}

// Execution Plan
{
  steps: [
    { type: 'navigate', target: '/payroll/transaction', ... },
    { type: 'select', target: '[data-field="financial-year"]', value: 'current', ... },
    { type: 'select', target: '[data-field="pay-period"]', value: 'December-2025', ... },
    { type: 'wait', target: '[data-status="data-loaded"]', ... },
    { type: 'validate', ... },
    { type: 'navigate', target: 'step-3', ... },
    { type: 'click', target: '[data-action="push-to-tally"]', requiresConfirmation: true, ... }
  ],
  requiresConfirmation: true,
  riskLevel: 'high'
}
```

## Future Enhancements

1. **Multi-language Support**
   - Parse prompts in multiple languages
   - Localized UI guidance

2. **Advanced NLP**
   - Better intent understanding
   - Context awareness
   - Follow-up questions

3. **Learning System**
   - Learn from user corrections
   - Improve parsing accuracy
   - Custom command patterns

4. **Integration Expansion**
   - More ERP systems
   - More modules
   - More actions

5. **Visual Enhancements**
   - Animated cursor movement
   - More sophisticated highlighting
   - Screen recording for audit

## Testing

To test the Guided Assistant:

1. Open the application
2. Look for the "AI Assistant" floating panel (bottom-right)
3. Enter a prompt: "For payroll, current financial year, December 2025, push records to Tally"
4. Click "Process" or use voice input
5. Review the execution plan
6. Choose "Guide Me Step-by-Step" or "Auto-Execute"
7. Follow the guided steps or watch auto-execution

## Troubleshooting

### Guided mode not highlighting elements
- Ensure data attributes are present on target elements
- Check browser console for errors
- Verify element selectors in ActionPlanner

### Navigation not working
- Check React Router integration
- Verify route paths match
- Ensure navigation events are dispatched

### Execution fails
- Check browser console for errors
- Verify element selectors
- Check network requests
- Review audit logs

