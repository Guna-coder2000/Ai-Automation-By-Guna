export const Test3AccordionLocators = {
  applicationUrl: "https://demo.automationtesting.in/Accordion.html",
  group2: "b:has-text('Collapsible Group 2 - Single Line Coding')",
  group2Body: "#collapse2",
  group3: "b:has-text('Collapsible Group 3 - Methhod Chaining')",
  group3Body: "#collapse3",
  page: "body",
} as const;

export type Test3AccordionLocatorKey = Exclude<keyof typeof Test3AccordionLocators, 'applicationUrl'>;
