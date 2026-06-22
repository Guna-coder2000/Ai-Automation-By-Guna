export const UnnamedScenarioLocators = {
  applicationUrl: "https://the-internet.herokuapp.com/",
  javascriptAlertsLink: "button",
  jsAlertButton: "button:has-text(\"jsAlert\")",
  dynamicControlsLink: "button:has-text(\"dynamicControlsLink\")",
  removeCheckboxButton: "button:has-text(\"removeCheckbox\")",
} as const;

export type UnnamedScenarioLocatorKey = Exclude<keyof typeof UnnamedScenarioLocators, 'applicationUrl'>;
