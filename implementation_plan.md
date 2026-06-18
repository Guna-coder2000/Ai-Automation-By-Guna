# Dynamic Agentic Orchestrator

This plan outlines the architecture for a fully dynamic, execution-time feedback loop. Based on your feedback, the framework will dynamically decide which Agent to call based on the exact nature of the failure. It will NOT just blindly call the Healing Agent every time. 

If it detects a logic or missing-step issue (e.g., a "login type" issue or a major flow change), it will actively invoke the **Planning Agent** to investigate the UI, understand the missing steps, and then pass the updated plan to the **Generation Agent** to rewrite the code.

## User Review Required

> [!IMPORTANT]  
> Please review this updated workflow. Does this match your vision for how the execution loop should detect issues and trigger the Planning Agent before the Generation Agent?

## Proposed Architecture

### 1. The Orchestrator Feedback Loop
During the `ai:run` or `ai-test` loop, if a Playwright test fails, the framework will capture the error log, the DOM snapshot, and the stack trace. Instead of immediately calling the Healing Agent, it will pass this data to a **Triage / Analysis Phase**.

### 2. Failure Classification (Triage)
The system will analyze the error:
- **Type A: Locator / DOM Change** (e.g., `Timeout waiting for selector`, `Strict mode violation`).
  - **Action:** Delegate to `HealingAgent`. The Healing Agent patches the locator in the code.
- **Type B: Logic / Flow / Missing Step Issue** (e.g., page navigation failed, unexpected popup blocked the flow, a completely new intermediate page appeared like a 2FA prompt).
  - **Action:** Delegate to the **Planning Agent**. 

### 3. Planning Agent UI Integration
When the Orchestrator delegates a logic failure to the Planning Agent:
- The Orchestrator will provide the Planning Agent with the current DOM state, the error, and the original requirement.
- The **Planning Agent** will "open the UI" (analyze the current DOM snapshot/page state) to get an idea of what the application currently looks like.
- The Planning Agent will generate a **new, updated test plan** with the missing steps included (e.g., "Step 3a: Close the promotional popup").
- The Orchestrator then passes this new plan to the **Generation Agent**, which rewrites/updates the test script.

## Proposed Changes

### `cli.ts` (Orchestrator)
#### [MODIFY] [cli.ts](file:///c:/Users/puttu/Downloads/Ai-Framework(5)/Ai-Framework/src/cli.ts)
- Modify the `executeWithHealing` loop to become `executeWithDynamicRecovery`.
- Add a lightweight LLM call (or rely on `AnalysisAgent`) immediately after a test fails to classify the error into `LOCATOR_ISSUE` vs `LOGIC_ISSUE`.
- If `LOGIC_ISSUE`, invoke `PlanningAgent.replan(errorContext)` -> `GenerateAgent.regenerate(newPlan)` -> Retry Execution.

### `PlanningAgent.ts`
#### [MODIFY] [PlanningAgent.ts](file:///c:/Users/puttu/Downloads/Ai-Framework(5)/Ai-Framework/src/agents/planning/PlanningAgent.ts)
- Add a new method `replan(errorContext, currentDom)` that takes the execution failure context and reads the UI/DOM to figure out what steps are missing.

## Verification Plan
1. Intentionally break a test by injecting an unexpected popup in the application (or deleting a crucial navigation step in the `.spec.ts`).
2. Run the Execution Orchestrator.
3. Verify that the framework detects it as a logic issue, calls the Planning Agent to understand the missing UI interaction, calls the Generation Agent to add the missing step, and successfully passes the retry.
