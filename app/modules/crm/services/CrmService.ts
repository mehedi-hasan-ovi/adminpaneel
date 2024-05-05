import { DefaultEntityTypes } from "~/application/dtos/shared/DefaultEntityTypes";
import { Colors } from "~/application/enums/shared/Colors";
import { RowRelationshipsApi } from "~/utils/api/RowRelationshipsApi";
import { RowsApi } from "~/utils/api/RowsApi";
import { getEntitiesByName, getEntityByName } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails, countRows, getRowById, getRows, getRowsInIds } from "~/utils/db/entities/rows.db.server";
import RowHelper from "~/utils/helpers/RowHelper";
import RowValueHelper from "~/utils/helpers/RowValueHelper";

async function validate(tenantId: string | null = null) {
  const crmEntities = ["company", "opportunity", "contact"];
  if (tenantId === null) {
    crmEntities.push("submission");
  }
  const entities = await getEntitiesByName(crmEntities);
  await Promise.all(
    crmEntities.map(async (crmEntity) => {
      const entity = entities.find((i) => i.name === crmEntity);
      if (!entity) {
        throw new Error(`CRM is not configured: Entity "${crmEntity}" is required. Go to /admin/entities/templates/manual and load the template.`);
      }
      if (tenantId === null && ![DefaultEntityTypes.All, DefaultEntityTypes.AdminOnly].find((f) => f.toString() === entity.type)) {
        throw new Error(`CRM is not configured: Entity "${crmEntity}" must be "All" or "Admin"`);
      } else if (tenantId !== null && ![DefaultEntityTypes.All, DefaultEntityTypes.AppOnly].find((f) => f.toString() === entity.type)) {
        throw new Error(`CRM is not configured: Entity "${crmEntity}" must be "All" or "App"`);
      }
    })
  );
}

async function getContactsInRowIds(rowIds: string[]): Promise<ContactDto[]> {
  const contactsEntity = await getEntityByName({ tenantId: null, name: "contact" });
  const rows = await getRowsInIds(rowIds);
  return await Promise.all(
    rowIds
      .filter((f) => f)
      .map(async (rowId) => {
        const row = rows.find((i) => i.id === rowId);
        if (!row) {
          throw new Error("Contact not found: " + rowId);
        }
        const email = RowValueHelper.getText({ entity: contactsEntity, row, name: "email" }) ?? "";
        const firstName = RowValueHelper.getText({ entity: contactsEntity, row, name: "firstName" }) ?? "";
        const lastName = RowValueHelper.getText({ entity: contactsEntity, row, name: "lastName" }) ?? "";
        const jobTitle = RowValueHelper.getText({ entity: contactsEntity, row, name: "jobTitle" }) ?? "";
        const marketingSubscriber = RowValueHelper.getBoolean({ entity: contactsEntity, row, name: "marketingSubscriber" }) ?? false;
        const contact: ContactDto = {
          id: row.id,
          email,
          firstName,
          lastName,
          jobTitle,
          marketingSubscriber,
        };
        return contact;
      })
  );
}

export type ContactDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  marketingSubscriber: boolean;
  company?: {
    name: string;
  };
};
async function getContact(rowId: string): Promise<ContactDto | null> {
  const row = await getRowById(rowId);
  if (!row) {
    return null;
  }
  const contactsEntity = await getEntityByName({ tenantId: null, name: "contact" });
  const email = RowValueHelper.getText({ entity: contactsEntity, row, name: "email" }) ?? "";
  const firstName = RowValueHelper.getText({ entity: contactsEntity, row, name: "firstName" }) ?? "";
  const lastName = RowValueHelper.getText({ entity: contactsEntity, row, name: "lastName" }) ?? "";
  const jobTitle = RowValueHelper.getText({ entity: contactsEntity, row, name: "jobTitle" }) ?? "";
  const marketingSubscriber = RowValueHelper.getBoolean({ entity: contactsEntity, row, name: "marketingSubscriber" }) ?? false;

  const companyEntity = await getEntityByName({ tenantId: null, name: "company" });
  const companyRow = row.parentRows.find((f) => f.parent.entityId === companyEntity.id)?.parent;
  let company: { name: string } | undefined = undefined;
  if (companyRow) {
    company = {
      name: RowValueHelper.getText({ entity: companyEntity, row: companyRow, name: "name" }) ?? "",
    };
  }

  return {
    id: row.id,
    email,
    firstName,
    lastName,
    jobTitle,
    marketingSubscriber,
    company,
  };
}

export type ContactFormSettings = { crm: boolean; actionUrl?: string; error?: string };
async function getContactFormSettings() {
  const settings: ContactFormSettings = {
    crm: false,
    actionUrl: undefined,
    error: undefined,
  };
  try {
    await validate();
    settings.crm = true;
  } catch (e: any) {
    if (process.env.INTEGRATIONS_CONTACT_FORMSPREE) {
      settings.actionUrl = process.env.INTEGRATIONS_CONTACT_FORMSPREE;
    } else {
      settings.error = "Contact form is not configured";
    }
  }
  return settings;
}

export type NewsletterFormSettings = {
  crm: boolean;
  convertKit?: boolean;
  error?: string;
};
async function getNewsletterFormSettings() {
  const settings: NewsletterFormSettings = {
    crm: false,
    convertKit: false,
    error: undefined,
  };
  try {
    await validate();
    settings.crm = true;
  } catch (e: any) {
    if (process.env.CONVERTKIT_FORM && process.env.CONVERTKIT_APIKEY) {
      settings.convertKit = true;
    } else {
      settings.error = "Newsletter form is not configured";
    }
  }
  return settings;
}

export type CrmSummaryDto = {
  companies: number;
  contacts: number;
  opportunities: { value: number; count: number };
  submissions: number;
  data: {
    openOpportunities: RowWithDetails[];
    submissions: RowWithDetails[];
  };
};
async function getSummary(tenantId: string | null): Promise<CrmSummaryDto> {
  const openOpportunities = await getRows({
    tenantId,
    entityName: "opportunity",
    rowWhere: {
      workflowState: {
        name: { in: ["new", "qualified"] },
      },
    },
  });
  const opportunities = { value: 0, count: 0 };
  const opportunitiesEntity = await getEntityByName({ tenantId, name: "opportunity" });
  openOpportunities.forEach((row) => {
    const value = RowValueHelper.getNumber({ entity: opportunitiesEntity, row, name: "value" });
    opportunities.value += value ?? 0;
    if ((value ?? 0) > 0) {
      opportunities.count++;
    }
  });
  const submissions = await getRows({ entityName: "submission", tenantId });
  return {
    companies: await countRows({ entityName: "company", tenantId }),
    contacts: await countRows({ entityName: "contact", tenantId }),
    opportunities,
    submissions: submissions.length,
    data: {
      openOpportunities,
      submissions,
    },
  };
}

async function createCompany({ tenantId, name }: { tenantId: string | null; name: string }) {
  const entity = await getEntityByName({ tenantId, name: "company" });
  const rowValues = RowHelper.getRowPropertiesFromForm({
    entity,
    values: [{ name: "name", value: name }],
  });
  const row = await RowsApi.create({
    entity,
    tenantId,
    rowValues,
  });
  return row;
}

async function createContact({
  tenantId,
  firstName,
  lastName,
  email,
  jobTitle,
  status,
  marketingSubscriber,
}: {
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  status: string;
  marketingSubscriber: boolean;
}) {
  const entity = await getEntityByName({ tenantId, name: "contact" });
  const rowValues = RowHelper.getRowPropertiesFromForm({
    entity,
    values: [
      { name: "firstName", value: firstName },
      { name: "lastName", value: lastName },
      { name: "email", value: email },
      { name: "jobTitle", value: jobTitle ?? "" },
      { name: "status", value: status },
      { name: "marketingSubscriber", value: marketingSubscriber ? "true" : "false" },
    ],
  });
  return await RowsApi.create({
    entity,
    tenantId,
    rowValues,
  });
}

async function createSubmission({ tenantId, users, message }: { tenantId: string | null; users: string; message: string }) {
  const entity = await getEntityByName({ tenantId, name: "submission" });
  const rowValues = RowHelper.getRowPropertiesFromForm({
    entity,
    values: [
      { name: "users", value: users },
      { name: "message", value: message },
    ],
  });
  const row = await RowsApi.create({
    entity,
    tenantId,
    rowValues,
  });
  return row;
}

async function createContactSubmission(submission: {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  company?: string;
  users: string;
  message: string;
}) {
  let contact = await RowsApi.find({
    entity: { name: "contact" },
    tenantId: null,
    properties: [{ name: "email", value: submission.email }],
  });

  if (!contact) {
    contact = await createContact({
      tenantId: null,
      firstName: submission.firstName,
      lastName: submission.lastName,
      email: submission.email,
      jobTitle: submission.jobTitle,
      status: "contact",
      marketingSubscriber: false,
    });
    await RowsApi.addTag({ row: contact, tag: { value: "form", color: Colors.BLUE } });
  }
  const companyEntity = await getEntityByName({ tenantId: null, name: "company" });
  const companies = contact.parentRows.filter((f) => f.parent.entityId === companyEntity.id);
  if (companies.length === 0 && submission.company) {
    const company = await createCompany({
      tenantId: null,
      name: submission.company,
    });
    await RowRelationshipsApi.createRelationship({
      parent: company,
      child: contact,
    });
  }

  const newSubmission = await createSubmission({
    tenantId: null,
    users: submission.users,
    message: submission.message,
  });
  await RowRelationshipsApi.createRelationship({
    parent: contact,
    child: newSubmission,
  });

  return contact;
}

async function updateContact(rowId: string, data: { marketingSubscriber?: boolean }) {
  const contactsEntity = await getEntityByName({ tenantId: null, name: "contact" });
  const row = await getRowById(rowId);
  if (!row) {
    return null;
  }
  return RowValueHelper.update({
    entity: contactsEntity,
    row,
    values: [{ name: "marketingSubscriber", booleanValue: data.marketingSubscriber }],
    session: { tenantId: row.tenantId },
  });
}

async function subscribeToNewsletter({ firstName, lastName, email, source }: { firstName: string; lastName: string; email: string; source?: string }) {
  const settings = await getNewsletterFormSettings();

  if (settings.crm) {
    let contact = await RowsApi.find({
      entity: { name: "contact" },
      tenantId: null,
      properties: [{ name: "email", value: email }],
    });

    if (!contact) {
      contact = await createContact({
        tenantId: null,
        firstName,
        lastName,
        email: email,
        jobTitle: "",
        status: "contact",
        marketingSubscriber: true,
      });
      if (source) {
        await RowsApi.addTag({ row: contact, tag: { value: source, color: Colors.ORANGE } });
      } else {
        await RowsApi.addTag({ row: contact, tag: { value: "newsletter", color: Colors.ORANGE } });
      }
    } else {
      await updateContact(contact.id, { marketingSubscriber: true });
    }
    return { success: true };
  } else if (settings.convertKit) {
    const API_KEY = process.env.CONVERTKIT_APIKEY;
    const FORM_ID = process.env.CONVERTKIT_FORM;
    const API = "https://api.convertkit.com/v3";

    const res = await fetch(`${API}/forms/${FORM_ID}/subscribe`, {
      method: "post",
      body: JSON.stringify({ email, firstName, lastName, api_key: API_KEY }),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    try {
      const response = await res.json();
      if (response.error) {
        return { error: response.message };
      } else {
        return { success: true };
      }
    } catch (e: any) {
      return { error: e.message };
    }
  }
  return { error: "No CRM or ConvertKit integration configured" };
}

export default {
  validate,
  getContactsInRowIds,
  getContact,
  getContactFormSettings,
  getNewsletterFormSettings,
  getSummary,
  createCompany,
  createContact,
  createSubmission,
  createContactSubmission,
  updateContact,
  subscribeToNewsletter,
};
