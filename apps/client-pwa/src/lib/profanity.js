/**
 * Simple Profanity Filter
 * Local-first content moderation for route names and usernames.
 */

const BANNED_TERMS = [
    // FR - Insults/Slurs
    'connard', 'connasse', 'pute', 'salope', 'encule', 'pd', 'pede', 'tapette',
    'biteman', 'bougnoule', 'negre', 'negro', 'bicot', 'youpin', 'triso', 'mongol',
    'chienne', 'batard', 'suce', 'bite', 'couille', 'chatte', 'foutre',
    'hitler', 'nazi', 'viol', 'tuer', 'mort', 'suicide', 'bombe', 'terroriste',

    // EN - Insults/Slurs
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cock', 'pussy', 'whore',
    'slut', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'spastic',
    'kill', 'rape', 'murder', 'suicide', 'bomb', 'terrorist'
];

/**
 * Checks if a string contains profanity.
 * Normalizes text (removes accents, lowercase) before checking.
 * @param {string} text - The text to check
 * @returns {boolean} - True if profanity is found
 */
export const containsProfanity = (text) => {
    if (!text) return false;

    // Normalize: lowercase, remove accents
    const normalized = text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9 ]/g, ""); // Keep only letters/numbers/spaces

    const words = normalized.split(/\s+/);

    return words.some(word => BANNED_TERMS.includes(word));
};

/**
 * Validates text and throws error if invalid
 * @param {string} text 
 * @param {string} fieldName 
 */
export const validateContent = (text, fieldName = "Ce champ") => {
    if (containsProfanity(text)) {
        throw new Error(`${fieldName} contient des termes inappropriés.`);
    }
};
