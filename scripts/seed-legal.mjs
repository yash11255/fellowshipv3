// Draft legal pages written for Arthroscopy College (the old site only had WordPress placeholder text).
// Review with your lawyer, then edit in Admin → Content. Usage (dev server stopped): node scripts/seed-legal.mjs
import { PGlite } from "@electric-sql/pglite";
const ORG = "Arthroscopy College (Orthosport × Threads Physio), F-10/4, Basement, Golf Course Rd, DLF Phase 1, Sector 27, Gurugram, Haryana 122001";
const CONTACT = `<p>Questions: <a href="mailto:orthosportin@gmail.com">orthosportin@gmail.com</a> · <a href="tel:+919650620870">+91 96506 20870</a><br />${ORG}</p>`;
const PAGES = {
  "privacy-policy": ["Privacy Policy", `
<p>This policy explains what personal information Arthroscopy College collects through arthroscopycollege.com and how we use it.</p>
<h2>What we collect</h2>
<ul><li><strong>Applications:</strong> name, email, phone, country, qualification, institution, experience, preferred start date, CV link and any message you send.</li><li><strong>Enquiries:</strong> the details you enter in the contact form.</li><li><strong>Account sign-in:</strong> your email address and one-time sign-in codes.</li><li><strong>Payments:</strong> processed by Razorpay. We receive a payment reference and status; we never see or store your card or UPI details.</li><li><strong>Usage data:</strong> basic analytics (pages visited, device type) if analytics is enabled.</li></ul>
<h2>How we use it</h2>
<ul><li>To review your application, contact you about it, and manage your enrolment and certificate.</li><li>To answer enquiries.</li><li>To send emails you need (application updates, payment links and receipts).</li><li>To improve the website.</li></ul>
<p>We do not sell your personal information. We share it only with service providers who help us run the site (hosting, email delivery, payments), and when required by law.</p>
<h2>Retention</h2><p>We keep application and enrolment records for as long as needed for training records, certificates and legal obligations. You can ask us to delete information we no longer need.</p>
<h2>Your rights</h2><p>You can ask to see, correct or delete your personal information by writing to us. Under the Digital Personal Data Protection Act, 2023 you may also withdraw consent and raise a grievance with us.</p>
<h2>Cookies</h2><p>We use essential cookies to keep you signed in. If analytics is enabled, it may set its own cookies.</p>
<h2>Contact</h2>${CONTACT}`],
  "terms-conditions": ["Terms & Conditions", `
<p>These terms apply to using arthroscopycollege.com and to applying for and attending programmes run by Arthroscopy College.</p>
<h2>Applications and admission</h2>
<ul><li>Submitting an application does not guarantee a seat. Admission is at the college's discretion, based on eligibility and seat availability.</li><li>You must provide accurate information. We may verify qualifications and registration before or on joining.</li></ul>
<h2>Fees and payment</h2>
<ul><li>Fees are shown on each programme page and in your acceptance email, and are subject to GST where applicable.</li><li>Where a booking amount (deposit) applies, your seat is reserved once it is paid; the balance is due on joining unless agreed otherwise.</li><li>Payments are processed securely by Razorpay.</li></ul>
<h2>Cancellations and refunds</h2>
<p>Refund eligibility and any rescheduling options are as stated in your acceptance email. If the college cancels or reschedules a cohort, you may move to another cohort or receive a full refund of amounts paid.</p>
<h2>Conduct in clinical settings</h2>
<ul><li>Participants must follow theatre protocols, patient-confidentiality rules and the instructions of faculty at all times.</li><li>Hands-on participation in procedures is supervised and at the discretion of the operating surgeon, in line with applicable regulations.</li><li>Photography or recording of patients is not permitted without explicit consent and faculty approval.</li></ul>
<h2>Certificates</h2><p>Certificates are issued on satisfactory completion and attendance. Certificates from partners (such as Arthrex) are subject to their own criteria.</p>
<h2>Website content</h2><p>Content on this website, including text, photos and videos, belongs to Arthroscopy College or its licensors and may not be reused without permission.</p>
<h2>Governing law</h2><p>These terms are governed by the laws of India. Courts in Gurugram, Haryana have jurisdiction.</p>
<h2>Contact</h2>${CONTACT}`],
  disclaimer: ["Disclaimer", `
<p>The information on arthroscopycollege.com, including articles and videos, is for general education of medical professionals and the public. It is not medical advice and does not replace consultation with a qualified doctor.</p>
<ul><li>Surgical and rehabilitation techniques shown are performed by trained specialists. Do not attempt any procedure without appropriate qualification, supervision and licensing.</li><li>Outcomes differ between patients. Testimonials and case results describe individual experiences and are not a guarantee of results.</li><li>Mentions of devices or brands (for example Arthrex or ConMed) are for educational context and do not imply endorsement by those companies unless stated.</li><li>We try to keep content accurate and current but make no warranties about completeness. Programme details, fees and dates may change; the details in your acceptance email apply.</li></ul>
<p>If you have a medical emergency, call 112 or go to the nearest hospital.</p>
<h2>Contact</h2>${CONTACT}`],
};
const db = new PGlite("./.data/pg");
for (const [slug, [title, body]] of Object.entries(PAGES)) await db.query(`insert into pages (slug,title,body) values ($1,$2,$3) on conflict (slug) do update set title=excluded.title, body=excluded.body, updated_at=now()`, [slug, title, body.replace(/\n/g, "")]);
console.log("legal pages:", Object.keys(PAGES).length);
await db.close();
