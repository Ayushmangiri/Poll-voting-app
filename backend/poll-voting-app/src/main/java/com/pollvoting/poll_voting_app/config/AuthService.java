package com.pollvoting.poll_voting_app.config;
import com.pollvoting.poll_voting_app.dto.AuthRequest;
import com.pollvoting.poll_voting_app.dto.AuthResponse;
import com.pollvoting.poll_voting_app.dto.SignupRequest;
import com.pollvoting.poll_voting_app.dto.UserDTO;
import com.pollvoting.poll_voting_app.entity.Role;
import com.pollvoting.poll_voting_app.entity.User;
import com.pollvoting.poll_voting_app.repository.UserRepository;
import com.pollvoting.poll_voting_app.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse login(AuthRequest request) {
        log.info("Login attempt for: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password for: {}", request.getEmail());
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        log.info("Login successful for: {} (Role: {})", user.getEmail(), user.getRole());

        return new AuthResponse(token, toUserDTO(user));
    }

    public AuthResponse signup(SignupRequest request) {
        log.info("Signup attempt for: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getEmail().toLowerCase().contains("admin")) {
            user.setRole(Role.ADMIN);
            log.info("Assigning ADMIN role to: {}", request.getEmail());
        } else {
            user.setRole(Role.USER);
            log.info("Assigning USER role to: {}", request.getEmail());
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        log.info("Signup successful for: {} (Role: {})", user.getEmail(), user.getRole());

        return new AuthResponse(token, toUserDTO(user));
    }

    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }
}