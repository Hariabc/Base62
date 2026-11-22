package com.base62.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class Base62EncoderTest {

    private Base62Encoder encoder;

    @BeforeEach
    void setUp() {
        encoder = new Base62Encoder();
    }

    @Test
    @DisplayName("Should encode positive IDs to non-empty short codes of minimum length 6")
    void testEncodeLength() {
        String code1 = encoder.encode(1L);
        String code1000 = encoder.encode(1000L);
        String codeMax = encoder.encode(999999999L);

        assertNotNull(code1);
        assertTrue(code1.length() >= 6);
        assertTrue(code1000.length() >= 6);
        assertTrue(codeMax.length() >= 6);
    }

    @Test
    @DisplayName("Consecutive IDs should produce non-sequential obfuscated codes")
    void testNonSequentialObfuscation() {
        String code1 = encoder.encode(101L);
        String code2 = encoder.encode(102L);

        assertNotEquals(code1, code2);
        // Ensure codes do not simply differ by the last character (not sequential)
        assertFalse(code1.substring(0, 4).equals(code2.substring(0, 4)));
    }

    @Test
    @DisplayName("Should produce unique codes without collision across sample sequence")
    void testNoCollisions() {
        Set<String> generatedCodes = new HashSet<>();
        for (long i = 1; i <= 5000; i++) {
            String code = encoder.encode(i);
            assertTrue(generatedCodes.add(code), "Collision detected for ID: " + i + " -> " + code);
        }
        assertEquals(5000, generatedCodes.size());
    }

    @Test
    @DisplayName("Should validate custom aliases correctly")
    void testCustomAliasValidation() {
        assertTrue(encoder.isValidAlias("my-custom-url"));
        assertTrue(encoder.isValidAlias("summer_sale_2026"));
        assertTrue(encoder.isValidAlias("promo123"));

        assertFalse(encoder.isValidAlias("ab")); // too short (< 3)
        assertFalse(encoder.isValidAlias("invalid space")); // contains space
        assertFalse(encoder.isValidAlias("special@chars!")); // special symbols
        assertFalse(encoder.isValidAlias(null));
    }
}
