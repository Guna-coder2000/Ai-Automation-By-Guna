#!/usr/bin/env node
/**
 * CLI Orchestrator - entry point for the AI-Playwright pipeline.
 *
 * Usage:
 *   npm run ai-test <request-file>.json          Run full pipeline
 *   npm run plan <request-file>.json             Run planning only
 *   npm run generate <plan-file>.json            Run generation only
 *   npm run execute <spec-file>.spec.ts          Run execution with healing
 *   npm run heal <spec-file>.spec.ts <selector>  Run healing only
 *   npm run report                               Run reporting only
 */
import path from 'path';
import { pathExists } from 'fs-extra';
import { Config } from './framework/Config';
import Logger from './utils/logger';
import { PlanningAgent } from './agents/planning/PlanningAgent';
import { GenerateAgent } from './agents/generate/GenerateAgent';
import { ExecutionAgent } from './agents/execution/ExecutionAgent';
import { HealingAgent } from './agents/healing/HealingAgent';
import { ReportingAgent } from './agents/reporting/ReportingAgent';
import { ApiAgent } from './agents/api/ApiAgent';
import { AnalysisAgent } from './agents/analysis/AnalysisAgent';
import { FrameworkError } from './framework/FrameworkError';
import {
  banner,
  stageStart,
  stagePass,
  stageFail,
  pipelineHeader,
  pipelineSummary,
  executionLog,
} from './utils/console-ui';

import { readdir, stat, emptyDir } from 'fs-extra';

async function resolveFile(arg: string, fallbackDir = 'requests'): Promise<string[]> {
  const resolvePath = async (p: string) => {
    if (path.isAbsolute(p)) return p;
    const resolved = path.resolve(p);
    if (await pathExists(resolved)) return resolved;
    return path.resolve(fallbackDir, p);
  };

  const targetPath = await resolvePath(arg);
  const info = await stat(targetPath).catch(() => null);
  
  if (info?.isDirectory()) {
    const files = await readdir(targetPath);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(targetPath, f));
  }
  
  return [targetPath];
}

async function runPlanning(requestFile: string): Promise<string> {
  stageStart(1, 'Planning Agent', 'Converting requirement to automation plan');
  const planner = new PlanningAgent();
  const planPath = await planner.run(requestFile);
  stagePass(1, 'Planning Agent', `Plan saved -> ${path.basename(planPath)}`);
  return planPath;
}

async function runGeneration(planPath: string): Promise<string> {
  stageStart(2, 'Generation Agent', 'Generating Playwright code from plan');
  const generator = new GenerateAgent();
  const specPath = await generator.run(planPath);
  stagePass(2, 'Generation Agent', `Spec generated -> ${path.basename(specPath)}`);
  return specPath;
}

async function runApiGeneration(requestFile: string): Promise<string> {
  stageStart(1, 'API Agent', 'Generating API testing script');
  const apiAgent = new ApiAgent();
  const specPath = await apiAgent.run(requestFile);
  stagePass(1, 'API Agent', `API Spec generated -> ${path.basename(specPath)}`);
  return specPath;
}

async function runExecution(specPath: string): Promise<{ passed: boolean; output: string }> {
  stageStart(3, 'Execution Agent', 'Running Playwright tests in browser');
  const executor = new ExecutionAgent();
  const result = await executor.run(specPath);
  stagePass(3, 'Execution Agent', 'All tests passed');
  return result;
}

async function runHealing(specPath: string, failedSelector: string, domSnippet?: string): Promise<string> {
  stageStart(4, 'Healing Agent', `Healing failed selector: "${failedSelector}"`);
  const healer = new HealingAgent();
  const healedSelector = await healer.run(specPath, failedSelector, domSnippet);
  stagePass(4, 'Healing Agent', `Healed -> "${healedSelector}"`);
  return healedSelector;
}

async function runExecutionWithHealing(specPath: string): Promise<void> {
  const logger = Logger.getInstance();
  const configuredHealingAttempts = Number(process.env.HEALING_MAX_ATTEMPTS ?? 3);
  const maxHealingAttempts = Number.isFinite(configuredHealingAttempts) && configuredHealingAttempts > 0
    ? configuredHealingAttempts
    : 3;
  let healingAttempts = 0;
  let executionError: unknown;

  while (healingAttempts <= maxHealingAttempts) {
    try {
      if (healingAttempts === 0) {
        await runExecution(specPath);
      } else {
        stageStart(4, 'Re-Execution', `Retrying after healing (${healingAttempts}/${maxHealingAttempts})`);
        const executor = new ExecutionAgent();
        await executor.run(specPath);
        stagePass(4, 'Re-Execution', 'Tests passed after healing');
      }
      return;
    } catch (execErr) {
      executionError = execErr;
      const failedSelector = (execErr as { failedSelector?: string }).failedSelector;
      const healingReason = (execErr as { healingReason?: string }).healingReason
        ?? 'No failed selector was detected in Playwright output';
      const domSnippet = (execErr as { domSnippet?: string }).domSnippet;
      const output = (execErr as { output?: string }).output;

      if (!failedSelector) {
        stageFail(
          healingAttempts === 0 ? 3 : 4,
          healingAttempts === 0 ? 'Execution Agent' : 'Re-Execution',
          `Test failed; locator not detected: ${healingReason}`
        );
        logger.warn(`Execution failed with error: ${healingReason}`);
        
        if (output && healingAttempts < maxHealingAttempts) {
          const analyzer = new AnalysisAgent();
          const rca = await analyzer.run(output);
          logger.info(`ROOT CAUSE: ${rca}`);
          executionLog('error', 'AI Root Cause Analysis', rca);

          const isLogicIssue = /logic|missing step|timeout|navigation|expected .* visible|flow|login/i.test(rca) || /logic/i.test(healingReason);
          
          if (isLogicIssue) {
            executionLog('heal', 'Generative Logic Healing', 'Logic issue detected. Triggering PlanningAgent to replan the UI flow.');
            const planner = new PlanningAgent();
            const scenarioName = path.basename(specPath, '.spec.ts');
            const planPath = path.resolve('storage', 'plans', `${scenarioName}Plan.json`);
            
            const newPlanPath = await planner.replan(output, domSnippet, planPath);
            if (newPlanPath) {
              const generator = new GenerateAgent();
              await generator.run(newPlanPath);
              healingAttempts += 1;
              continue;
            }
          }

          executionLog('heal', 'Generative Code Healing', 'Attempting to fix syntax or code error in generated files.');
          const generator = new GenerateAgent();
          await generator.fixCode(specPath, output);
          healingAttempts += 1;
          continue;
        } else if (output) {
          const analyzer = new AnalysisAgent();
          const rca = await analyzer.run(output);
          logger.info(`FINAL ROOT CAUSE: ${rca}`);
          executionLog('error', 'Final Root Cause Analysis', rca);
        }
        
        break;
      }

      if (healingAttempts >= maxHealingAttempts) {
        stageFail(4, 'Healing Agent', `Stopped after ${maxHealingAttempts} healing attempts. Last selector: "${failedSelector}"`);
        logger.warn(`Healing stopped after reaching max attempts: ${maxHealingAttempts}`);
        break;
      }

      healingAttempts += 1;
      await runHealing(specPath, failedSelector, domSnippet);
    }
  }

  throw executionError;
}

async function runReporting(): Promise<void> {
  stageStart(5, 'Reporting Agent', 'Aggregating reports, screenshots and videos');
  const reporter = new ReportingAgent();
  await reporter.run();
  stagePass(5, 'Reporting Agent', 'Reports ready in reports/ directory');
}

import { readFile } from 'fs-extra';

async function runFullPipeline(requestFiles: string[]): Promise<void> {
  const startTime = Date.now();
  pipelineHeader(`Batch Execution: ${requestFiles.length} request(s)`);
  Config.get();

  let executionError: unknown;
  
  try {
    // 1. Parallel Generation Phase (Fast Sharding)
    const generatedSpecs = await Promise.all(requestFiles.map(async (requestFile) => {
      const rawReq = await readFile(requestFile, 'utf-8').catch(() => '{}');
      const isApi = /"isApiTest"\s*:\s*true/.test(rawReq);
      
      if (isApi) {
        return await runApiGeneration(requestFile);
      } else {
        const planPath = await runPlanning(requestFile);
        return await runGeneration(planPath);
      }
    }));

    // 2. Sequential Execution Phase
    await emptyDir('blob-report').catch(() => {});
    
    for (const specPath of generatedSpecs) {
      try {
        await runExecutionWithHealing(specPath);
      } catch (err) {
        Logger.getInstance().error(`Execution failed for ${specPath}`, { error: err });
        executionError = err;
      }
    }
  } catch (err) {
    executionError = err;
  }

  await runReporting();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  pipelineSummary(!executionError, elapsed);

  if (executionError) {
    throw executionError;
  }
}

(async () => {
  const logger = Logger.getInstance();
  const stage = process.env.AI_STAGE || 'full';
  const args = process.argv.slice(2);

  try {
    Config.get();

    switch (stage) {
      case 'plan': {
        if (!args[0]) { banner('Usage: npm run plan <request-file-or-dir>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0]);
        for (const file of files) await runPlanning(file);
        break;
      }
      case 'generate': {
        if (!args[0]) { banner('Usage: npm run generate <plan-file-or-dir>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0], 'storage/plans');
        for (const file of files) await runGeneration(file);
        break;
      }
      case 'execute': {
        if (!args[0]) { banner('Usage: npm run execute <spec-file-or-dir>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0], 'generated/tests');
        // Just run the directory using execution engine
        await runExecutionWithHealing(files.length > 1 ? 'generated/tests' : files[0]);
        break;
      }
      case 'heal': {
        if (!args[0] || !args[1]) { banner('Usage: npm run heal <spec-file.ts> <failed-selector>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0], 'generated/tests');
        await runHealing(files[0], args[1]);
        break;
      }
      case 'report': {
        await runReporting();
        break;
      }
      case 'api': {
        if (!args[0]) { banner('Usage: npm run api <request-file-or-dir>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0]);
        for (const file of files) await runApiGeneration(file);
        break;
      }
      case 'full':
      default: {
        if (!args[0]) { banner('Usage: npm run ai-test <request-file-or-dir>', 'error'); process.exit(1); }
        const files = await resolveFile(args[0]);
        await runFullPipeline(files);
        break;
      }
    }

    process.exit(0);
  } catch (err) {
    if (err instanceof FrameworkError) {
      logger.error(`Pipeline aborted [${err.code}]: ${err.message}`);
    } else {
      logger.error(`Unexpected error: ${(err as Error).message}`);
    }
    process.exit(1);
  }
})();
