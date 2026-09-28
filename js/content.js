// All portfolio text lives here. Edit this file to change what the screens show.
// Sources: Shivam's resume and his public LinkedIn profile.

export const profile = {
  name: 'Shivam Verma',
  handle: 'cyb3r_n3rd',
  role: 'Offensive Security Engineer',
  intro: "Hi, I'm Shivam.",
  // Floating above the ground in front of the stall.
  roles: ['Offensive Security Engineer', 'Red Team', 'Web & API Penetration Testing', 'CVE Holder · Springer Best Paper', 'Hardware Hacker'],
  bio: [
    'Offensive security engineer and penetration tester with just over five years breaking into web applications, APIs and networks. Hands-on exploitation, not theory, plus red team engagements that chain findings the way a real attacker would.',
    'Published CVE holder and Springer Best Paper winner, with over 15,000 USD in bug bounties and Hall of Fame at the U.S. DoD and HP. I script my own tooling in Python and Bash.',
    'Thanks for stopping by the Cyber Tapri.',
  ],
  resume: 'assets/resume.pdf',
  socials: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/cyb3r-n3rd' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/shivamvermacyber' },
    { label: 'Email', icon: 'mail', href: 'mailto:v.shivam1996@gmail.com' },
  ],
};

export const skills = [
  { group: 'Web app testing', color: '#2af3ff', items: ['Pre & post login testing', 'XSS (reflected, stored, DOM)', 'Host header injection', 'Insecure deserialization', 'CSRF', 'SSRF', 'OWASP Top 10'] },
  { group: 'Red team & API', color: '#ff4fa3', items: ['Red team operations', 'Attacker TTPs', 'API security (REST, auth, business logic)', 'Lateral movement', 'Privilege escalation'] },
  { group: 'Crypto & transport', color: '#8a7bff', items: ['TLS 1.2 / 1.3 hardening', 'SSL handshake analysis', 'CSP', 'PKI'] },
  { group: 'Hardware', color: '#b6ff3b', items: ['USB Rubber Ducky', 'P4wnP1', 'Pwnagotchi', 'Raspberry Pi Zero', 'Arduino ATtiny', 'RFID'] },
  { group: 'Tools & scripting', color: '#ffb020', items: ['Burp Suite', 'Nmap', 'Metasploit', 'Kali Linux', 'Frida', 'MobSF', 'SAST / DAST', 'Python', 'Bash', 'PowerShell'] },
  { group: 'Certifications', color: '#e9ecf5', items: ['CEH v11', 'eWPTXv2', 'eJPT', 'CCNA', 'Splunk 7.x', 'MTA Networking', 'PentesterLab Unix & Android'] },
];

// C3iHub is intentionally left out (Mar 2021 – Dec 2024 is shown without the organisation).
export const experience = [
  { when: 'May 2025 – now', title: 'Offensive Security Engineer & Cyber Security Team Lead', where: 'ITDA, Government of Uttarakhand', text: 'Leading web and API penetration tests across 200+ assets and red team engagements that chain findings into real attack paths.' },
  { when: 'Jan – Apr 2025', title: 'Red Team, Penetration Tester', where: 'Ministry of Electronics & IT (MeitY)', text: 'VAPT and red team work for 50+ enterprise and public-sector bodies, with the risk and remediation reports.' },
  { when: 'Mar 2021 – Dec 2024', title: 'Cybersecurity Researcher & Penetration Tester', where: '', text: 'Tested 100+ web, network and industrial (ICS/SCADA) targets end to end; published the methodology in four peer-reviewed papers.' },
  { when: 'Feb – Aug 2020', title: 'Information Security Specialist (Intern)', where: 'Bulwark CyberX', text: 'OSINT threat hunting for defacements and OWASP Top 10 issues.' },
  { when: '2015 – 2019', title: 'B.Tech, Electronics & Telecommunications', where: 'Uttar Pradesh Technical University', text: '' },
];

// Shown in the vending machine. `color` tints the item, `code` is the slot label.
export const projects = [
  { code: 'A1', name: 'Rubber Ducky', color: '#ffd23a', kind: 'can', tags: ['hardware', 'arduino', 'hid'], text: 'A USB keystroke-injection device built on an Arduino ATtiny, used in authorised red team demos.', link: 'https://github.com/cyb3r-n3rd/Rubber-Ducky' },
  { code: 'A2', name: 'P4wnP1', color: '#ff4fa3', kind: 'bottle', tags: ['hardware', 'raspberry pi', 'active directory'], text: 'A Raspberry Pi Zero USB platform for Active Directory security testing.', link: 'https://github.com/cyb3r-n3rd/P4wnP1' },
  { code: 'A3', name: 'Pwnagotchi', color: '#b6ff3b', kind: 'can', tags: ['hardware', 'wi-fi', 'raspberry pi'], text: 'A Raspberry Pi Zero W Wi-Fi security research companion that learns from its surroundings.', link: 'https://github.com/cyb3r-n3rd' },
  { code: 'A4', name: 'RFID Library System', color: '#2af3ff', kind: 'carton', tags: ['rfid', 'embedded'], text: 'An RFID-based library management system built for my college library; one of the college\'s best projects.', link: '#' },
  { code: 'B1', name: 'Home Automation', color: '#8a7bff', kind: 'bottle', tags: ['iot', 'embedded'], text: 'A home automation build from 2018.', link: '#' },
  { code: 'B2', name: 'Mobile Pentesting', color: '#ff6b4a', kind: 'can', tags: ['python', 'mobile', 'traffic analysis'], text: 'Scripts for analysing mobile-device traffic captured with tools like Wireshark.', link: 'https://github.com/cyb3r-n3rd/Mobile-Pentesting' },
  { code: 'B3', name: 'Bug Bounty Notes', color: '#3dffb0', kind: 'carton', tags: ['web', 'methodology'], text: 'My bug-hunting methodology notes and cheat sheets.', link: 'https://github.com/cyb3r-n3rd/Bug-Bounty-Notes' },
  { code: 'B4', name: 'Security Tooling', color: '#e9ecf5', kind: 'bottle', tags: ['python', 'bash'], text: 'Python and Bash tooling I write to speed up testing.', link: 'https://github.com/cyb3r-n3rd' },
];

// Shown on the wall TV, grouped.
export const research = [
  {
    group: 'Publications',
    items: [
      { date: '2025', title: 'A Modular Framework for Decentralized Explainable AI using Blockchain', text: 'IEEE AIST 2025.', link: 'https://ieeexplore.ieee.org/document/11441500' },
      { date: '2025', title: 'Next-Gen ISP-Based Content Filtering System Using AI and Age-Aware Regulation', text: 'IEEE AIST 2025.', link: 'https://ieeexplore.ieee.org/document/11441491' },
      { date: '2025', title: 'Towards Fair and Scalable DAO Governance: An NLP-Driven Scoring System for Proposal Evaluation', text: 'IEEE AIST 2025.', link: 'https://ieeexplore.ieee.org/document/11441626' },
      { date: '2024', title: 'Demonstration of MITM Attack in Synchrophasor Network Using MAC Spoofing', text: 'Springer LNNS vol. 918 (ICCNSML 2023). Best Paper Award.', link: 'https://doi.org/10.1007/978-981-97-0641-9_29' },
    ],
  },
  {
    group: 'CVEs',
    items: [
      { date: '2022', title: 'CVE-2022-45033', text: 'Cross-site scripting in Expense Tracker 1.0 (CVSS 5.4).', link: 'https://nvd.nist.gov/vuln/detail/CVE-2022-45033' },
      { date: '2020', title: 'CVE-2020-36081', text: 'Published vulnerability, coordinated responsible disclosure.', link: 'https://nvd.nist.gov/vuln/detail/CVE-2020-36081' },
    ],
  },
  {
    group: 'Honours',
    items: [
      { date: '2026', title: 'HPAIR Asia Conference delegate', text: 'Harvard Project for Asian and International Relations, Hanoi.', link: null },
      { date: '2024', title: 'Springer Best Paper Award', text: 'ICCNSML 2023.', link: null },
      { date: '', title: 'Bug bounty: 15,000 USD+', text: 'Hall of Fame at the U.S. Department of Defense, HP and Hindawi.', link: null },
      { date: '2020', title: 'TryHackMe #3 in India', text: 'Hall of Fame.', link: null },
      { date: '', title: 'Wazuh & CHERI Alliance Ambassador', text: 'Open-source SIEM/XDR community and memory-safe hardware research.', link: null },
    ],
  },
];

// Shown on the arcade cabinet.
export const contact = [
  { label: 'EMAIL', value: 'v.shivam1996@gmail.com', href: 'mailto:v.shivam1996@gmail.com' },
  { label: 'LINKEDIN', value: 'shivamvermacyber', href: 'https://www.linkedin.com/in/shivamvermacyber' },
  { label: 'GITHUB', value: 'cyb3r-n3rd', href: 'https://github.com/cyb3r-n3rd' },
  { label: 'RESUME', value: 'download pdf', href: 'assets/resume.pdf' },
];
