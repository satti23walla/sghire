export default function Terms() {
  const lastUpdated = "July 2026"
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>Terms and Conditions</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Last updated: {lastUpdated}</p>

      <Section title="1. Acceptance of Terms">
        By accessing or using HireItRight ("the Platform", "we", "us"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the Platform. These terms apply to all users including candidates, employers and visitors.
      </Section>

      <Section title="2. Description of Service">
        HireItRight is a video-first, two-sided hiring platform that connects candidates and employers. The Platform allows candidates to create video profiles and apply for roles, and allows employers to post jobs, review applicants and manage the hiring process. HireItRight is accessible at hireitright.com.
      </Section>

      <Section title="3. User Accounts">
        <p style={p}>You must register for an account to use the Platform. You are responsible for:</p>
        <ul style={ul}>
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Providing accurate and complete information during registration</li>
          <li>Notifying us immediately of any unauthorised use of your account</li>
        </ul>
        <p style={p}>You must be at least 18 years of age to use HireItRight. By creating an account you confirm you meet this requirement.</p>
      </Section>

      <Section title="4. Candidate Obligations">
        As a candidate you agree to:
        <ul style={ul}>
          <li>Provide truthful, accurate and up-to-date information in your profile and applications</li>
          <li>Not misrepresent your qualifications, experience or identity</li>
          <li>Upload only content (including videos) that you have the right to share</li>
          <li>Not use the Platform to harass, spam or contact employers outside of the Platform's intended workflow</li>
          <li>Respect the confidentiality of any employer information you receive through the Platform</li>
        </ul>
      </Section>

      <Section title="5. Employer Obligations">
        As an employer you agree to:
        <ul style={ul}>
          <li>Post only genuine job listings for roles that actually exist</li>
          <li>Not discriminate against candidates on the basis of race, gender, age, religion, disability, nationality or any other protected characteristic</li>
          <li>Handle candidate data in accordance with applicable data protection laws including Singapore's Personal Data Protection Act (PDPA)</li>
          <li>Not share or distribute candidate profiles, videos or personal information to third parties without the candidate's consent</li>
          <li>Respond to candidates in a timely and professional manner</li>
          <li>Not use candidate information for any purpose other than the stated hiring process</li>
        </ul>
      </Section>

      <Section title="6. Video Content">
        <p style={p}>By uploading or recording video content on the Platform you confirm that:</p>
        <ul style={ul}>
          <li>You are the person appearing in the video or have obtained all necessary permissions</li>
          <li>The content does not violate any third-party intellectual property rights</li>
          <li>The content does not contain offensive, defamatory, misleading or illegal material</li>
          <li>You grant HireItRight a limited licence to store and display the video to authorised users of the Platform</li>
        </ul>
        <p style={p}>Video content is stored securely on Cloudflare Stream and is only accessible to users with appropriate access permissions. Employers may only view videos of candidates who have applied to their job listings.</p>
      </Section>

      <Section title="7. Privacy and Data Protection">
        Your use of the Platform is also governed by our Privacy Policy. We collect and process personal data in accordance with Singapore's Personal Data Protection Act (PDPA) 2012. By using the Platform you consent to such processing. You have the right to access, correct or delete your personal data by contacting us at hello@hireitright.com.
      </Section>

      <Section title="8. Intellectual Property">
        All content, trademarks, logos and intellectual property on the Platform (excluding user-generated content) are owned by or licensed to HireItRight. You may not reproduce, distribute or create derivative works without our express written consent. The HireItRight name, logo and penguin mark are proprietary to HireItRight.
      </Section>

      <Section title="9. Prohibited Conduct">
        You must not:
        <ul style={ul}>
          <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
          <li>Attempt to gain unauthorised access to any part of the Platform or other users' accounts</li>
          <li>Scrape, crawl or harvest data from the Platform without our permission</li>
          <li>Upload malware, viruses or any harmful code</li>
          <li>Create fake accounts or impersonate any person or organisation</li>
          <li>Post spam, unsolicited messages or misleading job listings</li>
          <li>Interfere with the security or proper functioning of the Platform</li>
        </ul>
      </Section>

      <Section title="10. Access Control and Security">
        HireItRight implements access controls to protect user privacy. Candidate profiles and videos are only accessible to employers whose job listings the candidate has applied to. Employer profiles are only accessible to candidates who have applied to their roles. Users must not attempt to circumvent these controls or access profiles they are not authorised to view.
      </Section>

      <Section title="11. Termination">
        We reserve the right to suspend or terminate your account at any time if you violate these Terms, without notice or liability. You may delete your account at any time by contacting hello@hireitright.com. Upon account deletion your personal data will be removed in accordance with our Privacy Policy and applicable law.
      </Section>

      <Section title="12. Disclaimers">
        <p style={p}>The Platform is provided on an "as is" and "as available" basis. We do not guarantee:</p>
        <ul style={ul}>
          <li>That the Platform will be uninterrupted, error-free or secure at all times</li>
          <li>That any job listing will result in a successful hire</li>
          <li>The accuracy or completeness of any user-generated content</li>
          <li>That candidates and employers will find a suitable match through the Platform</li>
        </ul>
        <p style={p}>HireItRight is a platform connecting candidates and employers. We are not a recruitment agency and are not responsible for hiring decisions made by employers.</p>
      </Section>

      <Section title="13. Limitation of Liability">
        To the fullest extent permitted by Singapore law, HireItRight shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the Platform. Our total liability to you for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim.
      </Section>

      <Section title="14. Changes to Terms">
        We may update these Terms from time to time. We will notify registered users of material changes by email or via the Platform. Continued use of the Platform after changes take effect constitutes your acceptance of the revised Terms.
      </Section>

      <Section title="15. Governing Law">
        These Terms are governed by the laws of the Republic of Singapore. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Singapore.
      </Section>

      <Section title="16. Contact Us">
        If you have any questions about these Terms, please contact us at:
        <div style={{ background: '#f9f9f7', borderRadius: 10, padding: '14px 18px', marginTop: 12, border: '0.5px solid #e0e0dc' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.8 }}>
            <strong>HireItRight</strong><br />
            Email: hello@hireitright.com<br />
            Website: hireitright.com<br />
            Singapore
          </p>
        </div>
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
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  )
}
