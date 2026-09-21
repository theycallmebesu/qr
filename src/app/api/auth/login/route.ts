import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken, setAuthCookie, getClientIp } from '@/lib/auth';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkLoginRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateLimit.resetMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Default fallback hash for 'spnh' if env is not yet reloaded by dev server
    const fallbackHash = '$2a$10$2UKMYRbYp59jIfG6V2DCAOwgK0KDOTxeFCX2WzRhGIMOPGGRgbALu';
    const adminHash = process.env.ADMIN_PASSWORD_HASH || fallbackHash;

    const isMatch = await bcrypt.compare(password, adminHash);

    if (!isMatch) {
      return NextResponse.json(
        {
          error: 'Incorrect admin password',
          remainingAttempts: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Reset rate limit on success
    resetLoginRateLimit(ip);

    // Sign JWT token and set in secure cookie
    const token = signAdminToken();
    const response = NextResponse.json(
      { success: true, message: 'Authentication successful' },
      { status: 200 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
