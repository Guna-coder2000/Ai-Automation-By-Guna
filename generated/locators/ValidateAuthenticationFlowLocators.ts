export const ValidateAuthenticationFlowLocators = {
  applicationUrl: "https://www.saucedemo.com/",
  username: "//*[@name=\"username\" or @placeholder=\"username\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  loginButton: "//button[contains(text(), \"login-\")]",
  inventoryContainer: "//*[@name=\"inventory_container\"]",
  reactBurgerMenuBtn: "//button[contains(text(), \"react-burger-menu-btn\")]",
  logoutSidebarLink: "//button[contains(text(), \"logout_sidebar_link\")]",
} as const;

export type ValidateAuthenticationFlowLocatorKey = Exclude<keyof typeof ValidateAuthenticationFlowLocators, 'applicationUrl'>;

export const TestData = {
  username: "standard_user",
  password: "secret_sauce",
} as const;
