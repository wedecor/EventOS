/** docs/09 POST /clients/:id/contacts response shape (decision 3A). */
export type AddContactResultDto = {
  id: string;
  contactsCount: number;
};
