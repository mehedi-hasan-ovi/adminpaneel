import { DefaultEntityTypes } from "~/application/dtos/shared/DefaultEntityTypes";
import { PropertyAttributeName } from "~/application/enums/entities/PropertyAttributeName";
import { ViewFilterCondition } from "~/application/enums/entities/ViewFilterCondition";
import { Colors } from "~/application/enums/shared/Colors";
import { EntitiesTemplateDto } from "./EntityTemplateDto";

export const SAMPLE_ENTITY_WITH_CUSTOM_FIELDS: EntitiesTemplateDto = {
  entities: [
    {
      type: DefaultEntityTypes.All,
      name: "sampleCustomEntity",
      slug: "sample-custom-entity",
      title: "Sample Custom Entity",
      titlePlural: "Sample Custom Entities",
      prefix: "SCE",
      icon: `<svg stroke="currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">   <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /> </svg>`,
      properties: [
        { name: "dynamicText", title: "Dynamic Text", type: "string", isRequired: true },
        { name: "customText", title: "Custom text", type: "string", isDynamic: false, isRequired: true },
        { name: "customNumber", title: "Custom number", type: "number", isDynamic: false, isRequired: true },
        { name: "customDate", title: "Custom date", type: "date", isDynamic: false, isRequired: true },
        { name: "customBoolean", title: "Custom boolean", type: "boolean", isDynamic: false, isRequired: true },
        { name: "customSelect", title: "Custom select", type: "select", isDynamic: false, isRequired: true },
      ],
    },
  ],
  relationships: [],
};

export const CRM_ENTITIES_TEMPLATE: EntitiesTemplateDto = {
  entities: [
    {
      type: DefaultEntityTypes.AdminOnly,
      name: "company",
      slug: "companies",
      title: "Company",
      titlePlural: "Companies",
      prefix: "CRM-COM",
      icon: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50"> <path d="M 8 2 L 8 6 L 4 6 L 4 48 L 15 48 L 15 39 L 19 39 L 19 48 L 30 48 L 30 6 L 26 6 L 26 2 Z M 10 10 L 12 10 L 12 12 L 10 12 Z M 14 10 L 16 10 L 16 12 L 14 12 Z M 18 10 L 20 10 L 20 12 L 18 12 Z M 22 10 L 24 10 L 24 12 L 22 12 Z M 32 14 L 32 18 L 34 18 L 34 20 L 32 20 L 32 22 L 34 22 L 34 24 L 32 24 L 32 26 L 34 26 L 34 28 L 32 28 L 32 30 L 34 30 L 34 32 L 32 32 L 32 34 L 34 34 L 34 36 L 32 36 L 32 38 L 34 38 L 34 40 L 32 40 L 32 42 L 34 42 L 34 44 L 32 44 L 32 48 L 46 48 L 46 14 Z M 10 15 L 12 15 L 12 19 L 10 19 Z M 14 15 L 16 15 L 16 19 L 14 19 Z M 18 15 L 20 15 L 20 19 L 18 19 Z M 22 15 L 24 15 L 24 19 L 22 19 Z M 36 18 L 38 18 L 38 20 L 36 20 Z M 40 18 L 42 18 L 42 20 L 40 20 Z M 10 21 L 12 21 L 12 25 L 10 25 Z M 14 21 L 16 21 L 16 25 L 14 25 Z M 18 21 L 20 21 L 20 25 L 18 25 Z M 22 21 L 24 21 L 24 25 L 22 25 Z M 36 22 L 38 22 L 38 24 L 36 24 Z M 40 22 L 42 22 L 42 24 L 40 24 Z M 36 26 L 38 26 L 38 28 L 36 28 Z M 40 26 L 42 26 L 42 28 L 40 28 Z M 10 27 L 12 27 L 12 31 L 10 31 Z M 14 27 L 16 27 L 16 31 L 14 31 Z M 18 27 L 20 27 L 20 31 L 18 31 Z M 22 27 L 24 27 L 24 31 L 22 31 Z M 36 30 L 38 30 L 38 32 L 36 32 Z M 40 30 L 42 30 L 42 32 L 40 32 Z M 10 33 L 12 33 L 12 37 L 10 37 Z M 14 33 L 16 33 L 16 37 L 14 37 Z M 18 33 L 20 33 L 20 37 L 18 37 Z M 22 33 L 24 33 L 24 37 L 22 37 Z M 36 34 L 38 34 L 38 36 L 36 36 Z M 40 34 L 42 34 L 42 36 L 40 36 Z M 36 38 L 38 38 L 38 40 L 36 40 Z M 40 38 L 42 38 L 42 40 L 40 40 Z M 10 39 L 12 39 L 12 44 L 10 44 Z M 22 39 L 24 39 L 24 44 L 22 44 Z M 36 42 L 38 42 L 38 44 L 36 44 Z M 40 42 L 42 42 L 42 44 L 40 44 Z"></path> </svg>',
      showInSidebar: false,
      properties: [
        { name: "name", title: "Name", type: "string", isRequired: true, isDisplay: true },
        { name: "address", title: "Address", type: "string" },
        { name: "phone", title: "Phone", type: "string" },
        {
          name: "source",
          title: "Source",
          type: "select",
          options: [
            { value: "email", name: "Email" },
            { value: "website", name: "Website" },
            { value: "social", name: "Social" },
          ],
        },
        { name: "logo", title: "Logo", type: "media" },
      ],
    },
    {
      type: DefaultEntityTypes.AdminOnly,
      name: "opportunity",
      slug: "opportunities",
      title: "Opportunity",
      titlePlural: "Opportunities",
      prefix: "CRM-OPP",
      icon: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 48 48"> <path d="M 24 4 C 12.972066 4 4 12.972074 4 24 C 4 35.027926 12.972066 44 24 44 C 35.027934 44 44 35.027926 44 24 C 44 12.972074 35.027934 4 24 4 z M 23.5 11 C 24.329 11 25 11.671 25 12.5 L 25 13.542969 C 27.267 13.751969 29.208547 15.3345 29.810547 17.5625 C 30.026547 18.3625 29.553906 19.186344 28.753906 19.402344 C 27.949906 19.615344 27.129109 19.144703 26.912109 18.345703 C 26.619109 17.259703 25.627 16.5 24.5 16.5 L 22.75 16.5 C 21.233 16.5 20 17.733 20 19.25 C 20 20.767 21.233 22 22.75 22 L 24.75 22 C 28.196 22 31 24.804 31 28.25 C 31 31.612 28.33 34.354328 25 34.486328 L 25 35.5 C 25 36.329 24.329 37 23.5 37 C 22.671 37 22 36.329 22 35.5 L 22 34.457031 C 19.712 34.247031 17.765734 32.645625 17.177734 30.390625 C 16.968734 29.588625 17.448 28.769547 18.25 28.560547 C 19.055 28.352547 19.871078 28.830813 20.080078 29.632812 C 20.367078 30.732813 21.360047 31.5 22.498047 31.5 L 24.748047 31.5 C 26.540047 31.5 27.998047 30.042 27.998047 28.25 C 27.998047 26.458 26.542 25 24.75 25 L 22.75 25 C 19.58 25 17 22.42 17 19.25 C 17 16.334 19.184 13.923687 22 13.554688 L 22 12.5 C 22 11.671 22.671 11 23.5 11 z"></path> </svg>',
      showInSidebar: false,
      properties: [
        { name: "name", title: "Name", type: "string", isDisplay: true },
        { name: "value", title: "Value", type: "number", isDisplay: true },
        { name: "expectedCloseDate", title: "Expected Close Date", type: "date" },
      ],
      workflow: {
        states: [
          { name: "new", title: "New", color: Colors.YELLOW },
          { name: "qualified", title: "Qualified", color: Colors.INDIGO },
          { name: "won", title: "Won", color: Colors.GREEN },
          { name: "lost", title: "Lost", color: Colors.RED },
        ],
        steps: [
          { from: "new", title: "Qualified", to: "qualified" },
          { from: "new", title: "Won", to: "won" },
          { from: "new", title: "Lost", to: "lost" },
          { from: "qualified", title: "Won", to: "won" },
          { from: "qualified", title: "Lost", to: "lost" },
        ],
      },
      views: [
        {
          layout: "table",
          name: "open",
          title: "Open opportunities",
          isDefault: true,
          properties: ["name", "value", "expectedCloseDate"],
          filters: [
            { match: "or", name: "workflowState", condition: ViewFilterCondition.equals, value: "new" },
            { match: "or", name: "workflowState", condition: ViewFilterCondition.equals, value: "qualified" },
          ],
        },
        {
          layout: "table",
          name: "opportunities",
          title: "Opportunities",
          properties: ["folio", "name", "value", "expectedCloseDate", "createdAt"],
        },
      ],
    },
    {
      type: DefaultEntityTypes.AdminOnly,
      name: "contact",
      slug: "contacts",
      title: "Contact",
      titlePlural: "Contacts",
      prefix: "CRM-CTC",
      icon: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50"> <path d="M 11 4 C 9.347656 4 8 5.347656 8 7 L 8 12 L 7 12 C 6.96875 12 6.9375 12 6.90625 12 C 6.355469 12.027344 5.925781 12.496094 5.953125 13.046875 C 5.980469 13.597656 6.449219 14.027344 7 14 L 11 14 C 11.355469 14.007813 11.6875 13.832031 11.875 13.53125 C 11.953125 13.671875 12 13.828125 12 14 C 12 14.550781 11.550781 15 11 15 L 8 15 L 8 18 L 7 18 C 6.96875 18 6.9375 18 6.90625 18 C 6.355469 18.027344 5.925781 18.496094 5.953125 19.046875 C 5.980469 19.597656 6.449219 20.027344 7 20 L 11 20 C 11.355469 20.007813 11.6875 19.832031 11.875 19.53125 C 11.953125 19.671875 12 19.828125 12 20 C 12 20.550781 11.550781 21 11 21 L 8 21 L 8 24 L 7 24 C 6.96875 24 6.9375 24 6.90625 24 C 6.355469 24.027344 5.925781 24.496094 5.953125 25.046875 C 5.980469 25.597656 6.449219 26.027344 7 26 L 11 26 C 11.355469 26.007813 11.6875 25.832031 11.875 25.53125 C 11.953125 25.671875 12 25.828125 12 26 C 12 26.554688 11.550781 27 11 27 L 8 27 L 8 30 L 7 30 C 6.96875 30 6.9375 30 6.90625 30 C 6.355469 30.027344 5.925781 30.496094 5.953125 31.046875 C 5.980469 31.597656 6.449219 32.027344 7 32 L 11 32 C 11.355469 32.007813 11.6875 31.832031 11.875 31.53125 C 11.953125 31.671875 12 31.828125 12 32 C 12 32.554688 11.550781 33 11 33 L 8 33 L 8 36 L 7 36 C 6.96875 36 6.9375 36 6.90625 36 C 6.355469 36.027344 5.925781 36.496094 5.953125 37.046875 C 5.980469 37.597656 6.449219 38.027344 7 38 L 11 38 C 11.355469 38.007813 11.6875 37.832031 11.875 37.53125 C 11.953125 37.671875 12 37.828125 12 38 C 12 38.554688 11.550781 39 11 39 L 8 39 L 8 43 C 8 44.652344 9.347656 46 11 46 L 39 46 C 40.652344 46 42 44.652344 42 43 L 42 7 C 42 5.347656 40.652344 4 39 4 Z M 26 16 C 30.699219 16 34 19.3125 34 23.8125 C 34 27.8125 31.800781 30.1875 29 30.1875 C 27.800781 30.1875 26.914063 29.5 26.8125 28 L 26.6875 28 C 25.789063 29.5 24.59375 30.1875 23.09375 30.1875 C 21.394531 30.1875 20.09375 28.886719 20.09375 26.6875 C 20.09375 23.386719 22.605469 20.40625 26.40625 20.40625 C 27.605469 20.40625 28.800781 20.699219 29.5 21 L 28.6875 26 C 28.386719 27.800781 28.605469 28.59375 29.40625 28.59375 C 30.707031 28.695313 32.1875 27.007813 32.1875 23.90625 C 32.1875 20.207031 29.886719 17.40625 25.6875 17.40625 C 21.386719 17.40625 17.8125 20.699219 17.8125 26 C 17.8125 30.5 20.6875 33.1875 24.6875 33.1875 C 26.1875 33.1875 27.585938 32.914063 28.6875 32.3125 L 29.1875 33.8125 C 27.585938 34.613281 26.210938 34.8125 24.3125 34.8125 C 19.8125 34.8125 16 31.613281 16 26.3125 C 16 20.8125 19.898438 16 26 16 Z M 26.09375 22.1875 C 23.992188 22.1875 22.40625 24.199219 22.40625 26.5 C 22.40625 27.601563 22.898438 28.3125 24 28.3125 C 25.199219 28.3125 26.488281 26.695313 26.6875 25.09375 L 27.1875 22.40625 C 26.988281 22.304688 26.59375 22.1875 26.09375 22.1875 Z"></path> </svg>',
      showInSidebar: false,
      properties: [
        { name: "firstName", title: "First name", type: "string", isRequired: true, isDisplay: true },
        { name: "lastName", title: "Last name", type: "string", isRequired: true, isDisplay: true },
        { name: "email", title: "Email", type: "string", isRequired: true, isDisplay: true },
        { name: "jobTitle", title: "Job Title", type: "string" },
        {
          name: "status",
          title: "Status",
          type: "select",
          options: [
            { value: "lead", name: "Lead", color: Colors.YELLOW },
            { value: "contact", name: "Contact", color: Colors.GREEN },
            { value: "customer", name: "Customer", color: Colors.INDIGO },
          ],
          attributes: [
            {
              name: PropertyAttributeName.DefaultValue,
              value: "lead",
            },
          ],
        },
        { name: "marketingSubscriber", title: "Marketing subscriber", type: "boolean" },
      ],
    },
    {
      type: DefaultEntityTypes.AdminOnly,
      name: "submission",
      slug: "submissions",
      title: "Submission",
      titlePlural: "Submissions",
      prefix: "CRM-SUB",
      icon: '<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50"> <path d="M 11 4 C 9.347656 4 8 5.347656 8 7 L 8 12 L 7 12 C 6.96875 12 6.9375 12 6.90625 12 C 6.355469 12.027344 5.925781 12.496094 5.953125 13.046875 C 5.980469 13.597656 6.449219 14.027344 7 14 L 11 14 C 11.355469 14.007813 11.6875 13.832031 11.875 13.53125 C 11.953125 13.671875 12 13.828125 12 14 C 12 14.550781 11.550781 15 11 15 L 8 15 L 8 18 L 7 18 C 6.96875 18 6.9375 18 6.90625 18 C 6.355469 18.027344 5.925781 18.496094 5.953125 19.046875 C 5.980469 19.597656 6.449219 20.027344 7 20 L 11 20 C 11.355469 20.007813 11.6875 19.832031 11.875 19.53125 C 11.953125 19.671875 12 19.828125 12 20 C 12 20.550781 11.550781 21 11 21 L 8 21 L 8 24 L 7 24 C 6.96875 24 6.9375 24 6.90625 24 C 6.355469 24.027344 5.925781 24.496094 5.953125 25.046875 C 5.980469 25.597656 6.449219 26.027344 7 26 L 11 26 C 11.355469 26.007813 11.6875 25.832031 11.875 25.53125 C 11.953125 25.671875 12 25.828125 12 26 C 12 26.554688 11.550781 27 11 27 L 8 27 L 8 30 L 7 30 C 6.96875 30 6.9375 30 6.90625 30 C 6.355469 30.027344 5.925781 30.496094 5.953125 31.046875 C 5.980469 31.597656 6.449219 32.027344 7 32 L 11 32 C 11.355469 32.007813 11.6875 31.832031 11.875 31.53125 C 11.953125 31.671875 12 31.828125 12 32 C 12 32.554688 11.550781 33 11 33 L 8 33 L 8 36 L 7 36 C 6.96875 36 6.9375 36 6.90625 36 C 6.355469 36.027344 5.925781 36.496094 5.953125 37.046875 C 5.980469 37.597656 6.449219 38.027344 7 38 L 11 38 C 11.355469 38.007813 11.6875 37.832031 11.875 37.53125 C 11.953125 37.671875 12 37.828125 12 38 C 12 38.554688 11.550781 39 11 39 L 8 39 L 8 43 C 8 44.652344 9.347656 46 11 46 L 39 46 C 40.652344 46 42 44.652344 42 43 L 42 7 C 42 5.347656 40.652344 4 39 4 Z M 26 16 C 30.699219 16 34 19.3125 34 23.8125 C 34 27.8125 31.800781 30.1875 29 30.1875 C 27.800781 30.1875 26.914063 29.5 26.8125 28 L 26.6875 28 C 25.789063 29.5 24.59375 30.1875 23.09375 30.1875 C 21.394531 30.1875 20.09375 28.886719 20.09375 26.6875 C 20.09375 23.386719 22.605469 20.40625 26.40625 20.40625 C 27.605469 20.40625 28.800781 20.699219 29.5 21 L 28.6875 26 C 28.386719 27.800781 28.605469 28.59375 29.40625 28.59375 C 30.707031 28.695313 32.1875 27.007813 32.1875 23.90625 C 32.1875 20.207031 29.886719 17.40625 25.6875 17.40625 C 21.386719 17.40625 17.8125 20.699219 17.8125 26 C 17.8125 30.5 20.6875 33.1875 24.6875 33.1875 C 26.1875 33.1875 27.585938 32.914063 28.6875 32.3125 L 29.1875 33.8125 C 27.585938 34.613281 26.210938 34.8125 24.3125 34.8125 C 19.8125 34.8125 16 31.613281 16 26.3125 C 16 20.8125 19.898438 16 26 16 Z M 26.09375 22.1875 C 23.992188 22.1875 22.40625 24.199219 22.40625 26.5 C 22.40625 27.601563 22.898438 28.3125 24 28.3125 C 25.199219 28.3125 26.488281 26.695313 26.6875 25.09375 L 27.1875 22.40625 C 26.988281 22.304688 26.59375 22.1875 26.09375 22.1875 Z"></path> </svg>',
      showInSidebar: false,
      properties: [
        { name: "users", title: "Users", type: "string" },
        { name: "message", title: "Message", type: "string", isDisplay: true },
      ],
    },
  ],
  relationships: [
    { parent: "company", child: "contact", order: 1, type: "one-to-many", required: false },
    { parent: "company", child: "opportunity", order: 2, type: "one-to-many", required: false },
    { parent: "contact", child: "submission", order: 3, type: "one-to-many", required: false },
  ],
};

export const TENANT_SETTINGS_ENTITIES_TEMPLATE: EntitiesTemplateDto = {
  entities: [
    {
      type: "system",
      name: "tenantSettings",
      slug: "tenant-settings",
      title: "Tenant Settings",
      titlePlural: "Tenant Settings",
      prefix: "TNS",
      properties: [
        {
          name: "website",
          title: "Website",
          type: "string",
          subtype: "url",
          isRequired: true,
          isDisplay: true,
          isReadOnly: false,
          showInCreate: false,
          attributes: [
            {
              name: "Placeholder",
              value: "https://website.co",
            },
          ],
        },
      ],
      isAutogenerated: false,
      hasApi: false,
      active: false,
      hasTags: false,
      hasComments: false,
      hasTasks: false,
      defaultVisibility: "tenant",
      onCreated: "redirectToOverview",
      onEdit: "editRoute",
    },
  ],
  relationships: [],
};

export const EMPLOYEES_ENTITIES_TEMPLATE: EntitiesTemplateDto = {
  entities: [
    {
      type: "app",
      name: "employee",
      slug: "employees",
      title: "Employee",
      titlePlural: "Employees",
      prefix: "EMP",
      properties: [
        {
          name: "firstName",
          title: "models.employee.firstName",
          type: "string",
          isRequired: true,
          isDisplay: true,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "lastName",
          title: "models.employee.lastName",
          type: "string",
          isRequired: true,
          isDisplay: true,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "email",
          title: "models.employee.email",
          type: "string",
          subtype: "email",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "pattern",
              value: "[a-zA-Z0-9._%+-]+@[a-z0-9.-]+.[a-zA-Z]{2,4}",
            },
          ],
        },
        {
          name: "salary",
          title: "Salary",
          type: "number",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "FormatNumber",
              value: "currency",
            },
          ],
        },
        {
          name: "status",
          title: "shared.status",
          type: "select",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          options: [
            {
              value: "Active",
              color: 10,
            },
            {
              value: "On Leave",
              color: 8,
            },
            {
              value: "Dismissed",
              color: 2,
            },
          ],
        },
        {
          name: "photo",
          title: "Photo",
          type: "media",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "Max",
              value: "1",
            },
            {
              name: "AcceptFileTypes",
              value: "image/png, image/gif, image/jpeg",
            },
            {
              name: "MaxSize",
              value: "2",
            },
          ],
        },
        {
          name: "pdf",
          title: "PDF",
          type: "media",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "AcceptFileTypes",
              value: ".pdf",
            },
          ],
        },
      ],
      isAutogenerated: true,
      hasApi: true,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 172 172" fill="currentColor"> <g fill="none" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" // style="mix-blend-mode: normal" > <path d="M0,172v-172h172v172z" fill="none" /> <g fill="currentColor"> <path d="M40.13333,11.46667c-6.33533,0 -11.46667,5.13133 -11.46667,11.46667v126.13333c0,6.33533 5.13133,11.46667 11.46667,11.46667h91.73333c6.33533,0 11.46667,-5.13133 11.46667,-11.46667v-126.13333c0,-6.33533 -5.13133,-11.46667 -11.46667,-11.46667h-28.66667v17.2c0,3.1648 -2.56853,5.73333 -5.73333,5.73333h-22.93333c-3.1648,0 -5.73333,-2.56853 -5.73333,-5.73333v-17.2zM86,11.46667c-3.16643,0 -5.73333,2.5669 -5.73333,5.73333c0,3.16643 2.5669,5.73333 5.73333,5.73333c3.16643,0 5.73333,-2.5669 5.73333,-5.73333c0,-3.16643 -2.5669,-5.73333 -5.73333,-5.73333zM86,57.33333c4.99947,0 7.89453,3.94167 7.89453,3.94167c6.79973,0 10.85078,6.21054 10.85078,14.27734c0,4.0248 -2.22839,8.24167 -2.22839,8.24167c0,0 1.24297,0.42221 1.24297,3.19141c0,3.99613 -3.2362,6.22604 -3.2362,6.22604c-0.344,3.05014 -4.04146,7.15888 -5.75573,8.92474v9.24948c5.39507,7.66547 25.63203,4.06073 25.63203,20.48099h-68.8c0,-16.42027 20.23696,-12.81006 25.63203,-20.46979v-9.24948c-1.71427,-1.76587 -5.40599,-5.88581 -5.75573,-8.93594c0,0 -3.2362,-1.20364 -3.2362,-6.22604c0,-2.58573 1.24297,-3.19141 1.24297,-3.19141c0,0 -2.7211,-3.77226 -2.7211,-8.6112c0,-11.4552 8.61416,-17.84948 19.23802,-17.84948z" /> </g> </g> </svg>',
      active: true,
      hasTags: true,
      hasComments: true,
      hasTasks: false,
    },
  ],
  relationships: [],
};

export const CONTRACTS_ENTITIES_TEMPLATE: EntitiesTemplateDto = {
  entities: [
    {
      type: "app",
      name: "contract",
      slug: "contracts",
      title: "Contract",
      titlePlural: "Contracts",
      prefix: "CON",
      properties: [
        {
          name: "name",
          title: "Name",
          type: "string",
          isRequired: true,
          isDisplay: true,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "type",
          title: "Type",
          type: "select",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "DefaultValue",
              value: "typeB",
            },
          ],
          options: [
            {
              value: "typeA",
              name: "Type A",
              color: 15,
            },
            {
              value: "typeB",
              name: "Type B",
              color: 5,
            },
          ],
        },
        {
          name: "description",
          title: "Description",
          type: "string",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "Rows",
              value: "3",
            },
          ],
        },
        {
          name: "document",
          title: "Document",
          type: "media",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "Min",
              value: "1",
            },
            {
              name: "Max",
              value: "1",
            },
            {
              name: "AcceptFileTypes",
              value: ".pdf",
            },
            {
              name: "MaxSize",
              value: "20",
            },
          ],
        },
        {
          name: "documentSigned",
          title: "Document Signed",
          type: "media",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: false,
          attributes: [
            {
              name: "AcceptFileTypes",
              value: ".pdf",
            },
            {
              name: "Max",
              value: "1",
            },
            {
              name: "MaxSize",
              value: "20",
            },
          ],
        },
        {
          name: "attachments",
          title: "Attachments",
          type: "media",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "estimatedAmount",
          title: "Estimated Amount",
          type: "number",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "FormatNumber",
              value: "decimal",
            },
          ],
        },
        {
          name: "realAmount",
          title: "Real amount",
          type: "number",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: false,
          attributes: [
            {
              name: "FormatNumber",
              value: "currency",
            },
          ],
        },
        {
          name: "active",
          title: "Active",
          type: "boolean",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "FormatBoolean",
              value: "activeInactive",
            },
          ],
        },
        {
          name: "estimatedCompletionDate",
          title: "Estimated Completion Date",
          type: "date",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "FormatDate",
              value: "diff",
            },
          ],
        },
        {
          name: "realCompletionDate",
          title: "Real Completion Date",
          type: "date",
          isRequired: false,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: false,
          attributes: [
            {
              name: "FormatDate",
              value: "YYYY-MM-DD",
            },
          ],
        },
      ],
      isAutogenerated: true,
      hasApi: true,
      icon: '<svg stroke="currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">   <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /> </svg>',
      active: true,
      hasTags: true,
      hasComments: true,
      hasTasks: true,
      workflow: {
        states: [
          {
            name: "draft",
            title: "Draft",
            color: 2,
          },
          {
            name: "pending",
            title: "Pending",
            color: 8,
            canDelete: false,
          },
          {
            name: "signed",
            title: "Signed",
            color: 10,
            canDelete: false,
          },
          {
            name: "archived",
            title: "Archived",
            color: 2,
            canUpdate: false,
          },
        ],
        steps: [
          {
            from: "draft",
            to: "pending",
            title: "Submit",
          },
          {
            from: "pending",
            to: "archived",
            title: "Archive",
          },
          {
            from: "pending",
            to: "signed",
            title: "Signed",
          },
        ],
      },
    },
  ],
  relationships: [],
};

export const ALL_PROPERTY_TYPES_ENTITY_TEMPLATE: EntitiesTemplateDto = {
  entities: [
    {
      type: "app",
      name: "allPropertyTypesEntity",
      slug: "all-property-types-entity",
      title: "All Property Types Entity",
      titlePlural: "All Property Types Entity",
      prefix: "ALL",
      properties: [
        {
          name: "textSingleLine",
          title: "Text (Single-line)",
          type: "string",
          subtype: "singleLine",
          isRequired: true,
          isDisplay: true,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "textEmail",
          title: "Text (Email)",
          type: "string",
          subtype: "email",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "textPhone",
          title: "Text (Phone)",
          type: "string",
          subtype: "phone",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "textUrl",
          title: "Text (URL)",
          type: "string",
          subtype: "url",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "number",
          title: "Number",
          type: "number",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "date",
          title: "Date",
          type: "date",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "singleSelectDropdown",
          title: "Single Select (Dropdown)",
          type: "select",
          subtype: "dropdown",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          options: [
            {
              value: "Option 1",
              color: 0,
            },
            {
              value: "Option 2",
              color: 0,
            },
            {
              value: "Option 3",
              color: 0,
            },
          ],
        },
        {
          name: "singleSelectRadioGroupCards",
          title: "Single Select (Radio Group Cards)",
          type: "select",
          subtype: "radioGroupCards",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          options: [
            {
              value: "Option 1",
              color: 0,
            },
            {
              value: "Option 2",
              color: 0,
            },
            {
              value: "Option 3",
              color: 0,
            },
          ],
        },
        {
          name: "boolean",
          title: "Boolean",
          type: "boolean",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "media",
          title: "Media",
          type: "media",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "multiSelectCombobox",
          title: "Multi Select (Combobox)",
          type: "multiSelect",
          subtype: "combobox",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          options: [
            {
              value: "Option 1",
              color: 0,
            },
            {
              value: "Option 2",
              color: 0,
            },
            {
              value: "Option 3",
              color: 0,
            },
          ],
        },
        {
          name: "multiSelectCheckboxCards",
          title: "Multi Select (Checkbox Cards)",
          type: "multiSelect",
          subtype: "checkboxCards",
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          options: [
            {
              value: "Option 1",
              color: 0,
            },
            {
              value: "Option 2",
              color: 0,
            },
            {
              value: "Option 3",
              color: 0,
            },
          ],
        },
        {
          name: "numberRange",
          title: "Number Range",
          type: "rangeNumber",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "dateRange",
          title: "Date Range",
          type: "rangeDate",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
        },
        {
          name: "multiText",
          title: "Multi Text",
          type: "multiText",
          subtype: null,
          isRequired: true,
          isDisplay: false,
          isReadOnly: false,
          showInCreate: true,
          attributes: [
            {
              name: "Separator",
              value: ",",
            },
          ],
        },
      ],
      isAutogenerated: true,
      hasApi: true,
      icon: '<svg stroke="currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">   <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /> </svg>',
      active: true,
      hasTags: true,
      hasComments: true,
      hasTasks: true,
      defaultVisibility: "tenant",
      onCreated: "redirectToOverview",
      onEdit: "editRoute",
      workflow: {
        states: [
          {
            name: "pending",
            title: "Pending",
            color: 8,
          },
          {
            name: "completed",
            title: "Completed",
            color: 10,
            canUpdate: false,
            canDelete: false,
          },
          {
            name: "cancelled",
            title: "Cancelled",
            color: 5,
            canUpdate: false,
            canDelete: false,
          },
        ],
        steps: [
          {
            from: "completed",
            to: "pending",
            title: "Recall",
          },
          {
            from: "pending",
            to: "completed",
            title: "Done",
          },
          {
            from: "pending",
            to: "cancelled",
            title: "Cancel",
          },
        ],
      },
    },
  ],
  relationships: [],
};

export const BOOKS_AND_AUTHORS_ENTITY_TEMPLATE: EntitiesTemplateDto = {
  entities: [],
  relationships: [],
};
