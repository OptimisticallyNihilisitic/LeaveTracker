import supabase from '../config/supabaseClient.js';
import redis from '../config/redisClient.js';
import { sendOtpEmail } from '../services/emailService.js';

const OTP_TTL_SECONDS = 600;       // 10 minutes
const MAX_ATTEMPTS = 5;

/** Generate a cryptographically simple 6-digit OTP */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── Step 1: Validate credentials, generate & send OTP ───────────────────────
export const initiateLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // Validate credentials using Supabase (anon client signInWithPassword)
  const { createClient } = await import('@supabase/supabase-js');
  const anonClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.session) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Sign out the temporary anon session immediately — we don't want them fully
  // logged in yet; the OTP step is still required.
  await anonClient.auth.signOut();

  // Generate OTP and store in Redis with TTL
  const otp = generateOtp();
  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  await redis.set(otpKey, otp, { ex: OTP_TTL_SECONDS });
  await redis.del(attemptsKey); // reset any leftover attempt counter

  // Send OTP email
  await sendOtpEmail(email, otp, 'login');

  return res.json({ message: 'OTP sent to your registered email' });
};

// ─── Step 2: Verify OTP, return real session tokens ──────────────────────────
export const verifyOtp = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(400).json({ error: 'email, password and otp are required' });
  }

  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  // Check attempt count first
  const attempts = (await redis.get(attemptsKey)) ?? 0;
  if (Number(attempts) >= MAX_ATTEMPTS) {
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    return res.status(429).json({ error: 'Too many failed attempts. Please login again.' });
  }

  // Fetch stored OTP
  const storedOtp = await redis.get(otpKey);

  if (!storedOtp) {
    return res.status(400).json({ error: 'OTP has expired. Please login again.' });
  }

  if (String(storedOtp) !== String(otp)) {
    // Increment failure counter (expire it alongside the OTP)
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, OTP_TTL_SECONDS);
    const remaining = MAX_ATTEMPTS - (Number(attempts) + 1);
    return res.status(400).json({
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    });
  }

  // OTP is valid — clean up Redis keys
  await redis.del(otpKey);
  await redis.del(attemptsKey);

  // Issue the real Supabase session
  const { createClient } = await import('@supabase/supabase-js');
  const anonClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.session) {
    return res.status(401).json({ error: 'Authentication failed. Please login again.' });
  }

  return res.json({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    expires_in: authData.session.expires_in,
  });
};
