// Authorized emails for dashboard access
export const AUTHORIZED_EMAILS = [
  "corey@ifinancememphis.com",
  "sam@ifinancememphis.com",
  "jon@ifinancememphis.com",
  "kyle@ifinancememphis.com",
  "alimigdadi@icloud.com",
  "carlosic6984@gmail.com"
];

// Helper function to check if an email is authorized
export const isEmailAuthorized = (email: string): boolean => {
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
};

// Helper function to add an email (for future server-side implementation)
export const addAuthorizedEmail = (email: string): void => {
  if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
    AUTHORIZED_EMAILS.push(email.toLowerCase());
  }
};

// Helper function to remove an email (for future server-side implementation)
export const removeAuthorizedEmail = (email: string): void => {
  const index = AUTHORIZED_EMAILS.indexOf(email.toLowerCase());
  if (index > -1) {
    AUTHORIZED_EMAILS.splice(index, 1);
  }
};