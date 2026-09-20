import { config } from '../config.js';

export function sanitizeMessage(value) {
  if (typeof value !== 'string') {
    const error = new Error('Message is required.');
    error.statusCode = 400; error.code = 'INVALID_MESSAGE';
    throw error;
  }
  const message = value.trim();
  if (message.length > config.MAX_MESSAGE_LENGTH) {
    const error = new Error('Message must be 4000 characters or fewer.');
    error.statusCode = 400; error.code = 'MESSAGE_TOO_LONG';
    throw error;
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) {
    const error = new Error('Message contains invalid control characters.');
    error.statusCode = 400; error.code = 'INVALID_MESSAGE';
    throw error;
  }
  if (!message) {
    const error = new Error('Message is required.');
    error.statusCode = 400; error.code = 'INVALID_MESSAGE';
    throw error;
  }
  return message;
}
