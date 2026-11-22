package com.base62.user;

import com.base62.common.exception.BadRequestException;
import com.base62.common.exception.ResourceNotFoundException;
import com.base62.security.JwtTokenProvider;
import com.base62.security.UserPrincipal;
import jakarta.annotation.PostConstruct;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostConstruct
    public void initDemoUser() {
        if (!userRepository.existsByEmail("demo@base62.ai")) {
            UserEntity demo = new UserEntity(
                    "demo@base62.ai",
                    passwordEncoder.encode("password123"),
                    "Alex Rivera (Demo)"
            );
            demo.setTier(UserTier.PRO);
            userRepository.save(demo);
        }
    }

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw new BadRequestException("An account with email " + request.email() + " already exists");
        }

        UserEntity user = new UserEntity(
                request.email().toLowerCase().trim(),
                passwordEncoder.encode(request.password()),
                request.fullName() != null ? request.fullName().trim() : "base62 User"
        );

        UserEntity savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase().trim(), request.password())
        );
        String token = jwtTokenProvider.generateToken(authentication);

        return AuthDto.AuthResponse.of(token, savedUser);
    }

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase().trim(), request.password())
        );

        String token = jwtTokenProvider.generateToken(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthDto.AuthResponse.of(token, user);
    }

    @Transactional(readOnly = true)
    public AuthDto.UserProfileDto getProfile(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return AuthDto.UserProfileDto.fromEntity(user);
    }

    @Transactional
    public AuthDto.UserProfileDto regenerateApiKey(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setApiKey("b62_" + UUID.randomUUID().toString().replace("-", ""));
        return AuthDto.UserProfileDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public AuthDto.UserProfileDto updateTier(Long userId, UserTier tier) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setTier(tier);
        return AuthDto.UserProfileDto.fromEntity(userRepository.save(user));
    }
}
