export const OpenMRSPatientRegistrationLocators = {
  applicationUrl: "https://demo.openmrs.org/openmrs/login.htm",
  username: "//*[@name=\"username\" or @placeholder=\"username\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  inpatientWard: "//button[contains(text(), \"inpatientWard\")]",
  loginButton: "//button[contains(text(), \"login\")]",
  registerPatientButton: "//button[contains(text(), \"registerPatient\")]",
  givenName: "//*[@name=\"givenName\" or @placeholder=\"givenName\"]",
  familyName: "//*[@name=\"familyName\" or @placeholder=\"familyName\"]",
  nextButton: "//button[contains(text(), \"next\")]",
  gender: "//*[@name=\"gender\" or @placeholder=\"gender\"]",
  birthdateDay: "//*[@name=\"birthdateDay\" or @placeholder=\"birthdateDay\"]",
  birthdateMonth: "//*[@name=\"birthdateMonth\" or @placeholder=\"birthdateMonth\"]",
  birthdateYear: "//*[@name=\"birthdateYear\" or @placeholder=\"birthdateYear\"]",
  confirmButton: "//button[contains(text(), \"confirm\")]",
} as const;

export type OpenMRSPatientRegistrationLocatorKey = Exclude<keyof typeof OpenMRSPatientRegistrationLocators, 'applicationUrl'>;

export const TestData = {
  username: "admin",
  password: "Admin123",
  givenName: "Test",
  familyName: "Patient",
  gender: "M",
  birthdateDay: "01",
  birthdateMonth: "January",
  birthdateYear: "1990",
} as const;
