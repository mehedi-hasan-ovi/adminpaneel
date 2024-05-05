import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TenantUserJoined } from "~/application/enums/tenants/TenantUserJoined";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { TenantUserStatus } from "~/application/enums/tenants/TenantUserStatus";
import { createLinkedAccount } from "~/utils/db/linkedAccounts.db.server";
import { LinkedAccountStatus } from "~/application/enums/tenants/LinkedAccountStatus";
import { seedRolesAndPermissions } from "../app/utils/services/rolesAndPermissionsService";
import { getAvailableTenantInboundAddress } from "~/utils/services/emailService";
import { getAvailableTenantSlug } from "~/utils/services/tenantService";
const db = new PrismaClient();

async function seed() {
  // await seedBlog();

  const adminEmail = "admin@email.com";
  const adminPassword = "password";
  const admin = await createUser("Admin", "User", adminEmail, adminPassword, TenantUserType.OWNER);
  // await createUser("Demo", "Admin", "guest@admin.com", "password", TenantUserType.MEMBER);
  const user1 = await createUser("John", "Doe", "john.doe@company.com", "password");
  const user2 = await createUser("Luna", "Davis", "luna.davis@company.com", "password");

  // User without tenants
  await createUser("Alex", "Martinez", "alex.martinez@company.com", "password");

  const tenant1 = await createTenant("Acme Corp 1", [
    { ...admin, type: TenantUserType.ADMIN },
    { ...user1, type: TenantUserType.ADMIN },
    { ...user2, type: TenantUserType.MEMBER },
  ]);
  const tenant2 = await createTenant("Acme Corp 2", [
    { ...user1, type: TenantUserType.OWNER },
    { ...user2, type: TenantUserType.MEMBER },
  ]);

  await createLinkedAccount({
    createdByUserId: user1.id,
    createdByTenantId: tenant1.id,
    providerTenantId: tenant1.id,
    clientTenantId: tenant2.id,
    status: LinkedAccountStatus.LINKED,
  });

  // await seedSampleEntities(tenant1And2Relationship, user1);

  await seedCoreEntities();

  // Permissions
  await seedRolesAndPermissions(adminEmail);
}

async function seedCoreEntities() {
  // App Entities
  // TODO: Seed your entities
}

async function createUser(firstName: string, lastName: string, email: string, password: string, adminRole?: TenantUserType) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      avatar: "",
      firstName,
      lastName,
      phone: "",
    },
  });
  if (adminRole !== undefined) {
    await db.adminUser.create({
      data: {
        userId: user.id,
      },
    });
  }
  return user;
}

async function createTenant(name: string, users: { id: string; type: TenantUserType }[]) {
  const slug = await getAvailableTenantSlug({ name });
  const address = await getAvailableTenantInboundAddress(name);
  const tenant = await db.tenant.create({
    data: {
      name,
      slug,
      icon: "",
      inboundAddresses: {
        create: {
          address,
        },
      },
    },
  });

  await db.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      stripeCustomerId: "",
    },
  });

  users.forEach(async (user) => {
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        type: user.type,
        joined: TenantUserJoined.CREATOR,
        status: TenantUserStatus.ACTIVE,
      },
    });
  });

  return tenant;
}

seed();
