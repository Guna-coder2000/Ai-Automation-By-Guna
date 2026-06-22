export const InternetUIComponentsLocators = {
  applicationUrl: "https://the-internet.herokuapp.com/",
  javascriptAlertsLink: "*",
  jsAlertButton: "//button[contains(normalize-space(.), \"jsAlert\")] | //a[contains(normalize-space(.), \"jsAlert\")] | //*[contains(@class, \"btn\") and contains(normalize-space(.), \"jsAlert\")] | //*[@id=\"jsAlertButton\" or @data-testid=\"jsAlertButton\"]",
  dynamicControlsLink: "//button[contains(normalize-space(.), \"dynamicControls\")] | //a[contains(normalize-space(.), \"dynamicControls\")] | //*[contains(@class, \"btn\") and contains(normalize-space(.), \"dynamicControls\")] | //*[@id=\"dynamicControlsLink\" or @data-testid=\"dynamicControlsLink\"]",
  removeCheckboxButton: "//button[contains(normalize-space(.), \"removeCheckbox\")] | //a[contains(normalize-space(.), \"removeCheckbox\")] | //*[contains(@class, \"btn\") and contains(normalize-space(.), \"removeCheckbox\")] | //*[@id=\"removeCheckboxButton\" or @data-testid=\"removeCheckboxButton\"]",
  checkboxGoneMessage: "//*[@name=\"checkboxGoneMessage\" or @id=\"checkboxGoneMessage\" or @data-testid=\"checkboxGoneMessage\"]",
} as const;

export type InternetUIComponentsLocatorKey = Exclude<keyof typeof InternetUIComponentsLocators, 'applicationUrl'>;
