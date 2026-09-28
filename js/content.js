// All portfolio text lives here. Edit this file to change what the screens show.

export const profile = {
  name: 'Shivam Verma',
  handle: 'cyb3r_n3rd',
  role: 'Security Researcher',
  intro: "Hi, I'm Shivam.",
  // Written on the ground in front of the stall.
  roles: ['Security Researcher', 'Web App Pentester', 'Mobile & Hardware Hacker', 'CTF Player', 'Chai Enthusiast'],
  bio: [
    'I\'m a security researcher who spends most days taking things apart to see how they break: web apps, mobile apps and the hardware underneath them.',
    'Placeholder: a sentence or two about what drives you, the kind of targets you enjoy, and how you like to work with the teams whose systems you test.',
    'Thanks for stopping by the stall.',
  ],
  // Drop the PDF at assets/resume.pdf (same folder as the site) and this link works.
  resume: 'assets/resume.pdf',
  socials: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/cyb3r-n3rd' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/shivamvermacyber' },
    { label: 'X', icon: 'x', href: '#' },
    { label: 'Email', icon: 'mail', href: 'mailto:placeholder@example.com' },
  ],
};

export const skills = [
  { group: 'Web', color: '#2af3ff', items: ['OWASP Top 10', 'Auth & session flaws', 'API testing', 'Burp Suite'] },
  { group: 'Mobile', color: '#ff4fa3', items: ['Android', 'iOS', 'Frida', 'Static & dynamic analysis'] },
  { group: 'Hardware', color: '#b6ff3b', items: ['UART / JTAG / SPI', 'Firmware extraction', 'Logic analysers', 'IoT'] },
  { group: 'Tooling', color: '#ffb020', items: ['Python', 'Bash', 'Ghidra', 'Linux'] },
];

export const experience = [
  { when: '2024 – now', title: 'Security Researcher', where: 'Placeholder organisation', text: 'Placeholder: what you test, what you have found, what you have shipped.' },
  { when: '2022 – 2024', title: 'Role title', where: 'Placeholder organisation', text: 'Placeholder: a line or two about this role.' },
  { when: '2020 – 2022', title: 'Education / earlier role', where: 'Placeholder', text: 'Placeholder: degree, certifications or early work.' },
];

// Shown in the vending machine. `color` tints the can, `code` is the slot label.
export const projects = [
  { code: 'A1', name: 'Project One', color: '#2af3ff', kind: 'can', tags: ['python', 'automation'], text: 'Placeholder: a tool or framework, the problem it solves and how it works.', link: '#' },
  { code: 'A2', name: 'Project Two', color: '#ff4fa3', kind: 'bottle', tags: ['android', 'frida'], text: 'Placeholder: a mobile testing utility and the class of bug it helps find.', link: '#' },
  { code: 'A3', name: 'Project Three', color: '#b6ff3b', kind: 'can', tags: ['hardware', 'uart'], text: 'Placeholder: a firmware extraction or teardown workflow.', link: '#' },
  { code: 'A4', name: 'Project Four', color: '#ffb020', kind: 'carton', tags: ['web', 'recon'], text: 'Placeholder: a recon or scanning pipeline.', link: '#' },
  { code: 'B1', name: 'Project Five', color: '#8a7bff', kind: 'bottle', tags: ['ctf'], text: 'Placeholder: a CTF challenge you built or solved.', link: '#' },
  { code: 'B2', name: 'Project Six', color: '#ff6b4a', kind: 'can', tags: ['iot'], text: 'Placeholder: an IoT device assessment.', link: '#' },
  { code: 'B3', name: 'Project Seven', color: '#3dffb0', kind: 'carton', tags: ['research'], text: 'Placeholder: a research prototype.', link: '#' },
  { code: 'B4', name: 'Project Eight', color: '#e9ecf5', kind: 'bottle', tags: ['tooling'], text: 'Placeholder: a small utility or browser extension.', link: '#' },
];

// Shown on the wall TV.
export const research = [
  { date: '2026', title: 'Write-up title one', text: 'Placeholder: a short summary of the finding, its impact and the fix.', link: '#' },
  { date: '2026', title: 'Write-up title two', text: 'Placeholder: a disclosed vulnerability, CVE or talk.', link: '#' },
  { date: '2025', title: 'Write-up title three', text: 'Placeholder: a CTF walkthrough or technique deep-dive.', link: '#' },
  { date: '2025', title: 'Write-up title four', text: 'Placeholder: notes from a hardware teardown.', link: '#' },
];

// Shown on the arcade cabinet.
export const contact = [
  { label: 'EMAIL', value: 'placeholder@example.com', href: 'mailto:placeholder@example.com' },
  { label: 'GITHUB', value: 'cyb3r-n3rd', href: 'https://github.com/cyb3r-n3rd' },
  { label: 'LINKEDIN', value: 'shivamvermacyber', href: 'https://www.linkedin.com/in/shivamvermacyber' },
  { label: 'RESUME', value: 'download pdf', href: 'assets/resume.pdf' },
  { label: 'PGP', value: 'placeholder fingerprint', href: null },
];
