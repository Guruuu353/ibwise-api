const prisma = require("../../config/db");

// Simple key-value settings store (proposal §6: "system settings"). Values
// are arbitrary JSON so new settings don't need a migration to add.
const DEFAULT_KEYS = {
  schoolName: "IBWISE Learning",
  contactEmail: "admissions@ibwise.example",
  contactPhone: "+254 757 279 330",
  blogModerationRequired: true,
};

async function getAll() {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULT_KEYS };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

async function set(key, value) {
  return prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

async function setMany(values) {
  const entries = Object.entries(values);
  return prisma.$transaction(entries.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })));
}

module.exports = { getAll, set, setMany };
