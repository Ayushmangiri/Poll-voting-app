package com.pollvoting.poll_voting_app.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDTO user;
}
