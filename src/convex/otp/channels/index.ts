import type { OtpChannel, OtpChannelId } from '../types';
import { consoleChannel } from './console';
import { fast2sms } from './fast2sms';
import { textbee } from './textbee';
import { whatsapp } from './whatsapp';

export const CHANNELS: Record<OtpChannelId, OtpChannel> = {
	textbee, // phase 1
	whatsapp, // phase 2
	fast2sms, // phase 3
	console: consoleChannel // dev only
};
