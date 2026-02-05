import { readUsers, writeUsers } from "../utils/db";
import { sendMail } from "../lib/email";

export async function ensureUserAndCourse({
  name,
  email,
  phone,
  courseSlug,
  sendWelcome = true,
}: {
  name?: string;
  email: string;
  phone?: string;
  courseSlug: string;
  sendWelcome?: boolean;
}) {
  const users = readUsers();
  const lower = email.toLowerCase();
  let user = users.find((u) => u.email === lower);

  let firstTime = false;

  if (!user) {
    firstTime = true;
    user = {
      id: Date.now().toString(),
      name: name || lower.split("@")[0],
      email: lower,
      phone: phone || "",
      // ✅ PLAIN PASSWORD (stored same as email)
      password: lower,
      createdAt: new Date().toISOString(),
      courses: {},
    };
    users.push(user);
  }

  if (!user.courses[courseSlug]) {
    user.courses[courseSlug] = {
      enrolledAt: new Date().toISOString(),
      progress: { firstModuleUnlocked: true, completedModules: [] },
      certificateUrl: null,
    };
  }

  writeUsers(users);

  if (sendWelcome && firstTime) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const lmsLink = `${base}/free-courses/${courseSlug}`;

    await sendMail(
      lower,
      `Your IIM SKILLS account for ${courseSlug.replace(/-/g, " ")}`,
      `
      <p>Hi ${user.name},</p>
      <p>Your account has been created.</p>
      <p><strong>Login ID:</strong> ${user.email}<br/>
         <strong>Password:</strong> ${user.password}</p>
      <p>Start your course here: <a href="${lmsLink}">${lmsLink}</a></p>
      <p>Best,<br/>IIM SKILLS</p>
      `
    );
  }

  return { ok: true };
}
