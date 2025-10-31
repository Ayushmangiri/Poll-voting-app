package com.pollvoting.poll_voting_app.entity;


import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "poll_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String text;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToMany(mappedBy = "votedOptions")
    private Set<User> voters = new HashSet<>();

    public int getVoteCount() {
        return voters != null ? voters.size() : 0;
    }
}
