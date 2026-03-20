const form = document.querySelector("#ics-form");
const termStartInput = document.querySelector("#term-start");
const csvFileInput = document.querySelector("#csv-file");
const statusText = document.querySelector("#status-text");
const previewText = document.querySelector("#preview-text");
const downloadLink = document.querySelector("#download-ics");
const templateButton = document.querySelector("#download-template");

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
    const csvText = await file.text();
    const rows = parseCsv(csvText);
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
