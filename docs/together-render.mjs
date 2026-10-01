import {
  createStory,
  storyFrame,
  STORY_VIEW,
  clamp,
  smooth,
} from "./together-core.mjs";

const C = {
  ink: "#0b1220",
  cyan: "#7ce4f1",
  gold: "#f4d77b",
  white: "#edf4f5",
  muted: "#96aaba",
};
const mono = (size = 12) => `${size}px "Space Mono", monospace`;
const sans = (size = 18) => `500 ${size}px "DM Sans", sans-serif`;
const headline = (size) => `800 ${size}px "Barlow Condensed", sans-serif`;
const mix = (a, b, t) => a + (b - a) * t;

async function atlas(path, columns, rows) {
  const image = new Image();
  image.src = new URL(path, import.meta.url).href;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const width = image.width / columns,
    height = image.height / rows;
  const bounds = [];
  for (let i = 0; i < columns * rows; i++) {
    const left = Math.round((i % columns) * width),
      top = Math.round(Math.floor(i / columns) * height);
    const right = Math.round(((i % columns) + 1) * width),
      bottom = Math.round((Math.floor(i / columns) + 1) * height);
    let x0 = right,
      y0 = bottom,
      x1 = left,
      y1 = top;
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        if (data[(y * image.width + x) * 4 + 3] > 35) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      }
    if (x1 < x0) throw new Error(`Empty character pose ${path}:${i}`);
    bounds.push({
      x: x0,
      y: y0,
      w: x1 - x0 + 1,
      h: y1 - y0 + 1,
      inset: Math.min(x0 - left, right - x1 - 1, y0 - top, bottom - y1 - 1),
    });
  }
  return { image, bounds, scaleHeight: bounds[columns === 4 ? 4 : 0].h };
}

export async function createRenderer(canvas, snapshot, asOf) {
  canvas.width = STORY_VIEW.width;
  canvas.height = STORY_VIEW.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  await Promise.all([
    document.fonts.load('800 96px "Barlow Condensed"'),
    document.fonts.load('500 18px "DM Sans"'),
    document.fonts.load('12px "Space Mono"'),
  ]);
  const [srijan, sarah, hug] = await Promise.all([
    atlas("assets/together/srijan.webp", 4, 3),
    atlas("assets/together/sarah.webp", 4, 3),
    atlas("assets/together/hug.webp", 3, 2),
  ]);
  const sprites = { srijan, sarah, hug };
  const story = createStory(snapshot, asOf);
  const sky = document.createElement("canvas");
  sky.width = canvas.width;
  sky.height = canvas.height;
  const s = sky.getContext("2d");
  const gradient = s.createLinearGradient(0, 0, 0, 480);
  gradient.addColorStop(0, "#0b1220");
  gradient.addColorStop(0.65, "#142c42");
  gradient.addColorStop(1, "#1b4356");
  s.fillStyle = gradient;
  s.fillRect(0, 0, 960, 480);
  for (let i = 0; i < 55; i++) {
    s.fillStyle = i % 4 ? "#3e6075" : "#7d99a5";
    s.fillRect(
      ((i * 173 + 101) % 930) + 15,
      ((i * 79 + 47) % 200) + 60,
      i % 4 ? 1 : 2,
      1,
    );
  }
  s.strokeStyle = "#426d80";
  s.lineWidth = 1;
  s.beginPath();
  s.arc(801, 179, 57, 0, Math.PI * 2);
  s.stroke();
  s.strokeStyle = "#2e556b";
  s.beginPath();
  s.ellipse(801, 179, 102, 29, -0.38, 0, Math.PI * 2);
  s.stroke();
  s.fillStyle = "#9cb8bf";
  s.beginPath();
  s.arc(801, 179, 22, 0, Math.PI * 2);
  s.fill();
  s.fillStyle = "#163146";
  s.beginPath();
  s.arc(812, 171, 22, 0, Math.PI * 2);
  s.fill();
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < 22; i++) {
      const x = i * 51 - 19 + layer * 17,
        h = 46 + ((i * 67 + layer * 43) % 134),
        y = 450 - h - layer * 5;
      s.fillStyle = ["#163043", "#12273b", "#0e2135"][layer];
      s.fillRect(x, y, 43, h + 30);
      s.fillRect(x + 13, y - 9 - (i % 4) * 3, 16, 12);
      if (layer === 2) {
        for (let row = 0; row < h / 12 - 1; row++)
          for (let col = 0; col < 4; col++) {
            if ((i * 17 + row * 11 + col * 7) % 6 < 3) {
              s.fillStyle = (row + i + col) % 8 === 0 ? "#8f8760" : "#31596c";
              s.fillRect(x + 5 + col * 8, y + 12 + row * 12, 3, 5);
            }
          }
      }
    }
  s.fillStyle = "#0a192a";
  s.fillRect(0, 440, 960, 40);

  function text(value, x, y, font, color = C.white, align = "left") {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
    ctx.textAlign = "left";
  }
  function box(x, y, w, h, fill, stroke, radius = 6) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  function sprite(name, frame, x, feet, height = 144, flip = false, alpha = 1) {
    const sheet = sprites[name],
      b = sheet.bounds[frame];
    const scale = height / sheet.scaleHeight;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(Math.round(x), Math.round(feet));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      sheet.image,
      b.x,
      b.y,
      b.w,
      b.h,
      (-b.w * scale) / 2,
      -b.h * scale,
      b.w * scale,
      b.h * scale,
    );
    ctx.restore();
  }
  function calendar() {
    const dates = story.world.calendar;
    text("A YEAR OF BUILDING", 642, 40, mono(9), C.muted);
    const first = dates[0]?.stamp || 0;
    for (const d of dates) {
      const index =
        Math.floor((d.stamp - first) / 86400000) + (dates[0]?.weekday || 0);
      const level = Math.min(
        4,
        Math.max(
          0,
          [
            "NONE",
            "FIRST_QUARTILE",
            "SECOND_QUARTILE",
            "THIRD_QUARTILE",
            "FOURTH_QUARTILE",
          ].indexOf(d.contributionLevel),
        ),
      );
      ctx.fillStyle = ["#203448", "#2c5667", "#3b7885", "#60a9ad", "#a7dbcf"][
        level
      ];
      ctx.fillRect(
        642 + Math.floor(index / 7) * 5.6,
        50 + (index % 7) * 5.6,
        4,
        4,
      );
    }
  }
  function chrome(label) {
    ctx.drawImage(sky, 0, 0);
    text("SRIJAN  ×  SARAH", 35, 39, mono(11), C.gold);
    text(label, 35, 60, mono(9), C.muted);
    calendar();
    ctx.strokeStyle = "#355267";
    ctx.lineWidth = 1;
    ctx.strokeRect(12.5, 12.5, 935, 455);
    text(
      `${story.world.windowStart} — ${story.world.windowEnd}`,
      35,
      458,
      mono(9),
      C.muted,
    );
    text(
      `${story.world.active.length} WORKED DAYS / ${story.world.total} CONTRIBUTIONS`,
      925,
      458,
      mono(9),
      C.cyan,
      "right",
    );
  }
  function terminal(x, y, w, h, t, miniature = false) {
    box(x, y, w, h, "#0d1b2c", "#36566a", 5);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ["#f0b27b", "#efd78b", "#8ed2c5"][i];
      ctx.beginPath();
      ctx.arc(x + 11 + i * 8, y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const lines = miniature
      ? ["const us = together;", "await coffee();", "build(ourWorld);"]
      : [
          "const team = ['srijan', 'sarah'];",
          "await coffee.refill();",
          "buildSomethingTogether(team);",
        ];
    lines.forEach((line, i) =>
      text(
        line.slice(0, Math.floor(t * 22 - i * 10)),
        x + 12,
        y + 33 + i * (miniature ? 11 : 23),
        mono(miniature ? 7 : 12),
        [C.cyan, C.gold, C.white][i],
      ),
    );
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = C.cyan;
      ctx.fillRect(x + 11, y + h - 13, miniature ? 4 : 7, 2);
    }
  }
  function seat(x, feet) {
    box(x - 28, feet - 96, 40, 58, "#21344a", "#426177", 12);
    box(x - 35, feet - 46, 68, 12, "#2b4259", null, 4);
    ctx.strokeStyle = "#37536a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, feet - 34);
    ctx.lineTo(x, feet - 4);
    ctx.moveTo(x - 25, feet);
    ctx.lineTo(x + 25, feet);
    ctx.stroke();
  }
  function desk(x, t) {
    terminal(x, 298, 92, 64, t, true);
    ctx.fillStyle = "#4c697a";
    ctx.fillRect(x + 43, 362, 6, 8);
    ctx.fillRect(x + 29, 369, 34, 3);
    box(x - 21, 376, 130, 9, "#826b55", "#b7a07c", 2);
    ctx.fillStyle = "#334b5d";
    ctx.fillRect(x - 14, 385, 5, 45);
    ctx.fillRect(x + 98, 385, 5, 45);
    box(x - 9, 370, 44, 4, "#263e51", "#3a576c", 1);
    ctx.strokeStyle = "#55727c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 76, 303);
    ctx.lineTo(x + 99, 295);
    ctx.lineTo(x + 98, 277);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.ellipse(x + 97, 280, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function coffee(t, fading = 1) {
    ctx.save();
    ctx.globalAlpha = fading;
    text("CODE", 35, 177, headline(94), C.white);
    text("TOGETHER.", 35, 263, headline(94), C.gold);
    text(
      "A little world we build, one day at a time.",
      38,
      296,
      sans(15),
      C.muted,
    );
    terminal(37, 320, 365, 113, t);
    const actors = [
      { id: "srijan", x: 525, offset: 0 },
      { id: "sarah", x: 743, offset: 0.6 },
    ];
    for (const p of actors) {
      seat(p.x - 4, 432);
      const local = (t + p.offset) % 5.2;
      const frame =
        local < 2.6
          ? 8 + (Math.floor(local * 5) % 2)
          : local < 3.3
            ? 10
            : local < 4.6
              ? 11
              : 10;
      sprite(p.id, frame, p.x, 433, 176);
      desk(p.x + 53, t + p.offset);
      text(
        p.id === "srijan" ? "SRIJAN" : "SARAH",
        p.x - 3,
        446,
        mono(9),
        p.id === "srijan" ? C.gold : C.cyan,
        "center",
      );
      // Steam follows the coffee cup only during the hold/sip beats.
      if (local > 2.6) {
        ctx.strokeStyle = "#a2bfc2";
        ctx.lineWidth = 1;
        for (let j = 0; j < 2; j++) {
          ctx.beginPath();
          ctx.moveTo(p.x + 32 + j * 7, 302);
          ctx.quadraticCurveTo(
            p.x + 25 + j * 7 + Math.sin(t * 3) * 3,
            294,
            p.x + 31 + j * 7,
            286,
          );
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  function ring(cx, cy, radius, alpha, rotation = 0) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, rotation, rotation + Math.PI * 1.7);
    ctx.stroke();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 9, -rotation, -rotation + Math.PI * 0.8);
    ctx.stroke();
    ctx.restore();
  }
  function contributionBlocks(camera, events = [], t = 0, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    for (const p of story.world.platforms) {
      const x = Math.round(p.x - camera);
      if (x > 980 || x + p.w < -20) continue;
      const hit = events.filter((e) => e.id === p.id && e.time <= t).at(-1);
      const hot = hit && t - hit.time < 0.38;
      box(
        x,
        p.y,
        p.w,
        p.h,
        p.date
          ? [null, "#183b4c", "#205263", "#276d79", "#3c8d91"][p.level]
          : "#19354a",
        hot ? C.gold : "#497a8b",
        5,
      );
      ctx.fillStyle = p.date
        ? [null, "#518b98", "#74b7bd", "#9adad1", "#c9e8c7"][p.level]
        : "#71969b";
      ctx.fillRect(x + 4, p.y, p.w - 8, hot ? 5 : 3);
      if (p.date) {
        text(
          p.date.slice(5).replace("-", "/"),
          x + 12,
          p.y + 20,
          mono(10),
          C.white,
        );
        text(`+${p.count}`, x + p.w - 12, p.y + 20, mono(9), C.gold, "right");
        for (let j = 0; j < p.level; j++) {
          ctx.fillStyle = "#88bfb9";
          ctx.fillRect(x + 12 + j * 8, p.y + 29, 4, 3);
        }
      }
      if (hot) {
        const progress = (t - hit.time) / 0.38;
        ring(x + p.w / 2, p.y, 9 + progress * 32, 1 - progress);
      }
    }
    ctx.restore();
  }
  function run(frame) {
    const { camera, actors } = frame.run;
    text("YOUR DAYS BECOME OUR WAY.", 35, 112, headline(32), C.white);
    contributionBlocks(camera, story.duet.events, frame.localTime);
    const a = actors[0],
      b = actors[1];
    ctx.strokeStyle = "#4b879a";
    ctx.setLineDash([3, 7]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x + a.w / 2 - camera, a.y + 40);
    ctx.quadraticCurveTo(
      (a.x + b.x) / 2 - camera,
      Math.max(a.y, b.y) + 84,
      b.x + b.w / 2 - camera,
      b.y + 40,
    );
    ctx.stroke();
    ctx.setLineDash([]);
    for (const p of [...actors].sort((a, b) => a.x - b.x)) {
      const phase = !p.grounded
        ? p.vy < 0
          ? 6
          : 7
        : Math.abs(p.vx) > 12
          ? Math.floor(p.distance / 22) % 4
          : 4;
      if (!p.grounded) {
        ctx.strokeStyle = p.id === "sarah" ? "#75b5c2" : "#9e926b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - camera - 12, p.y + p.h + 2);
        ctx.lineTo(p.x - camera - 35, p.y + p.h + 4);
        ctx.stroke();
      }
      sprite(p.id, phase, p.x + p.w / 2 - camera, p.y + p.h, 136);
    }
  }
  function burst(frame) {
    const t = frame.localTime,
      centerX = 598,
      centerY = 292;
    contributionBlocks(story.duet.frames.at(-1)?.camera || 0);
    const light = Math.sin(clamp(t / 2.2) * Math.PI);
    const aura = ctx.createRadialGradient(
      centerX,
      centerY,
      5,
      centerX,
      centerY,
      355,
    );
    aura.addColorStop(0, `rgba(199, 245, 239, ${light * 0.46})`);
    aura.addColorStop(0.3, `rgba(115, 214, 224, ${light * 0.23})`);
    aura.addColorStop(1, "rgba(115, 214, 224, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(220, 70, 740, 375);
    sprite("srijan", 4, 530, 390, 144);
    sprite("sarah", 4, 659, 390, 144, true);
    terminal(748, 309, 108, 70, 5, true);
    ctx.fillStyle = "#8eacb2";
    ctx.fillRect(795, 379, 8, 10);
    const bloom = smooth(Math.min(1, t / 0.8));
    const fade = 1 - smooth((t - 1.1) / 1.4);
    ring(centerX, centerY, 30 + bloom * 265, fade * 0.8, t * 2);
    ring(centerX, centerY, 15 + bloom * 145, fade, -t);
    for (let i = 0; i < 26; i++) {
      const angle = i * 2.3999,
        r = 30 + bloom * (130 + (i % 4) * 35);
      ctx.save();
      ctx.globalAlpha = fade * 0.8;
      ctx.fillStyle = i % 3 ? C.cyan : C.gold;
      ctx.fillRect(
        centerX + Math.cos(angle) * r,
        centerY + Math.sin(angle) * r,
        3 + (i % 3),
        3,
      );
      ctx.restore();
    }
    text("BUILD COMPLETE.", 35, 197, headline(60), C.gold);
    text(
      "You built the days. We brought them to life.",
      38,
      232,
      sans(15),
      C.white,
    );
    text("> success: together", 38, 275, mono(12), C.cyan);
  }
  function together(frame) {
    const t = frame.localTime;
    text("BETTER", 35, 174, headline(84), C.white);
    text("TOGETHER.", 35, 251, headline(84), C.gold);
    text("Every build ends where we belong.", 38, 288, sans(15), C.muted);
    text("// you + me + a little coffee", 39, 349, mono(12), C.cyan);
    box(434, 430, 495, 5, "#598595", null, 2);
    const pose =
      t < 0.5 ? 0 : t < 1 ? 1 : t < 1.5 ? 2 : t < 2 ? 3 : t < 3.1 ? 4 : 5;
    sprite("hug", pose, 680, 430, 242 + smooth(t / 3) * 12);
    if (t > 2) {
      ring(685, 299, 152, 0.15, 0.2);
      // An understated heart drawn as a game effect above the embrace.
      ctx.save();
      ctx.translate(714, 165);
      ctx.scale(0.65, 0.65);
      ctx.fillStyle = C.gold;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-17, -10, -20, -26, -9, -27);
      ctx.bezierCurveTo(-3, -28, 0, -23, 0, -21);
      ctx.bezierCurveTo(3, -29, 16, -29, 17, -20);
      ctx.bezierCurveTo(19, -10, 8, 0, 0, 5);
      ctx.fill();
      ctx.restore();
    }
  }
  function draw(elapsed) {
    const frame = storyFrame(story, elapsed);
    chrome(
      {
        coffee: "01 / COFFEE & CODE",
        compile: "02 / THE WORLD COMPILES",
        run: "03 / REAL DAYS, SHARED JUMPS",
        burst: "04 / THE BUILD BLOOMS",
        hug: "05 / HOME IS TOGETHER",
        return:
          frame.progress > 0.88
            ? "01 / COFFEE & CODE"
            : "06 / ANOTHER CUP, ANOTHER DAY",
      }[frame.chapter],
    );
    if (frame.chapter === "coffee") coffee(frame.localTime);
    else if (frame.chapter === "compile") {
      const p = smooth(frame.progress);
      coffee(5.05, 1 - smooth(frame.progress * 3));
      contributionBlocks(0, [], 0, p);
      ctx.save();
      ctx.globalAlpha = smooth((frame.progress - 0.15) / 0.35);
      text("THE WORLD", 35, 177, headline(78), C.white);
      text("COMPILES.", 35, 252, headline(78), C.gold);
      text("Our code becomes the city above us.", 38, 289, sans(15), C.muted);
      sprite("srijan", frame.progress < 0.32 ? 5 : 4, 635, 393, 145);
      sprite("sarah", frame.progress < 0.32 ? 5 : 4, 790, 393, 145);
      ctx.restore();
      for (let i = 0; i < 9; i++) {
        const y = 242 - ((frame.localTime * 72 + i * 28) % 130);
        text(
          [
            "<build />",
            "const us = 2;",
            "git commit",
            "await coffee()",
            "return together;",
          ][i % 5],
          512 + (i % 3) * 126,
          y,
          mono(10),
          i % 3 ? C.cyan : C.gold,
        );
      }
      ring(
        701,
        291,
        48 + p * 65,
        Math.sin(frame.progress * Math.PI),
        frame.localTime * 1.5,
      );
    } else if (frame.chapter === "run") run(frame);
    else if (frame.chapter === "burst") burst(frame);
    else if (frame.chapter === "hug") together(frame);
    else {
      const p = smooth(frame.progress);
      ctx.save();
      ctx.globalAlpha = 1 - p;
      together({ ...frame, localTime: 5.3 });
      ctx.restore();
      coffee(0, p);
    }
    if (!story.world.active.length) {
      // No workdays are invented when the public calendar is quiet.
      if (["compile", "burst"].includes(frame.chapter)) {
        ctx.drawImage(sky, 0, 80, 960, 355, 0, 80, 960, 355);
        coffee(frame.localTime);
        text(
          "A quiet calendar. A new idea brewing.",
          39,
          311,
          sans(13),
          C.cyan,
        );
      }
    }
    canvas.dataset.chapter = frame.chapter;
    canvas.dataset.time = frame.time.toFixed(3);
    return frame;
  }
  draw(0);
  return { canvas, ctx, story, sprites, draw };
}
