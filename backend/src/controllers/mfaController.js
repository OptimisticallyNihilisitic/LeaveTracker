import { createClient } from '@supabase/supabase-js';
import redis from '../config/redisClient.js';
import { sendOtpEmail } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const OTP_TTL_SECONDS = 600;
const MAX_ATTEMPTS = 5;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const makeAnonClient = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Validate credentials -> generate & send OTP
export const initiateLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const anonClient = makeAnonClient();
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.session) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    //session logout for mfa
    await anonClient.auth.signOut();

    const otp = generateOtp();
    const otpKey = `otp:${email}`;
    const attemptsKey = `otp_attempts:${email}`;

    await redis.set(otpKey, otp, { ex: OTP_TTL_SECONDS });
    await redis.del(attemptsKey); 

    await sendOtpEmail(email, otp, 'login');

    return res.json({ message: 'OTP sent to your registered email' });
  } catch (err) {
    console.error('[initiateLogin] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//Verify OTP -> return real session tokens
export const verifyOtp = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ error: 'email, password and otp are required' });
    }

    const otpKey = `otp:${email}`;
    const attemptsKey = `otp_attempts:${email}`;

    // Brute-force guard
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
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, OTP_TTL_SECONDS);
      const remaining = MAX_ATTEMPTS - (Number(attempts) + 1);
      return res.status(400).json({
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP valid — clean up Redis
    await redis.del(otpKey);
    await redis.del(attemptsKey);

    // Issue a real Supabase session and return tokens to the frontend
    const anonClient = makeAnonClient();
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
  } catch (err) {
    console.error('[verifyOtp] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
