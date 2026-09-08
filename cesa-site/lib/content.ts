/** Committee 2025, from CESA-CONTENT-REFERENCE.md. Update there first. */

export type Member = {
  name: string;
  role: string;
};

export const CORE: Member[] = [
  { name: "Tanisha Sharma", role: "Chairperson" },
  { name: "Swaroop Naik", role: "Vice Chairperson" },
  { name: "Diksha Parulekar", role: "General Secretary" },
];

export const TEAMS: Member[] = [
  { name: "Prashi Rawal", role: "Technical — Head" },
  { name: "Rohit Soneji", role: "Technical — Co-head" },
  { name: "Ishika Bhute", role: "Event — Head" },
  { name: "Soumitra Rajguru", role: "Event — Co-head" },
  { name: "Sudha Maurya", role: "Creative — Head" },
  { name: "Siddhi Naik", role: "Creative — Co-head" },
  { name: "Bhavika Yashwantrao", role: "Publicity — Head" },
  { name: "Tejas Dhanvi", role: "Publicity — Co-head" },
  { name: "Yash Salunkhe", role: "Media — Head" },
  { name: "Ayush Kamble", role: "Media — Co-head" },
  { name: "Devanshi Mahajan", role: "Documentation — Head" },
  { name: "Mayuri Kamath", role: "Documentation — Co-head" },
];

export const DEVELOPERS: Member[] = [
  { name: "Rohit Soneji", role: "Full Stack Developer & UI Designer" },
  { name: "Atharva Sheramkar", role: "Frontend Developer" },
  { name: "Maitrey Bharambe", role: "Backend Developer" },
];

export const COMMITTEE: Member[] = [...CORE, ...TEAMS];
