/**
 * Supabase Edge Function: Terms of Service
 * 
 * This function serves the Terms of Service page required by Facebook OAuth.
 * 
 * Endpoint: https://your-project.supabase.co/functions/v1/terms-of-service
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TERMS_OF_SERVICE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Terms of Service - Business Virtual Assistant</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1877f2;
      border-bottom: 3px solid #1877f2;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    p {
      margin-bottom: 15px;
      color: #666;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 8px;
      color: #666;
    }
    .last-updated {
      color: #999;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .contact {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-top: 30px;
    }
    a {
      color: #1877f2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Terms of Service</h1>
    <p class="last-updated"><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using the Business Virtual Assistant (BVA) platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
    
    <h2>2. Use License</h2>
    <p>Permission is granted to temporarily use the BVA platform for personal and commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
    <ul>
      <li>Modify or copy the materials</li>
      <li>Use the materials for any commercial purpose without explicit permission</li>
      <li>Attempt to decompile or reverse engineer any software</li>
      <li>Remove any copyright or other proprietary notations from the materials</li>
      <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
    </ul>
    
    <h2>3. User Accounts</h2>
    <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.</p>
    <p>You agree not to:</p>
    <ul>
      <li>Share your account credentials with others</li>
      <li>Create multiple accounts to circumvent restrictions</li>
      <li>Use another user's account without permission</li>
    </ul>
    
    <h2>4. OAuth Authentication</h2>
    <p>By using Facebook OAuth to authenticate, you agree to:</p>
    <ul>
      <li>Allow BVA to access your basic profile information (name, email)</li>
      <li>Allow BVA to access your Facebook Pages (for ad publishing features)</li>
      <li>Understand that BVA will store necessary tokens to provide these services</li>
      <li>Comply with Facebook's Terms of Service and Platform Policy</li>
    </ul>
    
    <div class="warning">
      <p><strong>Important:</strong> You can revoke access to your Facebook account at any time through your Facebook account settings or by disconnecting through BVA.</p>
    </div>
    
    <h2>5. Service Availability</h2>
    <p>We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole discretion without notice. We will not be liable if, for any reason, all or any part of our service is unavailable at any time or for any period.</p>
    
    <h2>6. Prohibited Uses</h2>
    <p>You may not use our service:</p>
    <ul>
      <li>In any way that violates any applicable law or regulation</li>
      <li>To transmit any malicious code or viruses</li>
      <li>To impersonate or attempt to impersonate the company or any employee</li>
      <li>In any way that infringes upon the rights of others</li>
      <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the service</li>
      <li>To publish or distribute spam, unsolicited, or bulk electronic communications</li>
    </ul>
    
    <h2>7. Intellectual Property</h2>
    <p>The service and its original content, features, and functionality are and will remain the exclusive property of BVA and its licensors. The service is protected by copyright, trademark, and other laws.</p>
    
    <h2>8. Limitation of Liability</h2>
    <p>In no event shall BVA, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.</p>
    
    <h2>9. Disclaimer</h2>
    <p>The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, BVA excludes all representations, warranties, and conditions relating to our service and the use of this service.</p>
    
    <h2>10. Indemnification</h2>
    <p>You agree to defend, indemnify, and hold harmless BVA and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees).</p>
    
    <h2>11. Termination</h2>
    <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
    
    <h2>12. Changes to Terms</h2>
    <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
    <p>What constitutes a material change will be determined at our sole discretion.</p>
    
    <h2>13. Governing Law</h2>
    <p>These Terms shall be interpreted and governed by the laws of the jurisdiction in which BVA operates, without regard to its conflict of law provisions.</p>
    
    <h2>14. Contact Information</h2>
    <div class="contact">
      <p>If you have any questions about these Terms of Service, please contact us:</p>
      <p>
        <strong>Email:</strong> <a href="mailto:dagodemarcgerald@gmail.com">dagodemarcgerald@gmail.com</a>
      </p>
      <p>
        <strong>Privacy Policy:</strong> <a href="/privacy-policy">Privacy Policy</a>
      </p>
      <p>
        <strong>Data Deletion:</strong> <a href="/data-deletion-instructions">Data Deletion Instructions</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
      },
    });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    // Return HTML response
    // Note: Supabase may require apikey header, but we'll return the content anyway
    // The apikey is automatically available in Edge Functions via Deno.env
    return new Response(TERMS_OF_SERVICE_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error serving terms of service:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

