import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import nodemailer from 'nodemailer';

// Mock Nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'mock_message_id' });
vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn().mockImplementation(() => {
        return {
          sendMail: mockSendMail,
        };
      }),
    },
  };
});

// Import modules under test after mock
import { sendEmailNotification, isSMTPConfigured } from '../lib/email';
import { POST as POST_email_send } from '../app/api/email/send/route';

describe('Email Notification System', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isSMTPConfigured', () => {
    it('should return false if credentials are missing', () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;
      expect(isSMTPConfigured()).toBe(false);
    });

    it('should return true if SMTP_USER and SMTP_PASSWORD are configured', () => {
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASSWORD = 'password123';
      expect(isSMTPConfigured()).toBe(true);
    });
  });

  describe('sendEmailNotification (Mock Mode)', () => {
    it('should not invoke sendMail when credentials are missing (runs in console mock mode)', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const result = await sendEmailNotification({
        to: 'user@example.com',
        type: 'welcome',
        data: { name: 'Sarah Jenkins' },
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('sendEmailNotification (Active SMTP Mode)', () => {
    beforeEach(() => {
      process.env.SMTP_USER = 'instaflowauto@gmail.com';
      process.env.SMTP_PASSWORD = 'app_password_123';
    });

    it('should call sendMail for welcome email with proper HTML formatting', async () => {
      const result = await sendEmailNotification({
        to: 'newuser@example.com',
        type: 'welcome',
        data: { name: 'Alice Smith' },
      });

      expect(result.success).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Auto Insta Flow" <instaflowauto@gmail.com>',
          to: 'newuser@example.com',
          subject: 'Welcome to Auto Insta Flow! 🚀',
          html: expect.stringContaining('Welcome to Auto Insta Flow, Alice Smith!'),
        })
      );
    });

    it('should call sendMail for plan upgrade email with active plan values', async () => {
      const result = await sendEmailNotification({
        to: 'customer@example.com',
        type: 'plan_activated',
        data: {
          name: 'Jane Doe',
          plan: 'pro',
          cycle: 'monthly',
          quota: 5000,
        },
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: 'Subscription Activated: PRO Plan 💎',
          html: expect.stringContaining('pro Plan'),
        })
      );
    });

    it('should call sendMail for connected Instagram account', async () => {
      const result = await sendEmailNotification({
        to: 'creator@example.com',
        type: 'instagram_connected',
        data: {
          name: 'Bob',
          igUsername: 'bob_creator',
          followersCount: 12500,
        },
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'creator@example.com',
          subject: 'Instagram Linked: @bob_creator 🔗',
          html: expect.stringContaining('@bob_creator'),
        })
      );
    });

    it('should call sendMail for disconnected Instagram account', async () => {
      const result = await sendEmailNotification({
        to: 'creator@example.com',
        type: 'instagram_disconnected',
        data: {
          name: 'Bob',
          igUsername: 'bob_creator',
        },
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'creator@example.com',
          subject: 'Instagram Profile Disconnected: @bob_creator ⚠️',
          html: expect.stringContaining('@bob_creator'),
        })
      );
    });

    it('should call sendMail for promotional broadcast', async () => {
      const result = await sendEmailNotification({
        to: 'marketing@example.com',
        type: 'promotional',
        data: {
          promoTitle: 'Huge Summer Update! ☀️',
          promoContentHtml: '<p>Get 20% off all plans today.</p>',
          promoCtaText: 'Claim Discount',
          promoCtaUrl: 'https://example.com/summer-promo',
        },
      });

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'marketing@example.com',
          subject: 'Huge Summer Update! ☀️',
          html: expect.stringContaining('Claim Discount'),
        })
      );
    });
  });

  describe('POST /api/email/send API Route', () => {
    it('should return 400 if to or type parameter is missing', async () => {
      const request = new Request('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ to: 'someone@example.com' }), // missing 'type'
      });

      const response = await POST_email_send(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('to and type are required');
    });

    it('should return 200 and return status queued', async () => {
      const request = new Request('http://localhost/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: 'client@example.com',
          type: 'welcome',
          data: { name: 'Client User' },
        }),
      });

      const response = await POST_email_send(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('queued');
    });
  });
});
