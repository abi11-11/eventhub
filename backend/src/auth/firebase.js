/**
 * Firebase Authentication Service
 * 
 * Handles:
 * - Firebase ID Token verification (from client)
 * - User lookup/creation in database
 * - Custom JWT token issuance
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');
const jwtService = require('./jwt');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class FirebaseAuthService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_PROJECT_ID) {
        logger.warn('Firebase not configured. Running in mock mode.');
        this.initialized = false;
        return;
      }

      // Initialize only if credentials are available
      if (process.env.FIREBASE_PROJECT_ID) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.initialized = true;
        logger.info('Firebase Admin SDK initialized');
      }
    } catch (error) {
      logger.warn('Firebase initialization skipped:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Verify Firebase ID Token (from client) and extract user info
   * @param {string} idToken - Firebase ID Token from client
   * @returns {Object} { uid, phoneNumber, email }
   */
  async verifyFirebaseToken(idToken) {
    try {
      if (!this.initialized) {
        logger.warn('Firebase not initialized. Skipping token verification.');
        return null;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      logger.info(`Firebase token verified for user: ${decodedToken.uid}`);
      
      return {
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number || null,
        email: decodedToken.email || null,
      };
    } catch (error) {
      logger.error('Firebase token verification failed:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  /**
   * Get or create user in database
   * @param {string} phoneNumber - User phone number from Firebase
   * @param {string} firebaseUid - Firebase UID
   * @returns {Object} User record
   */
  async getOrCreateUser(phoneNumber, firebaseUid) {
    try {
      // Check if user exists
      let user = await db('users')
        .where('phone_number', phoneNumber)
        .first();

      if (user) {
        logger.info(`User found: ${user.id}`);
        return user;
      }

      // Create new user
      const userId = uuidv4();
      const newUser = {
        id: userId,
        phone_number: phoneNumber,
        first_name: 'User', // Default, can be updated later during onboarding
        is_verified: true, // Firebase verified phone
        is_active: true,
      };

      await db('users').insert(newUser);
      logger.info(`New user created: ${userId} (${phoneNumber})`);

      return newUser;
    } catch (error) {
      logger.error('Error getting/creating user:', error);
      throw new Error('Failed to process user');
    }
  }

  /**
   * Login with Firebase ID Token
   * Issues custom JWT tokens after Firebase verification
   * 
   * @param {string} idToken - Firebase ID Token from client
   * @returns {Object} { accessToken, refreshToken, user }
   */
  async login(idToken) {
    try {
      // In development mode without Firebase, allow mock token
      if (!this.initialized && process.env.NODE_ENV === 'development') {
        logger.warn('Using mock authentication in development mode');
        
        // Extract phone from mock token (format: mock:+919999999991)
        const phoneNumber = idToken.replace('mock:', '');
        
        if (!phoneNumber.startsWith('+')) {
          throw new Error('Mock token must start with "mock:" followed by phone number');
        }

        // Get or create user
        const user = await this.getOrCreateUser(phoneNumber, `mock_${phoneNumber}`);
        
        // Generate custom JWT tokens
        const tokens = jwtService.generateTokenPair(user.id, user.phone_number);

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            phoneNumber: user.phone_number,
            firstName: user.first_name,
            isVerified: user.is_verified,
          },
        };
      }

      // Standard Firebase verification
      const firebaseUser = await this.verifyFirebaseToken(idToken);
      
      if (!firebaseUser?.phoneNumber) {
        throw new Error('Firebase token must contain phone number');
      }

      // Get or create user in database
      const user = await this.getOrCreateUser(
        firebaseUser.phoneNumber,
        firebaseUser.uid
      );

      // Generate custom JWT tokens
      const tokens = jwtService.generateTokenPair(user.id, user.phone_number);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          firstName: user.first_name,
          isVerified: user.is_verified,
        },
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseAuthService();
