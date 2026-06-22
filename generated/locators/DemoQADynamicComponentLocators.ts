export const DemoQADynamicComponentLocators = {
  applicationUrl: "https://demoqa.com/webtables",
  addNewRecordButton: "text",
  firstName: "//*[@name=\"firstName\" or @placeholder=\"firstName\"]",
  lastName: "//*[@name=\"lastName\" or @placeholder=\"lastName\"]",
  userEmail: "//*[@name=\"userEmail\" or @placeholder=\"userEmail\"]",
  age: "//*[@name=\"age\" or @placeholder=\"age\"]",
  salary: "//*[@name=\"salary\" or @placeholder=\"salary\"]",
  department: "//*[@name=\"department\" or @placeholder=\"department\"]",
  submit: "//button[contains(text(), \"submit\")]",
  newRecordRow: "//*[@name=\"newRecordRow\"]",
} as const;

export type DemoQADynamicComponentLocatorKey = Exclude<keyof typeof DemoQADynamicComponentLocators, 'applicationUrl'>;

export const TestData = {
  firstName: "Alice",
  lastName: "Smith",
  userEmail: "alice@example.com",
  age: "30",
  salary: "50000",
  department: "IT",
} as const;
