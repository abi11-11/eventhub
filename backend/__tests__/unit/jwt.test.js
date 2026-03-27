/**
 * JWT Service Unit Tests
 * 
 * Tests for token generation, verification, and refresh logic
 */

const jwt = require('jsonwebtoken');
const jwtService = require('../../src/auth/jwt');

// Mock environment setup for tests
process.env.NODE_ENV = 'test';

describe('JWT Service', () => {
  const testPayload = {
    user_id: 'test-user-123',
    phone_number: '+919999999991',
  };

  describe('signAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtService.signAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = jwtService.signAccessToken(testPayload);
      const decoded = jwt.decode(token);
      
      expect(decoded.user_id).toBe(testPayload.user_id);
      expect(decoded.phone_number).toBe(testPayload.phone_number);
    });

    it('should have correct issuer', () => {
      const token = jwtService.signAccessToken(testPayload);
      const decoded = jwt.decode(token);
      
      expect(decoded.iss).toBe('eventhub-api');
    });

    it('should have RS256 algorithm', () => {
      const token = jwtService.signAccessToken(testPayload);
      const header = jwt.decode(token, { complete: true }).header;
      
      expect(header.alg).toBe('RS256');
    });
  });

  describe('signRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtService.signRefreshToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should have longer expiration than access token', () => {
      // Refresh tokens expire in 30d, access tokens in 7d
      const accessToken = jwtService.signAccessToken(testPayload);
      const refreshToken = jwtService.signRefreshToken(testPayload);
      
      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);
      
      // Refresh token should expire later
      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwtService.signAccessToken(testPayload);
      const decoded = jwtService.verifyToken(token);
      
      expect(decoded.user_id).toBe(testPayload.user_id);
      expect(decoded.phone_number).toBe(testPayload.phone_number);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwtService.verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });

    it('should throw error for tampered payload', () => {
      const token = jwtService.signAccessToken(testPayload);
      const parts = token.split('.');
      
      // Modify payload
      const tamperedPayload = Buffer.from(JSON.stringify({ user_id: 'hacker' }))
        .toString('base64')
        .replace(/=/g, '');
      
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      
      expect(() => {
        jwtService.verifyToken(tamperedToken);
      }).toThrow('Invalid token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const result = jwtService.generateTokenPair(
        testPayload.user_id,
        testPayload.phone_number
      );
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should generate different access and refresh tokens', () => {
      const result = jwtService.generateTokenPair(
        testPayload.user_id,
        testPayload.phone_number
      );
      
      expect(result.accessToken).not.toBe(result.refreshToken);
    });

    it('should mark tokens with correct type', () => {
      const result = jwtService.generateTokenPair(
        testPayload.user_id,
        testPayload.phone_number
      );
      
      const accessDecoded = jwt.decode(result.accessToken);
      const refreshDecoded = jwt.decode(result.refreshToken);
      
      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens from valid refresh token', () => {
      const pair1 = jwtService.generateTokenPair(
        testPayload.user_id,
        testPayload.phone_number
      );
      
      const pair2 = jwtService.refreshTokens(pair1.refreshToken);
      
      expect(pair2).toHaveProperty('accessToken');
      expect(pair2).toHaveProperty('refreshToken');
      expect(pair2.accessToken).not.toBe(pair1.accessToken);
    });

    it('should throw error if refresh token type is wrong', () => {
      // Create an "access" token and try to refresh with it
      const accessToken = jwtService.signAccessToken({
        ...testPayload,
        type: 'access',
      });
      
      expect(() => {
        jwtService.refreshTokens(accessToken);
      }).toThrow('Invalid token type');
    });

    it('should preserve user_id across refreshes', () => {
      const pair1 = jwtService.generateTokenPair(
        testPayload.user_id,
        testPayload.phone_number
      );
      
      const pair2 = jwtService.refreshTokens(pair1.refreshToken);
      
      const decoded1 = jwt.decode(pair1.accessToken);
      const decoded2 = jwt.decode(pair2.accessToken);
      
      expect(decoded1.user_id).toBe(decoded2.user_id);
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired token', (done) => {
      // Create an immediately-expired token
      const expiredToken = jwt.sign(testPayload, jwtService.privateKey, {
        algorithm: 'RS256',
        expiresIn: '0s', // Expires immediately
        issuer: 'eventhub-api',
      });

      // Wait a bit to ensure expiration
      setTimeout(() => {
        expect(() => {
          jwtService.verifyToken(expiredToken);
        }).toThrow('Token has expired');
        done();
      }, 100);
    });
  });
});
