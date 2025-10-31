package com.pollvoting.poll_voting_app.dto;

import com.pollvoting.poll_voting_app.entity.Role;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
}
