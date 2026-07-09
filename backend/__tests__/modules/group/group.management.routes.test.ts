import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { groupRouter } from "../../../src/modules/group/group.routes";
import { createTestUser } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { groups, groupMembers, invitations, notifications } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(groupRouter);
  return app;
};

const createTestGroup = async (
  adminId: string,
  overrides: Partial<{
    members: string[];
    walletBalance: number;
    walletCurrency: string;
    groupName: string;
    description: string;
  }> = {}
) => {
  const [g] = await getDb()
    .insert(groups)
    .values({
      adminId,
      groupName: overrides.groupName ?? "Test Group",
      description: overrides.description,
      walletBalance: String(overrides.walletBalance ?? 0),
      walletCurrency: overrides.walletCurrency ?? "AUD",
    })
    .returning();
  const members = overrides.members ?? [adminId];
  await getDb()
    .insert(groupMembers)
    .values(members.map((userId) => ({ groupId: g.id, userId })))
    .onConflictDoNothing();
  return { ...g, _id: g.id };
};

const memberIds = async (groupId: string) => {
  const rows = await getDb()
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));
  return rows.map((r) => r.userId);
};
const groupIdsOfUser = async (userId: string) => {
  const rows = await getDb()
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  return rows.map((r) => r.groupId);
};
const adminOf = async (groupId: string) => {
  const [g] = await getDb().select().from(groups).where(eq(groups.id, groupId));
  return g?.adminId;
};

describe("POST /groups/create", () => {
  it("creates a group, adds the creator as admin/member, and links it to the user", async () => {
    const admin = await createTestUser({ email: "creator@test.com" });

    const res = await request(makeApp()).post("/groups/create").send({
      groupName: "Roomies",
      description: "Shared rent",
      userId: admin.id,
      currency: "AUD",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("groupId");

    const [group] = await getDb().select().from(groups).where(eq(groups.id, res.body.groupId));
    expect(group.groupName).toBe("Roomies");
    expect(group.adminId).toBe(admin.id);
    expect(await memberIds(group.id)).toEqual([admin.id]);
    expect(await groupIdsOfUser(admin.id)).toContain(res.body.groupId);
  });

  it("returns 404 when the creator does not exist", async () => {
    const res = await request(makeApp()).post("/groups/create").send({
      groupName: "Roomies",
      description: "Shared rent",
      userId: randomUUID(),
      currency: "AUD",
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "User user not found" });
  });
});

describe("GET /groups/:groupId and GET /groups/batch (route ordering)", () => {
  let admin: TestUser;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    admin = await createTestUser({ email: "detail-admin@test.com" });
    group = await createTestGroup(admin.id, {
      groupName: "Detail Group",
      walletBalance: 250,
    });
  });

  it("GET /groups/batch is not shadowed by /groups/:groupId and returns raw group docs", async () => {
    const res = await request(makeApp())
      .get("/groups/batch")
      .query({ userId: admin.id });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(group.id);
    expect(res.body[0].groupName).toBe("Detail Group");
    expect(res.body[0].createdAt).toBeDefined();
  });

  it("GET /groups/:groupId returns raw member/admin/transactionHistory docs", async () => {
    const res = await request(makeApp()).get(`/groups/${group.id}`);

    expect(res.status).toBe(200);
    expect(res.body.groupName).toBe("Detail Group");
    expect(Number(res.body.walletBalance)).toBe(250);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0]._id).toBe(admin.id);
    expect(res.body.admin._id).toBe(admin.id);
    expect(res.body.transactionHistory).toEqual([]);
  });

  it("GET /groups/:groupId returns 404 when the group does not exist", async () => {
    const res = await request(makeApp()).get(`/groups/${randomUUID()}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "group not found" });
  });
});

describe("GET /groups/member", () => {
  it("returns the flattened member list (id/name/email/role)", async () => {
    const admin = await createTestUser({
      email: "member-admin@test.com",
      firstName: "Ada",
      lastName: "Admin",
    });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp())
      .get("/groups/member")
      .query({ groupId: group.id });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: admin.id,
        name: "Ada Admin",
        email: "member-admin@test.com",
        role: "Admin",
      },
    ]);
  });
});

describe("PUT /groups/leave", () => {
  it("removes the actor from the group and reassigns admin", async () => {
    const admin = await createTestUser({ email: "leave-admin@test.com" });
    const other = await createTestUser({ email: "leave-other@test.com" });
    const group = await createTestGroup(admin.id, {
      members: [admin.id, other.id],
    });

    const res = await request(makeApp())
      .put("/groups/leave")
      .query({ groupId: group.id, userId: admin.id });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Successfully Left Group" });

    expect(await memberIds(group.id)).toEqual([other.id]);
    expect(await adminOf(group.id)).toBe(other.id);
  });

  it("returns 404 when the sole member tries to leave with a non-zero balance", async () => {
    const admin = await createTestUser({ email: "solo-admin@test.com" });
    const group = await createTestGroup(admin.id, { walletBalance: 100 });

    const res = await request(makeApp())
      .put("/groups/leave")
      .query({ groupId: group.id, userId: admin.id });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      errorMsg: "You Are The Only Member Left And Wallet Balance Is Not Empty",
    });
  });
});

describe("PUT /groups/invite/:groupId/:targetId/:creatorId and /groups/remove/...", () => {
  it("invites a target member, creating a pending Invitation", async () => {
    const admin = await createTestUser({
      email: "invite-admin@test.com",
      firstName: "Ada",
      lastName: "Admin",
    });
    const target = await createTestUser({
      email: "invite-target@test.com",
      firstName: "Tim",
      lastName: "Target",
    });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp()).put(
      `/groups/invite/${group.id}/${target.id}/${admin.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Group updated" });

    const invites = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.receiver, target.id));
    expect(invites).toHaveLength(1);
    expect(invites[0].senderName).toBe("Ada Admin");
    expect(invites[0].receiverName).toBe("Tim Target");

    // pendingInvite derives from invitations.groupId; user.invitation from receiver.
    const groupInvites = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.groupId, group.id));
    expect(groupInvites.map((i) => i.id)).toContain(invites[0].id);

    const notes = await getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.receiver, target.id));
    expect(notes).toHaveLength(1);
  });

  it("returns 400 when the actor is not the group admin", async () => {
    const admin = await createTestUser({ email: "not-admin-1@test.com" });
    const nonAdmin = await createTestUser({ email: "not-admin-2@test.com" });
    const target = await createTestUser({ email: "not-admin-3@test.com" });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp()).put(
      `/groups/invite/${group.id}/${target.id}/${nonAdmin.id}`
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "User is not the admin" });
  });

  it("removes a member from the group", async () => {
    const admin = await createTestUser({ email: "remove-admin@test.com" });
    const member = await createTestUser({ email: "remove-member@test.com" });
    const group = await createTestGroup(admin.id, {
      members: [admin.id, member.id],
    });

    const res = await request(makeApp()).put(
      `/groups/remove/${group.id}/${member.id}/${admin.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Group updated" });

    expect(await memberIds(group.id)).not.toContain(member.id);
    expect(await groupIdsOfUser(member.id)).not.toContain(group.id);
  });
});

describe("PUT /invitation/process/:invitationId/:mode", () => {
  it("accept: adds the member to the group and deletes the invitation", async () => {
    const admin = await createTestUser({ email: "process-admin@test.com" });
    const invitee = await createTestUser({ email: "process-invitee@test.com" });
    const group = await createTestGroup(admin.id);

    const [invitation] = await getDb()
      .insert(invitations)
      .values({
        groupName: group.groupName,
        groupId: group.id,
        sender: admin.id,
        receiver: invitee.id,
        senderName: "Admin Name",
        receiverName: "Invitee Name",
      })
      .returning();

    const res = await request(makeApp()).put(
      `/invitation/process/${invitation.id}/accept`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invitation Processed" });

    expect(await memberIds(group.id)).toContain(invitee.id);
    expect(await groupIdsOfUser(invitee.id)).toContain(group.id);

    const remainingInvites = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.groupId, group.id));
    expect(remainingInvites).toHaveLength(0);

    const inviteeInvites = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.receiver, invitee.id));
    expect(inviteeInvites).toHaveLength(0);

    const [gone] = await getDb().select().from(invitations).where(eq(invitations.id, invitation.id));
    expect(gone).toBeUndefined();
  });

  it("returns 404 when the invitation does not exist", async () => {
    const res = await request(makeApp()).put(
      `/invitation/process/${randomUUID()}/accept`
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "invitation not found" });
  });
});

describe("GET /groups/invitation/pending and GET /invitation/batch", () => {
  it("return raw Invitation docs (asserts _id, not flattened)", async () => {
    const admin = await createTestUser({ email: "pending-admin@test.com" });
    const invitee = await createTestUser({ email: "pending-invitee@test.com" });
    const group = await createTestGroup(admin.id);

    const [invitation] = await getDb()
      .insert(invitations)
      .values({
        groupName: group.groupName,
        groupId: group.id,
        sender: admin.id,
        receiver: invitee.id,
        senderName: "Admin Name",
        receiverName: "Invitee Name",
      })
      .returning();

    const pendingRes = await request(makeApp())
      .get("/groups/invitation/pending")
      .query({ groupId: group.id });

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0]._id).toBe(invitation.id);
    expect(pendingRes.body[0].createdAt).toBeDefined();

    const batchRes = await request(makeApp())
      .get("/invitation/batch")
      .query({ userId: invitee.id });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body).toHaveLength(1);
    expect(batchRes.body[0]._id).toBe(invitation.id);
  });
});

describe("GET /find/invitee/:email/:userId/:groupId", () => {
  it("returns the recipient's userId when the actor is the group admin", async () => {
    const admin = await createTestUser({ email: "findinvitee-admin@test.com" });
    const recipient = await createTestUser({
      email: "findinvitee-recipient@test.com",
    });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp()).get(
      `/find/invitee/${encodeURIComponent(recipient.email)}/${admin.id}/${group.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toBe(recipient.id);
  });

  it("returns 404 when the recipient email does not exist", async () => {
    const admin = await createTestUser({ email: "findinvitee-admin2@test.com" });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp()).get(
      `/find/invitee/nobody@test.com/${admin.id}/${group.id}`
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "Recipient not found." });
  });

  it("returns 400 when the actor is not the group admin", async () => {
    const admin = await createTestUser({ email: "findinvitee-admin3@test.com" });
    const nonAdmin = await createTestUser({ email: "findinvitee-nonadmin@test.com" });
    const recipient = await createTestUser({
      email: "findinvitee-recipient2@test.com",
    });
    const group = await createTestGroup(admin.id);

    const res = await request(makeApp()).get(
      `/find/invitee/${encodeURIComponent(recipient.email)}/${nonAdmin.id}/${group.id}`
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "You Need To Be An Admin To Invite" });
  });
});
