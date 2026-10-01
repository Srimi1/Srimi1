// Shared landing physics for the playable city and the contribution autopilot.
export const GRAVITY = 1750;
export const JUMP_SPEED = 700;
export const RUN_SPEED = 300;

export function integrateBody(body, platforms, width, dt) {
  const previousFeet = body.y + body.h;
  body.x = Math.max(0, Math.min(width - body.w, body.x + body.vx * dt));
  body.y += body.vy * dt;
  body.grounded = false;
  if (body.vy < 0) return null;
  for (const platform of [...platforms].sort((a, b) => a.y - b.y)) {
    if (
      body.x + body.w > platform.x &&
      body.x < platform.x + platform.w &&
      previousFeet <= platform.y + 1 &&
      body.y + body.h >= platform.y
    ) {
      body.y = platform.y - body.h;
      body.vy = 0;
      body.grounded = true;
      return platform;
    }
  }
  return null;
}
