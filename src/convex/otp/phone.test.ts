import { describe, expect, it } from 'vitest';
import { isValidIndianMobile, maskPhone, normalizeIndianMobile, toIndianNationalNumber } from './phone';

describe('normalizeIndianMobile', () => {
	// If two spellings of one number normalised differently, they would become two accounts
	it.each([
		'9876543210',
		'09876543210',
		'919876543210',
		'+919876543210',
		'+91 98765-43210',
		'+91-9876543210',
		'(98765) 43210',
		'98765.43210'
	])('turns "%s" into the one canonical number', (input) => {
		expect(normalizeIndianMobile(input)).toBe('+919876543210');
	});

	it.each([
		['a number starting 5, which is not a mobile', '5876543210'],
		['too short', '98765432'],
		['too long', '+9198765432101'],
		['another country', '+14155552671'],
		['letters', '98765abcde'],
		['empty', '']
	])('refuses %s', (_why, input) => {
		expect(normalizeIndianMobile(input)).toBeNull();
	});
});

describe('isValidIndianMobile', () => {
	it('accepts only the canonical form, so a loose spelling cannot reach the database', () => {
		expect(isValidIndianMobile('+919876543210')).toBe(true);
		expect(isValidIndianMobile('9876543210')).toBe(false);
		expect(isValidIndianMobile('+91 9876543210')).toBe(false);
		expect(isValidIndianMobile('+915876543210')).toBe(false);
	});
});

describe('toIndianNationalNumber', () => {
	it('gives the ten digits Indian providers expect', () => {
		expect(toIndianNationalNumber('+919876543210')).toBe('9876543210');
	});
});

describe('maskPhone', () => {
	it('keeps the country code and last four digits only, for logs', () => {
		const masked = maskPhone('+919876543210');
		expect(masked).toBe('+91******3210');
		expect(masked).not.toContain('98765');
	});

	it('never echoes something too short to mask safely', () => {
		expect(maskPhone('+91')).toBe('***');
	});
});
