// src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "../lib/prisma";
import crypto from "crypto";

// Function to initialize Google Strategy (called after env is loaded)
export const initializeGoogleStrategy = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("⚠️  Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // User exists, return them
            return done(null, user);
          }

          // User doesn't exist, create a new one
          // Generate a secure random password (user won't need it for Google login)
          const randomPassword = crypto.randomBytes(32).toString("hex");

          // Create the user
          user = await prisma.user.create({
            data: {
              email,
              password: randomPassword, // Random password since they use Google
              name: profile.displayName || null,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              role: "SELLER",
            },
          });

          // Optionally create a demo shop for the new user
          await prisma.shop.create({
            data: {
              name: `${profile.displayName || "My"}'s Shop`,
              ownerId: user.id,
            },
          });

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  console.log("✅ Google OAuth strategy initialized");
};

// Serialize user for session (we're using JWT, so minimal serialization)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
