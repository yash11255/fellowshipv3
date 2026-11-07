// Programs offered by Arthroscopy College. Source: arthroscopycollege.com (Fellowship Details, Physiotherapy Internship,
// homepage, course posters). Fees marked `confirm` conflict or are missing on the old site.

export type Program = {
  slug: string;
  title: string;
  short: string;
  audience: string;
  duration: string;
  format: string;
  schedule?: string;
  fee: { label: string; amount: number; note?: string }[];   // INR
  deposit?: number;                                           // % payable at booking
  image: string;
  highlights: string[];
  curriculum: { title: string; items: string[] }[];
  outcomes: string[];
  eligibility: string[];
  confirm?: string;                                           // data the owner must verify
};

export const PROGRAMS: Program[] = [
  {
    slug: "fellowship-in-arthroscopy",
    title: "Fellowship in Arthroscopy & Sports Medicine",
    short: "One month inside the operating theatre with Dr. Manu Bora: 30–40 arthroscopic surgeries, internal-brace techniques and an Arthrex certificate.",
    audience: "Orthopaedic surgeons",
    duration: "1 month (extendable)",
    format: "Offline · in OT, Gurugram",
    fee: [
      { label: "Indian surgeons", amount: 150000, note: "+ GST" },
      { label: "International surgeons", amount: 200000, note: "+ GST" },
    ],
    deposit: 50,
    image: "/img/ot-1.webp",
    highlights: ["30–40 surgeries per month", "Hands-on in the operating theatre", "Knee & shoulder model training", "Virtual reality training", "Certificate from Arthrex", "Advance ACL course included free"],
    curriculum: [
      { title: "Knee", items: ["ACL / PCL repair with internal brace", "ACL / PCL reconstruction with internal brace", "MCL & LCL repair with internal brace", "Meniscus repair", "AutoCart cartilage transplant"] },
      { title: "Shoulder", items: ["Bankart repair", "PASTA repair", "Rotator cuff double-row repair"] },
      { title: "Ankle", items: ["ATFL repair with internal brace"] },
    ],
    outcomes: ["International-standard arthroscopic technique", "Case discussions and active involvement in surgery", "Confidence to perform internal-brace procedures independently"],
    eligibility: ["Orthopaedic surgeons who have just completed PG (MS / DNB Ortho)", "Practising orthopaedic surgeons upskilling in knee, shoulder and ankle arthroscopy"],
    confirm: "Old site lists ₹1,50,000 on Fellowship Details but ₹1,00,000 in the homepage FAQ.",
  },
  {
    slug: "advance-acl-course",
    title: "Next-Gen ACL Reconstruction Course",
    short: "Five days on Quad tendon + Internal Brace + LET: the triple-assurance ACL technique, from portals and graft harvest to implants.",
    audience: "Orthopaedic surgeons, fellows & residents",
    duration: "5 days",
    format: "Offline · OT + models, Gurugram",
    schedule: "Second week of every month",
    fee: [{ label: "Early bird", amount: 50000, note: "per surgeon" }],
    image: "/img/ot-2.webp",
    highlights: ["Quad tendon + internal brace + LET", "Arthroscopy on knee models (with Arthrex)", "VR training (with ConMed)", "2 days training + 3 days OT assistance", "Certificate on completion"],
    curriculum: [
      { title: "Training & assistance (2 days)", items: ["Arthroscopic surgeries on knee and shoulder models", "Arthroscopic rehabilitation program", "Virtual-reality training"] },
      { title: "Operating theatre (3 days)", items: ["Creating knee portals", "Harvesting quadriceps graft for ACL", "ACL reconstruction & repair with FiberTape internal brace", "Lateral Extra-articular Tenodesis (LET)", "Meniscus tear management, suture configurations & implant selection", "Cartilage procedures: transplant, AutoCart, Graftnet"] },
    ],
    outcomes: ["Perform modern ACL reconstruction with internal brace", "Choose grafts and implants confidently", "Manage meniscus and cartilage lesions"],
    eligibility: ["Orthopaedic surgeons", "Orthopaedic fellows and residents"],
    confirm: "Only the early-bird fee (₹50,000) is published. Confirm regular fee and next dates.",
  },
  {
    slug: "physiotherapy-internship",
    title: "Physiotherapy Internship: ACL Rehab",
    short: "A one-month, in-clinic internship on ACL rehabilitation, from pre-op to return to sport, with real patients at Threads Physio.",
    audience: "Physiotherapists, final-year students, coaches",
    duration: "1 month",
    format: "Offline · in-clinic, Gurugram",
    fee: [],
    image: "/img/team-1.jpg",
    highlights: ["Real ACL patients, pre-op to return-to-sport", "Mentored by Dr. Viraj Pandya, Head Physiotherapist", "Phase I–V rehab protocols", "Certificate on completion"],
    curriculum: [
      { title: "Module 1", items: ["Anatomy, biomechanics & injury mechanism"] },
      { title: "Module 2", items: ["Clinical evaluation & diagnosis: Lachman, pivot shift, anterior drawer", "Functional testing and movement screening"] },
      { title: "Module 3", items: ["Surgical interventions: autograft vs allograft, hamstring vs patellar tendon", "Post-surgery protocols and red flags"] },
      { title: "Module 4", items: ["ACL rehabilitation phases I–V: acute, strengthening, functional, return-to-sport"] },
    ],
    outcomes: ["Plan and progress ACL rehab independently", "Run return-to-sport testing", "Communicate with the surgical team"],
    eligibility: ["MSK and sports physiotherapists", "Final-year physiotherapy students", "Athletes and athletic coaches"],
    confirm: "Fee not published on the old site.",
  },
  {
    slug: "acl-rehab-workshop",
    title: "ACL Rehab Weekend Workshop",
    short: "Two days on ACL rehab for physiotherapists: assessment, prehab, post-surgical rehab, return-to-sport testing and certification.",
    audience: "Physiotherapists & students",
    duration: "2 days · 10am–4pm",
    format: "Offline · Gurugram",
    fee: [{ label: "Workshop fee", amount: 6000 }],
    image: "/img/clinic-1.jpg",
    highlights: ["Led by Dr. Viraj Pandya & Dr. Astha Singh", "Physical & radiological assessment", "Return-to-sport testing protocol", "Certificate"],
    curriculum: [
      { title: "Day 1", items: ["Introduction & anatomy of the ACL", "Mode of injury", "Assessment: physical and radiological", "Prehab"] },
      { title: "Day 2", items: ["Post-surgical rehab", "Return to sport", "Testing protocol", "Q&A and certification"] },
    ],
    outcomes: ["Structured ACL assessment", "Evidence-based prehab and rehab plans"],
    eligibility: ["Physiotherapists", "Physiotherapy students"],
    confirm: "Poster lists 29 Nov 2025. Confirm upcoming dates.",
  },
  {
    slug: "online-fellowship",
    title: "Online Arthroscopy Fellowship",
    short: "Learn arthroscopy concepts from home: recorded surgeries, case discussions and technique sessions with Dr. Manu Bora.",
    audience: "Orthopaedic surgeons & residents",
    duration: "Self-paced",
    format: "Online",
    fee: [],
    image: "/img/ot-2.webp",
    highlights: ["Recorded live surgeries", "Technique breakdowns", "Case discussions", "Certificate"],
    curriculum: [{ title: "Overview", items: ["Details to be published"] }],
    outcomes: ["Strong conceptual foundation before hands-on training"],
    eligibility: ["Orthopaedic surgeons and residents"],
    confirm: "Old site only links to an application. Add syllabus, duration and fee.",
  },
];

export const getProgram = (slug: string) => PROGRAMS.find((p) => p.slug === slug);
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const FACULTY = [
  { name: "Dr. Manu Bora", role: "Director · Orthopaedic & Arthroscopy Surgeon, Arthrex Master Instructor", image: "/brand/dr-manu-bora.jpg" },
  { name: "Dr. Viraj Pandya", role: "Head Physiotherapist, Threads Physio", image: "/img/faculty-viraj.jpg" },
];

export const FAQS: { q: string; a: string }[] = [
  {
    "q": "How long is the Arthroscopy Fellowship?",
    "a": "The Arthroscopy Fellowship offered by Arthroscopy College is one month long, with an option to extend based on the participant’s interest and performance. This duration is designed to provide comprehensive, hands-on training in advanced arthroscopic techniques, including cadaver-based workshops and mentorship by experienced orthopedic surgeons. For those looking to deepen their expertise further, the extendable option allows additional time to refine skills and gain more practical experience."
  },
  {
    "q": "What is the fee for the Arthroscopy Fellowship program, and are there any additional expenses?",
    "a": "The fee for the Arthroscopy Fellowship program is Rs. 1,00,000."
  },
  {
    "q": "What is the most common Orthopedic Fellowship?",
    "a": "The most common Orthopedic Fellowships typically include subspecialties such as Arthroscopy and Sports Medicine, joint replacement (hip and knee arthroplasty), spine surgery, and trauma surgery. These fellowships focus on specific areas of orthopedic practice, allowing surgeons to gain advanced expertise in diagnosing and treating related conditions. Among these, arthroscopy and sports medicine are particularly popular due to the growing demand for minimally invasive surgical techniques and the management of sports-related injuries."
  },
  {
    "q": "Are the training sessions hands-on or observation-based?",
    "a": "Our training sessions are primarily hands-on, ensuring participants gain practical experience in arthroscopic techniques. Trainees actively participate in procedures, including cadaver-based workshops and simulations, under the supervision of expert mentors. This approach allows for skill refinement and confidence building in real-world surgical scenarios. Observation-based learning is also included to complement hands-on practice, ensuring a well-rounded understanding of techniques and procedures."
  },
  {
    "q": "Will I receive a certification after completing the fellowship?",
    "a": "Yes, participants will receive a certification upon successfully completing the fellowship. This certification acknowledges your training in advanced arthroscopic techniques and serves as a valuable credential for your professional development in orthopedic surgery."
  },
  {
    "q": "What procedures are covered during the fellowship?",
    "a": "During the fellowship, participants will learn and practice a variety of arthroscopic procedures, including: ACL/ PCL Repair with Internal Brace ACL/ PCL Reconstruction with Internal Brace AutoCart Cartilage Transplant Meniscus Repair MCL Repair with Internal Brace LCL Repair with Internal Brace ATFL Repair with Internal Brace Bankart Repair Pasta Repair Rotator Cuff Double Row Repair"
  }
];
