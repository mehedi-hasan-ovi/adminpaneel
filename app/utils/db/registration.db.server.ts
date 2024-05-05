import { db } from "../db.server";

export async function getRegistrationByEmail(email: string) {
  return await db.registration.findFirst({
    where: {
      email,
    },
  });
}

export async function getRegistrationByToken(token: string) {
  return await db.registration.findUnique({
    where: {
      token,
    },
  });
}

export async function createRegistration(data: {
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  company: string | null;
  selectedSubscriptionPriceId: string | null;
  ipAddress: string | null;
}) {
  return await db.registration.create({
    data,
  });
}

export async function updateRegistration(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    company?: string | null;
    createdTenantId?: string | null;
    token?: string;
  }
) {
  return await db.registration.update({
    where: { id },
    data,
  });
}
