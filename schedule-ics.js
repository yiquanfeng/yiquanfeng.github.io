const form = document.querySelector("#ics-form");
const termStartInput = document.querySelector("#term-start");
const csvFileInput = document.querySelector("#csv-file");
const statusText = document.querySelector("#status-text");
const previewText = document.querySelector("#preview-text");
const downloadLink = document.querySelector("#download-ics");
const templateButton = document.querySelector("#download-template");
const csvHint = document.querySelector("#csv-hint");

csvFileInput.addEventListener("change", () => {
  const file = csvFileInput.files?.[0];
  if (csvHint) {
    csvHint.style.display = file && file.name.toLowerCase().endsWith(".csv") ? "" : "none";
  }
});

let currentDownloadUrl = null;

templateButton.addEventListener("click", () => {
  const template = [
    "course,weekday,startTime,endTime,weeks,location,teacher,note",
    "高等数学,1,08:00,09:40,1-16,教学楼 A101,张老师,必修",
    "大学英语,3,10:10,11:50,1-16,教学楼 B203,Li,",
    "数据结构,5,14:00,15:40,1-8,实验楼 302,王老师,单双周请自行拆分",
  ].join("\n");

  downloadTextFile(template, "schedule-template.csv", "text/csv;charset=utf-8");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = csvFileInput.files?.[0];
  const termStart = termStartInput.value;

  if (!file || !termStart) {
    setError("请先选择学期开始日期和课表文件。");
    return;
  }

  try {
    const rows = await parseFile(file);
    const events = buildEvents(rows, termStart);
    const icsText = buildIcs(events);

    if (currentDownloadUrl) {
      URL.revokeObjectURL(currentDownloadUrl);
    }

    currentDownloadUrl = URL.createObjectURL(
      new Blob([icsText], { type: "text/calendar;charset=utf-8" })
    );

    downloadLink.href = currentDownloadUrl;
    downloadLink.classList.remove("disabled");
    downloadLink.download = "schedule.ics";
    statusText.textContent = `已生成 ${events.length} 个日历事件。`;
    previewText.textContent = buildPreview(events);
  } catch (error) {
    setError(error instanceof Error ? error.message : "生成失败。");
  }
});

function setError(message) {
  if (currentDownloadUrl) {
    URL.revokeObjectURL(currentDownloadUrl);
    currentDownloadUrl = null;
  }
  statusText.textContent = message;
  previewText.textContent = "请检查 CSV 内容后重试。";
  downloadLink.classList.add("disabled");
  downloadLink.removeAttribute("href");
}

function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    throw new Error("CSV 文件是空的。");
  }

  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (char === "\"") {
      if (insideQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if (char === "\n" && !insideQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);

  const headers = rows[0].map((item) => item.trim());
  const requiredHeaders = ["course", "weekday", "startTime", "endTime", "weeks"];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV 缺少必要表头: ${header}`);
    }
  }

  return rows.slice(1).filter((items) => items.some((item) => item.trim())).map((items, index) => {
    const record = {};
    headers.forEach((header, headerIndex) => {
      record[header] = (items[headerIndex] || "").trim();
    });
    record.rowNumber = index + 2;
    return record;
  });
}

function buildEvents(rows, termStartValue) {
  const termStart = new Date(`${termStartValue}T00:00:00`);
  if (Number.isNaN(termStart.getTime())) {
    throw new Error("学期开始日期无效。");
  }

  const events = [];

  rows.forEach((row) => {
    const course = row.course;
    const weekday = parseWeekday(row.weekday);
    const weeks = parseWeeks(row.weeks, row.rowNumber);
    const startTime = parseTime(row.startTime, row.rowNumber);
    const endTime = parseTime(row.endTime, row.rowNumber);

    if (endTime.totalMinutes <= startTime.totalMinutes) {
      throw new Error(`第 ${row.rowNumber} 行结束时间必须晚于开始时间。`);
    }

    weeks.forEach((week) => {
      const date = new Date(termStart);
      date.setDate(termStart.getDate() + (week - 1) * 7 + (weekday - 1));

      const startDate = combineDateTime(date, startTime);
      const endDate = combineDateTime(date, endTime);

      const summary = course || `Course Week ${week}`;
      const descriptionParts = [];

      if (row.teacher) {
        descriptionParts.push(`Teacher: ${row.teacher}`);
      }
      if (row.note) {
        descriptionParts.push(`Note: ${row.note}`);
      }

      events.push({
        summary,
        location: row.location || "",
        description: descriptionParts.join("\n"),
        startDate,
        endDate,
      });
    });
  });

  events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return events;
}

function parseWeekday(input) {
  const value = input.trim().toLowerCase();
  const mapping = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
    周一: 1,
    周二: 2,
    周三: 3,
    周四: 4,
    周五: 5,
    周六: 6,
    周日: 7,
    星期一: 1,
    星期二: 2,
    星期三: 3,
    星期四: 4,
    星期五: 5,
    星期六: 6,
    星期日: 7,
  };

  if (!mapping[value]) {
    throw new Error(`无法识别星期: ${input}`);
  }

  return mapping[value];
}

function parseWeeks(input, rowNumber) {
  const parts = input.split(",").map((item) => item.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`第 ${rowNumber} 行缺少 weeks。`);
  }

  const weeks = new Set();

  parts.forEach((part) => {
    if (part.includes("-")) {
      const [startText, endText] = part.split("-").map((item) => item.trim());
      const start = Number.parseInt(startText, 10);
      const end = Number.parseInt(endText, 10);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end < start) {
        throw new Error(`第 ${rowNumber} 行 weeks 格式无效: ${input}`);
      }

      for (let week = start; week <= end; week += 1) {
        weeks.add(week);
      }
      return;
    }

    const week = Number.parseInt(part, 10);
    if (!Number.isInteger(week) || week <= 0) {
      throw new Error(`第 ${rowNumber} 行 weeks 格式无效: ${input}`);
    }
    weeks.add(week);
  });

  return [...weeks].sort((a, b) => a - b);
}

function parseTime(input, rowNumber) {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`第 ${rowNumber} 行时间格式无效: ${input}`);
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`第 ${rowNumber} 行时间超出范围: ${input}`);
  }

  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

function combineDateTime(date, time) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0
  );
}

function buildIcs(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//yiquanfeng//Schedule to ICS//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:School Schedule",
  ];

  const timestamp = formatUtcDate(new Date());

  events.forEach((event, index) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${Date.now()}-${index}@yiquanfeng.github.io`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART:${formatLocalDate(event.startDate)}`);
    lines.push(`DTEND:${formatLocalDate(event.endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function formatUtcDate(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeIcsText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function buildPreview(events) {
  const sample = events.slice(0, 6).map((event) => {
    return `${formatPreviewDate(event.startDate)} ${event.summary} @ ${event.location || "TBA"}`;
  });

  if (events.length > 6) {
    sample.push(`... 共 ${events.length} 个事件`);
  }

  return sample.join("\n");
}

function formatPreviewDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function downloadTextFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── XLS / XLSX support ────────────────────────────────────────────────────────

async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
    return parseXlsFile(file);
  }
  const text = await file.text();
  return parseCsv(text);
}

async function parseXlsFile(file) {
  if (typeof XLSX === "undefined") {
    throw new Error("XLS 解析库加载失败，请刷新页面重试。");
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  return parseBuptWorkbook(workbook);
}

// BUPT slot → time range mapping (08:00–20:55, 14 slots)
const SLOT_TIMES = {
  1:  { start: "08:00", end: "08:45" },
  2:  { start: "08:50", end: "09:35" },
  3:  { start: "09:50", end: "10:35" },
  4:  { start: "10:40", end: "11:25" },
  5:  { start: "11:30", end: "12:15" },
  6:  { start: "13:00", end: "13:45" },
  7:  { start: "13:50", end: "14:35" },
  8:  { start: "14:45", end: "15:30" },
  9:  { start: "15:40", end: "16:25" },
  10: { start: "16:35", end: "17:20" },
  11: { start: "17:25", end: "18:10" },
  12: { start: "18:30", end: "19:15" },
  13: { start: "19:20", end: "20:05" },
  14: { start: "20:10", end: "20:55" },
};

function parseBuptWorkbook(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // raw:true keeps cell text as-is including \n in multiline cells
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });

  if (data.length < 4) {
    throw new Error("XLS 文件格式不符：行数过少，请确认是北邮「学生个人课表」。");
  }

  // Validate header row (row index 2): should contain 星期一..星期五
  const headerRow = data[2] || [];
  if (!String(headerRow[1] || "").includes("星期")) {
    throw new Error("XLS 文件格式不符：未找到星期表头，请确认是北邮「学生个人课表」。");
  }

  const rows = [];

  // data[3..16] = slots 1–14 (data[3] → slot 1)
  for (let ri = 3; ri <= 16 && ri < data.length; ri++) {
    const slotNum = ri - 2; // ri=3 → slot 1
    const dataRow = data[ri];

    for (let ci = 1; ci <= 7; ci++) {
      const cellText = String(dataRow[ci] || "").trim();
      if (!cellText) continue;

      const courses = parseBuptCourses(cellText);

      for (const course of courses) {
        if (!course.slots.length || course.slots[0] !== slotNum) continue;

        const firstSlot = course.slots[0];
        const lastSlot = course.slots[course.slots.length - 1];

        if (!SLOT_TIMES[firstSlot] || !SLOT_TIMES[lastSlot]) continue;

        rows.push({
          course: course.name,
          weekday: String(ci),
          startTime: SLOT_TIMES[firstSlot].start,
          endTime: SLOT_TIMES[lastSlot].end,
          weeks: course.weeks,
          location: course.location,
          teacher: course.teacher,
          note: "",
          rowNumber: ri,
        });
      }
    }
  }

  if (rows.length === 0) {
    throw new Error("未解析到任何课程，请确认文件是北邮「学生个人课表」格式。");
  }

  return rows;
}

// Parse one cell which may contain multiple courses concatenated with \n.
// Each course block: name \n teacher \n weeks \n location \n slots
// e.g. "\n传感技术与应用\n王程\n1-11[周]\n4-302\n[03-04-05]节"
function parseBuptCourses(text) {
  const parts = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const courses = [];

  for (let i = 0; i + 4 < parts.length; i += 5) {
    const name = parts[i];
    const teacher = parts[i + 1];
    const weeksRaw = parts[i + 2]; // e.g. "1-16[周]"
    const location = parts[i + 3];
    const slotsRaw = parts[i + 4]; // e.g. "[03-04-05]节"

    // Strip "[周]" suffix → "1-16"
    const weeks = weeksRaw.replace(/\[周\]$/, "").trim();

    // Parse "[03-04-05]节" → [3, 4, 5]
    const slotsMatch = slotsRaw.match(/\[(.+?)\]节/);
    const slots = slotsMatch
      ? slotsMatch[1].split("-").map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n))
      : [];

    if (name && weeks && slots.length) {
      courses.push({ name, teacher, weeks, location, slots });
    }
  }

  return courses;
}
