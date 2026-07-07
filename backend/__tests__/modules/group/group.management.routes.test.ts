import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { groupRouter } from "../../../src/modules/group/group.routes";
import { createTestUser } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import User from "../../../model/User";
import Groups from "../../../model/Groups";
import Invitation from "../../../model/Invitation";
import Notification from "../../../model/Notification";

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
    pendingInvite: string[];
  }> = {}
) => {
  return Groups.create({
    admin: adminId,
    members: overrides.members ?? [adminId],
    groupName: overrides.groupName ?? "Test Group",
    description: overrides.description,
    walletBalance: overrides.walletBalance ?? 0,
    walletCurrency: overrides.walletCurrency ?? "AUD",
    pendingInvite: overrides.pendingInvite ?? [],
    transactionHistory: [],
  });
};

describe("POST /groups/create", () => {
  it("creates a group, adds the creator as admin/member, and links it to the user", async () => {
    const admin = await createTestUser({ email: "creator@test.com" });

    const res = await request(makeApp()).post("/groups/create").send({
      groupName: "Roomies",
      description: "Shared rent",
      userId: admin._id.toString(),
      currency: "AUD",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("groupId");

    const group = await Groups.findById(res.body.groupId);
    expect(group?.groupName).toBe("Roomies");
    expect(group?.admin.toString()).toBe(admin._id.toString());
    expect(group?.members.map((m) => m.toString())).toEqual([
      admin._id.toString(),
    ]);

    const updatedUser = await User.findById(admin._id);
    expect(
      updatedUser?.groups.map((g) => g.toString())
    ).toContain(res.body.groupId);
  });

  it("returns 404 when the creator does not exist", async () => {
    const res = await request(makeApp()).post("/groups/create").send({
      groupName: "Roomies",
      description: "Shared rent",
      userId: new mongoose.Types.ObjectId().toString(),
      currency: "AUD",
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "User user not found" });
  });
});

describe("GET /groups/:groupId and GET /groups/batch (route ordering)", () => {
  let admin: UserType;
  let group: Awaited<ReturnType<typeof createTestGroup>>;

  beforeEach(async () => {
    admin = await createTestUser({ email: "detail-admin@test.com" });
    group = await createTestGroup(admin._id.toString(), {
      groupName: "Detail Group",
      walletBalance: 250,
    });
    admin.groups.push(group._id);
    await admin.save();
  });

  it("GET /groups/batch is not shadowed by /groups/:groupId and returns raw group docs", async () => {
    const res = await request(makeApp())
      .get("/groups/batch")
      .query({ userId: admin._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(group._id.toString());
    expect(res.body[0].groupName).toBe("Detail Group");
    expect(res.body[0].createdAt).toBeDefined();
  });

  it("GET /groups/:groupId returns raw member/admin/transactionHistory docs", async () => {
    const res = await request(makeApp()).get(`/groups/${group._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.groupName).toBe("Detail Group");
    expect(res.body.walletBalance).toBe(250);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0]._id).toBe(admin._id.toString());
    expect(res.body.admin._id).toBe(admin._id.toString());
    expect(res.body.transactionHistory).toEqual([]);
  });

  it("GET /groups/:groupId returns 404 when the group does not exist", async () => {
    const res = await request(makeApp()).get(
      `/groups/${new mongoose.Types.ObjectId().toString()}`
    );

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
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp())
      .get("/groups/member")
      .query({ groupId: group._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: admin._id.toString(),
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
    const group = await createTestGroup(admin._id.toString(), {
      members: [admin._id.toString(), other._id.toString()],
    });
    admin.groups.push(group._id);
    await admin.save();

    const res = await request(makeApp())
      .put("/groups/leave")
      .query({ groupId: group._id.toString(), userId: admin._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Successfully Left Group" });

    const updatedGroup = await Groups.findById(group._id);
    expect(updatedGroup?.members.map((m) => m.toString())).toEqual([
      other._id.toString(),
    ]);
    expect(updatedGroup?.admin.toString()).toBe(other._id.toString());
  });

  it("returns 404 when the sole member tries to leave with a non-zero balance", async () => {
    const admin = await createTestUser({ email: "solo-admin@test.com" });
    const group = await createTestGroup(admin._id.toString(), {
      walletBalance: 100,
    });

    const res = await request(makeApp())
      .put("/groups/leave")
      .query({ groupId: group._id.toString(), userId: admin._id.toString() });

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
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp()).put(
      `/groups/invite/${group._id.toString()}/${target._id.toString()}/${admin._id.toString()}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Group updated" });

    const invitations = await Invitation.find({ receiver: target._id });
    expect(invitations).toHaveLength(1);
    expect(invitations[0].senderName).toBe("Ada Admin");
    expect(invitations[0].receiverName).toBe("Tim Target");

    const updatedGroup = await Groups.findById(group._id);
    expect(
      updatedGroup?.pendingInvite.map((i) => i.toString())
    ).toContain(invitations[0]._id.toString());

    const updatedTarget = await User.findById(target._id);
    expect(
      updatedTarget?.invitation.map((i) => i.toString())
    ).toContain(invitations[0]._id.toString());

    const notifications = await Notification.find({ receiver: target._id });
    expect(notifications).toHaveLength(1);
  });

  it("returns 400 when the actor is not the group admin", async () => {
    const admin = await createTestUser({ email: "not-admin-1@test.com" });
    const nonAdmin = await createTestUser({ email: "not-admin-2@test.com" });
    const target = await createTestUser({ email: "not-admin-3@test.com" });
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp()).put(
      `/groups/invite/${group._id.toString()}/${target._id.toString()}/${nonAdmin._id.toString()}`
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "User is not the admin" });
  });

  it("removes a member from the group", async () => {
    const admin = await createTestUser({ email: "remove-admin@test.com" });
    const member = await createTestUser({ email: "remove-member@test.com" });
    const group = await createTestGroup(admin._id.toString(), {
      members: [admin._id.toString(), member._id.toString()],
    });
    member.groups.push(group._id);
    await member.save();

    const res = await request(makeApp()).put(
      `/groups/remove/${group._id.toString()}/${member._id.toString()}/${admin._id.toString()}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Group updated" });

    const updatedGroup = await Groups.findById(group._id);
    expect(
      updatedGroup?.members.map((m) => m.toString())
    ).not.toContain(member._id.toString());

    const updatedMember = await User.findById(member._id);
    expect(
      updatedMember?.groups.map((g) => g.toString())
    ).not.toContain(group._id.toString());
  });
});

describe("PUT /invitation/process/:invitationId/:mode", () => {
  it("accept: adds the member to the group and deletes the invitation", async () => {
    const admin = await createTestUser({ email: "process-admin@test.com" });
    const invitee = await createTestUser({ email: "process-invitee@test.com" });
    const group = await createTestGroup(admin._id.toString());

    const invitation = await Invitation.create({
      groupName: group.groupName,
      groupId: group._id,
      sender: admin._id,
      receiver: invitee._id,
      senderName: "Admin Name",
      receiverName: "Invitee Name",
    });
    group.pendingInvite.push(invitation._id);
    await group.save();
    invitee.invitation.push(invitation._id);
    await invitee.save();

    const res = await request(makeApp()).put(
      `/invitation/process/${invitation._id.toString()}/accept`
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Invitation Processed" });

    const updatedGroup = await Groups.findById(group._id);
    expect(
      updatedGroup?.members.map((m) => m.toString())
    ).toContain(invitee._id.toString());
    expect(updatedGroup?.pendingInvite).toHaveLength(0);

    const updatedInvitee = await User.findById(invitee._id);
    expect(
      updatedInvitee?.groups.map((g) => g.toString())
    ).toContain(group._id.toString());
    expect(updatedInvitee?.invitation).toHaveLength(0);

    expect(await Invitation.findById(invitation._id)).toBeNull();
  });

  it("returns 404 when the invitation does not exist", async () => {
    const res = await request(makeApp()).put(
      `/invitation/process/${new mongoose.Types.ObjectId().toString()}/accept`
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMsg: "invitation not found" });
  });
});

describe("GET /groups/invitation/pending and GET /invitation/batch", () => {
  it("return raw Invitation docs (asserts _id, not flattened)", async () => {
    const admin = await createTestUser({ email: "pending-admin@test.com" });
    const invitee = await createTestUser({ email: "pending-invitee@test.com" });
    const group = await createTestGroup(admin._id.toString());

    const invitation = await Invitation.create({
      groupName: group.groupName,
      groupId: group._id,
      sender: admin._id,
      receiver: invitee._id,
      senderName: "Admin Name",
      receiverName: "Invitee Name",
    });
    group.pendingInvite.push(invitation._id);
    await group.save();
    invitee.invitation.push(invitation._id);
    await invitee.save();

    const pendingRes = await request(makeApp())
      .get("/groups/invitation/pending")
      .query({ groupId: group._id.toString() });

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0]._id).toBe(invitation._id.toString());
    expect(pendingRes.body[0].createdAt).toBeDefined();

    const batchRes = await request(makeApp())
      .get("/invitation/batch")
      .query({ userId: invitee._id.toString() });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body).toHaveLength(1);
    expect(batchRes.body[0]._id).toBe(invitation._id.toString());
  });
});

describe("GET /find/invitee/:email/:userId/:groupId", () => {
  it("returns the recipient's userId when the actor is the group admin", async () => {
    const admin = await createTestUser({ email: "findinvitee-admin@test.com" });
    const recipient = await createTestUser({
      email: "findinvitee-recipient@test.com",
    });
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp()).get(
      `/find/invitee/${encodeURIComponent(recipient.email)}/${admin._id.toString()}/${group._id.toString()}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toBe(recipient._id.toString());
  });

  it("returns 404 when the recipient email does not exist", async () => {
    const admin = await createTestUser({ email: "findinvitee-admin2@test.com" });
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp()).get(
      `/find/invitee/nobody@test.com/${admin._id.toString()}/${group._id.toString()}`
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
    const group = await createTestGroup(admin._id.toString());

    const res = await request(makeApp()).get(
      `/find/invitee/${encodeURIComponent(recipient.email)}/${nonAdmin._id.toString()}/${group._id.toString()}`
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "You Need To Be An Admin To Invite" });
  });
});
