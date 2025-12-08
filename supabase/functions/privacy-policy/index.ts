/**
 * Supabase Edge Function: Privacy Policy
 * 
 * This function serves the Privacy Policy page required by Facebook OAuth.
 * 
 * Endpoint: https://your-project.supabase.co/functions/v1/privacy-policy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PRIVACY_POLICY_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - Business Virtual Assistant</title>
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
    ul {
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
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="last-updated"><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h2>1. Introduction</h2>
    <p>Welcome to Business Virtual Assistant (BVA). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service, including when you authenticate using Facebook OAuth.</p>
    
    <h2>2. Data Collection</h2>
    <p>We collect the following information when you use Facebook OAuth:</p>
    <ul>
      <li><strong>Email address</strong> - Used for account identification and communication</li>
      <li><strong>Public profile information</strong> - Your name and profile picture</li>
      <li><strong>Facebook Page access</strong> - For ad publishing features (with your permission)</li>
      <li><strong>Facebook User ID</strong> - To link your Facebook account to your BVA account</li>
    </ul>
    
    <p>We also collect information you provide directly, such as:</p>
    <ul>
      <li>Account registration information</li>
      <li>Product and shop data</li>
      <li>Usage data and analytics</li>
    </ul>
    
    <h2>3. How We Use Your Information</h2>
    <p>Your information is used to:</p>
    <ul>
      <li>Authenticate and manage your account</li>
      <li>Enable ad publishing to Facebook Pages and Instagram</li>
      <li>Provide personalized services and recommendations</li>
      <li>Improve our platform and develop new features</li>
      <li>Communicate with you about your account and our services</li>
      <li>Comply with legal obligations</li>
    </ul>
    
    <h2>4. Data Storage and Security</h2>
    <p>Your data is stored securely in our database and is not shared with third parties except:</p>
    <ul>
      <li>As necessary to provide our services (e.g., with Facebook/Meta for ad publishing)</li>
      <li>As required by law or legal process</li>
      <li>With your explicit consent</li>
    </ul>
    
    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
    
    <h2>5. Data Retention</h2>
    <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.</p>
    
    <h2>6. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access</strong> - Request a copy of your personal data</li>
      <li><strong>Correction</strong> - Request correction of inaccurate data</li>
      <li><strong>Deletion</strong> - Request deletion of your data (see Data Deletion Instructions)</li>
      <li><strong>Portability</strong> - Request transfer of your data</li>
      <li><strong>Objection</strong> - Object to processing of your data</li>
    </ul>
    
    <h2>7. Third-Party Services</h2>
    <p>Our service integrates with third-party services including:</p>
    <ul>
      <li><strong>Facebook/Meta</strong> - For OAuth authentication and ad publishing</li>
      <li><strong>Supabase</strong> - For authentication and database services</li>
    </ul>
    <p>These services have their own privacy policies. We encourage you to review them.</p>
    
    <h2>8. Cookies and Tracking</h2>
    <p>We use cookies and similar technologies to enhance your experience, analyze usage, and assist with authentication.</p>
    
    <h2>9. Children's Privacy</h2>
    <p>Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.</p>
    
    <h2>10. Changes to This Privacy Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
    
    <h2>11. Contact Us</h2>
    <div class="contact">
      <p>If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
      <p>
        <strong>Email:</strong> <a href="mailto:dagodemarcgerald@gmail.com">dagodemarcgerald@gmail.com</a>
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
    return new Response(PRIVACY_POLICY_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error serving privacy policy:", error);
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

