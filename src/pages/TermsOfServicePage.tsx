import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <h1 
          className="text-4xl font-bold text-foreground mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using StarPath ("the Service"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              StarPath is a gamified habit tracking application that helps users build and maintain 
              positive habits through goal setting, progress tracking, achievements, and social features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One person may not maintain more than one account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload malicious content or attempt to compromise the Service</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use automated systems or bots to access the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. User Content</h2>
            <p>
              You retain ownership of content you create (habits, goals, messages, profile information). 
              By using the Service, you grant us a license to store, display, and process your content 
              as necessary to provide the Service.
            </p>
            <p>
              You are solely responsible for your content and must ensure it does not violate any 
              laws or third-party rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and content (excluding user content), 
              is owned by StarPath and protected by intellectual property laws. You may not copy, 
              modify, or distribute any part of the Service without our permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee 
              that the Service will be uninterrupted, secure, or error-free. We are not responsible 
              for any loss of data or damages resulting from your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, StarPath shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or 
              revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms. 
              You may also delete your account at any time through the Settings page. Upon termination, 
              your data will be deleted in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify users of significant changes. 
              Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Contact</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-foreground font-medium">clawzer96@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
