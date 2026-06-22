# FULL DYNAMIC AI-Driven Playwright Automation Framework

## Overview
This framework is a **fully dynamic, application-agnostic**, intelligent self-healing test automation solution powered by AI. Designed to handle all types of applications (Banking, HRMS, E-Commerce, CRM, Healthcare) purely from JSON requirements, it seamlessly translates raw user intents into robust, executable Playwright scripts. 

The core philosophy is **Zero Hardcoding**. Every action, locator, and assertion is dynamically evaluated and executed at runtime.

---

## Core Design Principles & Current Architecture

Our framework is built on several uncompromising principles to ensure enterprise-grade stability and readiness:

- **100% Application Agnostic**: The framework core has zero hardcoded domain knowledge. It consumes `requests/*.json` and automatically figures out the domain.
- **Strict Data & Locator Separation**: The generated code is pristine. All locators, input variables, and test data are stored externally. The generated test scripts pull these values dynamically.
- **Dynamic Offline Heuristics (Never Fail Fallback)**: If the LLM provider (Groq/Ollama) is down or hallucinates locators, the Generation Agent forcibly overrides it with an advanced, highly resilient local XPath heuristic algorithm (`//*[@id="x" or @name="x" or @placeholder="x"...]`).
- **Advanced Dynamic Assertions**: The framework dynamically creates advanced assertions (`assertText`, `assertValue`, `assertVisible`) natively within the generated Page Objects based purely on the JSON intent.
- **Smart Auto-Waits**: Hard waits (e.g., fixed sleep times) are strictly prohibited. The framework relies entirely on Playwright's native auto-waiting.
- **Sequential Batch Orchestration & Merged Reporting**: Executes 10+ disparate application domains in a continuous non-breaking loop. Captures states into unified Blob reports and automatically merges them into a single stunning Client Executive HTML dashboard.
- **Resilient AI Healing Loop**: If a locator changes, the Healing Agent parses the DOM, fixes the selector, dynamically patches the external TypeScript locator files, and resumes execution seamlessly.

---

## The AI Agent Pipeline

The architecture relies on specialized AI Agents collaborating seamlessly:

### 1. Planning Agent
- **Purpose**: Translates JSON requirements and raw input data into a structured automation plan cache. Maps scenarios dynamically.

### 2. Generation Agent
- **Purpose**: Writes exceptionally clean Playwright code based on the plan. Integrates the strict Offline Heuristic Fallback to prevent LLM hallucinations.

### 3. Execution Agent
- **Purpose**: Runs the generated tests with maximum efficiency. Safely intercepts and hides noisy Playwright HTML traces from the presentation console.

### 4. Healing Agent
- **Purpose**: A relentless, deep-DOM self-healing mechanism. Safely patches TypeScript files without corrupting syntax, protecting valid locators while fixing broken ones.

### 5. Reporting Agent
- **Purpose**: Aggregates blob results into highly readable Client Executive HTML summaries with integrated video and screenshot evidence.

---

## Getting Started

1. Drop your JSON requirement into `requests/`.
2. Run `npm run ai-test requests`.
3. Watch the fully dynamic orchestrator generate, execute, heal, and report autonomously!
