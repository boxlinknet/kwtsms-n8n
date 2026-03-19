import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	NodeApiError,
	IDataObject,
} from 'n8n-workflow';

/**
 * Returns a human-readable error message for a kwtSMS API error code.
 *
 * @param code - The error code string returned by the API (e.g. "ERR001").
 * @returns A descriptive error message.
 */
export function getErrorMessage(code: string): string {
	const map: Record<string, string> = {
		ERR001: 'API is disabled on this account',
		ERR002: 'Missing required parameter',
		ERR003: 'Authentication failed. Check your API username and password.',
		ERR004: 'This account does not have API access',
		ERR005: 'Account is blocked',
		ERR006: 'No valid phone numbers provided',
		ERR007: 'Too many numbers. Maximum 200 per request.',
		ERR008: 'Sender ID is banned',
		ERR009: 'Message text is empty',
		ERR010: 'Account balance is zero',
		ERR011: 'Insufficient balance for this send',
		ERR012: 'Message exceeds maximum length (7 pages)',
		ERR013: 'Send queue is full. Please retry in a moment.',
		ERR019: 'No delivery reports found',
		ERR020: 'Message does not exist',
		ERR021: 'No delivery report available for this message',
		ERR022: 'Delivery reports not ready yet. Try again later.',
		ERR023: 'Unknown delivery report error',
		ERR024: 'Your IP is not in the API whitelist',
		ERR025: 'Invalid number format. Use digits only, no + or 00 prefix.',
		ERR026: 'No route for this country. Contact kwtSMS to activate.',
		ERR027: 'HTML tags are not allowed in messages',
		ERR028: 'Must wait 15 seconds before sending to the same number again',
		ERR029: 'Message does not exist or invalid message ID',
		ERR030: 'Message stuck in queue with error. Delete from queue to recover credits.',
		ERR031: 'Message rejected: prohibited content detected',
		ERR032: 'Message rejected: spam detected',
		ERR033: 'No active coverage. Contact kwtSMS to activate.',
	};

	return map[code] ?? `Unknown error (${code})`;
}

/**
 * Sends a request to the kwtSMS API.
 *
 * Credentials (username and password) are merged into the request body
 * automatically from the stored n8n credentials.
 *
 * @param method   - HTTP method (GET, POST, etc.).
 * @param endpoint - API endpoint path, appended to the base URL.
 * @param body     - Optional request body parameters.
 * @returns The parsed JSON response from the API.
 * @throws NodeApiError if the API returns an error result.
 */
export async function kwtSmsApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
): Promise<IDataObject> {
	let response: IDataObject;

	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'kwtSmsApi', {
			method,
			url: `https://www.kwtsms.com/API${endpoint}`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body,
			returnFullResponse: false,
			ignoreHttpStatusErrors: true,
		}) as IDataObject;
	} catch (err) {
		const error = err as Error;
		throw new NodeApiError(this.getNode(), {
			message: `kwtSMS API request failed: ${error.message}`,
		});
	}

	if (response && response.result === 'ERROR') {
		const errorCode = (response.code as string) || (response.errorCode as string) || 'UNKNOWN';
		const errorMessage = getErrorMessage(errorCode);

		throw new NodeApiError(this.getNode(), {
			message: `${errorCode}: ${errorMessage}`,
			description: errorMessage,
		});
	}

	return response;
}

/**
 * Normalizes a phone number string.
 *
 * Converts Arabic-Indic digits (U+0660..U+0669) and Extended Arabic-Indic
 * digits (U+06F0..U+06F9) to their Latin equivalents (0..9), then strips
 * all non-digit characters and leading zeros.
 *
 * @param phone - The raw phone number string.
 * @returns The normalized phone number containing only digits with no leading zeros.
 */
export function normalizePhone(phone: string): string {
	// Convert Arabic-Indic digits to Latin
	phone = phone.replace(/[\u0660-\u0669]/g, (c) =>
		String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48),
	);

	// Convert Extended Arabic-Indic digits to Latin
	phone = phone.replace(/[\u06F0-\u06F9]/g, (c) =>
		String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48),
	);

	// Strip all non-digit characters
	phone = phone.replace(/\D/g, '');

	// Strip leading zeros
	phone = phone.replace(/^0+/, '');

	return phone;
}

/**
 * Cleans a message string for safe delivery via SMS.
 *
 * Performs the following transformations in order:
 * 1. Converts Arabic-Indic and Extended Arabic-Indic digits to Latin.
 * 2. Strips emoji characters.
 * 3. Strips hidden Unicode control characters (zero-width spaces, BOM, etc.).
 * 4. Strips HTML tags.
 * 5. Trims leading and trailing whitespace.
 *
 * @param message - The raw message string.
 * @returns The cleaned message string.
 */
export function cleanMessage(message: string): string {
	// Convert Arabic-Indic digits to Latin
	message = message.replace(/[\u0660-\u0669]/g, (c) =>
		String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48),
	);

	// Convert Extended Arabic-Indic digits to Latin
	message = message.replace(/[\u06F0-\u06F9]/g, (c) =>
		String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48),
	);

	// Strip emoji characters using Unicode property escapes
	// Removes Extended_Pictographic (all emoji) and Variation Selectors
	message = message.replace(/\p{Extended_Pictographic}/gu, '');
	message = message.replace(/\uFE00/g, '');
	message = message.replace(/\uFE01/g, '');
	message = message.replace(/\uFE0F/g, '');
	message = message.replace(/\u200D/g, '');
	message = message.replace(/\u20E3/g, '');

	// Strip hidden control characters
	message = message.replace(/[\u200B\uFEFF\u00AD\u200C\u2060\u200E\u200F]/g, '');

	// Strip HTML tags
	message = message.replace(/<[^>]*>/g, '');

	// Trim whitespace
	message = message.trim();

	return message;
}

/**
 * Removes duplicate entries from an array of phone number strings.
 *
 * @param numbers - Array of phone number strings, possibly containing duplicates.
 * @returns A new array with duplicates removed, preserving original order.
 */
export function deduplicateNumbers(numbers: string[]): string[] {
	return [...new Set(numbers)];
}

/**
 * Masks a phone number for display in logs or UI, hiding the middle digits.
 *
 * Examples:
 * - "96598765432" becomes "965****32"
 * - "12345" becomes "***"
 *
 * @param phone - The phone number string to mask.
 * @returns The masked phone number string.
 */
export function maskPhone(phone: string): string {
	if (phone.length <= 5) {
		return '***';
	}

	return phone.slice(0, 3) + '****' + phone.slice(-2);
}
