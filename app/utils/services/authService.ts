import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { i18nHelper } from "~/locale/i18n.utils";
import UserUtils from "../app/UserUtils";
import { getAppConfiguration } from "../db/appConfiguration.db.server";
import { getAllRoles } from "../db/permissions/roles.db.server";
import { createTenant, createTenantUser } from "../db/tenants.db.server";
import { getUserByEmail, register } from "../db/users.db.server";
import { sendEmail } from "../email.server";
import { createStripeCustomer } from "../stripe.server";
import { createAccountCreatedEvent } from "./events/accountsEventsService";
import crypto from "crypto";
import { createRegistration, getRegistrationByEmail, updateRegistration } from "../db/registration.db.server";
import { getClientIPAddress } from "~/utils/server/IpUtils";
import { addBlacklistAttempt, findInBlacklist } from "../db/blacklist.db.server";
import { baseURL } from "../url.server";
import { getUserInfo } from "../session.server";
import { TenantTypesApi } from "../api/TenantTypesApi";

export type RegistrationData = { email?: string; password?: string; company?: string; firstName?: string; lastName?: string; avatarURL?: string };

export async function getRegistrationFormData(request: Request): Promise<RegistrationData> {
  const formData = await request.formData();
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();
  const company = formData.get("company")?.toString();
  const firstName = formData.get("first-name")?.toString();
  const lastName = formData.get("last-name")?.toString();

  return { email, password, company, firstName, lastName };
}

export async function validateRegistration(
  request: Request,
  registrationData: RegistrationData,
  checkEmailVerification: boolean = true,
  stripeCustomerId?: string,
  githubId?: string,
  googleId?: string
) {
  let { t } = await i18nHelper(request);
  const userInfo = await getUserInfo(request);
  const { auth } = await getAppConfiguration();
  const { email, password, company, firstName, lastName, avatarURL } = registrationData;
  if (!email || !UserUtils.validateEmail(email)) {
    throw Error(t("account.register.errors.invalidEmail"));
  }
  if (!githubId && !googleId) {
    if (!auth.requireEmailVerification && !UserUtils.validatePassword(password)) {
      throw Error(t("account.register.errors.passwordRequired"));
    } else if (auth.requireOrganization && typeof company !== "string") {
      throw Error(t("account.register.errors.organizationRequired"));
    } else if (auth.requireName && (typeof firstName !== "string" || typeof lastName !== "string")) {
      throw Error(t("account.register.errors.nameRequired"));
    }
  }

  if (company && company.length > 100) {
    throw Error("Maximum length for company name is 100 characters");
  } else if (firstName && firstName.length > 50) {
    throw Error("Maximum length for first name is 50 characters");
  } else if (lastName && lastName.length > 50) {
    throw Error("Maximum length for last name is 50 characters");
  }

  const ipAddress = getClientIPAddress(request.headers)?.toString() ?? "";
  // eslint-disable-next-line no-console
  console.log("[REGISTRATION ATTEMPT]", { email, domain: email.substring(email.lastIndexOf("@") + 1), ipAddress });

  const blacklistedEmail = await findInBlacklist("email", email);
  if (blacklistedEmail) {
    await addBlacklistAttempt(blacklistedEmail);
    throw Error(t("account.register.errors.blacklist.email"));
  }
  const blacklistedDomain = await findInBlacklist("domain", email.substring(email.lastIndexOf("@") + 1));
  if (blacklistedDomain) {
    await addBlacklistAttempt(blacklistedDomain);
    throw Error(t("account.register.errors.blacklist.domain"));
  }
  const blacklistedIp = await findInBlacklist("ip", ipAddress);
  if (blacklistedIp) {
    await addBlacklistAttempt(blacklistedIp);
    throw Error(t("account.register.errors.blacklist.ip"));
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw Error(t("api.errors.userAlreadyRegistered"));
  }

  if (checkEmailVerification && auth.requireEmailVerification) {
    return { email, ipAddress, verificationRequired: true };
  }
  const locale = userInfo.lng;
  const registered = await createUserAndTenant({ email, password, company, firstName, lastName, stripeCustomerId, githubId, googleId, avatarURL, locale });
  return { email, ipAddress, verificationRequired: false, registered };
}

interface CreateRegistrationFormDto {
  email: string;
  ipAddress: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  recreateToken?: boolean;
}
export async function createRegistrationForm({ email, company, firstName, lastName, ipAddress, recreateToken }: CreateRegistrationFormDto) {
  const registration = await getRegistrationByEmail(email);
  if (registration) {
    if (registration.createdTenantId) {
      throw Error("api.errors.userAlreadyRegistered");
    } else {
      if (recreateToken) {
        const newToken = crypto.randomBytes(20).toString("hex");
        await updateRegistration(registration.id, {
          firstName,
          lastName,
          company,
          token: newToken,
        });
        await sendEmail(email, "email-verification", {
          action_url: baseURL + `/verify/` + newToken,
          email: email,
          first_name: firstName ?? "",
          last_name: lastName ?? "",
          company,
        });
      }
    }
  } else {
    var token = crypto.randomBytes(20).toString("hex");
    await createRegistration({
      email,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      company: company ?? "",
      token,
      selectedSubscriptionPriceId: null,
      ipAddress,
    });
    await sendEmail(email, "email-verification", {
      action_url: baseURL + `/verify/` + token,
      first_name: firstName,
      last_name: lastName,
      email,
      company,
    });
  }
}

interface CreateUserAndTenantDto {
  email: string;
  password?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  stripeCustomerId?: string;
  githubId?: string;
  googleId?: string;
  avatarURL?: string;
  locale?: string;
}
export async function createUserAndTenant({
  email,
  password,
  company,
  firstName,
  lastName,
  stripeCustomerId,
  githubId,
  googleId,
  avatarURL,
  locale,
}: CreateUserAndTenantDto) {
  let tenantName = company ?? email.split("@")[0];
  if (!stripeCustomerId && process.env.STRIPE_SK) {
    const stripeCustomer = await createStripeCustomer(email, tenantName);
    if (!stripeCustomer) {
      throw Error("Could not create Stripe customer");
    }
    stripeCustomerId = stripeCustomer.id;
  }
  const user = await register({
    email: email,
    password: password ?? "",
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    githubId,
    googleId,
    avatarURL,
    locale,
  });
  if (!user) {
    throw Error("Could not create user");
  }
  const tenant = await createTenant({ name: tenantName, subscriptionCustomerId: stripeCustomerId });
  if (!tenant) {
    throw Error("Could not create tenant");
  }
  const roles = await getAllRoles("app");
  await createTenantUser(
    {
      tenantId: tenant.id,
      userId: user.id,
      type: TenantUserType.OWNER,
    },
    roles
  );
  await TenantTypesApi.setTenantTypes({ tenantId: tenant.id });

  await sendEmail(email, "welcome", {
    action_url: baseURL + `/login`,
    name: firstName,
  });

  await createAccountCreatedEvent(tenant.id, {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    user: { id: user.id, email: user.email },
  });

  return { user, tenant };
}
