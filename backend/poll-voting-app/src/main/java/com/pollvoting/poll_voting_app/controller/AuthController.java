package com.pollvoting.poll_voting_app.controller;



import com.pollvoting.poll_voting_app.config.AuthService;
import com.pollvoting.poll_voting_app.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }
}
