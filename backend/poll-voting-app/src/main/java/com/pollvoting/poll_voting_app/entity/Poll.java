package com.pollvoting.poll_voting_app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "polls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Poll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String question;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PollStatus status = PollStatus.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "closes_at")
    private LocalDateTime closesAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PollOption> options = new ArrayList<>();
}