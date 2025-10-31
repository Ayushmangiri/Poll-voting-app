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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ================= LOGIN =================
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, toUserDTO(user));
    }

    // ================= SIGNUP =================
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // ✅ Assign role automatically based on email
        if (request.getEmail().toLowerCase().contains("admin")) {
            user.setRole(Role.ADMIN);
        } else {
            user.setRole(Role.USER);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, toUserDTO(user));
    }

    // ================= HELPER METHOD =================
    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }
}
