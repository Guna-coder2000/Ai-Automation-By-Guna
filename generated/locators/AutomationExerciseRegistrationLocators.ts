export const AutomationExerciseRegistrationLocators = {
  applicationUrl: "https://automationexercise.com/",
  signupLoginLink: "text",
  signupName: "//*[@name=\"signupName\" or @placeholder=\"signupName\"]",
  signupEmail: "//*[@name=\"signupEmail\" or @placeholder=\"signupEmail\"]",
  signupButton: "//button[contains(text(), \"signup\")]",
  mrRadio: "//*[@name=\"mrRadio\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  days: "//*[@name=\"days\" or @placeholder=\"days\"]",
  months: "//*[@name=\"months\" or @placeholder=\"months\"]",
  years: "//*[@name=\"years\" or @placeholder=\"years\"]",
  createAccountButton: "//button[contains(text(), \"createAccount\")]",
} as const;

export type AutomationExerciseRegistrationLocatorKey = Exclude<keyof typeof AutomationExerciseRegistrationLocators, 'applicationUrl'>;

export const TestData = {
  signupName: "John Doe Test",
  signupEmail: "johndoe.test@example.com",
  password: "Password123",
  days: "1",
  months: "January",
  years: "2000",
} as const;
