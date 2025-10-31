package com.pollvoting.poll_voting_app.dto;


import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}
