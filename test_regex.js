const { readFileSync } = require('fs');

function cleanExtractedSelector(selector) {
  const trimmed = selector.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').split(/\s+\{"(?:error|screenshot|screenshotError)"/)[0].trim();
  const unwrapped = /^(['"`])[\s\S]*\1$/.test(trimmed)
    ? trimmed.slice(1, -1)
    : trimmed;

  return unwrapped
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

function extractFailedSelector(output) {
  const frameworkActionMatch = output.match(/(?:FrameworkError:\s*)?(?:clickOnElement|clearAndEnterText|selectOptionByTextOnDropdown|verifyElementVisible|verifyElementHidden|click|fill|press|select|selectByText|fillAndChoose|check|uncheck|hover|dragAndDrop|uploadFile)\s+failed on\s+([^\r\n]+)/i);
  if (frameworkActionMatch?.[1]) return cleanExtractedSelector(frameworkActionMatch?.[1]);
  return undefined;
}

const output = `    FrameworkError: clickOnElement failed on //*[contains(@class, 'btn-danger')]

       at ..\\src\\framework\\CommonActions.ts:557`;

console.log("Extracted:", extractFailedSelector(output));
