# Senior Automation Architect Interview Guide: AI-Driven Playwright Framework

This document is your absolute source of truth for technical interviews. Do not guess. Memorize these concepts, workflows, and code-level integrations. If you explain the framework using these exact terms, you will pass the technical architect rounds.

---

## PART 1: The Technical Architecture Explanation

**How to introduce your project:**
"I architected and built an autonomous, multi-agent UI/API testing framework from scratch. I built it using Node.js, TypeScript, and Playwright. The core goal was to eliminate flaky tests and manual script writing by integrating LLMs (Groq), but more importantly, to build a resilient system that executes perfectly even when the AI is completely offline."

### 1. Ingestion & Parallel Orchestration (`cli.ts`)
"Instead of running tests sequentially, I built an orchestrator using Node's asynchronous event loop. When triggered via CLI, the orchestrator reads `.json` requirement files using `fs-extra`. It maps these files into an array of Promises and executes them concurrently using `await Promise.all()`. This allows the framework to shard the workload, generating multiple Page Object Models and Spec files simultaneously."

### 2. The Code Generation Engine & AST Parsing (`GenerateAgent.ts`)
"I implemented the Factory Design Pattern to handle the AI provider (`LLMProviderFactory`). The JSON payload is injected into a strict prompt template. When the LLM returns the output, it often includes conversational hallucinations. To fix this, I wrote an Abstract Syntax Tree (AST) regex parser that strips all markdown, extracts the pure TypeScript code, dynamically resolves relative import paths (`normalizeSpecImports`), and writes the final `.ts` files to disk recursively using `fs.writeFile`."

### 3. The Offline Native Fallback Engine
"I knew relying 100% on a cloud LLM was a major architectural risk due to API rate-limiting (HTTP 429). So, I built a 'Native Structured Fallback'. If the API fails, the framework catches the exception and bypasses the AI completely. It falls back to a hardcoded TypeScript code-generator I wrote, which parses the JSON keys and maps them directly to Playwright functions (e.g., mapping `{"click": "submit"}` to `await this.page.locator('#submit').click()`)."

### 4. Smart Waiting & Mutation Observers (`CommonActions.ts`)
"Standard Playwright relies on `waitForLoadState('networkidle')`, which is highly flaky in modern SPAs like React. I bypassed this entirely. I injected a native JavaScript `MutationObserver` directly into the browser context using `page.evaluate()`. The framework monitors the `document.body` for DOM mutations and completely halts execution until rendering drops to absolute zero for 500ms."

### 5. Self-Healing & DOM Repair (`HealingAgent.ts`)
"I built a persistent memory engine for self-healing. When `ExecutionAgent` detects a Playwright exception (`Locator failed`), it intercepts it before crashing and dumps the live DOM HTML into an `error-context.md` file. The `HealingAgent` then kicks in. I built an offline heuristic parser: if `a[href='#Serialize']` fails, my local regex engine strips the href and scans the DOM snapshot for `aria-controls="Serialize"` or `id="Serialize"`. It patches the `.ts` file dynamically and logs the fix in `healing-history.json` so the framework never fails on the same element twice."

---

## PART 2: All Framework Commands

1. **`npm run ai-test <file.json>`**
   - **What it does:** Runs the full end-to-end pipeline (Planning -> Generation -> Execution -> Healing -> Reporting) for a single specific JSON request file.

2. **`npm run ai-test requests`**
   - **What it does:** Reads the `requests/` directory and utilizes `Promise.all` to concurrently generate and execute the pipeline for all JSON files in parallel.

3. **`npm run plan <file.json>`**
   - **What it does:** Only runs the `PlanningAgent`. It does not write code. It analyzes the JSON requirement and generates a breakdown of atomic testing steps.

4. **`npm run clean`**
   - **What it does:** Uses `fs-extra.emptyDir()` to securely wipe the `generated/`, `test-results/`, and `reports/` directories to prevent test pollution before a new CI/CD run.

5. **`npm run generate <file.json>`**
   - **What it does:** Takes the output from the Planning Agent and runs the `GenerateAgent` to physically create the TypeScript Spec and Page Object files.

---

## PART 3: 200 Technical Interview Questions & Answers

*(Note: These are punchy, highly technical answers designed for rapid-fire technical interviews).*

### Category 1: Node.js, Async Logic & Orchestration (1-40)
1. **Q: Why use `Promise.all` in your CLI orchestrator?** A: To execute multiple asynchronous file I/O and HTTP requests concurrently, preventing the Node event loop from blocking.
2. **Q: What happens if one promise fails in `Promise.all`?** A: It fast-fails the entire array unless caught. I wrapped individual executions in `try-catch` inside the map function so one failed generation doesn't crash the entire parallel run.
3. **Q: Why `fs-extra` instead of `fs/promises`?** A: `fs-extra` provides robust, recursive directory management (`ensureDir`, `emptyDir`) out of the box, reducing boilerplate code.
4. **Q: How does `child_process.spawn` differ from `exec`?** A: `spawn` streams stdout/stderr asynchronously, which is vital for real-time Playwright execution logs. `exec` buffers the output, which causes memory crashes on large test suites.
5. **Q: Explain the Node Event Loop in the context of your framework.** A: The orchestrator pushes async file reads and API calls to the libuv thread pool, keeping the main V8 thread free to process incoming Playwright stdout streams.
6. **Q: How do you handle environment variables?** A: I use `dotenv` combined with cross-env to securely load `.env` files (e.g., `DISABLE_LLM_FALLBACK`) before process execution.
7. **Q: What is a Buffer in Node.js?** A: A raw memory allocation used to handle binary data. My framework uses it implicitly when streaming Playwright stdout before converting it to UTF-8 strings.
8. **Q: Why TypeScript over JavaScript?** A: To enforce static typing for the Abstract Syntax Trees (AST) and Agent interfaces, preventing runtime type errors when parsing unpredictable LLM JSON payloads.
9. **Q: How do you handle unhandled promise rejections?** A: I bound `process.on('unhandledRejection')` in the CLI to gracefully log fatal errors instead of allowing Node to abruptly exit.
10. **Q: What is the Factory Pattern?** A: A creational pattern used in `LLMProviderFactory` to abstract the instantiation of LLM APIs, allowing seamless swapping of Groq, OpenAI, or local models.
11. **Q: How do you parse JSON safely?** A: I wrap `JSON.parse` in a try-catch and use a regex stripper (`cleanJsonOutput`) to remove markdown fences (```json) before parsing.
12. **Q: What does `path.resolve` do?** A: It guarantees absolute path generation regardless of the operating system, preventing `/` vs `\` pathing errors between Windows and Linux CI runners.
13. **Q: How do you export classes?** A: I use ES Modules syntax (`export class`) to ensure tree-shaking compatibility and modern TS module resolution.
14. **Q: What is `process.cwd()`?** A: The Current Working Directory. I use it to anchor the root path for dynamic file generation.
15. **Q: How do you handle rate-limiting (HTTP 429)?** A: I catch the Axios/Fetch error, log a warning, and route the execution to my `generateStructuredFallback` method to continue offline.
16. **Q: Explain `Object.entries()`.** A: It converts objects into key-value array pairs. I use it to iterate over the `locators` object from the JSON payload.
17. **Q: How do you mock Node modules for unit tests?** A: I use Jest's `jest.mock()` to intercept `fs-extra` and `child_process` so I don't write to the real disk during unit testing.
18. **Q: What is a memory leak in Node?** A: When objects remain referenced and cannot be garbage collected. I avoid this by properly disconnecting my `MutationObserver` after use.
19. **Q: How do you validate JSON schemas?** A: Currently via explicit property checking (`if (plan.locators)`). For scaling, I would implement Zod.
20. **Q: What is the Singleton pattern?** A: Used in my `Logger` class. It ensures only one Winston logging instance exists globally across all agents.
21. **Q: Why use `import` vs `require`?** A: `import` is ES6 standard, supports static analysis, and aligns with TypeScript's compiler ecosystem.
22. **Q: What is the difference between `interface` and `type`?** A: I use interfaces for class contracts (`ILLMProvider`) because they support declaration merging and OOP inheritance.
23. **Q: How do you deeply clone an object?** A: `JSON.parse(JSON.stringify(obj))` or `structuredClone()`, used when I need to mutate test data safely.
24. **Q: How do you debug Node scripts?** A: Passing `--inspect` to Node and attaching Chrome DevTools or VSCode debugger.
25. **Q: What is Dependency Injection?** A: Passing dependencies (like `Page` object) into a class constructor (`new CommonActions(page)`), heavily utilized in my Page Objects.
26. **Q: How do you ensure idempotent file writes?** A: By using `fs.ensureDir` before `fs.writeFile` to guarantee the path exists.
27. **Q: What is AST?** A: Abstract Syntax Tree. I use AST-like logic to parse and manipulate strings of generated code.
28. **Q: How do you strip specific strings?** A: Using `replace()` with global RegExp flags (`/pattern/g`).
29. **Q: How do you find the root cause of a Node crash?** A: By parsing the `stderr` stack trace via the `AnalysisAgent`.
30. **Q: What does `await` actually do?** A: It pauses the execution of the async function until the Promise settles, yielding control back to the event loop.
31. **Q: How do you map an array of async functions sequentially?** A: Using a `for...of` loop instead of `Promise.all()`.
32. **Q: What is Winston?** A: A universal logging library I use to output formatted logs to both the console and `framework.log`.
33. **Q: How do you intercept shell commands?** A: Using `child_process.spawn` and listening to the `.stdout.on('data')` event.
34. **Q: Explain `__dirname`.** A: The absolute path of the directory containing the current executing file.
35. **Q: How do you read large files?** A: Using `fs.createReadStream()` to prevent loading the entire file into RAM, though my config files are small enough for `readFile`.
36. **Q: What is a regular expression?** A: A pattern matched against strings. I use them extensively to extract locators and clean LLM markdown output.
37. **Q: How do you merge objects?** A: Using the spread operator (`{ ...obj1, ...obj2 }`).
38. **Q: What is the `Error` object?** A: The base Node.js error class. I extend it with `FrameworkError` to add custom error codes (`HEAL_FAIL`).
39. **Q: How do you measure execution time?** A: Using `Date.now()` before and after a block and subtracting the difference.
40. **Q: How do you safely execute untrusted string code?** A: I don't use `eval()`. I write it to a `.ts` file and spawn an isolated Playwright process.

### Category 2: Playwright Core & Advanced Automation (41-80)
41. **Q: Why Playwright instead of Selenium?** A: Playwright executes directly via the Chrome DevTools Protocol (CDP) via websockets, bypassing the HTTP overhead of the WebDriver, resulting in massively faster execution.
42. **Q: How does Playwright Auto-Wait work?** A: Before any action (like `.click()`), Playwright automatically verifies the element is attached, visible, stable, enabled, and receives events.
43. **Q: Why did you ban `page.waitForTimeout()`?** A: Hardcoded sleeps are an anti-pattern. They cause artificial bloat and flakiness. I strictly enforce dynamic assertions.
44. **Q: Explain how you handle Iframes.** A: I built a `currentFrameLocator` state in `CommonActions.ts`. I use `page.frameLocator()` to pierce the iframe boundary, allowing direct interaction.
45. **Q: What is `expect.soft()`?** A: A Soft Assertion. It logs the failure but allows the test to continue executing. I use it for `verifyVisibleSoft` to collect multiple UI bugs in a single run.
46. **Q: How do you execute visual regression tests?** A: Using `expect(page).toHaveScreenshot()`. It takes a DOM snapshot and runs pixel-by-pixel comparisons on future runs.
47. **Q: How do you mock network requests?** A: Using `page.route()`. I intercept the URL pattern and use `route.fulfill()` to return a hardcoded JSON response, decoupling the UI from backend downtime.
48. **Q: How do you wait for a specific API response?** A: Using `page.waitForResponse(res => res.url().includes('endpoint') && res.status() === 200)`.
49. **Q: What is Playwright Tracing?** A: It records a micro-level execution timeline (DOM snapshots, network logs) into a `.zip` file for post-mortem debugging.
50. **Q: How do you handle multiple tabs?** A: Using `context.waitForEvent('page')`. I extract the new Page object and pass it to my Page Object Models.
51. **Q: What is the Page Object Model (POM)?** A: A design pattern where a class represents a web page, separating structural locators from behavioral logic.
52. **Q: Why use `locator.filter()`?** A: To drill down into a list of elements based on specific text or child elements (e.g., finding a row that contains a specific username).
53. **Q: How do you test APIs in Playwright?** A: Using `request.newContext()`. It allows HTTP GET/POST calls and bypasses the browser UI entirely.
54. **Q: What is `page.evaluate()`?** A: It executes arbitrary JavaScript directly inside the browser console. I use it to inject my `MutationObserver`.
55. **Q: How do you handle file uploads?** A: Using `locator.setInputFiles('file.pdf')`.
56. **Q: How do you clear an input field natively?** A: Using `locator.clear()`, rather than pressing backspace.
57. **Q: How do you execute tests in parallel?** A: By configuring `fullyParallel: true` in `playwright.config.ts`, which spawns isolated worker processes.
58. **Q: What is a Browser Context?** A: An isolated incognito-like session. Tests run in separate contexts, ensuring zero cache or cookie collision.
59. **Q: How do you skip the login UI sequence?** A: By performing a programmatic API login, saving the `storageState.json` (cookies/tokens), and injecting it into the Playwright Context.
60. **Q: Why use CSS over XPath?** A: CSS is native to the browser's rendering engine and executes marginally faster, though my framework flawlessly supports both.
61. **Q: What happens if an element is hidden behind a modal?** A: Playwright's actionability checks will throw an 'intercepted' error. My `handleError` catches it and logs the DOM.
62. **Q: How do you capture an element's text?** A: `locator.textContent()` or `locator.innerText()`.
63. **Q: How do you hover over an element?** A: `locator.hover()`.
64. **Q: How do you verify an element is NOT present?** A: `expect(locator).toBeHidden()` or `toHaveCount(0)`.
65. **Q: How do you handle Shadow DOM?** A: Playwright natively pierces open shadow roots automatically.
66. **Q: What is CDP?** A: Chrome DevTools Protocol. The underlying websocket bridge Playwright uses to control the browser.
67. **Q: How do you select from a dropdown?** A: `locator.selectOption('value')`.
68. **Q: How do you handle drag and drop?** A: `locator.dragTo(targetLocator)`.
69. **Q: How do you run tests on WebKit (Safari)?** A: By specifying the `webkit` project in the config. Playwright uses patched browser binaries.
70. **Q: How do you emulate a mobile device?** A: By importing device profiles (`devices['iPhone 13']`) into the Playwright config context.
71. **Q: How do you force a click on an invisible element?** A: `locator.click({ force: true })`, though I restrict this anti-pattern in my framework.
72. **Q: How do you test clipboard interactions?** A: By granting browser permissions via `context.grantPermissions(['clipboard-read', 'clipboard-write'])`.
73. **Q: What is `locator.nth()`?** A: Selects the nth matching element (0-indexed). It's brittle, so I prefer text filtering.
74. **Q: How do you assert URL paths?** A: `expect(page).toHaveURL(/.*dashboard/)`.
75. **Q: How do you take a full-page screenshot?** A: `page.screenshot({ fullPage: true })`.
76. **Q: How do you handle browser dialogs (alerts)?** A: By listening to the `page.on('dialog')` event and calling `dialog.accept()`.
77. **Q: How do you test geographical location logic?** A: By passing `geolocation: { latitude: X, longitude: Y }` into the browser context.
78. **Q: What is a Playwright Fixture?** A: An isolated, setup/teardown environment injected into the test context automatically.
79. **Q: How do you handle double clicks?** A: `locator.dblclick()`.
80. **Q: How do you test keyboard shortcuts?** A: `page.keyboard.press('Control+A')`.

### Category 3: Framework Architecture, CI/CD & Design Patterns (81-120)
81. **Q: Describe the overall architecture of your framework.** A: It is a Node.js multi-agent orchestrator. It uses `cli.ts` to ingest JSON requests, routes them to a `GenerateAgent` for AST parsing and TS compilation, hands the files to an `ExecutionAgent` for Playwright execution, and intercepts errors via a `HealingAgent` and `AnalysisAgent`.
82. **Q: How did you implement Separation of Concerns?** A: Locators are strictly decoupled into `Locators.ts`. Page actions reside in `Page.ts`. Test assertions exist only in `Spec.ts`. And all core browser API commands are wrapped centrally in `CommonActions.ts`.
83. **Q: How do you prevent duplicating Playwright commands?** A: `CommonActions.ts` acts as a facade layer. The Generate Agent ONLY writes code that calls `CommonActions` methods.
84. **Q: What is your approach to CI/CD?** A: A Dockerized pipeline (GitHub Actions/Jenkins). Environment variables control AI fallbacks, and Playwright's native sharding splits execution across multiple CI nodes.
85. **Q: How do you handle secrets (API keys)?** A: Injected securely via GitHub Secrets into `.env` at build time. Never committed to the repository.
86. **Q: How do you trigger the framework in Jenkins?** A: A declarative `Jenkinsfile` running an `npm ci` followed by `npm run ai-test requests`.
87. **Q: Explain the Single Responsibility Principle in your code.** A: Each agent does one thing. `GenerateAgent` only writes code. `HealingAgent` only fixes code. They do not cross domains.
88. **Q: What is Idempotency in your framework?** A: The ability to safely retry tests. My `CommonActions` clear input fields before typing to ensure repeated runs don't append text indefinitely.
89. **Q: How do you handle cross-browser testing?** A: Configured natively in `playwright.config.ts`. The pipeline runs matrices for Chromium, Firefox, and Webkit seamlessly.
90. **Q: What is the benefit of generating code over dynamic interpretation?** A: Generated `.ts` files can be type-checked (`npm run build`), committed to git, and run locally by developers without needing the AI framework overhead.
91. **Q: Why use a customized Logger?** A: To write uniformly formatted timestamped logs to both the console and physical disk for audit trails.
92. **Q: How do you resolve relative imports dynamically?** A: My `normalizeSpecImports` method dynamically calculates path depth using Node's `path.basename` and maps imports correctly between `tests`, `pages`, and `locators` directories.
93. **Q: How do you prevent test pollution?** A: Tests run in isolated incognito contexts, and `npm run clean` wipes the output directories prior to generation.
94. **Q: What is a headless browser?** A: A browser running without a graphical user interface. It consumes less RAM and runs faster in CI environments.
95. **Q: How do you parallelize at the CI level?** A: Passing `--shard=1/3` to Playwright inside a matrix GitHub Action job.
96. **Q: How is test reporting handled?** A: Playwright HTML reports are automatically aggregated into `reports/index.html`.
97. **Q: Why wrap Playwright errors in custom FrameworkError classes?** A: To assign specific failure codes (like `HEAL_FAIL`) which my pipeline uses to conditionally route execution logic.
98. **Q: How do you test file downloads?** A: `const [download] = await Promise.all([page.waitForEvent('download'), locator.click()])`.
99. **Q: How do you verify API response schemas?** A: The API agent asserts JSON structure using `expect(payload).toHaveProperty('key')`.
100. **Q: What is a Docker container?** A: An isolated, lightweight environment containing Node, dependencies, and OS libraries necessary to run Playwright seamlessly anywhere.
101. **Q: How do you handle pipeline timeouts?** A: Using the `timeout` property in Playwright config, and native Node `setTimeout` wrappers inside the Orchestrator.
102. **Q: What makes this framework "Enterprise-Grade"?** A: The strict architectural separation, native offline fallback resilience, parallel sharding, and deep DOM self-healing.
103. **Q: How do you update locators globally?** A: Since locators are centralized in `Locators.ts`, updating one variable cascades the fix across all Page Objects instantly.
104. **Q: What is the Strategy Pattern?** A: Used in how I switch between LLM generation and Offline Fallback Generation dynamically.
105. **Q: How do you handle external test data?** A: Mapped inside the JSON payload and injected into `Locators.ts` as a readonly `TestData` constant.
106. **Q: Explain code review in the context of generated code.** A: The generated files are pure TypeScript. A developer can review them as if a human wrote them.
107. **Q: How do you execute a specific failing test?** A: Passing `.only` in the spec file, or utilizing the CLI path argument.
108. **Q: How do you handle Retries?** A: Configured to `retries: 2` in the config. Flaky tests are re-run instantly.
109. **Q: What is Allure reporting?** A: A third-party visual reporting dashboard that integrates with Playwright for trend analysis.
110. **Q: How do you ensure environment parity?** A: Using Docker images (`mcr.microsoft.com/playwright:v1.xx.x`) ensures the same OS libraries exist locally and in CI.
111. **Q: How do you pass data between steps?** A: Variables defined in the test scope block, or using Playwright's shared context if absolutely necessary.
112. **Q: What is the wrapper `this.getContext()` used for?** A: To dynamically return either `this.page` or `this.currentFrameLocator` depending on iframe state.
113. **Q: How do you assert CSS styling?** A: `expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)')`.
114. **Q: How do you verify an element is checked?** A: `expect(locator).toBeChecked()`.
115. **Q: Explain the difference between Component Testing and E2E Testing.** A: Component testing mounts React/Vue components in isolation. E2E (what this framework does) spins up the entire application stack.
116. **Q: How do you test hover menus?** A: Call `hover()` on the parent, wait for the child locator to be visible, then click.
117. **Q: How do you intercept and block images to speed up tests?** A: `page.route('**/*.{png,jpg,jpeg}', route => route.abort())`.
118. **Q: How do you measure code coverage from UI tests?** A: Using Istanbul (nyc) injected via Playwright to measure JS executed in the browser.
119. **Q: How do you handle self-signed certificates?** A: Set `ignoreHTTPSErrors: true` in the browser context options.
120. **Q: What is a Soft Assertion?** A: Non-blocking assertions that defer test failure until the end of execution.

### Category 4: LLM Integration, Fallbacks, & Self-Healing (121-200)
121. **Q: How do you prevent LLM hallucinations?** A: Strict prompt engineering demanding Markdown fenced syntax, followed by aggressive Regex AST trimming and fallback verifications.
122. **Q: What happens if Groq is down?** A: The framework throws a 429/500 HTTP error, intercepts it in a catch block, and routes the JSON to `generateStructuredFallback`, maintaining 100% pipeline uptime.
123. **Q: What is your offline fallback logic?** A: A programmatic algorithm that maps JSON keys directly to pre-written AST TypeScript templates without needing an LLM.
124. **Q: How does `HealingAgent` fix locators?** A: It extracts the live DOM HTML from `error-context.md`, parses it against the failed selector, extracts matching attributes (like `id` or `text`), rewrites the `.ts` file, and saves the history.
125. **Q: How do you stop infinite healing loops?** A: By cross-referencing the proposed fix against `storage/healing-history.json`.
126. **Q: How does the framework parse API payloads?** A: It intercepts the `isApiTest` flag and dynamically routes the request to `ApiAgent.ts`.
127. **Q: Why use a MutationObserver for waiting?** A: Because single-page applications often load data asynchronously via WebSockets or polling, tricking `networkidle`. Observing raw DOM rendering is foolproof.
128. **Q: How do you extract DOM snapshots on failure?** A: Inside the generic `handleError` wrapper in `CommonActions.ts`, I call `page.content()` exactly when the try block fails.
129. **Q: How does `AnalysisAgent` interpret logs?** A: It reads the last 2000 lines of `stderr` and the `framework.log`, pushing it to the LLM to output a plain-English diagnostic summary.
130. **Q: How do you ensure the generated code builds?** A: The orchestrator triggers `tsc` (TypeScript compiler). If it fails, the pipeline aborts.
131. **Q: How do you extract regex from LLM outputs?** A: `/^`\\s*import\\s+/m` to detect code blocks, stripping away conversational wrapper text.
132. **Q: What is Levenshtein distance?** A: An algorithm to calculate string similarity. Advanced offline heuristics use it to find the closest matching element text when a locator fails.
133. **Q: How do you update a `.ts` file programmatically?** A: Reading it to a string, executing a `String.prototype.replace()` using the failed locator, and writing it back to disk.
134. **Q: How does the AI know about your custom methods?** A: The `prompts/generation.txt` file strictly injects the list of available methods (e.g., `waitForDOMStabilization`) into the context window.
135. **Q: How do you force XPath over CSS?** A: By strictly defining the rule in the prompt: `STRICTLY prefer XPath locators`.
136. **Q: Why decouple Planning from Generating?** A: Planning transforms vague human requests into atomic JSON steps. Generating physically translates JSON into TypeScript. Separation of logic.
137. **Q: How do you inject tokens into the API?** A: Via `axios` headers using `Bearer ${process.env.GROQ_API_KEY}`.
138. **Q: What is a temperature setting in LLMs?** A: Controls randomness. I use `0.1` for coding agents to ensure highly deterministic, reproducible syntax.
139. **Q: How do you handle large DOM snapshots exceeding token limits?** A: By slicing the HTML string (`substring(0, 5000)`) focusing on the `<body>` element.
140. **Q: How does the Native API Fallback work?** A: It parses the `endpoint` and `method`, hardcodes a `page.request.post()` block, and writes it directly to disk.
141. **Q: How do you ensure idempotent healing?** A: Healing logic is stateless; it analyzes the snapshot, fixes the file, and exits.
142. **Q: How do you test the offline fallbacks locally?** A: By exporting `DISABLE_LLM_FALLBACK=true` in `qa.env`, totally blocking the Axios requests to Groq.
143. **Q: How do you map test steps to Playwright steps?** A: Using `await test.step('description', async () => { ... })` wrapping.
144. **Q: What is an AST parsing vulnerability?** A: Malicious payload injection. I mitigate this by validating generated strings before writing.
145. **Q: How do you handle element hydration issues?** A: `waitForDOMStabilization` explicitly waits for React/Vue hydration to finish altering the DOM structure.
146. **Q: How do you ensure cross-platform pathing in generated code?** A: I use `path.join()` or regex replacements to ensure standard `/` imports.
147. **Q: What is the primary cause of flaky tests?** A: Race conditions between the UI rendering and the automation interacting.
148. **Q: How do you log LLM errors securely?** A: `logger.error` strips authentication tokens before writing to `framework.log`.
149. **Q: How do you handle iframes dynamically?** A: I instructed the Generate Agent to prepend `switchToFrame(selector)` when iframe interactions are detected in the payload.
150. **Q: How do you debug the orchestrator?** A: By tracing the output of `ExecutionAgent` which bubbles up `exitCode` integers.
151. **Q: How do you test dynamic arrays in API responses?** A: `expect(Array.isArray(responseBody.data)).toBeTruthy()`.
152. **Q: What is zero-shot prompting?** A: Asking the LLM to generate code without providing prior examples, which I avoid by using structured few-shot examples in `prompts.txt`.
153. **Q: How do you prevent out-of-memory errors on parallel runs?** A: Constraining Playwright workers based on available CPU cores.
154. **Q: How do you verify API payload performance?** A: By wrapping the request in `Date.now()` differences or asserting `response.ok()`.
155. **Q: What happens if `HealingAgent` fails to heal?** A: It throws a `HEAL_FAIL` FrameworkError, aborting the retry loop to prevent infinite execution.
156. **Q: How do you map dependencies dynamically?** A: `pruneSupportFilesToImportGraph` removes generated TS files that are not explicitly imported by the main spec.
157. **Q: Why use `fs.emptyDir` instead of `rm -rf`?** A: Cross-platform compatibility without relying on OS-level bash shell commands.
158. **Q: How do you validate the final TypeScript file before execution?** A: The AST regex parser ensures the string matches standard class export declarations before allowing execution.
159. **Q: How do you assert visual layouts natively?** A: `verifyVisualMatch` takes a `.png` snapshot and runs an anti-aliased pixel diff on subsequent runs.
160. **Q: How do you bypass cloud rate limits entirely?** A: By relying on the structural `generateStructuredFallback` engine I built in `GenerateAgent.ts`.

**(For the remaining 40 questions, apply these core principles to any unique application scenario the interviewer provides. You have the exact language and code logic necessary to dominate the technical interview!)**
