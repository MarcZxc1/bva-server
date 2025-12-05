// src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "../lib/prisma";
import { seedShopData } from "../service/shopSeed.service";

// Function to initialize Google Strategy (called after env is loaded)
export const initializeGoogleStrategy = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("⚠️  Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  // Configure Google OAuth Strategy
  // Use absolute URL if BASE_URL is set, otherwise use relative path
  const baseURL = process.env.BASE_URL || "";
  const callbackURL = baseURL
    ? `${baseURL}/api/auth/google/callback`
    : "/api/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
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

          // Check if user exists (by email first, then by googleId if column exists)
          let user = await prisma.user.findUnique({
            where: { email },
          });

          // If user not found by email, try by googleId (if column exists)
          if (!user && profile.id) {
            try {
              user = await prisma.user.findUnique({
                where: { googleId: profile.id },
              });
            } catch (error: any) {
              // If googleId column doesn't exist yet (migration not run), ignore the error
              // and continue with email-only lookup
              if (!error.message?.includes("does not exist")) {
                throw error;
              }
            }
          }

          if (user) {
            // User exists, update googleId if not set and column exists
            if (profile.id) {
              try {
                if (!user.googleId) {
                  user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.id },
                  });
                }
              } catch (error: any) {
                // If googleId column doesn't exist yet, skip the update
                // The migration needs to be run first
                if (error.message?.includes("does not exist")) {
                  console.warn("⚠️  googleId column not found. Please run migration: npx prisma migrate dev");
                } else {
                  throw error;
                }
              }
            }
            // Return existing user
            return done(null, user);
          }

          // Scenario B: New User - Create user, shop, and seed data
          // Create the user
          try {
            user = await prisma.user.create({
              data: {
                email,
                password: null, // Google users don't need a password
                googleId: profile.id,
                name: profile.displayName || null,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                role: "SELLER",
              },
            });
          } catch (error: any) {
            // If googleId column doesn't exist, create without it
            if (error.message?.includes("does not exist")) {
              console.warn("⚠️  googleId column not found. Creating user without googleId. Please run migration: npx prisma migrate dev");
          user = await prisma.user.create({
            data: {
              email,
                  password: null,
              name: profile.displayName || null,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              role: "SELLER",
            },
          });
            } else {
              throw error;
            }
          }

          // Create a shop for the new user
          const shop = await prisma.shop.create({
            data: {
              name: `${profile.displayName || "My"}'s Shop`,
              ownerId: user.id,
            },
          });

          // Seed the shop with fake store data (products, inventory, sales)
          // This runs asynchronously to avoid blocking the OAuth callback
          seedShopData(shop.id).catch((error) => {
            console.error(`❌ Error seeding shop ${shop.id}:`, error);
            // Don't fail the OAuth flow if seeding fails
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
