const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;

// Initialize Passport strategies
// Note: User model is passed in to avoid circular dependencies
const configurePassport = (User) => {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_secret',
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { googleId: profile.id },
          defaults: {
            username: profile.emails[0].value,
            googleId: profile.id
          }
        });
        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  ));

  // GitHub OAuth Strategy
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID || 'placeholder_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder_secret',
      callbackURL: "/auth/github/callback"
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { githubId: profile.id },
          defaults: {
            username: profile.username,
            githubId: profile.id
          }
        });
        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  ));

  // Microsoft OAuth Strategy
  passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID || 'placeholder_id',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'placeholder_secret',
      callbackURL: "/auth/microsoft/callback",
      tenant: process.env.MICROSOFT_TENANT_ID || 'common',
      scope: ['user.read']
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const [user, created] = await User.findOrCreate({
          where: { microsoftId: profile.id },
          defaults: {
            username: profile.emails && profile.emails.length > 0 
              ? profile.emails[0].value 
              : profile.userPrincipalName,
            microsoftId: profile.id
          }
        });
        return cb(null, user);
      } catch (err) {
        return cb(err, null);
      }
    }
  ));

  return passport;
};

module.exports = configurePassport;
