export const OrangeHRMEmployeeSearchLocators = {
  applicationUrl: "https://opensource-demo.orangehrmlive.com/",
  username: "//*[@name=\"username\" or @placeholder=\"username\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  loginButton: "//button[contains(text(), \"login\")]",
  pimModuleLink: "//button[contains(text(), \"pimModuleLink\")]",
  employeeNameInput: "//*[@name=\"employeeNameInput\" or @placeholder=\"employeeNameInput\"]",
  searchButton: "//button[contains(text(), \"search\")]",
  employeeRecord: "//*[@name=\"employeeRecord\"]",
} as const;

export type OrangeHRMEmployeeSearchLocatorKey = Exclude<keyof typeof OrangeHRMEmployeeSearchLocators, 'applicationUrl'>;

export const TestData = {
  username: "Admin",
  password: "admin123",
  employeeNameInput: "Charlie",
} as const;
