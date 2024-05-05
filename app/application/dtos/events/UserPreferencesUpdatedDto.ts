export type UserPreferencesUpdatedDto = {
  new: {
    locale: string;
  };
  old: {
    locale: string;
  };
  userId: string;
};
