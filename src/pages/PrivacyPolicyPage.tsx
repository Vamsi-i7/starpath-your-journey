import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicyPage = () => {
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
          Privacy Policy
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to StarPath ("we," "our," or "us"). We are committed to protecting your privacy 
              and personal information. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our habit tracking application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (for account creation and authentication)</li>
              <li>Username (for profile identification)</li>
              <li>Profile picture (optional, if you choose to upload one)</li>
              <li>Bio information (optional)</li>
            </ul>
            
            <h3 className="text-xl font-medium text-foreground">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Habits you create and track</li>
              <li>Goals and progress data</li>
              <li>Achievement and XP information</li>
              <li>Messages sent to friends within the app</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our service</li>
              <li>Track your habits and display your progress</li>
              <li>Enable social features like friends and messaging</li>
              <li>Send you notifications about your habits and achievements</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates or support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect 
              your personal information. Your data is stored securely using industry-standard 
              encryption and access controls. However, no method of transmission over the Internet 
              is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may 
              share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Cookies and Tracking</h2>
            <p>
              We use essential cookies and local storage to maintain your session and preferences 
              (such as theme settings). We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-foreground font-medium">clawzer96@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
