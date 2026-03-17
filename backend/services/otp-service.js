const crypto = require('crypto');
const twilio = require('twilio');
const hashService = require('./hash-service');

const smsSid = process.env.SMS_SID;
const smsAuthToken = process.env.SMS_AUTH_TOKEN;
const smsFrom = process.env.SMS_FROM_NUMBER;

const twilioClient = twilio(smsSid, smsAuthToken, { lazyLoading: true });

class OtpService {
  // Generate a 4-digit OTP
  generateOtp() {
    return crypto.randomInt(1000, 9999).toString();
  }

  // Send OTP via Twilio SMS
  async sendBySms(phone, otp) {
    if (!phone || !otp) {
      throw new Error('Phone number and OTP are required to send SMS.');
    }

    try {
      const message = await twilioClient.messages.create({
        to: phone,
        from: smsFrom,
        body: `Your CodersHouse OTP is ${otp}`,
      });

      console.log(`✅ OTP sent to ${phone}: SID ${message.sid}`);
      return message;
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${phone}:`, error.message);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify hashed OTP
  verifyOtp(hashedOtp, data) {
    if (!hashedOtp || !data) return false;
    const computedHash = hashService.hashOtp(data);
    return computedHash === hashedOtp;
  }
}

module.exports = new OtpService();
