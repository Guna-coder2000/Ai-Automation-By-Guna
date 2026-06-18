export const Test1RegistrationLocators = {
  applicationUrl: "https://demo.automationtesting.in/Register.html",
  firstName: "//input[@placeholder='First Name']",
  lastName: "//input[@placeholder='Last Name']",
  address: "//textarea[@ng-model='Adress']",
  email: "//input[@type='email']",
  phone: "//input[@type='tel']",
  genderMale: "//input[@value='Male']",
  hobbiesCricket: "//input[@value='Cricket']",
  hobbiesMovies: "//input[@value='Movies']",
  skills: "//*[@id='Skills']",
  country: "//*[@id='countries']",
  yearbox: "//*[@id='yearbox']",
  monthbox: "//select[@ng-model='monthbox']",
  daybox: "//*[@id='daybox']",
  password: "//*[@id='firstpassword']",
  confirmPassword: "//*[@id='secondpassword']",
  submit: "//*[@id='submitbtn']",
  username: "//input[@type='email']",
  loginButton: "button[type=\"submit\"], input[type=\"submit\"], #login-button",
} as const;

export type Test1RegistrationLocatorKey = Exclude<keyof typeof Test1RegistrationLocators, 'applicationUrl'>;

export const TestData = {
  firstName: "Ai",
  lastName: "Agent",
  address: "123 AI Street, Tech City",
  email: "test@ai.com",
  phone: "1234567890",
  password: "Password123",
} as const;
