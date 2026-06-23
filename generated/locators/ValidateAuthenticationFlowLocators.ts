export const ValidateAuthenticationFlowLocators = {
  applicationUrl: "https://www.saucedemo.com/",
  usernameInput: "//input[@placeholder=\"Username\"]",
  passwordInput: "//input[@placeholder=\"Password\"]",
} as const;

export type ValidateAuthenticationFlowLocatorKey = Exclude<keyof typeof ValidateAuthenticationFlowLocators, 'applicationUrl'>;

export const TestData = {
  username: "standard_user",
  password: "secret_sauce",
} as const;
