export default function Privacy() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Last updated: July 2026</p>

      <Section title="1. Introduction">
        HireItRight ("we", "us", "our") is committed to protecting the personal data of our users in accordance with Singapore's Personal Data Protection Act 2012 (PDPA). This Privacy Policy explains how we collect, use, disclose and protect your personal data when you use our platform at hireitright.com.
      </Section>

      <Section title="2. Data Protection Officer (DPO)">
        We have appointed a Data Protection Officer who is responsible for ensuring our compliance with the PDPA. You may contact our DPO for any data protection matters:
        <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '14px 18px', marginTop: 12, border: '0.5px solid #e0e0dc' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.8 }}>
            <strong>Data Protection Officer</strong><br />
            HireItRight<br />
            Email: <a href="mailto:dpo@hireitright.com" style={{ color: '#1D9E75' }}>dpo@hireitright.com</a><br />
            Website: hireitright.com
          </p>
        </div>
      </Section>

      <Section title="3. Personal Data We Collect">
        <p style={p}>We collect the following categories of personal data:</p>
        <Table rows={[
          ['Account data', 'Full name, email address, password (hashed), role (candidate/employer)'],
          ['Profile data', 'Headline, skills, industry, location, LinkedIn URL, company name, company URL'],
          ['Photo', 'Profile photo uploaded by you'],
          ['Video content', 'Intro videos and job response videos you record or link'],
          ['Application data', 'Cover notes, reference links, application status, interview details'],
          ['Job listings', 'Job title, description, requirements, location, career site URLs (employers)'],
          ['Usage data', 'Notification records, login timestamps, video view logs'],
          ['Communications', 'Messages sent via our notification system'],
        ]} />
        <p style={{ ...p, marginTop: 12 }}>We do not collect NRIC numbers, passport numbers, financial information or sensitive personal data as defined under the PDPA.</p>
      </Section>

      <Section title="4. How We Use Your Personal Data">
        <p style={p}>We collect and use your personal data for the following purposes, for which you provide consent at signup:</p>
        <ul style={ul}>
          <li>Creating and managing your account on HireItRight</li>
          <li>Enabling candidates to apply for job listings and employers to review applications</li>
          <li>Displaying your profile to authorised parties (employers you apply to, or candidates who apply to your jobs)</li>
          <li>Sending notifications about application status, profile views and interview invitations</li>
          <li>Delivering email communications via our email service provider (Resend)</li>
          <li>Storing and delivering video content via Cloudflare Stream</li>
          <li>Improving the Platform and user experience</li>
          <li>Complying with legal obligations</li>
        </ul>
        <p style={p}>We will not use your personal data for direct marketing without your separate consent.</p>
      </Section>

      <Section title="5. Access Control and Data Sharing Between Users">
        <p style={p}>HireItRight operates a strict access control model:</p>
        <ul style={ul}>
          <li><strong>Candidate profiles</strong> are only visible to employers whose job listings the candidate has applied to</li>
          <li><strong>Employer profiles</strong> are only visible to candidates who have applied to their roles</li>
          <li>Videos, photos and personal details are not publicly accessible</li>
          <li>Employers must not share, download or distribute candidate information outside the Platform without the candidate's consent</li>
        </ul>
      </Section>

      <Section title="6. Disclosure to Third Parties">
        <p style={p}>We share your personal data with the following third-party service providers who process data on our behalf. Each has entered into or operates under a Data Processing Agreement:</p>
        <Table rows={[
          ['Supabase Inc.', 'Database, authentication and file storage', 'Singapore region'],
          ['Cloudflare Inc.', 'Video storage and delivery (Cloudflare Stream)', 'United States'],
          ['Resend Inc.', 'Transactional email delivery', 'United States'],
          ['Vercel Inc.', 'Website hosting and deployment', 'United States'],
        ]} headers={['Provider', 'Purpose', 'Location']} />
        <p style={{ ...p, marginTop: 12 }}>For transfers to providers in the United States, we rely on contractual safeguards (Standard Contractual Clauses or equivalent) to ensure adequate protection of your personal data. We do not sell your personal data to any third party.</p>
      </Section>

      <Section title="7. Data Retention">
        <p style={p}>We retain your personal data for as long as your account is active or as needed to provide the Platform. Specifically:</p>
        <ul style={ul}>
          <li><strong>Account and profile data:</strong> Retained until you delete your account</li>
          <li><strong>Application data:</strong> Retained for 12 months after the application is closed or withdrawn</li>
          <li><strong>Video content:</strong> Deleted from Cloudflare Stream within 30 days of account deletion</li>
          <li><strong>Notification records:</strong> Retained for 90 days</li>
          <li><strong>Inactive accounts:</strong> Accounts with no activity for 24 months may be deleted after 30 days' notice</li>
        </ul>
      </Section>

      <Section title="8. Your Rights Under the PDPA">
        <p style={p}>As an individual whose personal data we hold, you have the following rights:</p>
        <ul style={ul}>
          <li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right of correction:</strong> Request correction of inaccurate or incomplete personal data</li>
          <li><strong>Right to withdraw consent:</strong> Withdraw consent to the collection, use or disclosure of your data at any time (note: withdrawal may affect your ability to use the Platform)</li>
          <li><strong>Right to erasure:</strong> Request deletion of your account and all associated personal data using the "Delete Account" feature in your dashboard settings, or by contacting dpo@hireitright.com</li>
          <li><strong>Right to data portability:</strong> Request a copy of your data in a portable format</li>
        </ul>
        <p style={p}>To exercise any of these rights, contact our DPO at dpo@hireitright.com. We will respond within 30 days.</p>
      </Section>

      <Section title="9. Cookies">
        <p style={p}>HireItRight uses only essential cookies necessary for the Platform to function. We do not use tracking, advertising or analytics cookies. Essential cookies include:</p>
        <ul style={ul}>
          <li>Session authentication cookies (to keep you logged in)</li>
          <li>Security cookies set by Cloudflare to protect against bots</li>
        </ul>
        <p style={p}>You may disable cookies in your browser settings, but this may affect your ability to log in and use the Platform.</p>
      </Section>

      <Section title="10. Data Security">
        <p style={p}>We implement the following security measures to protect your personal data:</p>
        <ul style={ul}>
          <li>HTTPS/TLS encryption for all data in transit</li>
          <li>HSTS headers enforced sitewide</li>
          <li>Passwords are hashed and never stored in plaintext</li>
          <li>Profile photos stored in private storage with time-limited access tokens</li>
          <li>Videos accessible only via access-controlled platform</li>
          <li>Role-based access control (RLS) on all database tables</li>
          <li>Email OTP verification on account creation</li>
        </ul>
      </Section>

      <Section title="11. Data Breach Notification">
        In the event of a data breach that is likely to result in significant harm to affected individuals, we will notify the Personal Data Protection Commission (PDPC) within 3 calendar days of assessing the breach, and notify affected individuals as required by the PDPA. To report a suspected security incident, contact dpo@hireitright.com immediately.
      </Section>

      <Section title="12. Children's Data">
        HireItRight is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with their personal data, please contact dpo@hireitright.com and we will delete it promptly.
      </Section>

      <Section title="13. Changes to This Policy">
        We may update this Privacy Policy from time to time. Material changes will be communicated via email or via a notice on the Platform. Continued use of the Platform after changes take effect constitutes acceptance of the revised Policy. The current version is always available at hireitright.com/privacy.
      </Section>

      <Section title="14. Contact and Complaints">
        <p style={p}>For any questions, concerns or requests relating to this Privacy Policy or your personal data, contact our DPO at <a href="mailto:dpo@hireitright.com" style={{ color: '#1D9E75' }}>dpo@hireitright.com</a>.</p>
        <p style={p}>If you are not satisfied with our response, you have the right to lodge a complaint with the Personal Data Protection Commission (PDPC) at <a href="https://www.pdpc.gov.sg" target="_blank" rel="noreferrer" style={{ color: '#1D9E75' }}>pdpc.gov.sg</a>.</p>
      </Section>
    </div>
  )
}

const p = { marginBottom: 10 }
const ul = { paddingLeft: 20, marginBottom: 10, lineHeight: 1.8 }

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0ee' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function Table({ rows, headers }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
      {headers && (
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '8px 10px', background: '#1D9E75', color: '#fff', fontSize: 12, fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? '#f9f9f7' : '#fff' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0ee', verticalAlign: 'top', fontWeight: ci === 0 ? 500 : 400 }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
