export const SuiteCRMCreateLeadLocators = {
  applicationUrl: "https://demo.suiteondemand.com/",
  username: "//*[@name=\"username\" or @placeholder=\"username\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  loginButton: "//button[contains(text(), \"login\")]",
  salesMenu: "//button[contains(text(), \"salesMenu\")]",
  leadsLink: "//button[contains(text(), \"leadsLink\")]",
  createLeadButton: "//button[contains(text(), \"createLead\")]",
  firstName: "//*[@name=\"firstName\" or @placeholder=\"firstName\"]",
  lastName: "//*[@name=\"lastName\" or @placeholder=\"lastName\"]",
  saveButton: "//button[contains(text(), \"save\")]",
} as const;

export type SuiteCRMCreateLeadLocatorKey = Exclude<keyof typeof SuiteCRMCreateLeadLocators, 'applicationUrl'>;

export const TestData = {
  username: "will",
  password: "will",
  firstName: "James",
  lastName: "Bond",
} as const;
