package com.base62.analytics;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class UserAgentParser {

    public record ClientDeviceInfo(String browser, String operatingSystem, String deviceType) {}

    public ClientDeviceInfo parse(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return new ClientDeviceInfo("Unknown", "Unknown", "Desktop");
        }

        String ua = userAgent.toLowerCase(Locale.ROOT);

        // Detect Bot
        if (ua.contains("bot") || ua.contains("spider") || ua.contains("crawler") || ua.contains("slurp")) {
            return new ClientDeviceInfo("Bot", "Server", "Bot");
        }

        // Detect Device Type
        String deviceType = "Desktop";
        if (ua.contains("ipad") || ua.contains("tablet") || (ua.contains("android") && !ua.contains("mobile"))) {
            deviceType = "Tablet";
        } else if (ua.contains("mobile") || ua.contains("iphone") || ua.contains("ipod") || ua.contains("android")) {
            deviceType = "Mobile";
        }

        // Detect Operating System
        String os = "Other";
        if (ua.contains("windows")) {
            os = "Windows";
        } else if (ua.contains("mac os") || ua.contains("macintosh")) {
            os = "macOS";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            os = "iOS";
        } else if (ua.contains("android")) {
            os = "Android";
        } else if (ua.contains("linux")) {
            os = "Linux";
        }

        // Detect Browser
        String browser = "Other";
        if (ua.contains("edg/") || ua.contains("edge/")) {
            browser = "Edge";
        } else if (ua.contains("chrome") && !ua.contains("chromium")) {
            browser = "Chrome";
        } else if (ua.contains("safari") && !ua.contains("chrome")) {
            browser = "Safari";
        } else if (ua.contains("firefox")) {
            browser = "Firefox";
        } else if (ua.contains("opera") || ua.contains("opr/")) {
            browser = "Opera";
        }

        return new ClientDeviceInfo(browser, os, deviceType);
    }
}
