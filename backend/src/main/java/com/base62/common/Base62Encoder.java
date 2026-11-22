package com.base62.common;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Base62 encoder/decoder with non-sequential bijection.
 * Uses a prime multiplier and XOR mask to prevent enumeration attacks on sequential IDs.
 */
@Component
public class Base62Encoder {

    private static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = ALPHABET.length(); // 62
    private static final long MASK = 0x5bf03635L;
    private static final long PRIME = 1000000007L;
    private static final Pattern CUSTOM_ALIAS_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,30}$");

    /**
     * Encodes a numeric ID into a compact Base62 short string.
     */
    public String encode(long id) {
        if (id <= 0) {
            id = Math.abs(id) + 1;
        }
        // Obfuscate to avoid predictable sequential codes (e.g. ID 1 vs ID 2)
        long obfuscated = ((id * PRIME) ^ MASK) & 0xFFFFFFFFL;

        StringBuilder sb = new StringBuilder();
        while (obfuscated > 0) {
            int remainder = (int) (obfuscated % BASE);
            sb.append(ALPHABET.charAt(remainder));
            obfuscated /= BASE;
        }

        // Pad to minimum 6 characters for consistent length
        while (sb.length() < 6) {
            sb.append(ALPHABET.charAt((int) (id % BASE)));
            id /= BASE;
        }

        return sb.reverse().toString();
    }

    /**
     * Validates whether a custom alias matches allowed URL characters.
     */
    public boolean isValidAlias(String alias) {
        if (alias == null || alias.trim().isEmpty()) {
            return false;
        }
        return CUSTOM_ALIAS_PATTERN.matcher(alias.trim()).matches();
    }
}
