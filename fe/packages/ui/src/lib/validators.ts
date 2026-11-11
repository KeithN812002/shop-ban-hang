/**
 * Shared validation utilities for the workspace
 */

/**
 * Email regex used across the system, requires a top-level domain (kept in sync with BE Constants.REGEX.EMAIL)
 */
export const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

/**
 * Validates if a string follows phone number character rules
 * Allowed characters: digits, spaces, '+', '-', '(', ')', '.'
 */
export const isPhoneCharsValid = (value: string) => {
    const raw = String(value ?? '').trim()
    if (!raw) return true
    return /^[0-9+\-().\s]+$/.test(raw)
}

/**
 * Validates the digit count of a phone number
 * Bounds cover both domestic and international numbers (country code + subscriber number)
 * @param value The phone string
 * @param min Minimum digits required (default 8)
 * @param max Maximum digits allowed (default 15, per ITU-T E.164)
 */
export const isPhoneLengthValid = (value: string, min = 8, max = 15) => {
    const raw = String(value ?? '').trim()
    if (!raw) return true
    const digits = raw.replace(/\D/g, '')
    return digits.length >= min && digits.length <= max
}

/**
 * Max input length of a phone field: 15 digits plus separators ('+', spaces, '-', '(', ')', '.')
 */
export const PHONE_MAX_LENGTH = 20

/**
 * Strips characters that are not allowed in a phone number and caps the length.
 * Keeps '+', spaces, '-', '(', ')', '.' so international numbers stay intact.
 */
export const formatPhoneInput = (value: string) => {
    return String(value ?? '')
        .replace(/[^0-9+\-().\s]/g, '')
        .slice(0, PHONE_MAX_LENGTH)
}

/**
 * Regex to detect HTML tags (like <p>, <a>, <script>, <!----> etc.)
 */
export const HTML_TAG_REGEX = /<[a-zA-Z/!][^>]*>/

/**
 * Checks if a value contains HTML or script tags
 */
export const hasHtmlOrScript = (value: unknown) => {
    const raw = String(value ?? '')
    return HTML_TAG_REGEX.test(raw)
}
