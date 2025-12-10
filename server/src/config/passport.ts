// src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from "passport-facebook";
import prisma from "../lib/prisma";

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
  const baseURL = process.env.BASE_URL || process.env.BACKEND_URL || "http://localhost:3000";
  const callbackURL = `${baseURL}/api/auth/google/callback`;
  
  console.log(`🔗 Google OAuth callback URL: ${callbackURL}`);

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

          // Extract role from state if available (passed through OAuth flow)
          // The state is available in req.query.state in the callback, but we need to get it here
          // We'll use a workaround: store role in a temporary way or get it from the request
          // For now, we'll default to BUYER and let the callback handle role assignment
          // The role will be determined from the state in the callback route
          let defaultRole: "BUYER" | "SELLER" = "BUYER";

          // Check if user exists (by email and BVA platform first, then by googleId and BVA)
          // Note: Platform-specific lookup happens in callback route
          // Passport strategy just needs to find/create a temporary user for OAuth flow
          let user = await prisma.user.findFirst({
            where: { 
              email,
              platform: "BVA", // Default platform for passport strategy
            },
          });

          // If user not found by email, try by googleId with BVA platform
          if (!user && profile.id) {
            try {
              user = await prisma.user.findFirst({
                where: { 
                  googleId: profile.id,
                  platform: "BVA",
                },
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
          // Note: Role will be set to BUYER by default, but can be updated in callback if needed
          // For new users, we default to BUYER for shopee-clone compatibility
          // SELLER role assignment happens in the callback route if state indicates it
          try {
            user = await prisma.user.create({
              data: {
                email,
                password: null, // Google users don't need a password
                googleId: profile.id,
                name: profile.displayName || null,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                role: "BUYER", // Default to BUYER, can be updated in callback if state indicates SELLER
                platform: "BVA", // Default to BVA, callback route will create platform-specific user
              },
            }).catch(async (error: any) => {
              // Handle race condition - if email already exists, fetch the user
              // Try to find by email and platform BVA (default)
              if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                const existingUser = await prisma.user.findFirst({
                  where: { 
                    email,
                    platform: "BVA",
                  },
                });
                if (existingUser) {
                  // Update googleId if missing
                  if (!existingUser.googleId && profile.id) {
                    return await prisma.user.update({
                      where: { id: existingUser.id },
                      data: { googleId: profile.id },
                    });
                  }
                  return existingUser;
                }
              }
              throw error;
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

          // Create a shop for the new user (only if they're a SELLER)
          // No automatic data seeding - data will come from Shopee-Clone webhooks
          if (user.role === "SELLER") {
            await prisma.shop.create({
              data: {
                name: `${profile.displayName || "My"}'s Shop`,
                ownerId: user.id,
              },
            });
          }

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

// Function to initialize Facebook Strategy (called after env is loaded)
export const initializeFacebookStrategy = () => {
  const clientID = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("⚠️  Facebook OAuth not configured: Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET");
    return;
  }

  // Configure Facebook OAuth Strategy
  const baseURL = process.env.BASE_URL || process.env.BACKEND_URL || "http://localhost:3000";
  const callbackURL = `${baseURL}/api/auth/facebook/callback`;
  
  console.log(`🔗 Facebook OAuth callback URL: ${callbackURL}`);

  passport.use(
    new FacebookStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        profileFields: ['id', 'displayName', 'email', 'first_name', 'last_name'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: FacebookProfile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const facebookId = profile.id;

          if (!email && !facebookId) {
            return done(new Error("No email or Facebook ID found in profile"), null);
          }

          // Check if user exists (by email and BVA platform first, then by facebookId and BVA)
          // Note: Platform-specific lookup happens in callback route
          let user = email ? await prisma.user.findFirst({
            where: { 
              email,
              platform: "BVA", // Default platform for passport strategy
            },
          }) : null;

          // If user not found by email, try by facebookId with BVA platform
          if (!user && facebookId) {
            try {
              user = await prisma.user.findFirst({
                where: { 
                  facebookId,
                  platform: "BVA",
                },
              });
            } catch (error: any) {
              // If facebookId column doesn't exist yet (migration not run), ignore the error
              if (!error.message?.includes("does not exist")) {
                throw error;
              }
            }
          }

          if (user) {
            // User exists, update facebookId if not set and column exists
            if (facebookId) {
              try {
                if (!user.facebookId) {
                  user = await prisma.user.update({
                    where: { id: user.id },
                    data: { facebookId },
                  });
                }
              } catch (error: any) {
                // If facebookId column doesn't exist yet, skip the update
                if (error.message?.includes("does not exist")) {
                  console.warn("⚠️  facebookId column not found. Please run migration: npx prisma migrate dev");
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
                email: email || `facebook_${facebookId}@facebook.com`,
                password: null, // Facebook users don't need a password
                facebookId,
                name: profile.displayName || null,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                role: "SELLER",
                platform: "BVA", // Default to BVA, callback route will create platform-specific user
              },
            }).catch(async (error: any) => {
              // Handle race condition - if email already exists, fetch the user
              if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                const existingUser = await prisma.user.findFirst({
                  where: { 
                    email: email || `facebook_${facebookId}@facebook.com`,
                    platform: "BVA",
                  },
                });
                if (existingUser) {
                  // Update facebookId if missing
                  if (!existingUser.facebookId && facebookId) {
                    return await prisma.user.update({
                      where: { id: existingUser.id },
                      data: { facebookId },
                    });
                  }
                  return existingUser;
                }
              }
              throw error;
            });
          } catch (error: any) {
            // If facebookId column doesn't exist, create without it
            if (error.message?.includes("does not exist")) {
              console.warn("⚠️  facebookId column not found. Creating user without facebookId. Please run migration: npx prisma migrate dev");
              user = await prisma.user.create({
                data: {
                  email: email || `facebook_${facebookId}@facebook.com`,
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

          // Create a shop for the new user (only if they're a SELLER)
          if (user.role === "SELLER") {
            await prisma.shop.create({
              data: {
                name: `${profile.displayName || "My"}'s Shop`,
                ownerId: user.id,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Facebook OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );

  console.log("✅ Facebook OAuth strategy initialized");
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
